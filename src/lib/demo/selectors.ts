import { addDaysISO, pct, todayISO } from "@/lib/utils";
import type { DemoState } from "@/lib/demo/types";
import type { SessionUser } from "@/lib/permissions";

export function scopedStandardIds(state: DemoState, user: SessionUser | null): number[] | null {
  if (!user || user.role === "admin" || !user.assignedStandards.length) return null;
  return user.assignedStandards;
}

export function attendanceSummary(rows: { status: string }[]) {
  const total = rows.length;
  const present = rows.filter((r) => r.status !== "absent").length;
  return { total, present, absent: total - present, pct: pct(present, total) };
}

export function dashboardData(state: DemoState, user: SessionUser | null) {
  const today = todayISO();
  const scope = scopedStandardIds(state, user);
  const inScope = <T extends { standardId: number }>(rows: T[]) =>
    scope ? rows.filter((r) => scope.includes(r.standardId)) : rows;

  const students = inScope(state.students);
  const attendance = inScope(state.attendance);
  const todayRows = attendance.filter((a) => a.date === today);
  const present = todayRows.filter((a) => a.status !== "absent").length;
  const absent = todayRows.filter((a) => a.status === "absent").length;

  const standards = scope ? state.standards.filter((s) => scope.includes(s.id)) : state.standards;

  const standardRows = standards.map((s) => {
    const total = state.students.filter((x) => x.standardId === s.id && x.status === "active").length;
    const day = todayRows.filter((a) => a.standardId === s.id);
    const p = day.filter((a) => a.status !== "absent").length;
    const a = day.filter((x) => x.status === "absent").length;
    const res = state.results.filter((r) => {
      const st = state.students.find((x) => x.id === r.studentId);
      return st?.standardId === s.id;
    });
    return {
      id: s.id,
      name: s.name,
      total,
      present: p,
      absent: a,
      attendancePct: pct(p, p + a),
      avgMarks: res.length ? Math.round((res.reduce((x, y) => x + y.percentage, 0) / res.length) * 10) / 10 : 0,
    };
  });

  /* 14-day trend */
  const trend: { date: string; pct: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = addDaysISO(today, -i);
    const rows = attendance.filter((a) => a.date === d);
    if (!rows.length) continue;
    trend.push({ date: d, pct: pct(rows.filter((r) => r.status !== "absent").length, rows.length) });
  }

  /* performance per exam name */
  const perfMap = new Map<string, { sum: number; n: number; order: string }>();
  for (const r of state.results) {
    const exam = state.exams.find((e) => e.id === r.examId);
    if (!exam) continue;
    if (scope && !scope.includes(exam.standardId)) continue;
    const cur = perfMap.get(exam.name) ?? { sum: 0, n: 0, order: exam.examDate };
    cur.sum += r.percentage;
    cur.n += 1;
    if (exam.examDate < cur.order) cur.order = exam.examDate;
    perfMap.set(exam.name, cur);
  }
  const performance = [...perfMap.entries()]
    .sort((a, b) => a[1].order.localeCompare(b[1].order))
    .map(([name, v]) => ({ name, pct: Math.round((v.sum / v.n) * 10) / 10 }));

  const recentStudents = [...students]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const recentMarks = [...state.marks]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      studentName: state.students.find((s) => s.id === m.studentId)?.fullName ?? "—",
      subject: state.subjects.find((s) => s.id === m.subjectId)?.name ?? "—",
      exam: state.exams.find((e) => e.id === m.examId)?.name ?? "—",
      obtained: m.marksObtained,
      max: m.maxMarks,
    }));

  /* low attendance in last 30 days */
  const since = addDaysISO(today, -30);
  const lowAttendance = students
    .filter((s) => s.status === "active")
    .map((s) => {
      const rows = state.attendance.filter((a) => a.studentId === s.id && a.date >= since);
      const p = rows.filter((a) => a.status !== "absent").length;
      return { ...s, total: rows.length, pct: pct(p, rows.length) };
    })
    .filter((s) => s.total > 0 && s.pct < 85)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 6);

  const lowMarks = state.results
    .map((r) => ({
      r,
      student: state.students.find((s) => s.id === r.studentId),
      exam: state.exams.find((e) => e.id === r.examId),
    }))
    .filter((x) => x.student && x.exam && (!scope || scope.includes(x.student.standardId)))
    .sort((a, b) => a.r.percentage - b.r.percentage)
    .slice(0, 6);

  const avgPerformance = state.results.length
    ? Math.round((state.results.reduce((a, b) => a + b.percentage, 0) / state.results.length) * 10) / 10
    : 0;

  return {
    stats: {
      totalStudents: students.length,
      activeStudents: students.filter((s) => s.status === "active").length,
      present,
      absent,
      attendancePct: pct(present, present + absent),
      assistants: state.users.filter((u) => u.role === "assistant").length,
      upcomingExams: state.exams.filter((e) => e.status === "upcoming" && e.examDate >= today).length,
      avgPerformance,
    },
    standardRows,
    trend,
    performance,
    recentStudents,
    recentMarks,
    recentActivity: state.activity.slice(0, 6),
    lowAttendance,
    lowMarks,
  };
}

export const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "lastweek", label: "Last Week" },
  { key: "month", label: "This Month" },
  { key: "lastmonth", label: "Last Month" },
];

export function resolveRange(range?: string, from?: string, to?: string) {
  const today = todayISO();
  if (from && to) return { from, to, key: "custom" };
  const d = new Date(`${today}T00:00:00`);
  switch (range) {
    case "today":
      return { from: today, to: today, key: "today" };
    case "yesterday":
      return { from: addDaysISO(today, -1), to: addDaysISO(today, -1), key: "yesterday" };
    case "week": {
      const dow = (d.getDay() + 6) % 7;
      return { from: addDaysISO(today, -dow), to: today, key: "week" };
    }
    case "lastweek": {
      const dow = (d.getDay() + 6) % 7;
      const s = addDaysISO(today, -dow - 7);
      return { from: s, to: addDaysISO(s, 6), key: "lastweek" };
    }
    case "lastmonth": {
      const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const last = new Date(d.getFullYear(), d.getMonth(), 0);
      return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10), key: "lastmonth" };
    }
    default: {
      const first = new Date(d.getFullYear(), d.getMonth(), 1);
      return { from: first.toISOString().slice(0, 10), to: today, key: "month" };
    }
  }
}
