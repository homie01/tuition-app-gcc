"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import {
  CalendarCheck2,
  ClipboardList,
  FileText,
  Info,
  MessageCircle,
  Pencil,
  Phone,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Avatar, Badge, Card, CardHead, EmptyState, PageHeader, StatusPill, Tabs } from "@/components/ui";
import { PerformanceLineChart } from "@/components/charts";
import { formatDate, formatDateTime, normalizePhone, pct } from "@/lib/utils";

type Student = {
  id: number;
  studentCode: string;
  fullName: string;
  fatherName: string | null;
  motherName: string | null;
  schoolName: string | null;
  rollNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  primaryMobile: string;
  secondaryMobile: string | null;
  whatsappNumber: string | null;
  guardianName: string | null;
  relationship: string | null;
  shift: string;
  joiningDate: string | null;
  monthlyFees: number;
  status: string;
  photoColor: string | null;
  notes: string | null;
};

type AttRow = {
  id: number;
  date: string;
  status: string;
  shift: string;
  takenByName: string | null;
  takenAt: string;
  remark: string | null;
};

type MarkRow = {
  id: number;
  examId: number;
  examName: string;
  examDate: string;
  subject: string;
  obtained: number;
  max: number;
  addedByName: string | null;
};

type ResultRow = {
  id: number;
  examId: number;
  examName: string;
  examDate: string;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  rank: number | null;
  resultStatus: string;
  generatedAt: string;
  generatedByName: string | null;
};

export default function StudentProfile({
  student,
  standard,
  division,
  attendance,
  summary,
  marks,
  results,
  upcomingExams,
  initialTab,
  canEdit,
  canWhatsapp,
  tuitionName,
  lowAttendanceThreshold,
}: {
  student: Student;
  standard: string;
  division: string;
  attendance: AttRow[];
  summary: { totalClasses: number; present: number; absent: number };
  marks: MarkRow[];
  results: ResultRow[];
  upcomingExams: { id: number; name: string; examDate: string }[];
  initialTab: string;
  canEdit: boolean;
  canWhatsapp: boolean;
  tuitionName: string;
  lowAttendanceThreshold: number;
}) {
  const [tab, setTab] = React.useState(initialTab);
  const attendancePct = pct(summary.present, summary.totalClasses);

  const examGroups = React.useMemo(() => {
    const map = new Map<number, { name: string; date: string; rows: MarkRow[] }>();
    for (const m of marks) {
      const cur = map.get(m.examId) ?? { name: m.examName, date: m.examDate, rows: [] };
      cur.rows.push(m);
      map.set(m.examId, cur);
    }
    return [...map.entries()].map(([examId, v]) => ({ examId, ...v }));
  }, [marks]);

  const waLink = () => {
    const n = normalizePhone(student.whatsappNumber || student.primaryMobile);
    const text = `Dear Parent/Guardian, this is a message from ${tuitionName} regarding ${student.fullName} (${student.studentCode}).`;
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div>
      <PageHeader
        title={student.fullName}
        subtitle={`${student.studentCode} · ${standard}-${division} · ${student.shift} shift`}
        breadcrumb={[{ label: "Students", href: "/students" }, { label: student.fullName }]}
        actions={
          <>
            {canWhatsapp ? (
              <a href={waLink()} target="_blank" rel="noreferrer" className="btn-soft">
                <MessageCircle className="h-4 w-4 text-[#16a34a]" /> WhatsApp
              </a>
            ) : null}
            <Link href={`/students/${student.id}/result`} className="btn-soft">
              <FileText className="h-4 w-4" /> Result PDF
            </Link>
            {canEdit ? (
              <Link href={`/students/${student.id}/edit`} className="btn-primary">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            ) : null}
          </>
        }
      />

      {/* Hero */}
      <Card className="mb-4 p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={student.fullName} color={student.photoColor} size={68} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{student.fullName}</h2>
            </div>
            <p className="mt-1 text-[13.5px] text-slate-500">
              {student.schoolName ?? "School not set"} · Roll no. {student.rollNumber ?? "—"} · Joined {formatDate(student.joiningDate)}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:w-auto">
            <MiniStat label="Attendance" value={`${attendancePct}%`} tone={attendancePct >= lowAttendanceThreshold ? "#16A34A" : "#DC2626"} />
            <MiniStat label="Classes" value={summary.totalClasses} tone="#2563EB" />
            <MiniStat
              label="Avg result"
              value={results.length ? `${(results.reduce((a, b) => a + b.percentage, 0) / results.length).toFixed(1)}%` : "—"}
              tone="#7C3AED"
            />
          </div>
        </div>
      </Card>

      <div className="mb-4">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "overview", label: "Overview", icon: <Info className="h-4 w-4" /> },
            { key: "attendance", label: "Attendance", icon: <CalendarCheck2 className="h-4 w-4" /> },
            { key: "marks", label: "Marks", icon: <ClipboardList className="h-4 w-4" /> },
            { key: "performance", label: "Performance", icon: <TrendingUp className="h-4 w-4" /> },
            { key: "results", label: "Results", icon: <Trophy className="h-4 w-4" /> },
          ]}
        />
      </div>

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead title="Student information" icon={<Info className="h-4.5 w-4.5" />} />
            <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Info2 label="Student ID" value={student.studentCode} />
              <Info2 label="Full name" value={student.fullName} />
              <Info2 label="Father's name" value={student.fatherName} />
              <Info2 label="Mother's name" value={student.motherName} />
              <Info2 label="Standard / Division" value={`${standard} - ${division}`} />
              <Info2 label="Stream" value={student.stream ?? (standard.toLowerCase().includes("11") || standard.toLowerCase().includes("12") ? "Science" : "Regular Stream")} />
              <Info2 label="Shift" value={student.shift} className="capitalize" />
              <Info2 label="School" value={student.schoolName} />
              <Info2 label="Roll number" value={student.rollNumber} />
              <Info2 label="Date of birth" value={formatDate(student.dateOfBirth)} />
              <Info2 label="Gender" value={student.gender} className="capitalize" />
              <Info2 label="Joining date" value={formatDate(student.joiningDate)} />
              <Info2 label="Address" value={student.address} className="sm:col-span-2 lg:col-span-3" />
              {student.notes ? <Info2 label="Notes" value={student.notes} className="sm:col-span-2 lg:col-span-3" /> : null}
            </dl>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHead title="Contact" icon={<Phone className="h-4.5 w-4.5" />} />
              <dl className="grid gap-4 p-5">
                <Info2 label="Relationship" value={student.relationship} />
                <Info2 label="Primary mobile" value={student.primaryMobile} />
                <Info2 label="Secondary mobile" value={student.secondaryMobile} />
                <Info2 label="WhatsApp number" value={student.whatsappNumber ?? student.primaryMobile} />
              </dl>
              <div className="flex gap-2 border-t border-[#e2e8f0] p-4">
                <a href={`tel:${student.primaryMobile}`} className="btn-soft flex-1">
                  <Phone className="h-4 w-4" /> Call
                </a>
                <a href={waLink()} target="_blank" rel="noreferrer" className="btn-ok flex-1">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </Card>

            <Card>
              <CardHead title="Upcoming exams" icon={<ClipboardList className="h-4.5 w-4.5" />} />
              <div className="divide-y divide-slate-100">
                {upcomingExams.length ? (
                  upcomingExams.map((e) => (
                    <div key={e.id} className="flex items-center justify-between px-5 py-3">
                      <p className="text-[13.5px] font-medium text-slate-700">{e.name}</p>
                      <span className="text-[12px] text-slate-400">{formatDate(e.examDate)}</span>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No upcoming exams" />
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "attendance" ? (
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="p-5"><MiniStat label="Total classes" value={summary.totalClasses} tone="#2563EB" big /></Card>
          <Card className="p-5"><MiniStat label="Present" value={summary.present} tone="#16A34A" big /></Card>
          <Card className="p-5"><MiniStat label="Absent" value={summary.absent} tone="#DC2626" big /></Card>
          <Card className="p-5"><MiniStat label="Attendance %" value={`${attendancePct}%`} tone="#F59E0B" big /></Card>

          <Card className="lg:col-span-4">
            <CardHead title="Date-wise attendance" subtitle="Most recent 120 records" icon={<CalendarCheck2 className="h-4.5 w-4.5" />} />
            {attendance.length ? (
              <div className="max-h-[60vh] overflow-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr>
                      <th className="th">Date</th>
                      <th className="th">Shift</th>
                      <th className="th">Status</th>
                      <th className="th">Taken by</th>
                      <th className="th">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70">
                        <td className="td font-medium text-slate-800">{formatDate(a.date)}</td>
                        <td className="td capitalize">{a.shift}</td>
                        <td className="td"><StatusPill status={a.status} /></td>
                        <td className="td">{a.takenByName ?? "—"}</td>
                        <td className="td text-slate-500">{formatDateTime(a.takenAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No attendance records" message="Attendance will appear once it is taken for this class." />
            )}
          </Card>
        </div>
      ) : null}

      {tab === "marks" ? (
        <div className="space-y-4">
          {examGroups.length ? (
            examGroups.map((g) => {
              const total = g.rows.reduce((a, b) => a + b.obtained, 0);
              const max = g.rows.reduce((a, b) => a + b.max, 0);
              return (
                <Card key={g.examId}>
                  <CardHead
                    title={g.name}
                    subtitle={`Exam date ${formatDate(g.date)}`}
                    icon={<ClipboardList className="h-4.5 w-4.5" />}
                    action={<Badge tone="brand">{total}/{max} · {pct(total, max)}%</Badge>}
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px]">
                      <thead>
                        <tr>
                          <th className="th">Subject</th>
                          <th className="th text-right">Obtained</th>
                          <th className="th text-right">Maximum</th>
                          <th className="th text-right">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {g.rows.map((r) => (
                          <tr key={r.id}>
                            <td className="td font-medium text-slate-800">{r.subject}</td>
                            <td className="td text-right">{r.obtained}</td>
                            <td className="td text-right text-slate-500">{r.max}</td>
                            <td className="td text-right">
                              <Badge tone={pct(r.obtained, r.max) >= 60 ? "ok" : pct(r.obtained, r.max) >= 35 ? "warn" : "bad"}>
                                {pct(r.obtained, r.max)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card><EmptyState title="No marks yet" message="Marks entered for this student will show here exam-wise." /></Card>
          )}
        </div>
      ) : null}

      {tab === "performance" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead title="Performance trend" subtitle="Result percentage across exams" icon={<TrendingUp className="h-4.5 w-4.5" />} />
            <div className="p-4">
              {results.length ? (
                <PerformanceLineChart data={results.map((r) => ({ name: r.examName, pct: Math.round(r.percentage * 10) / 10 }))} />
              ) : (
                <EmptyState title="Not enough data" message="Generate at least one result to see the trend." />
              )}
            </div>
          </Card>
          <Card>
            <CardHead title="Exam comparison" icon={<Trophy className="h-4.5 w-4.5" />} />
            <div className="divide-y divide-slate-100">
              {results.map((r, i) => {
                const prev = results[i - 1];
                const diff = prev ? r.percentage - prev.percentage : 0;
                return (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-[13.5px] font-semibold text-slate-800">{r.examName}</p>
                      <p className="text-[12px] text-slate-400">{formatDate(r.examDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{r.percentage.toFixed(1)}%</p>
                      {prev ? (
                        <p className={`text-[12px] font-semibold ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {diff >= 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(1)}%
                        </p>
                      ) : (
                        <p className="text-[12px] text-slate-400">first exam</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {!results.length ? <EmptyState title="No results yet" /> : null}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "results" ? (
        <Card>
          <CardHead
            title="Generated results"
            subtitle="All published results for this student"
            icon={<Trophy className="h-4.5 w-4.5" />}
            action={
              <Link href={`/students/${student.id}/result`} className="btn-primary">
                <FileText className="h-4 w-4" /> Generate Result PDF
              </Link>
            }
          />
          {results.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr>
                    <th className="th">Exam</th>
                    <th className="th">Exam date</th>
                    <th className="th text-right">Total</th>
                    <th className="th text-right">Percentage</th>
                    <th className="th">Grade</th>
                    <th className="th">Rank</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="td font-medium text-slate-800">{r.examName}</td>
                      <td className="td text-slate-500">{formatDate(r.examDate)}</td>
                      <td className="td text-right">{r.totalObtained}/{r.totalMax}</td>
                      <td className="td text-right font-semibold">{r.percentage.toFixed(2)}%</td>
                      <td className="td"><Badge tone="violet">{r.grade}</Badge></td>
                      <td className="td">{r.rank ? `#${r.rank}` : "—"}</td>
                      <td className="td"><StatusPill status={r.resultStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No results generated" message="Generate results from the Marks & Results section." />
          )}
        </Card>
      ) : null}
    </div>
  );
}

function Info2({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[12px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-[14px] font-medium text-slate-800">{value || "—"}</dd>
    </div>
  );
}

function MiniStat({ label, value, tone, big }: { label: string; value: string | number; tone: string; big?: boolean }) {
  return (
    <div className={big ? "" : "rounded-xl bg-slate-50 px-3 py-2 text-center"}>
      <p className={`font-bold ${big ? "text-2xl" : "text-base"}`} style={{ color: tone }}>{value}</p>
      <p className={`text-slate-500 ${big ? "mt-1 text-[13px]" : "text-[11px]"}`}>{label}</p>
    </div>
  );
}
