"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import { BarChart3, CalendarCheck2, FileBarChart2, FileSpreadsheet, FileText, Trophy } from "lucide-react";
import { Badge, Button, Card, CardHead, EmptyState, PageHeader, Select } from "@/components/ui";
import { formatDate, pct } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";
import { RANGES, resolveRange } from "@/lib/demo/selectors";
import { DivisionMarksExcelModal } from "@/components/division-marks-excel-modal";

export default function ReportsPage() {
  const { state, user, standardName, divisionName, visibleStandards } = useDemo();

  const [rangeKey, setRangeKey] = React.useState("month");
  const initial = resolveRange("month");
  const [from, setFrom] = React.useState(initial.from);
  const [to, setTo] = React.useState(initial.to);
  const [standardId, setStandardId] = React.useState("");
  const [stream, setStream] = React.useState("");
  const [divisionId, setDivisionId] = React.useState("");
  const [examId, setExamId] = React.useState("");
  const [showExcelModal, setShowExcelModal] = React.useState(false);

  function applyRange(key: string) {
    const r = resolveRange(key);
    setRangeKey(key);
    setFrom(r.from);
    setTo(r.to);
  }

  const scope = user?.role === "assistant" && user.assignedStandards.length ? user.assignedStandards : null;

  const stds = visibleStandards();
  const selectedStd = stds.find((s) => String(s.id) === standardId);
  const is11or12 = selectedStd
    ? selectedStd.name.toLowerCase().includes("11") || selectedStd.name.toLowerCase().includes("12")
    : false;

  const attRows = state.attendance.filter((a) => {
    if (a.date < from || a.date > to) return false;
    if (scope && !scope.includes(a.standardId)) return false;
    if (standardId && String(a.standardId) !== standardId) return false;
    if (standardId && is11or12 && stream) {
      const student = state.students.find((s) => s.id === a.studentId);
      if ((student?.stream ?? "Science") !== stream) return false;
    }
    if (divisionId && String(a.divisionId) !== divisionId) return false;
    return true;
  });

  const perStudent = React.useMemo(() => {
    const map = new Map<number, { total: number; present: number }>();
    for (const a of attRows) {
      const cur = map.get(a.studentId) ?? { total: 0, present: 0 };
      cur.total++;
      if (a.status !== "absent") cur.present++;
      map.set(a.studentId, cur);
    }
    return [...map.entries()]
      .map(([id, v]) => ({ student: state.students.find((s) => s.id === id)!, ...v }))
      .filter((x) => x.student)
      .sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
  }, [attRows, state.students]);

  const resultRows = state.results.filter((r) => {
    const exam = state.exams.find((e) => e.id === r.examId);
    if (!exam) return false;
    if (exam.examDate < from || exam.examDate > to) return false;
    if (scope && !scope.includes(exam.standardId)) return false;
    if (standardId && String(exam.standardId) !== standardId) return false;
    if (standardId && is11or12 && stream) {
      const student = state.students.find((s) => s.id === r.studentId);
      if ((student?.stream ?? "Science") !== stream) return false;
    }
    if (examId && String(exam.id) !== examId) return false;
    return true;
  });

  const perfByStudent = new Map<number, { sum: number; n: number; grade: string }>();
  for (const r of resultRows) {
    const cur = perfByStudent.get(r.studentId) ?? { sum: 0, n: 0, grade: r.grade };
    cur.sum += r.percentage;
    cur.n += 1;
    cur.grade = r.grade;
    perfByStudent.set(r.studentId, cur);
  }

  const totalMarked = attRows.length;
  const totalPresent = attRows.filter((a) => a.status !== "absent").length;
  const avgPerf = resultRows.length ? resultRows.reduce((a, b) => a + b.percentage, 0) / resultRows.length : 0;

  const divs = state.divisions.filter((d) => !standardId || String(d.standardId) === standardId);
  const examOptions = state.exams
    .filter((e) => (!scope || scope.includes(e.standardId)) && (!standardId || String(e.standardId) === standardId))
    .sort((a, b) => b.examDate.localeCompare(a.examDate));

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Combined attendance and result reports for any period, class or exam."
        actions={
          <>
            <Button variant="outline" onClick={() => setShowExcelModal(true)}>
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Division PDF (Excel)
            </Button>
            <Link href="/attendance/reports" className="btn-soft"><CalendarCheck2 className="h-4 w-4" /> Attendance report</Link>
            <Link href="/results" className="btn-soft"><Trophy className="h-4 w-4" /> Results</Link>
          </>
        }
      />

      <Card className="mb-4">
        <CardHead title="Report filters" icon={<FileBarChart2 className="h-4.5 w-4.5" />} />
        <div className="flex flex-wrap gap-2 border-b border-[#e2e8f0] px-4 py-3">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => applyRange(r.key)}
              className={`rounded-xl px-3.5 py-2 text-[13px] font-medium transition ${
                rangeKey === r.key ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className={`grid gap-3 p-4 sm:grid-cols-2 ${is11or12 ? "lg:grid-cols-6" : "lg:grid-cols-5"}`}>
          <div>
            <label className="field-label">Standard</label>
            <Select value={standardId} onChange={(e) => { setStandardId(e.target.value); setDivisionId(""); setExamId(""); setStream(""); }}>
              <option value="">All standards</option>
              {stds.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          {is11or12 ? (
            <div>
              <label className="field-label">Stream</label>
              <Select value={stream} onChange={(e) => setStream(e.target.value)}>
                <option value="">All streams</option>
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
              </Select>
            </div>
          ) : null}
          <div>
            <label className="field-label">Division</label>
            <Select value={divisionId} onChange={(e) => setDivisionId(e.target.value)}>
              <option value="">All divisions</option>
              {divs.map((d) => <option key={d.id} value={d.id}>Division {d.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="field-label">Exam</label>
            <Select value={examId} onChange={(e) => setExamId(e.target.value)}>
              <option value="">All exams</option>
              {examOptions.map((e) => {
                const sub = e.subjectId ? state.subjects.find((s) => s.id === e.subjectId) : null;
                return (
                  <option key={e.id} value={e.id}>
                    {standardName(e.standardId)} · {e.name}{sub ? ` (${sub.name})` : ""}
                  </option>
                );
              })}
            </Select>
          </div>
          <div>
            <label className="field-label">From</label>
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setRangeKey("custom"); }} className="input" />
          </div>
          <div>
            <label className="field-label">To</label>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setRangeKey("custom"); }} className="input" />
          </div>
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-5"><p className="text-2xl font-bold text-[#2563EB]">{perStudent.length}</p><p className="mt-1 text-[13px] text-slate-500">Students in report</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-[#16A34A]">{pct(totalPresent, totalMarked)}%</p><p className="mt-1 text-[13px] text-slate-500">Average attendance</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-[#7C3AED]">{resultRows.length}</p><p className="mt-1 text-[13px] text-slate-500">Results in range</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-[#F59E0B]">{avgPerf.toFixed(1)}%</p><p className="mt-1 text-[13px] text-slate-500">Average performance</p></Card>
      </div>

      <Card className="overflow-hidden">
        <CardHead
          title="Combined student report"
          subtitle={`${formatDate(from)} to ${formatDate(to)} · attendance, marks, percentage and grade`}
          icon={<BarChart3 className="h-4.5 w-4.5" />}
        />
        {perStudent.length ? (
          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr>
                  <th className="th">Student</th>
                  <th className="th">Class</th>
                  <th className="th text-right">Classes</th>
                  <th className="th text-right">Present</th>
                  <th className="th text-right">Attendance</th>
                  <th className="th text-right">Avg result</th>
                  <th className="th">Grade</th>
                  <th className="th text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {perStudent.map((r) => {
                  const attPct = pct(r.present, r.total);
                  const perf = perfByStudent.get(r.student.id);
                  const avg = perf ? perf.sum / perf.n : null;
                  return (
                    <tr key={r.student.id} className="hover:bg-slate-50/70">
                      <td className="td">
                        <Link href={`/students/${r.student.id}`} className="font-medium text-slate-800 hover:text-[#2563eb]">{r.student.fullName}</Link>
                        <span className="ml-2 text-[12px] text-slate-400">{r.student.studentCode}</span>
                      </td>
                      <td className="td">{standardName(r.student.standardId)}-{divisionName(r.student.divisionId)}</td>
                      <td className="td text-right">{r.total}</td>
                      <td className="td text-right text-green-700">{r.present}</td>
                      <td className="td text-right"><Badge tone={attPct >= 85 ? "ok" : attPct >= 70 ? "warn" : "bad"}>{attPct}%</Badge></td>
                      <td className="td text-right">{avg != null ? `${avg.toFixed(1)}%` : "—"}</td>
                      <td className="td">{perf ? <Badge tone="violet">{perf.grade}</Badge> : "—"}</td>
                      <td className="td text-right">
                        <Link href={`/students/${r.student.id}/result`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#2563eb] hover:bg-[#eff6ff]">
                          <FileText className="h-4 w-4" /> Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No data for this period" message="Try a wider date range or a different class." />
        )}
      </Card>

      <DivisionMarksExcelModal
        open={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        defaultStandardId={standardId}
        defaultDivisionId={divisionId}
        defaultStream={stream}
        defaultExamId={examId}
      />
    </div>
  );
}
