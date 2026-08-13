"use client";

import * as React from "react";
import { useRouter } from "@/lib/next-compat";
import { KeyRound, Pencil, ShieldCheck, Trash2, UserCog, UserPlus } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHead,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusPill,
  useToast,
} from "@/components/ui";
import { DEFAULT_ASSISTANT_PERMISSIONS, PERMISSION_GROUPS, PERMISSION_LABELS } from "@/lib/permissions";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";
import type { User } from "@/lib/demo/types";

export default function AssistantsPage() {
  const router = useRouter();
  const { push } = useToast();
  const { state, user, saveAssistant, deleteAssistant } = useDemo();

  const [editing, setEditing] = React.useState<User | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [confirm, setConfirm] = React.useState<User | null>(null);

  React.useEffect(() => {
    if (user && user.role !== "admin") router.replace("/no-access");
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const rows = state.users.filter((u) => u.role !== "admin").sort((a, b) => a.name.localeCompare(b.name));

  function toggleStatus(a: User) {
    const next = a.status === "active" ? "disabled" : "active";
    saveAssistant({ status: next }, a.id);
    push("success", next === "active" ? `${a.name} can sign in again.` : `${a.name} was disabled.`);
  }

  return (
    <div>
      <PageHeader title="Assistants" subtitle="Give trusted helpers their own secure login with exactly the permissions you choose." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid flex-1 grid-cols-3 gap-3">
          <Card className="p-4"><p className="text-xl font-bold text-[#2563EB]">{rows.length}</p><p className="text-[13px] text-slate-500">Total assistants</p></Card>
          <Card className="p-4"><p className="text-xl font-bold text-[#16A34A]">{rows.filter((r) => r.status === "active").length}</p><p className="text-[13px] text-slate-500">Active</p></Card>
          <Card className="p-4"><p className="text-xl font-bold text-[#DC2626]">{rows.filter((r) => r.status !== "active").length}</p><p className="text-[13px] text-slate-500">Disabled</p></Card>
        </div>
        <Button onClick={() => setCreating(true)} className="sm:self-stretch"><UserPlus className="h-4 w-4" /> Add Assistant</Button>
      </div>

      <Card className="overflow-hidden">
        <CardHead
          title="Assistant Management"
          subtitle="Control exactly what each assistant can see and do. Changes apply immediately."
          icon={<UserCog className="h-4.5 w-4.5" />}
        />
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr>
                  <th className="th">Assistant</th>
                  <th className="th">Contact</th>
                  <th className="th">Assigned standards</th>
                  <th className="th">Permissions</th>
                  <th className="th">Status</th>
                  <th className="th">Last login</th>
                  <th className="th">Created</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={a.name} color={a.avatarColor} size={36} />
                        <div>
                          <p className="font-semibold text-slate-800">{a.name}</p>
                          <p className="text-[12px] text-slate-400">Assistant</p>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <p className="text-slate-700">{a.email}</p>
                      <p className="text-[12px] text-slate-400">{a.mobile ?? "—"}</p>
                    </td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        {a.assignedStandards.length ? (
                          a.assignedStandards.map((id) => (
                            <Badge key={id} tone="brand">{state.standards.find((s) => s.id === id)?.name ?? id}</Badge>
                          ))
                        ) : (
                          <span className="text-[13px] text-slate-400">All standards</span>
                        )}
                      </div>
                    </td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        {a.permissions.slice(0, 3).map((p) => <Badge key={p} tone="neutral">{PERMISSION_LABELS[p] ?? p}</Badge>)}
                        {a.permissions.length > 3 ? <Badge tone="violet">+{a.permissions.length - 3}</Badge> : null}
                        {!a.permissions.length ? <span className="text-[13px] text-slate-400">No access</span> : null}
                      </div>
                    </td>
                    <td className="td"><StatusPill status={a.status} /></td>
                    <td className="td text-slate-500">{a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Never"}</td>
                    <td className="td text-slate-500">{formatDate(a.createdAt)}</td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditing(a)} title="Edit & permissions" className="rounded-lg p-2 text-slate-400 hover:bg-[#eff6ff] hover:text-[#2563eb]">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => toggleStatus(a)} title={a.status === "active" ? "Disable" : "Enable"} className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600">
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirm(a)} title="Delete" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<UserCog className="h-6 w-6" />}
            title="No assistants yet"
            message="Create an assistant account so someone else can take attendance or enter marks from their own device."
            action={<Button onClick={() => setCreating(true)}><UserPlus className="h-4 w-4" /> Add Assistant</Button>}
          />
        )}
      </Card>

      <AssistantModal
        open={creating || Boolean(editing)}
        assistant={editing}
        standards={state.standards}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={(payload, id) => {
          const res = saveAssistant(payload, id);
          if (!res.ok) {
            push("error", res.error ?? "Could not save assistant");
            return false;
          }
          push("success", id ? "Assistant updated." : "Assistant account created.");
          setCreating(false);
          setEditing(null);
          return true;
        }}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Are you sure you want to delete this assistant?"
        message={`${confirm?.name ?? ""} will lose access to the application immediately. This cannot be undone.`}
        confirmLabel="Delete Assistant"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteAssistant(confirm.id);
            push("success", `${confirm.name} was removed and can no longer sign in.`);
          }
          setConfirm(null);
        }}
      />
    </div>
  );
}

function AssistantModal({
  open,
  assistant,
  standards,
  onClose,
  onSave,
}: {
  open: boolean;
  assistant: User | null;
  standards: { id: number; name: string }[];
  onClose: () => void;
  onSave: (payload: Partial<User> & { password?: string }, id?: number) => boolean;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "disabled">("active");
  const [perms, setPerms] = React.useState<string[]>(DEFAULT_ASSISTANT_PERMISSIONS);
  const [stds, setStds] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setName(assistant?.name ?? "");
    setEmail(assistant?.email ?? "");
    setMobile(assistant?.mobile ?? "");
    setPassword("");
    setStatus((assistant?.status as "active" | "disabled") ?? "active");
    setPerms(assistant?.permissions ?? DEFAULT_ASSISTANT_PERMISSIONS);
    setStds(assistant?.assignedStandards ?? []);
  }, [open, assistant]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={assistant ? `Edit ${assistant.name}` : "Add a new assistant"}
      description="Assistants sign in from their own device and only see what you allow."
      width="max-w-3xl"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() =>
              onSave(
                {
                  name,
                  email,
                  mobile: mobile || null,
                  permissions: perms,
                  assignedStandards: stds,
                  status,
                  ...(password ? { password } : {}),
                },
                assistant?.id,
              )
            }
          >
            {assistant ? "Save changes" : "Create assistant"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amit Joshi" />
        </Field>
        <Field label="Email (used to sign in)" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="amit@tuition.in" />
        </Field>
        <Field label="Mobile number">
          <Input inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9825012345" />
        </Field>
        <Field label={assistant ? "Reset password (optional)" : "Password"} required={!assistant} hint="At least 6 characters">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-10" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={assistant ? "Leave blank to keep current" : "••••••"} />
          </div>
        </Field>
        <Field label="Account status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as "active" | "disabled")}>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </Select>
        </Field>
      </div>

      <div className="mt-5">
        <p className="field-label">Assigned standards</p>
        <p className="mb-2 text-[12px] text-slate-400">Leave all unchecked to allow every standard.</p>
        <div className="flex flex-wrap gap-2">
          {standards.map((s) => {
            const on = stds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStds((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                className={`rounded-xl border px-3.5 py-2 text-[13px] font-medium transition ${
                  on ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]" : "border-[#e2e8f0] text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <p className="field-label">Permissions</p>
        <p className="mb-3 text-[12px] text-slate-400">Turn ON only what this person needs.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PERMISSION_GROUPS.map((g) => (
            <div key={g.group} className="rounded-xl border border-[#e2e8f0] p-3">
              <p className="mb-2 text-[13px] font-semibold text-slate-700">{g.group}</p>
              <div className="space-y-1.5">
                {g.items.map((i) => (
                  <label key={i.key} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={perms.includes(i.key)}
                      onChange={() => setPerms((prev) => (prev.includes(i.key) ? prev.filter((x) => x !== i.key) : [...prev, i.key]))}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    <span>
                      <span className="block text-[13.5px] font-medium text-slate-800">{i.label}</span>
                      <span className="block text-[11.5px] text-slate-400">{i.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
