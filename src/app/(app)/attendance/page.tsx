"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  CheckCheck,
  History,
  MessageCircle,
  Save,
  UserX,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHead,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Select,
  useToast,
} from "@/components/ui";
import { formatDate, formatDateTime, normalizePhone, todayISO } from "@/lib/utils";
import { renderTemplate } from "@/lib/grading";
import { useDemo } from "@/lib/demo/store";
import type { AttendanceStatus, Student } from "@/lib/demo/types";

export default function AttendancePage() {
  const { push } = useToast();
  const { state, allows, visibleStandards, saveAttendance, sendWhatsapp } = useDemo();

  const standards = visibleStandards();
  const [date, setDate] = React.useState(todayISO());
  const [standardId, setStandardId] = React.useState(standards[0] ? String(standards[0].id) : "");
  const [stream, setStream] = React.useState("Science");
  const [divisionId, setDivisionId] = React.useState("");
  const [shift, setShift] = React.useState("morning");
  const [marks, setMarks] = React.useState<Record<number, AttendanceStatus>>({});
  const [saving, setSaving] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [absentModal, setAbsentModal] = React.useState<Student[] | null>(null);

  const canTake = allows("attendance.take");
  const canEdit = allows("attendance.edit");
  const canWhatsapp = allows("whatsapp.send");

  const selectedStdName = standards.find((s) => String(s.id) === standardId)?.name.toLowerCase() ?? "";
  const is11or12 = selectedStdName.includes("11") || selectedStdName.includes("12");

  const divs = state.divisions.filter((d) => String(d.standardId) === standardId);
  React.useEffect(() => {
    if (divs.length && !divs.some((d) => String(d.id) === divisionId)) setDivisionId(String(divs[0].id));
  }, [standardId, divs, divisionId]);

  const roster = React.useMemo(() => {
    const isHigherSec = standards.some(
      (s) => String(s.id) === standardId && (s.name.toLowerCase().includes("11") || s.name.toLowerCase().includes("12"))
    );
    return state.students
      .filter((s) => {
        if (String(s.standardId) !== standardId) return false;
        if (String(s.divisionId) !== divisionId) return false;
        if (s.shift !== shift) return false;
        if (s.status !== "active") return false;
        if (isHigherSec) {
          const st = s.stream ?? "Science";
          if (st !== stream) return false;
        }
        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [state.students, standards, standardId, divisionId, shift, stream]);

  const existing = React.useMemo(
    () => state.attendance.filter((a) => a.date === date && a.shift === shift && roster.some((r) => r.id === a.studentId)),
    [state.attendance, date, shift, roster],
  );

  const already = existing.length ? { by: existing[0].takenByName, at: existing[0].takenAt } : null;

  React.useEffect(() => {
    const map: Record<number, AttendanceStatus> = {};
    for (const r of roster) map[r.id] = "present";
    for (const e of existing) {
      map[e.studentId] = e.status === "present" ? "present" : "absent";
    }
    setMarks(map);
    setEditMode(false);
  }, [roster, existing]);

  const counts = React.useMemo(() => {
    const values = roster.map((r) => marks[r.id] ?? "present");
    return {
      present: values.filter((v) => v === "present").length,
      absent: values.filter((v) => v === "absent").length,
    };
  }, [roster, marks]);

  const locked = Boolean(already) && !editMode;
  const standardName = standards.find((s) => String(s.id) === standardId)?.name ?? "";
  const divisionName = divs.find((d) => String(d.id) === divisionId)?.name ?? "";

  function setAll(status: AttendanceStatus) {
    const map: Record<number, AttendanceStatus> = {};
    for (const r of roster) map[r.id] = status;
    setMarks(map);
  }

  function save() {
    setSaving(true);
    setTimeout(() => {
      saveAttendance({
        date,
        standardId: Number(standardId),
        divisionId: Number(divisionId),
        shift,
        entries: roster.map((r) => ({ studentId: r.id, status: marks[r.id] ?? "present" })),
      });
      push("success", "Attendance successfully saved.");
      const absentRows = roster.filter((r) => marks[r.id] === "absent");
      if (absentRows.length && canWhatsapp && state.settings.whatsappAutoNotify) setAbsentModal(absentRows);
      setSaving(false);
    }, 300);
  }

  const build = (r: Student) =>
    renderTemplate(state.templates.absence, {
      student_name: r.fullName,
      father_name: r.fatherName || "N/A",
      student_id: r.studentCode,
      guardian_name: "Parent/Guardian",
      date: formatDate(date),
      standard: is11or12 ? `${standardName} (${stream})` : standardName,
      division: divisionName,
      shift,
      class_name: state.settings.tuitionName,
    });

  return (
    <div>
      <PageHeader
        title="Take Attendance"
        subtitle="Pick the class, tap Present or Absent, then save. It takes less than a minute."
        actions={
          <>
            <Link href="/attendance/history" className="btn-soft"><History className="h-4 w-4" /> History</Link>
            <Link href="/attendance/reports" className="btn-soft"><BarChart3 className="h-4 w-4" /> Reports</Link>
          </>
        }
      />

      <Card className="mb-4">
        <CardHead
          title="Select the class"
          subtitle="Choose date, standard, division and shift — students appear below."
          icon={<CalendarDays className="h-4.5 w-4.5" />}
        />
        <div className={`grid gap-3 p-4 sm:grid-cols-2 ${is11or12 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
          <Field label="Date">
            <input type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Standard">
            <Select value={standardId} onChange={(e) => setStandardId(e.target.value)}>
              {standards.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          {is11or12 ? (
            <Field label="Stream">
              <Select value={stream} onChange={(e) => setStream(e.target.value)}>
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
              </Select>
            </Field>
          ) : null}
          <Field label="Division">
            <Select value={divisionId} onChange={(e) => setDivisionId(e.target.value)}>
              {divs.map((d) => <option key={d.id} value={d.id}>Division {d.name}</option>)}
            </Select>
          </Field>
          <Field label="Shift">
            <Select value={shift} onChange={(e) => setShift(e.target.value)}>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
            </Select>
          </Field>
        </div>
      </Card>

      {already ? (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Attendance is already saved for this class and date.</p>
              <p className="text-[13px] text-amber-800">Taken by {already.by ?? "—"} · {formatDateTime(already.at)}</p>
            </div>
          </div>
          {canEdit ? (
            <Button variant={editMode ? "soft" : "primary"} onClick={() => setEditMode((m) => !m)}>
              {editMode ? "Cancel editing" : "Edit attendance"}
            </Button>
          ) : null}
        </div>
      ) : null}

      {!roster.length ? (
        <Card>
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No active students in this class"
            message={`There are no active students in ${standardName}${is11or12 ? ` (${stream})` : ""}-${divisionName} for the ${shift} shift. Try a different stream, division or shift.`}
          />
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">{roster.length} students</Badge>
                <Badge tone="ok">{counts.present} present</Badge>
                <Badge tone="bad">{counts.absent} absent</Badge>
              </div>
              {canTake && !locked ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="soft" onClick={() => setAll("present")}>
                    <CheckCheck className="h-4 w-4 text-[#16a34a]" /> All Present
                  </Button>
                  <Button variant="soft" onClick={() => setAll("absent")}>
                    <UserX className="h-4 w-4 text-[#dc2626]" /> All Absent
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>

          {/* Desktop Table View */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="max-h-[62vh] overflow-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="th w-14">#</th>
                    <th className="th">Student</th>
                    <th className="th text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((r, i) => (
                    <tr key={r.id} className={marks[r.id] === "absent" ? "bg-red-50/40" : ""}>
                      <td className="td text-slate-400">{i + 1}</td>
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.fullName} color={r.photoColor} size={34} />
                          <div>
                            <p className="font-semibold text-slate-800">{r.fullName}</p>
                            <p className="text-[12px] text-slate-400">Roll {r.rollNumber ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td">
                        <div className="flex justify-end gap-1.5">
                          {(["present", "absent"] as const).map((st) => {
                            const active = (marks[r.id] ?? "present") === st;
                            const colors: Record<string, string> = {
                              present: "bg-[#16a34a] text-white",
                              absent: "bg-[#dc2626] text-white",
                            };
                            return (
                              <button
                                key={st}
                                disabled={locked || !canTake}
                                onClick={() => setMarks((p) => ({ ...p, [r.id]: st }))}
                                className={`rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold capitalize transition disabled:opacity-60 ${
                                  active ? colors[st] : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                              >
                                {st === "present" && active ? <Check className="mr-1 inline h-3.5 w-3.5" /> : null}
                                {st === "absent" && active ? <UserX className="mr-1 inline h-3.5 w-3.5 text-white" /> : null}
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile & Tablet Card View (Matching exact user image design) */}
          <div className="block space-y-2.5 lg:hidden">
            {roster.map((r, i) => {
              const currentStatus = marks[r.id] ?? "present";
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-900 bg-white px-4 py-3 shadow-sm transition-all"
                >
                  <span className="min-w-0 truncate pr-2 text-[15px] font-bold text-slate-900 sm:text-base">
                    {i + 1}. {r.fullName}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={locked || !canTake}
                      onClick={() => setMarks((p) => ({ ...p, [r.id]: "present" }))}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-900 text-[15px] font-bold transition-all disabled:opacity-60 sm:h-10 sm:w-10 sm:text-base ${
                        currentStatus === "present"
                          ? "border-[#16a34a] bg-[#16a34a] text-white"
                          : "bg-white text-slate-900 hover:bg-slate-100"
                      }`}
                      title="Mark Present"
                    >
                      P
                    </button>
                    <button
                      type="button"
                      disabled={locked || !canTake}
                      onClick={() => setMarks((p) => ({ ...p, [r.id]: "absent" }))}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-900 text-[15px] font-bold transition-all disabled:opacity-60 sm:h-10 sm:w-10 sm:text-base ${
                        currentStatus === "absent"
                          ? "border-[#dc2626] bg-[#dc2626] text-white"
                          : "bg-white text-slate-900 hover:bg-slate-100"
                      }`}
                      title="Mark Absent"
                    >
                      A
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {canTake ? (
            <div className="sticky bottom-16 z-20 mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#e2e8f0] bg-white/95 p-3.5 backdrop-blur lg:bottom-4">
              <p className="text-[13px] text-slate-500 text-center sm:text-left">
                {standardName}-{divisionName} · {shift} shift · {formatDate(date)}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                {counts.absent && canWhatsapp ? (
                  <Button variant="soft" onClick={() => setAbsentModal(roster.filter((r) => marks[r.id] === "absent"))} className="grow sm:grow-0">
                    <MessageCircle className="h-4 w-4 text-[#16a34a]" /> Notify absentees
                  </Button>
                ) : null}
                <Button onClick={save} loading={saving} disabled={locked} className="grow sm:grow-0">
                  <Save className="h-4 w-4" /> {already ? "Update attendance" : "Save attendance"}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {absentModal ? (
        <Modal
          open
          onClose={() => setAbsentModal(null)}
          title={`Notify ${absentModal.length} guardian${absentModal.length === 1 ? "" : "s"}`}
          description="These students were marked absent. Send the absence message on WhatsApp."
          width="max-w-2xl"
          footer={
            <>
              <Button variant="soft" onClick={() => setAbsentModal(null)}>Not now</Button>
              <Button
                variant="ok"
                onClick={() => {
                  sendWhatsapp(
                    absentModal.map((r) => ({
                      studentId: r.id,
                      to: normalizePhone(r.whatsappNumber || r.primaryMobile),
                      body: build(r),
                    })),
                  );
                  push("success", "Messages prepared. Use “Open WhatsApp” to send each one.");
                  setAbsentModal(null);
                }}
              >
                <MessageCircle className="h-4 w-4" /> Prepare all
              </Button>
            </>
          }
        >
          <div className="space-y-2">
            {absentModal.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-[#e2e8f0] p-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <Avatar name={r.fullName} color={r.photoColor} size={34} />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-slate-800">{r.fullName}</p>
                    <p className="text-[12px] text-slate-500">+{normalizePhone(r.whatsappNumber || r.primaryMobile)}</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${normalizePhone(r.whatsappNumber || r.primaryMobile)}?text=${encodeURIComponent(build(r))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-soft"
                >
                  <MessageCircle className="h-4 w-4 text-[#16a34a]" /> Open WhatsApp
                </a>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
