"use client";

import * as React from "react";
import { MessageCircle, RotateCcw, Save, Send, Sparkles } from "lucide-react";
import { Avatar, Badge, Button, Card, CardHead, EmptyState, PageHeader, Textarea, useToast } from "@/components/ui";
import { DEFAULT_ABSENCE_TEMPLATE, renderTemplate, TEMPLATE_VARIABLES } from "@/lib/grading";
import { formatDate, formatDateTime, normalizePhone, todayISO } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";

export default function WhatsappPage() {
  const { push } = useToast();
  const { state, user, standardName, divisionName, saveTemplate, sendWhatsapp } = useDemo();
  const isAdmin = user?.role === "admin";

  const [template, setTemplate] = React.useState(state.templates.absence);
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => setTemplate(state.templates.absence), [state.templates.absence]);

  const today = todayISO();
  const absent = React.useMemo(
    () =>
      state.attendance
        .filter((a) => a.date === today && a.status === "absent")
        .map((a) => ({ a, s: state.students.find((x) => x.id === a.studentId)! }))
        .filter((x) => x.s)
        .sort((x, y) => x.s.fullName.localeCompare(y.s.fullName)),
    [state.attendance, state.students, today],
  );

  const sample = absent[0];
  const preview = renderTemplate(template, {
    student_name: sample?.s.fullName ?? "Rahul Patel",
    father_name: sample?.s.fatherName ?? "Ramesh Patel",
    student_id: sample?.s.studentCode ?? "ST0001",
    guardian_name: "Parent/Guardian",
    date: formatDate(sample?.a.date ?? new Date()),
    standard: sample ? standardName(sample.s.standardId) : "Standard 8",
    division: sample ? divisionName(sample.s.divisionId) : "A",
    shift: sample?.a.shift ?? "morning",
    class_name: state.settings.tuitionName,
    exam_name: "Mid Term Exam",
    total: "253/300",
    percentage: "84.33",
    grade: "A",
  });

  function insertVar(v: string) {
    const el = ref.current;
    if (!el) {
      setTemplate((t) => `${t}${v}`);
      return;
    }
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? template.length;
    setTemplate(`${template.slice(0, start)}${v}${template.slice(end)}`);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + v.length;
    });
  }

  const buildFor = (i: (typeof absent)[number]) =>
    renderTemplate(template, {
      student_name: i.s.fullName,
      father_name: i.s.fatherName || "N/A",
      student_id: i.s.studentCode,
      guardian_name: "Parent/Guardian",
      date: formatDate(i.a.date),
      standard: standardName(i.s.standardId),
      division: divisionName(i.s.divisionId),
      shift: i.a.shift,
      class_name: state.settings.tuitionName,
    });

  return (
    <div>
      <PageHeader title="WhatsApp" subtitle="Customise the guardian message and notify parents of absent students in one tap." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead
            title="Absence message template"
            subtitle="Write the message once — the system fills in each student's details."
            icon={<MessageCircle className="h-4.5 w-4.5" />}
          />
          <div className="p-5">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => insertVar(v)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11.5px] text-slate-600 transition hover:bg-[#eff6ff] hover:text-[#2563eb] disabled:opacity-60"
                >
                  {v}
                </button>
              ))}
            </div>
            <Textarea
              ref={ref}
              rows={11}
              value={template}
              disabled={!isAdmin}
              onChange={(e) => setTemplate(e.target.value)}
              className="font-mono text-[13.5px] leading-6"
            />
            {isAdmin ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    saveTemplate("absence", template);
                    push("success", "Message template saved.");
                  }}
                >
                  <Save className="h-4 w-4" /> Save template
                </Button>
                <Button
                  variant="soft"
                  onClick={() => {
                    setTemplate(DEFAULT_ABSENCE_TEMPLATE);
                    saveTemplate("absence", DEFAULT_ABSENCE_TEMPLATE);
                    push("success", "Message reset to the default text.");
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> Reset to default
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-slate-500">Only the admin can change this message.</p>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHead title="Live preview" subtitle="This is exactly what the guardian receives." icon={<Sparkles className="h-4.5 w-4.5" />} />
            <div className="p-5">
              <div className="rounded-2xl bg-[#e5ddd5] p-4">
                <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-slate-800">{preview}</p>
                  <p className="mt-1 text-right text-[10.5px] text-slate-400">
                    {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHead
              title="Delivery method"
              subtitle="How messages reach guardians"
              icon={<Send className="h-4.5 w-4.5" />}
              action={<Badge tone="warn">Manual mode</Badge>}
            />
            <div className="space-y-2 p-5 text-[13.5px] text-slate-600">
              <p>
                <b className="text-slate-800">Manual (this demo)</b> — every message is generated with the student&apos;s real details and
                logged below. Tap <i>Open WhatsApp</i> to send it from your own WhatsApp — no unofficial automation.
              </p>
              <p>
                <b className="text-slate-800">Official WhatsApp Business API</b> — in the production build the same message payload is
                posted to a provider such as Meta Cloud API, Twilio or Gupshup so messages are delivered automatically.
              </p>
            </div>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHead
            title="Today's absent students"
            subtitle="Send the absence message to their guardians"
            icon={<MessageCircle className="h-4.5 w-4.5" />}
            action={
              absent.length ? (
                <Button
                  variant="ok"
                  onClick={() => {
                    sendWhatsapp(
                      absent.map((i) => ({
                        studentId: i.s.id,
                        attendanceId: i.a.id,
                        to: normalizePhone(i.s.whatsappNumber || i.s.primaryMobile),
                        body: buildFor(i),
                      })),
                    );
                    push("success", `Prepared ${absent.length} message(s). Use “Open WhatsApp” to send each one.`);
                  }}
                >
                  <Send className="h-4 w-4" /> Prepare all ({absent.length})
                </Button>
              ) : null
            }
          />
          {absent.length ? (
            <div className="divide-y divide-slate-100">
              {absent.map((i) => (
                <div key={i.a.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3">
                    <Avatar name={i.s.fullName} color={i.s.photoColor} size={38} />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-slate-800">{i.s.fullName}</p>
                      <p className="text-[12.5px] text-slate-500">
                        {i.s.studentCode} · {standardName(i.s.standardId)}-{divisionName(i.s.divisionId)} · +
                        {normalizePhone(i.s.whatsappNumber || i.s.primaryMobile)}
                      </p>
                    </div>
                  </div>
                  {i.a.notified ? <Badge tone="ok">Notified</Badge> : <Badge tone="warn">Pending</Badge>}
                  <a
                    href={`https://wa.me/${normalizePhone(i.s.whatsappNumber || i.s.primaryMobile)}?text=${encodeURIComponent(buildFor(i))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-soft"
                  >
                    <MessageCircle className="h-4 w-4 text-[#16a34a]" /> Open WhatsApp
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Nobody is absent today 🎉" message="Absent students appear here right after you save attendance." />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHead title="Message history" subtitle="Every message prepared or sent from this app" />
          {state.messages.length ? (
            <div className="max-h-[50vh] overflow-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr>
                    <th className="th">To</th>
                    <th className="th">Message</th>
                    <th className="th">Channel</th>
                    <th className="th">Status</th>
                    <th className="th">By</th>
                    <th className="th">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.messages.map((m) => (
                    <tr key={m.id}>
                      <td className="td">+{m.toNumber}</td>
                      <td className="td max-w-sm truncate text-slate-500">{m.body.replace(/\n/g, " ")}</td>
                      <td className="td capitalize">{m.channel}</td>
                      <td className="td"><Badge tone={m.status === "sent" ? "ok" : m.status === "failed" ? "bad" : "warn"}>{m.status}</Badge></td>
                      <td className="td">{m.sentByName ?? "—"}</td>
                      <td className="td text-slate-500">{formatDateTime(m.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No messages yet" message="Messages you send to guardians will be listed here." />
          )}
        </Card>
      </div>
    </div>
  );
}
