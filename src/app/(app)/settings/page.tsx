"use client";

import * as React from "react";
import { useRouter } from "@/lib/next-compat";
import {
  BookOpen,
  Building2,
  GraduationCap,
  MessageCircle,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHead,
  ConfirmDialog,
  Field,
  Input,
  PageHeader,
  Select,
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import type { GradeBand } from "@/lib/grading";
import { useDemo } from "@/lib/demo/store";

export default function SettingsPage() {
  const router = useRouter();
  const { push } = useToast();
  const { state, user, saveSettings, addAcademic, removeAcademic, updateProfile, resetDemo } = useDemo();

  const [tab, setTab] = React.useState("tuition");
  const [form, setForm] = React.useState(state.settings);
  const [bands, setBands] = React.useState<GradeBand[]>(state.settings.gradeBands);
  const [saving, setSaving] = React.useState(false);
  const [pw, setPw] = React.useState({ current: "", next: "", confirm: "" });
  const [resetOpen, setResetOpen] = React.useState(false);

  React.useEffect(() => {
    setForm(state.settings);
    setBands(state.settings.gradeBands);
  }, [state.settings]);

  React.useEffect(() => {
    if (user && user.role !== "admin") router.replace("/no-access");
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  function save() {
    setSaving(true);
    setTimeout(() => {
      saveSettings({ ...form, gradeBands: bands });
      push("success", "Settings saved.");
      setSaving(false);
    }, 200);
  }

  function changePassword() {
    if (pw.next !== pw.confirm) {
      push("error", "New passwords do not match.");
      return;
    }
    const res = updateProfile({ currentPassword: pw.current, newPassword: pw.next });
    if (!res.ok) push("error", res.error ?? "Could not change password");
    else {
      push("success", "Password changed.");
      setPw({ current: "", next: "", confirm: "" });
    }
  }

  function add(type: "standard" | "division" | "subject", name: string, standardId?: number) {
    const res = addAcademic(type, name, standardId);
    if (!res.ok) push("error", res.error ?? "Could not add");
    else push("success", "Added successfully.");
  }

  function remove(type: "standard" | "division" | "subject", id: number) {
    const res = removeAcademic(type, id);
    if (!res.ok) push("error", res.error ?? "Could not remove");
    else push("success", "Removed.");
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Everything about your tuition class, classes, grading and communication." />

      <div className="mb-4">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "tuition", label: "Tuition Info", icon: <Building2 className="h-4 w-4" /> },
            { key: "academic", label: "Academic", icon: <BookOpen className="h-4 w-4" /> },
            { key: "grading", label: "Grading", icon: <GraduationCap className="h-4 w-4" /> },
            { key: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" /> },
            { key: "security", label: "Security", icon: <ShieldCheck className="h-4 w-4" /> },
          ]}
        />
      </div>

      {tab === "tuition" ? (
        <Card>
          <CardHead title="Tuition information" subtitle="Shown on the sidebar, login screen and printed result PDFs." icon={<Building2 className="h-4.5 w-4.5" />} />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Tuition class name" required>
              <Input value={form.tuitionName} onChange={(e) => set("tuitionName", e.target.value)} />
            </Field>
            <Field label="Tagline">
              <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </Field>
            <Field label="Logo initials" hint="2–3 letters shown in the blue square">
              <Input maxLength={4} value={form.logoText} onChange={(e) => set("logoText", e.target.value.toUpperCase())} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end border-t border-[#e2e8f0] p-4">
            <Button onClick={save} loading={saving}><Save className="h-4 w-4" /> Save settings</Button>
          </div>
        </Card>
      ) : null}

      {tab === "academic" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead title="Standards & divisions" subtitle="Your classes and their divisions" icon={<BookOpen className="h-4.5 w-4.5" />} />
            <div className="divide-y divide-slate-100">
              {state.standards.map((s) => (
                <div key={s.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{s.name}</p>
                    <button onClick={() => remove("standard", s.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {state.divisions.filter((d) => d.standardId === s.id).map((d) => (
                      <span key={d.id} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[13px] text-slate-700">
                        Division {d.name}
                        <button onClick={() => remove("division", d.id)} className="text-slate-400 hover:text-red-600">×</button>
                      </span>
                    ))}
                    <AddInline placeholder="New division (e.g. C)" onAdd={(v) => add("division", v, s.id)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#e2e8f0] p-4">
              <AddInline placeholder="New standard (e.g. Standard 9)" onAdd={(v) => add("standard", v)} wide />
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHead title="Master Subjects List" icon={<GraduationCap className="h-4.5 w-4.5" />} />
              <div className="flex flex-wrap gap-2 p-4">
                {state.subjects.filter((s) => s.active).map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[13px] text-slate-700">
                    {s.name}
                    <button onClick={() => remove("subject", s.id)} className="text-slate-400 hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
              <div className="border-t border-[#e2e8f0] p-4">
                <AddInline placeholder="New subject" onAdd={(v) => add("subject", v)} wide />
              </div>
            </Card>

            <Card>
              <CardHead
                title="Standard-wise Subject Allocation"
                subtitle="Configured subject rules mapped per class and stream."
                icon={<BookOpen className="h-4.5 w-4.5" />}
              />
              <div className="overflow-x-auto p-4">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-800 uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2 rounded-l-lg">Standard</th>
                      <th className="px-3 py-2">Stream</th>
                      <th className="px-3 py-2 rounded-r-lg">Allocated Subjects</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {[
                      { std: "5", stream: "—", subs: ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"] },
                      { std: "6", stream: "—", subs: ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"] },
                      { std: "7", stream: "—", subs: ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"] },
                      { std: "8", stream: "—", subs: ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"] },
                      { std: "9", stream: "—", subs: ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"] },
                      { std: "10", stream: "—", subs: ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"] },
                      { std: "11", stream: "Science", subs: ["Physics", "Chemistry", "Mathematics", "Biology", "English"] },
                      { std: "11", stream: "Commerce", subs: ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"] },
                      { std: "12", stream: "Science", subs: ["Physics", "Chemistry", "Mathematics", "Biology", "English"] },
                      { std: "12", stream: "Commerce", subs: ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"] },
                    ].map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5 font-bold text-slate-900">Standard {item.std}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${item.stream === "Science" ? "bg-blue-50 text-blue-700" : item.stream === "Commerce" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {item.stream}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {item.subs.map((sub, sIdx) => (
                              <span key={sIdx} className="rounded-md bg-slate-100 px-2 py-0.5 text-[12px] text-slate-800 font-medium border border-slate-200/60">
                                {sub}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHead title="Shifts" subtitle="Class timings used across the app" />
              <div className="flex flex-wrap gap-2 p-4">
                <Badge tone="brand">Morning</Badge>
                <Badge tone="violet">Afternoon</Badge>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "grading" ? (
        <Card>
          <CardHead title="Grading system" subtitle="Set the minimum percentage for each grade." icon={<GraduationCap className="h-4.5 w-4.5" />} />
          <div className="space-y-2 p-5">
            {bands.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input className="w-24" value={b.grade} onChange={(e) => setBands((p) => p.map((x, j) => (j === i ? { ...x, grade: e.target.value } : x)))} />
                <Input
                  className="w-28"
                  inputMode="numeric"
                  value={String(b.min)}
                  onChange={(e) => setBands((p) => p.map((x, j) => (j === i ? { ...x, min: Number(e.target.value) || 0 } : x)))}
                />
                <Input className="flex-1" value={b.label} onChange={(e) => setBands((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <button onClick={() => setBands((p) => p.filter((_, j) => j !== i))} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button variant="soft" onClick={() => setBands((p) => [...p, { grade: "New", min: 0, label: "" }])}>
              <Plus className="h-4 w-4" /> Add grade
            </Button>
          </div>
          <div className="grid gap-4 border-t border-[#e2e8f0] p-5 sm:grid-cols-3">
            <Field label="Pass percentage">
              <Input inputMode="numeric" value={String(form.passPercentage)} onChange={(e) => set("passPercentage", Number(e.target.value) || 0)} />
            </Field>
            <Field label="Low attendance warning below (%)">
              <Input inputMode="numeric" value={String(form.lowAttendanceThreshold)} onChange={(e) => set("lowAttendanceThreshold", Number(e.target.value) || 0)} />
            </Field>
            <Field label="Low marks warning below (%)">
              <Input inputMode="numeric" value={String(form.lowMarksThreshold)} onChange={(e) => set("lowMarksThreshold", Number(e.target.value) || 0)} />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.rankEnabled} onChange={(e) => set("rankEnabled", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#2563eb]" />
              Show rank on results
            </label>
          </div>
          <div className="flex justify-end border-t border-[#e2e8f0] p-4">
            <Button onClick={save} loading={saving}><Save className="h-4 w-4" /> Save settings</Button>
          </div>
        </Card>
      ) : null}

      {tab === "whatsapp" ? (
        <Card>
          <CardHead
            title="WhatsApp provider"
            subtitle="Connect an official WhatsApp Business API provider for automatic delivery."
            icon={<MessageCircle className="h-4.5 w-4.5" />}
            action={<Badge tone="warn">Demo · manual mode</Badge>}
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Provider">
              <Select value={form.whatsappProvider} onChange={(e) => set("whatsappProvider", e.target.value)}>
                <option value="none">Manual (open WhatsApp)</option>
                <option value="meta_cloud">Meta WhatsApp Cloud API</option>
                <option value="twilio">Twilio WhatsApp</option>
                <option value="gupshup">Gupshup</option>
              </Select>
            </Field>
            <Field label="Business phone number ID" hint="From your provider dashboard">
              <Input value={form.whatsappPhoneNumberId} onChange={(e) => set("whatsappPhoneNumberId", e.target.value)} />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 sm:col-span-2">
              <input type="checkbox" checked={form.whatsappAutoNotify} onChange={(e) => set("whatsappAutoNotify", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#2563eb]" />
              Automatically prompt to notify guardians right after attendance is saved
            </label>
            <div className="rounded-xl border border-blue-100 bg-[#eff6ff] p-4 text-[13px] text-blue-900 sm:col-span-2">
              This is a frontend demo, so messages are generated and logged locally and opened through the official
              <b> wa.me </b> deep link. In production the same payload is posted to your WhatsApp Business API provider from a
              secure server route — the access token is never stored in the browser.
            </div>
          </div>
          <div className="flex justify-end border-t border-[#e2e8f0] p-4">
            <Button onClick={save} loading={saving}><Save className="h-4 w-4" /> Save settings</Button>
          </div>
        </Card>
      ) : null}

      {tab === "security" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHead title="Change password" subtitle="Use a strong password you do not use anywhere else." icon={<ShieldCheck className="h-4.5 w-4.5" />} />
            <div className="grid gap-4 p-5">
              <Field label="Current password" required>
                <Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
              </Field>
              <Field label="New password" required hint="At least 6 characters">
                <Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
              </Field>
              <Field label="Confirm new password" required>
                <Input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
              </Field>
            </div>
            <div className="flex justify-end border-t border-[#e2e8f0] p-4">
              <Button onClick={changePassword} disabled={!pw.current || !pw.next}>Change password</Button>
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHead title="Access model" subtitle="How this demo protects each screen" />
              <ul className="space-y-3 p-5 text-[13.5px] text-slate-600">
                <li>• Every page and action is gated by role + granular permission checks.</li>
                <li>• Disabling or deleting an assistant revokes their session immediately.</li>
                <li>• Assistants only ever see the standards assigned to them.</li>
                <li>• In production these same checks run again server-side with hashed passwords and signed session cookies.</li>
              </ul>
            </Card>

            <Card>
              <CardHead title="Demo data" subtitle="All data lives in your browser (localStorage)" />
              <div className="flex flex-col gap-3 p-5">
                <p className="text-[13.5px] text-slate-600">
                  Every change you make — students, attendance, marks, results — is saved locally so you can refresh and continue.
                  Reset to bring back the original sample data.
                </p>
                <Button variant="soft" onClick={() => setResetOpen(true)} className="self-start">
                  <RotateCcw className="h-4 w-4" /> Reset demo data
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={resetOpen}
        title="Reset all demo data?"
        message="Every student, attendance record, mark and result you changed will be replaced with the original sample data."
        confirmLabel="Reset demo"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetDemo();
          setResetOpen(false);
          push("success", "Demo data restored.");
        }}
      />
    </div>
  );
}

function AddInline({ placeholder, onAdd, wide }: { placeholder: string; onAdd: (v: string) => void; wide?: boolean }) {
  const [v, setV] = React.useState("");
  return (
    <div className={`flex gap-2 ${wide ? "w-full" : ""}`}>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        className={`rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-[13px] outline-none focus:border-[#2563eb] ${wide ? "flex-1" : "w-44"}`}
      />
      <button
        onClick={() => {
          onAdd(v);
          setV("");
        }}
        className="inline-flex items-center gap-1 rounded-lg bg-[#eff6ff] px-3 py-1.5 text-[13px] font-semibold text-[#2563eb] hover:bg-blue-100"
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
  );
}
