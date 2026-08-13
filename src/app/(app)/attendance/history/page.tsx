"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import { History } from "lucide-react";
import { Badge, Card, CardHead, EmptyState, PageHeader } from "@/components/ui";
import { formatDate, formatDateTime, pct } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";

export default function AttendanceHistoryPage() {
  const { state, user, standardName, divisionName } = useDemo();

  const rows = React.useMemo(() => {
    const scope = user?.role === "assistant" && user.assignedStandards.length ? user.assignedStandards : null;
    const map = new Map<
      string,
      { date: string; standardId: number; divisionId: number; shift: string; total: number; present: number; absent: number; takenBy: string | null; takenAt: string }
    >();
    for (const a of state.attendance) {
      if (scope && !scope.includes(a.standardId)) continue;
      const key = `${a.date}|${a.standardId}|${a.divisionId}|${a.shift}`;
      const cur =
        map.get(key) ??
        { date: a.date, standardId: a.standardId, divisionId: a.divisionId, shift: a.shift, total: 0, present: 0, absent: 0, takenBy: a.takenByName, takenAt: a.takenAt };
      cur.total++;
      if (a.status === "absent") cur.absent++;
      else cur.present++;
      if (a.takenAt > cur.takenAt) cur.takenAt = a.takenAt;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date) || a.standardId - b.standardId).slice(0, 100);
  }, [state.attendance, user]);

  return (
    <div>
      <PageHeader
        title="Attendance History"
        subtitle="Every attendance session with the exact date, time and the person who took it."
        breadcrumb={[{ label: "Attendance", href: "/attendance" }, { label: "History" }]}
      />
      <Card className="overflow-hidden">
        <CardHead title="Recent attendance sessions" subtitle={`${rows.length} sessions`} icon={<History className="h-4.5 w-4.5" />} />
        {rows.length ? (
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr>
                  <th className="th">Date</th>
                  <th className="th">Class</th>
                  <th className="th">Shift</th>
                  <th className="th text-right">Students</th>
                  <th className="th text-right">Present</th>
                  <th className="th text-right">Absent</th>
                  <th className="th text-right">Attendance</th>
                  <th className="th">Taken by</th>
                  <th className="th">Saved at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => {
                  const p = pct(r.present, r.total);
                  return (
                    <tr key={i} className="hover:bg-slate-50/70">
                      <td className="td font-medium text-slate-800">{formatDate(r.date)}</td>
                      <td className="td">
                        <Link href={`/students?standardId=${r.standardId}`} className="font-medium text-[#2563eb]">
                          {standardName(r.standardId)}-{divisionName(r.divisionId)}
                        </Link>
                      </td>
                      <td className="td capitalize">{r.shift}</td>
                      <td className="td text-right">{r.total}</td>
                      <td className="td text-right text-green-700">{r.present}</td>
                      <td className="td text-right text-red-600">{r.absent}</td>
                      <td className="td text-right"><Badge tone={p >= 85 ? "ok" : p >= 70 ? "warn" : "bad"}>{p}%</Badge></td>
                      <td className="td">{r.takenBy ?? "—"}</td>
                      <td className="td text-slate-500">{formatDateTime(r.takenAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No attendance saved yet" message="Take attendance for a class to see it here." />
        )}
      </Card>
    </div>
  );
}
