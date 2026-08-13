"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = { fontSize: 11, fill: "#94a3b8" };

export function AttendanceTrendChart({ data }: { data: { date: string; pct: number }[] }) {
  const shaped = data.map((d) => ({
    label: new Date(`${d.date}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    pct: d.pct,
  }));
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={shaped} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} width={44} unit="%" />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(v?: unknown) => [`${v}%`, "Attendance"]}
        />
        <Area type="monotone" dataKey="pct" stroke="#2563EB" strokeWidth={2.4} fill="url(#attGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StandardBarChart({ data }: { data: { name: string; total: number }[] }) {
  const colors = ["#2563EB", "#7C3AED", "#0891B2", "#16A34A", "#F59E0B", "#DB2777"];
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(v?: unknown) => [String(v), "Students"]}
        />
        <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={46}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PerformanceLineChart({ data }: { data: { name: string; pct: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} width={44} unit="%" />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(v?: unknown) => [`${v}%`, "Average"]}
        />
        <Line type="monotone" dataKey="pct" stroke="#16A34A" strokeWidth={2.6} dot={{ r: 4, fill: "#16A34A" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
