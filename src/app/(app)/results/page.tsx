"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import { useSearchParams } from "@/lib/next-compat";
import { FileText, Trophy } from "lucide-react";
import { Badge, Card, CardHead, EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";

function ResultsInner() {
  const sp = useSearchParams();
  const { state, user, standardName, divisionName } = useDemo();

  const scope = user?.role === "assistant" && user.assignedStandards.length ? user.assignedStandards : null;
  const examList = state.exams
    .filter((e) => !scope || scope.includes(e.standardId))
    .sort((a, b) => b.examDate.localeCompare(a.examDate));
  const published = examList.filter((e) => state.results.some((r) => r.examId === e.id));

  const [activeId, setActiveId] = React.useState<number | null>(
    sp.get("examId") ? Number(sp.get("examId")) : published[0]?.id ?? null,
  );

  const active = examList.find((e) => e.id === activeId) ?? null;
  const rows = active
    ? state.results
        .filter((r) => r.examId === active.id)
        .map((r) => ({ r, student: state.students.find((s) => s.id === r.studentId)! }))
        .filter((x) => x.student)
        .sort((a, b) => (a.r.rank ?? 999) - (b.r.rank ?? 999))
    : [];

  const passCount = rows.filter((x) => x.r.resultStatus === "pass").length;
  const avg = rows.length ? rows.reduce((a, b) => a + b.r.percentage, 0) / rows.length : 0;

  return (
    <div>
      <PageHeader
        title="Results & PDF Report Cards"
        subtitle="Published results with grade, rank, and 5 exportable PDF result card templates with graphs & attendance."
        breadcrumb={[{ label: "Marks & Results", href: "/marks" }, { label: "Results" }]}
      />

      <Card className="mb-4">
        <CardHead title="Select an exam" icon={<Trophy className="h-4.5 w-4.5" />} />
        <div className="flex flex-wrap gap-2 p-4">
          {published.length ? (
            published.map((e) => {
              const sub = e.subjectId ? state.subjects.find((s) => s.id === e.subjectId) : null;
              return (
                <button
                  key={e.id}
                  onClick={() => setActiveId(e.id)}
                  className={`rounded-xl border px-3.5 py-2 text-[13px] font-medium transition ${
                    e.id === activeId ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]" : "border-[#e2e8f0] text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {standardName(e.standardId)} · {e.name}
                  {sub ? (
                    <span className="ml-1.5 rounded-md bg-blue-100/90 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">
                      {sub.name}
                    </span>
                  ) : null}
                  <span className="ml-2 text-[11px] text-slate-400">{formatDate(e.examDate)}</span>
                </button>
              );
            })
          ) : (
            <p className="px-1 py-2 text-sm text-slate-500">No published results yet. Generate results from Marks.</p>
          )}
        </div>
      </Card>

      {active && rows.length ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-5"><p className="text-2xl font-bold text-[#2563EB]">{rows.length}</p><p className="mt-1 text-[13px] text-slate-500">Students</p></Card>
            <Card className="p-5"><p className="text-2xl font-bold text-[#16A34A]">{passCount}</p><p className="mt-1 text-[13px] text-slate-500">Passed</p></Card>
            <Card className="p-5"><p className="text-2xl font-bold text-[#DC2626]">{rows.length - passCount}</p><p className="mt-1 text-[13px] text-slate-500">Failed</p></Card>
            <Card className="p-5"><p className="text-2xl font-bold text-[#F59E0B]">{avg.toFixed(1)}%</p><p className="mt-1 text-[13px] text-slate-500">Class average</p></Card>
          </div>

          <Card className="overflow-hidden">
            <CardHead
              title={`${standardName(active.standardId)} · ${active.name}${
                active.subjectId ? ` (${state.subjects.find((s) => s.id === active.subjectId)?.name ?? "Subject"})` : ""
              }`}
              subtitle={`Exam date ${formatDate(active.examDate)}${
                active.subjectId ? ` · Subject: ${state.subjects.find((s) => s.id === active.subjectId)?.name ?? ""}` : ""
              }`}
              action={
                active.subjectId ? (
                  <Badge tone="brand">
                    Subject: {state.subjects.find((s) => s.id === active.subjectId)?.name ?? ""}
                  </Badge>
                ) : undefined
              }
            />
            <div className="max-h-[65vh] overflow-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr>
                    <th className="th w-16">Rank</th>
                    <th className="th">Student</th>
                    <th className="th">Class</th>
                    <th className="th text-right">Total</th>
                    <th className="th text-right">Percentage</th>
                    <th className="th">Grade</th>
                    <th className="th">Result</th>
                    <th className="th text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(({ r, student }) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="td">
                        {r.rank && r.rank <= 3 ? <Badge tone={r.rank === 1 ? "warn" : "brand"}>#{r.rank}</Badge> : <span className="text-slate-500">{r.rank ? `#${r.rank}` : "—"}</span>}
                      </td>
                      <td className="td">
                        <Link href={`/students/${student.id}`} className="font-semibold text-slate-800 hover:text-[#2563eb]">{student.fullName}</Link>
                        <span className="ml-2 text-[12px] text-slate-400">{student.studentCode}</span>
                      </td>
                      <td className="td">
                        {standardName(student.standardId)}-{divisionName(student.divisionId)}
                        {standardName(student.standardId).toLowerCase().includes("11") || standardName(student.standardId).toLowerCase().includes("12") ? (
                          <span className="ml-1.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                            {student.stream ?? "Science"}
                          </span>
                        ) : null}
                      </td>
                      <td className="td text-right">{r.totalObtained}/{r.totalMax}</td>
                      <td className="td text-right font-semibold">{r.percentage.toFixed(2)}%</td>
                      <td className="td"><Badge tone="violet">{r.grade}</Badge></td>
                      <td className="td"><StatusPill status={r.resultStatus} /></td>
                      <td className="td text-right">
                        <Link
                          href={`/students/${student.id}/result?examId=${active.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#2563eb] hover:bg-[#eff6ff]"
                        >
                          <FileText className="h-4 w-4" /> Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={<Trophy className="h-6 w-6" />}
            title="No results to show"
            message="Enter marks for an exam and click “Generate results” in the Marks section."
            action={<Link href="/marks" className="btn-primary">Go to Marks</Link>}
          />
        </Card>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <React.Suspense fallback={<div className="skeleton h-96 w-full rounded-2xl" />}>
      <ResultsInner />
    </React.Suspense>
  );
}
