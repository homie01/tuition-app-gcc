"use client";

import * as React from "react";
import { Save, ShieldCheck, UserCog } from "lucide-react";
import { Avatar, Badge, Button, Card, CardHead, Field, Input, PageHeader, useToast } from "@/components/ui";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";

export default function ProfilePage() {
  const { push } = useToast();
  const { state, user, updateProfile } = useDemo();

  const [v, setV] = React.useState({ name: "", mobile: "" });
  const [pw, setPw] = React.useState({ current: "", next: "" });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (user) setV({ name: user.name, mobile: user.mobile ?? "" });
  }, [user]);

  if (!user) return null;

  function save() {
    setSaving(true);
    setTimeout(() => {
      const res = updateProfile({
        name: v.name,
        mobile: v.mobile,
        ...(pw.next ? { currentPassword: pw.current, newPassword: pw.next } : {}),
      });
      if (!res.ok) push("error", res.error ?? "Could not update profile");
      else {
        push("success", "Profile updated.");
        setPw({ current: "", next: "" });
      }
      setSaving(false);
    }, 250);
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your account details and what you are allowed to do." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHead title="Account details" icon={<UserCog className="h-4.5 w-4.5" />} />
          <div className="flex items-center gap-4 border-b border-[#e2e8f0] px-5 py-5">
            <Avatar name={user.name} color={user.avatarColor} size={60} />
            <div>
              <p className="text-lg font-bold text-slate-900">{user.name}</p>
              <p className="text-[13.5px] text-slate-500">{user.email}</p>
              <div className="mt-1.5 flex gap-2">
                <Badge tone={user.role === "admin" ? "brand" : "violet"}>{user.role === "admin" ? "Administrator" : "Assistant"}</Badge>
                <Badge tone="ok">Active</Badge>
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input value={v.name} onChange={(e) => setV((p) => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Mobile number">
              <Input inputMode="numeric" value={v.mobile} onChange={(e) => setV((p) => ({ ...p, mobile: e.target.value }))} />
            </Field>
            <Field label="Current password" hint="Only needed if changing the password">
              <Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
            </Field>
            <Field label="New password">
              <Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
            </Field>
          </div>
          <div className="flex justify-end border-t border-[#e2e8f0] p-4">
            <Button onClick={save} loading={saving}><Save className="h-4 w-4" /> Save changes</Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHead title="Your access" subtitle="Permissions enabled for your account" icon={<ShieldCheck className="h-4.5 w-4.5" />} />
            <div className="space-y-3 p-5">
              {PERMISSION_GROUPS.map((g) => {
                const allowed = g.items.filter((i) => user.role === "admin" || user.permissions.includes(i.key));
                if (!allowed.length) return null;
                return (
                  <div key={g.group}>
                    <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-400">{g.group}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allowed.map((i) => <Badge key={i.key} tone="ok">{i.label}</Badge>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHead title="Assigned standards" />
            <div className="flex flex-wrap gap-2 p-5">
              {user.role === "admin" || !user.assignedStandards.length ? (
                <Badge tone="brand">All standards</Badge>
              ) : (
                user.assignedStandards.map((id) => (
                  <Badge key={id} tone="brand">{state.standards.find((s) => s.id === id)?.name ?? id}</Badge>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHead title="Last login" />
            <p className="px-5 py-4 text-[14px] text-slate-700">{formatDateTime(user.lastLoginAt)}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
