"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import { Bell, CheckCheck } from "lucide-react";
import { Badge, Button, Card, CardHead, EmptyState, PageHeader, useToast } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";

const TONE: Record<string, string> = { info: "brand", success: "ok", warning: "warn", danger: "bad" };

export default function NotificationsPage() {
  const { push } = useToast();
  const { state, markAllNotificationsRead } = useDemo();
  const rows = state.notifications;
  const unread = rows.filter((r) => !r.isRead).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Absences, marks, results, assistant activity and warnings — all in one place."
        actions={
          <Button
            variant="soft"
            disabled={!unread}
            onClick={() => {
              markAllNotificationsRead();
              push("success", "All notifications marked as read.");
            }}
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        }
      />
      <Card>
        <CardHead
          title="All notifications"
          subtitle={unread ? `${unread} unread` : "You are all caught up"}
          icon={<Bell className="h-4.5 w-4.5" />}
        />
        {rows.length ? (
          <div className="divide-y divide-slate-100">
            {rows.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "/notifications"}
                className={`flex flex-col gap-1 px-5 py-3.5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4 ${
                  n.isRead ? "" : "bg-blue-50/40"
                }`}
              >
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-slate-800">{n.title}</p>
                  <p className="mt-0.5 text-[13px] text-slate-500">{n.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={TONE[n.severity] ?? "neutral"}>{n.type}</Badge>
                  <span className="text-[11.5px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No notifications yet" message="Activity in the app will show up here." />
        )}
      </Card>
    </div>
  );
}
