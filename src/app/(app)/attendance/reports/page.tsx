"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import { useSearchParams } from "@/lib/next-compat";
import { CalendarRange, Filter } from "lucide-react";
import { Badge, Card, CardHead, EmptyState, PageHeader, Select } from "@/components/ui";
import { formatDate, pct } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";
import { RANGES, resolveRange } from "@/lib/demo/selectors";

function ReportsInner() {
  const sp = useSearchParams();
  const { state, user, standardName, divisionName, visibleStandards } = useDemo();

  const [standardId, setStandardId] = React.useState(sp.get("standardId") ?? "");
  const [stream, setStream] = React.useState("");
  const [divisionId, setDivisionId] = React.useState(sp.get("divisionId") ?? "");
  const [studentId, setStudentId] = React.useState(sp.get("studentId") ?? "");
  const [rangeKey, setRangeKey] = React.useState(sp.get("range") ?? "month");
  const initial = resolveRange(rangeKey);
  const [from, setFrom] = React.useState(initial.from);
  const [to, setTo] = React.useState(initial.to);

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

  const filteredAttendance = React.useMemo(() => {
    const sel = stds.find((s) => String(s.id) === standardId);
    const isHigherSec = sel ? sel.name.toLowerCase().includes("11") || sel.name.toLowerCase().includes("12") : false;

    return state.attendance.filter((a) => {
      if (a.date < from || a.date > to) return false;
      if (scope && !scope.includes(a.standardId)) return false;
      if (standardId && String(a.standardId) !== standardId) return false;
      if (standardId && isHigherSec && stream) {
        const st = state.students.find((s) => s.id === a.studentId);
        if ((st?.stream ?? "Science") !== stream) return false;
      }
      if (divisionId && String(a.divisionId) !== divisionId) return false;
      if (studentId && String(a.studentId) !== studentId) return false;
      return true;
    });
  }, [state.attendance, state.students, stds, from, to, scope, standardId, stream, divisionId, studentId]);

  const totalCount = filteredAttendance.length;
  const presentCount = filteredAttendance.filter((a) => a.status !== "absent").length;
  const absentCount = totalCount - presentCount;

  const perStudent = React.useMemo(() => {
    const map = new Map<number, { total: number; present: number }>();
    for (const a of filteredAttendance) {
      const cur = map.get(a.studentId) ?? { total: 0, present: 0 };
      cur.total++;
      if (a.status !== "absent") cur.present++;
      map.set(a.studentId, cur);
    }
    return [...map.entries()]
      .map(([id, v]) => ({ student: state.students.find((s) => s.id === id)!, ...v }))
      .filter((x) => x.student)
      .sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
  }, [filteredAttendance, state.students]);

  const dayRows = studentId
    ? filteredAttendance.filter((a) => String(a.studentId) === studentId).sort((a, b) => a.date.localeCompare(b.date))
    : [];
  const selectedStudent = studentId ? state.students.find((s) => String(s.id) === studentId) : null;

  const divs = state.divisions.filter((d) => !standardId || String(d.standardId) === standardId);
  const studentOptions = state.students
    .filter((s) => {
      if (standardId && String(s.standardId) !== standardId) return false;
      if (standardId && is11or12 && stream) {
        if ((s.stream ?? "Science") !== stream) return false;
      }
      return true;
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div>
      <PageHeader
        title="Attendance Report"
        subtitle="See attendance for any class, student or date range."
        breadcrumb={[{ label: "Attendance", href: "/attendance" }, { label: "Reports" }]}
      />

      <Card className="mb-4">
        <CardHead title="Choose what to see" icon={<Filter className="h-4.5 w-4.5" />} />
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
            <Select
              value={standardId}
              onChange={(e) => {
                setStandardId(e.target.value);
                setDivisionId("");
                setStudentId("");
                setStream("");
              }}
            >
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
            <label className="field-label">Student</label>
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">All students</option>
              {studentOptions.map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>)}
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
        <Card className="p-5"><p className="text-2xl font-bold text-[#2563EB]">{totalCount}</p><p className="mt-1 text-[13px] text-slate-500">Total classes marked</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-[#16A34A]">{presentCount}</p><p className="mt-1 text-[13px] text-slate-500">Present</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-[#DC2626]">{absentCount}</p><p className="mt-1 text-[13px] text-slate-500">Absent</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-[#F59E0B]">{pct(presentCount, totalCount)}%</p><p className="mt-1 text-[13px] text-slate-500">Attendance percentage</p></Card>
      </div>

      {selectedStudent && dayRows.length ? (
        <Card className="mb-4">
          <CardHead
            title={`Day-wise attendance — ${selectedStudent.fullName}`}
            subtitle={`${formatDate(from)} to ${formatDate(to)}`}
            icon={<CalendarRange className="h-4.5 w-4.5" />}
          />
          <div className="flex flex-wrap gap-2 p-4">
            {dayRows.map((d) => (
              <div
                key={d.id}
                title={`${formatDate(d.date)} — ${d.status}`}
                className={`flex w-[74px] flex-col items-center rounded-xl border px-2 py-2 text-center ${
                  d.status === "absent"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : d.status === "late"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : d.status === "leave"
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "border-green-200 bg-green-50 text-green-700"
                }`}
              >
                <span className="text-[15px] font-bold">{d.date.slice(8, 10)}</span>
                <span className="text-[10px] uppercase">{new Date(`${d.date}T00:00:00`).toLocaleDateString("en-GB", { month: "short" })}</span>
                <span className="mt-0.5 text-[10.5px] font-semibold capitalize">{d.status}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <CardHead title="Student-wise summary" subtitle={`${formatDate(from)} to ${formatDate(to)}`} />
        {perStudent.length ? (
          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr>
                  <th className="th">Student</th>
                  <th className="th">Class</th>
                  <th className="th text-right">Total</th>
                  <th className="th text-right">Present</th>
                  <th className="th text-right">Absent</th>
                  <th className="th text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {perStudent.map((r) => {
                  const p = pct(r.present, r.total);
                  return (
                    <tr key={r.student.id} className="hover:bg-slate-50/70">
                      <td className="td">
                        <Link href={`/students/${r.student.id}`} className="font-medium text-slate-800 hover:text-[#2563eb]">
                          {r.student.fullName}
                        </Link>
                        <span className="ml-2 text-[12px] text-slate-400">{r.student.studentCode}</span>
                      </td>
                      <td className="td">{standardName(r.student.standardId)}-{divisionName(r.student.divisionId)}</td>
                      <td className="td text-right">{r.total}</td>
                      <td className="td text-right text-green-700">{r.present}</td>
                      <td className="td text-right text-red-600">{r.total - r.present}</td>
                      <td className="td text-right"><Badge tone={p >= 85 ? "ok" : p >= 70 ? "warn" : "bad"}>{p}%</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No attendance in this range" message="Try a different date range or class." />
        )}
      </Card>
    </div>
  );
}

export default function AttendanceReportsPage() {
  return (
    <React.Suspense fallback={<div className="skeleton h-96 w-full rounded-2xl" />}>
      <ReportsInner />
    </React.Suspense>
  );
}
