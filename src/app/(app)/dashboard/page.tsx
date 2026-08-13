"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { Avatar, Badge, Card, CardHead, EmptyState } from "@/components/ui";
import { AttendanceTrendChart, PerformanceLineChart, StandardBarChart } from "@/components/charts";
import { formatDate, greeting, timeAgo } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";
import { dashboardData } from "@/lib/demo/selectors";

function Stat({ label, value, sub, icon, tone }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {sub ? <p className="mt-0.5 text-[12px] text-slate-400">{sub}</p> : null}
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${tone}14`, color: tone }}>
          {icon}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { state, user, allows, standardName, divisionName } = useDemo();
  const data = React.useMemo(() => dashboardData(state, user), [state, user]);
  if (!user) return null;
  const { stats } = data;

  const quick = [
    { href: "/attendance", label: "Take Attendance", icon: <CalendarCheck2 className="h-4 w-4" />, show: allows("attendance.take") },
    { href: "/students/new", label: "Add Student", icon: <UserPlus className="h-4 w-4" />, show: allows("student.add") },
    { href: "/marks", label: "Add Marks", icon: <ClipboardList className="h-4 w-4" />, show: allows("marks.add") },
    { href: "/whatsapp", label: "Send WhatsApp", icon: <MessageCircle className="h-4 w-4" />, show: allows("whatsapp.send") },
  ].filter((q) => q.show);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl bg-[#0f172a] p-6 text-white sm:p-8">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[13px] font-medium text-white/60">{formatDate(new Date())}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-[28px]">
              {greeting()}, {user.name.replace(/ Sir$/, "")} 👋
            </h1>
            <p className="mt-1.5 text-[15px] text-white/70">
              Manage {state.settings.tuitionName} from one place — attendance, marks, results and parent updates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quick.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/20"
              >
                {q.icon}
                {q.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Total Students" value={stats.totalStudents} sub={`${stats.activeStudents} active`} icon={<Users className="h-5 w-5" />} tone="#2563EB" />
        <Stat label="Present Today" value={stats.present} sub="marked present" icon={<UserCheck className="h-5 w-5" />} tone="#16A34A" />
        <Stat label="Absent Today" value={stats.absent} sub="needs follow-up" icon={<UserX className="h-5 w-5" />} tone="#DC2626" />
        <Stat label="Today's Attendance" value={`${stats.attendancePct}%`} sub="of marked students" icon={<TrendingUp className="h-5 w-5" />} tone="#F59E0B" />
        <Stat label="Assistants" value={stats.assistants} sub="team members" icon={<GraduationCap className="h-5 w-5" />} tone="#7C3AED" />
        <Stat label="Upcoming Exams" value={stats.upcomingExams} sub="results pending" icon={<ClipboardList className="h-5 w-5" />} tone="#0891B2" />
        <Stat label="Average Performance" value={`${stats.avgPerformance}%`} sub="all published results" icon={<TrendingUp className="h-5 w-5" />} tone="#16A34A" />
        <Stat label="Standards" value={data.standardRows.length} sub="classes running" icon={<Activity className="h-5 w-5" />} tone="#DB2777" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHead title="Attendance trend" subtitle="Daily attendance percentage over the last 14 days" icon={<TrendingUp className="h-4.5 w-4.5" />} />
          <div className="p-4">
            {data.trend.length ? <AttendanceTrendChart data={data.trend} /> : <EmptyState title="No attendance yet" message="Take today's attendance to see the trend." />}
          </div>
        </Card>
        <Card>
          <CardHead title="Students per standard" icon={<Users className="h-4.5 w-4.5" />} />
          <div className="p-4">
            <StandardBarChart data={data.standardRows.map((s) => ({ name: s.name.replace("Standard ", "Std "), total: s.total }))} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHead
            title="Today's attendance by standard"
            subtitle="Tap a standard to open its student list"
            icon={<CalendarCheck2 className="h-4.5 w-4.5" />}
            action={<Link href="/attendance/reports" className="text-[13px] font-semibold text-[#2563eb] hover:underline">Full report</Link>}
          />
          <div className="divide-y divide-slate-100">
            {data.standardRows.map((s) => (
              <Link key={s.id} href={`/students?standardId=${s.id}`} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-slate-50">
                <div className="flex items-center justify-between sm:w-28 shrink-0">
                  <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                  <p className="text-[12px] text-slate-400 sm:hidden">{s.total} students</p>
                </div>
                <div className="h-2.5 w-full flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.attendancePct}%`,
                      background: s.attendancePct >= 85 ? "#16A34A" : s.attendancePct >= 70 ? "#F59E0B" : "#DC2626",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between sm:w-28 shrink-0 sm:text-right">
                  <p className="text-xs text-slate-400 sm:hidden">{s.present} present · {s.absent} absent</p>
                  <p className="text-sm font-bold text-slate-800">{s.attendancePct}%</p>
                </div>
              </Link>
            ))}
            {!data.standardRows.length ? <EmptyState title="No standards configured" message="Add standards from Settings." /> : null}
          </div>
        </Card>

        <Card>
          <CardHead title="Performance overview" subtitle="Average result percentage by exam" icon={<TrendingUp className="h-4.5 w-4.5" />} />
          <div className="p-4">
            {data.performance.length ? <PerformanceLineChart data={data.performance} /> : <EmptyState title="No results yet" message="Generate results to see performance." />}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHead title="Recent registrations" icon={<UserPlus className="h-4.5 w-4.5" />} />
          <div className="divide-y divide-slate-100">
            {data.recentStudents.map((s) => (
              <Link key={s.id} href={`/students/${s.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <Avatar name={s.fullName} color={s.photoColor} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-slate-800">{s.fullName}</p>
                  <p className="text-[12px] text-slate-500">{s.studentCode} · {standardName(s.standardId)}-{divisionName(s.divisionId)}</p>
                </div>
                <span className="text-[11px] text-slate-400">{timeAgo(s.createdAt)}</span>
              </Link>
            ))}
            {!data.recentStudents.length ? <EmptyState title="No students yet" /> : null}
          </div>
        </Card>

        <Card>
          <CardHead title="Recent marks added" icon={<ClipboardList className="h-4.5 w-4.5" />} />
          <div className="divide-y divide-slate-100">
            {data.recentMarks.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-slate-800">{m.studentName}</p>
                  <p className="truncate text-[12px] text-slate-500">{m.subject} · {m.exam}</p>
                </div>
                <Badge tone="brand">{m.obtained}/{m.max}</Badge>
              </div>
            ))}
            {!data.recentMarks.length ? <EmptyState title="No marks entered yet" /> : null}
          </div>
        </Card>

        <Card>
          <CardHead
            title="Recent activity"
            icon={<Activity className="h-4.5 w-4.5" />}
            action={
              user.role === "admin" ? (
                <Link href="/activity" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563eb] hover:underline">
                  All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null
            }
          />
          <div className="divide-y divide-slate-100">
            {data.recentActivity.map((a) => (
              <div key={a.id} className="px-5 py-3">
                <p className="text-[13px] text-slate-700">{a.description}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{a.userName} · {timeAgo(a.createdAt)}</p>
              </div>
            ))}
            {!data.recentActivity.length ? <EmptyState title="No activity yet" /> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Students with low attendance" subtitle="Below 85% in the last 30 days" icon={<TrendingDown className="h-4.5 w-4.5" />} />
          <div className="divide-y divide-slate-100">
            {data.lowAttendance.map((s) => (
              <Link key={s.id} href={`/students/${s.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-slate-800">{s.fullName}</p>
                  <p className="text-[12px] text-slate-500">{s.studentCode} · {standardName(s.standardId)}-{divisionName(s.divisionId)}</p>
                </div>
                <Badge tone={s.pct < 70 ? "bad" : "warn"}>{s.pct}%</Badge>
              </Link>
            ))}
            {!data.lowAttendance.length ? <EmptyState title="Great attendance!" message="No student is below 85%." /> : null}
          </div>
        </Card>

        <Card>
          <CardHead title="Students needing help" subtitle="Lowest result percentages" icon={<TrendingDown className="h-4.5 w-4.5" />} />
          <div className="divide-y divide-slate-100">
            {data.lowMarks.map((x) => (
              <Link key={x.r.id} href={`/students/${x.student!.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-slate-800">{x.student!.fullName}</p>
                  <p className="text-[12px] text-slate-500">{standardName(x.student!.standardId)} · {x.exam!.name}</p>
                </div>
                <Badge tone={x.r.percentage < 40 ? "bad" : "warn"}>{x.r.percentage.toFixed(1)}%</Badge>
              </Link>
            ))}
            {!data.lowMarks.length ? <EmptyState title="No results yet" /> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
