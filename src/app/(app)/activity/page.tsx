"use client";

import * as React from "react";
import { useRouter } from "@/lib/next-compat";
import { Activity } from "lucide-react";
import { Badge, Card, CardHead, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";

const TONES: Record<string, string> = {
  auth: "neutral",
  student: "brand",
  attendance: "ok",
  marks: "violet",
  result: "warn",
  assistant: "bad",
  whatsapp: "ok",
  settings: "neutral",
  profile: "neutral",
  exam: "violet",
};

export default function ActivityPage() {
  const router = useRouter();
  const { state, user } = useDemo();
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    if (user && user.role !== "admin") router.replace("/no-access");
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const term = q.trim().toLowerCase();
  const rows = state.activity.filter(
    (r) => !term || r.description.toLowerCase().includes(term) || r.userName.toLowerCase().includes(term),
  );

  return (
    <div>
      <PageHeader title="Activity Logs" subtitle="A full record of who did what, and when — for complete accountability." />

      <Card className="mb-4">
        <div className="flex flex-col gap-2 p-4 sm:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by action or person…"
            className="input flex-1"
          />
        </div>
      </Card>

      <Card>
        <CardHead title="System activity" subtitle={`${rows.length} events`} icon={<Activity className="h-4.5 w-4.5" />} />
        {rows.length ? (
          <ol className="divide-y divide-slate-100">
            {rows.map((r) => {
              const kind = r.action.split(".")[0];
              return (
                <li key={r.id} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex-1">
                    <p className="text-[14px] text-slate-800">{r.description}</p>
                    <p className="mt-0.5 text-[12px] text-slate-400">
                      {r.userName} · {r.userRole} · {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={TONES[kind] ?? "neutral"}>{r.action}</Badge>
                    <span className="w-16 text-right text-[11.5px] text-slate-400">{timeAgo(r.createdAt)}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState title="No activity found" message="Try a different search term." />
        )}
      </Card>
    </div>
  );
}
