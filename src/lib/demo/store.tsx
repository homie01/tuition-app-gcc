"use client";

import * as React from "react";
import { buildDemoState, DEMO_VERSION } from "@/lib/demo/seed";
import { getSubjectsForStandard } from "@/lib/demo/subjects";
import { gradeFor } from "@/lib/grading";
import { can, type SessionUser } from "@/lib/permissions";
import { colorFor } from "@/lib/utils";
import type {
  Attendance,
  AttendanceStatus,
  DemoState,
  Exam,
  Student,
  User,
} from "@/lib/demo/types";

const STORAGE_KEY = "classdesk.demo.v4";

type Ctx = {
  ready: boolean;
  state: DemoState;
  user: SessionUser | null;
  /** helpers */
  standardName: (id: number) => string;
  divisionName: (id: number) => string;
  subjectName: (id: number) => string;
  getSubjectsForStandard: (standardId?: number | string | null, stream?: string | null) => DemoState["subjects"];
  visibleStandards: () => DemoState["standards"];
  allows: (permission: string) => boolean;
  /** actions */
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (patch: { name?: string; mobile?: string; currentPassword?: string; newPassword?: string }) => { ok: boolean; error?: string };
  saveStudent: (values: Omit<Student, "id" | "studentCode" | "photoColor" | "createdAt">, id?: number) => { ok: boolean; id: number; code: string };
  importStudents: (list: Omit<Student, "id" | "studentCode" | "photoColor" | "createdAt">[]) => number;
  setStudentStatus: (id: number, status: Student["status"]) => void;
  deleteStudent: (id: number) => void;
  saveAttendance: (input: {
    date: string;
    standardId: number;
    divisionId: number;
    shift: string;
    entries: { studentId: number; status: AttendanceStatus }[];
  }) => { saved: number; updated: boolean };
  createExam: (input: {
    name: string;
    standardId: number;
    subjectId?: number | null;
    stream?: string | null;
    examDate: string;
    maxMarksDefault: number;
  }) => Exam;
  saveMarks: (input: {
    examId: number;
    subjectId: number;
    maxMarks: number;
    entries: { studentId: number; marksObtained: number | null }[];
  }) => { saved: number; error?: string };
  generateResults: (examId: number) => { generated: number; error?: string };
  saveAssistant: (input: Partial<User> & { password?: string }, id?: number) => { ok: boolean; error?: string };
  deleteAssistant: (id: number) => void;
  saveTemplate: (key: "absence" | "result", body: string) => void;
  sendWhatsapp: (messages: { studentId?: number; attendanceId?: number; to: string; body: string }[]) => number;
  saveSettings: (patch: Partial<DemoState["settings"]>) => void;
  addAcademic: (type: "standard" | "division" | "subject", name: string, standardId?: number) => { ok: boolean; error?: string };
  removeAcademic: (type: "standard" | "division" | "subject", id: number) => { ok: boolean; error?: string };
  markAllNotificationsRead: () => void;
  resetDemo: () => void;
};

const DemoContext = React.createContext<Ctx | null>(null);

export function useDemo() {
  const ctx = React.useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}

const nextId = (rows: { id: number }[]) => (rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1);
const nowISO = () => new Date().toISOString();

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DemoState>(() => buildDemoState());
  const [ready, setReady] = React.useState(false);

  /* hydrate from localStorage on the client only */
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState;
        if (parsed?.version === DEMO_VERSION) setState(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  /* persist */
  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota – demo keeps working in memory */
    }
  }, [state, ready]);

  const sessionUser = state.users.find((u) => u.id === state.sessionUserId && u.status === "active") ?? null;

  const user: SessionUser | null = sessionUser
    ? {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        mobile: sessionUser.mobile,
        role: sessionUser.role,
        status: sessionUser.status,
        permissions: sessionUser.permissions,
        assignedStandards: sessionUser.assignedStandards,
        avatarColor: sessionUser.avatarColor,
        lastLoginAt: sessionUser.lastLoginAt ? new Date(sessionUser.lastLoginAt) : null,
      }
    : null;

  /* ------------------------------------------------------------------ */
  /* internal helpers                                                    */
  /* ------------------------------------------------------------------ */
  const patch = React.useCallback((fn: (draft: DemoState) => DemoState) => {
    setState((prev) => fn(structuredClone(prev)));
  }, []);

  const pushLog = (draft: DemoState, action: string, description: string) => {
    const actor = draft.users.find((u) => u.id === draft.sessionUserId);
    draft.activity.unshift({
      id: nextId(draft.activity),
      userName: actor?.name ?? "System",
      userRole: actor?.role ?? "admin",
      action,
      description,
      createdAt: nowISO(),
    });
    draft.activity = draft.activity.slice(0, 300);
  };

  const pushNote = (
    draft: DemoState,
    type: string,
    title: string,
    message: string,
    link: string | null,
    severity: "info" | "success" | "warning" | "danger",
  ) => {
    draft.notifications.unshift({
      id: nextId(draft.notifications),
      type,
      title,
      message,
      link,
      severity,
      isRead: false,
      createdAt: nowISO(),
    });
    draft.notifications = draft.notifications.slice(0, 100);
  };

  /* ------------------------------------------------------------------ */
  /* actions                                                             */
  /* ------------------------------------------------------------------ */
  const value: Ctx = {
    ready,
    state,
    user,

    standardName: (id) => state.standards.find((s) => s.id === id)?.name ?? "—",
    divisionName: (id) => state.divisions.find((d) => d.id === id)?.name ?? "—",
    subjectName: (id) => state.subjects.find((s) => s.id === id)?.name ?? "—",
    getSubjectsForStandard: (standardId, stream) =>
      getSubjectsForStandard(standardId ?? undefined, stream, state.subjects, state.standards),
    visibleStandards: () =>
      user && user.role === "assistant" && user.assignedStandards.length
        ? state.standards.filter((s) => user.assignedStandards.includes(s.id))
        : state.standards,
    allows: (permission) => (user ? can(user, permission) : false),

    login: (email, password) => {
      const found = state.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() || u.mobile === email.trim(),
      );
      if (!found || found.password !== password) return { ok: false, error: "Incorrect email or password." };
      if (found.status !== "active") return { ok: false, error: "This account has been disabled by the admin." };
      patch((d) => {
        d.sessionUserId = found.id;
        const u = d.users.find((x) => x.id === found.id);
        if (u) u.lastLoginAt = nowISO();
        pushLog(d, "auth.login", `${found.role === "admin" ? "Admin" : "Assistant"} ${found.name} signed in.`);
        return d;
      });
      return { ok: true };
    },

    logout: () =>
      patch((d) => {
        d.sessionUserId = null;
        return d;
      }),

    updateProfile: (input) => {
      if (!sessionUser) return { ok: false, error: "Not signed in." };
      if (input.newPassword) {
        if (input.newPassword.length < 6) return { ok: false, error: "New password must be at least 6 characters." };
        if (input.currentPassword !== sessionUser.password) return { ok: false, error: "Your current password is incorrect." };
      }
      patch((d) => {
        const u = d.users.find((x) => x.id === sessionUser.id);
        if (u) {
          if (input.name) u.name = input.name;
          if (input.mobile !== undefined) u.mobile = input.mobile || null;
          if (input.newPassword) u.password = input.newPassword;
        }
        pushLog(d, "profile.update", `${input.name ?? sessionUser.name} updated their profile.`);
        return d;
      });
      return { ok: true };
    },

    saveStudent: (values, id) => {
      let outId = id ?? 0;
      let outCode = "";
      patch((d) => {
        if (id) {
          const idx = d.students.findIndex((s) => s.id === id);
          if (idx >= 0) {
            d.students[idx] = { ...d.students[idx], ...values };
            outCode = d.students[idx].studentCode;
            pushLog(d, "student.update", `${sessionUser?.name} updated details of ${values.fullName} (${outCode}).`);
          }
        } else {
          const newId = nextId(d.students);
          const codeStr = `ST${String(newId).padStart(4, "0")}`;
          d.students.push({
            ...values,
            id: newId,
            studentCode: codeStr,
            photoColor: colorFor(codeStr),
            createdAt: nowISO(),
          });
          outId = newId;
          outCode = codeStr;
          pushLog(d, "student.create", `Student ${values.fullName} (${codeStr}) registered by ${sessionUser?.name}.`);
          pushNote(d, "student", "New student registered", `${values.fullName} (${codeStr}) was added to the class.`, `/students/${newId}`, "success");
        }
        return d;
      });
      return { ok: true, id: outId, code: outCode };
    },

    importStudents: (list) => {
      let count = 0;
      patch((d) => {
        let currentNext = nextId(d.students);
        for (const values of list) {
          const codeStr = `ST${String(currentNext).padStart(4, "0")}`;
          d.students.push({
            ...values,
            id: currentNext,
            studentCode: codeStr,
            photoColor: colorFor(codeStr),
            createdAt: nowISO(),
          });
          currentNext++;
          count++;
        }
        pushLog(d, "student.import", `${sessionUser?.name} imported ${count} student(s) via Excel/CSV.`);
        pushNote(d, "student", "Students Imported", `Successfully imported ${count} student(s) into the class.`, "/students", "success");
        return d;
      });
      return count;
    },

    setStudentStatus: (id, status) =>
      patch((d) => {
        const s = d.students.find((x) => x.id === id);
        if (s) {
          s.status = status;
          pushLog(d, status === "active" ? "student.activate" : "student.deactivate", `${sessionUser?.name} marked ${s.fullName} (${s.studentCode}) as ${status}.`);
        }
        return d;
      }),

    deleteStudent: (id) =>
      patch((d) => {
        const idx = d.students.findIndex((x) => x.id === id);
        if (idx !== -1) {
          const s = d.students[idx];
          d.students.splice(idx, 1);
          // clean up student attendance and marks
          d.attendance = d.attendance.filter((a) => a.studentId !== id);
          d.marks = d.marks.filter((m) => m.studentId !== id);
          pushLog(d, "student.delete", `${sessionUser?.name} deleted student ${s.fullName} (${s.studentCode}).`);
          pushNote(d, "student", "Student Deleted", `Student ${s.fullName} was permanently deleted.`, "/students", "info");
        }
        return d;
      }),

    saveAttendance: ({ date, standardId, divisionId, shift, entries }) => {
      let saved = 0;
      let updated = false;
      patch((d) => {
        const actor = d.users.find((u) => u.id === d.sessionUserId);
        const device = typeof navigator !== "undefined" && /Mobi/i.test(navigator.userAgent) ? "Mobile browser" : "Desktop browser";
        for (const e of entries) {
          const existing = d.attendance.find((a) => a.studentId === e.studentId && a.date === date && a.shift === shift);
          if (existing) {
            existing.status = e.status;
            existing.updatedAt = nowISO();
            updated = true;
          } else {
            const row: Attendance = {
              id: nextId(d.attendance),
              studentId: e.studentId,
              date,
              standardId,
              divisionId,
              shift,
              status: e.status,
              takenBy: actor?.id ?? null,
              takenByName: actor?.name ?? null,
              takenAt: nowISO(),
              updatedAt: nowISO(),
              deviceInfo: device,
              notified: false,
            };
            d.attendance.push(row);
          }
          saved++;
        }
        const absent = entries.filter((e) => e.status === "absent").length;
        const cls = `${d.standards.find((s) => s.id === standardId)?.name ?? ""}-${d.divisions.find((x) => x.id === divisionId)?.name ?? ""}`;
        pushLog(
          d,
          updated ? "attendance.update" : "attendance.save",
          `${actor?.role === "admin" ? "Admin" : "Assistant"} ${actor?.name} ${updated ? "updated" : "saved"} attendance for ${cls} (${shift} shift) — ${saved} students.`,
        );
        pushNote(d, "attendance", "Attendance submitted", `${actor?.name} saved attendance for ${cls}. ${absent} absent.`, "/attendance/history", absent ? "warning" : "success");
        return d;
      });
      return { saved, updated };
    },

    createExam: (input) => {
      let createdExam: Exam | null = null;
      patch((d) => {
        const id = nextId(d.exams);
        const exam: Exam = {
          id,
          name: input.name,
          standardId: input.standardId,
          subjectId: input.subjectId ?? null,
          stream: input.stream ?? null,
          examDate: input.examDate,
          resultDate: null,
          maxMarksDefault: input.maxMarksDefault,
          status: new Date(input.examDate) > new Date() ? "upcoming" : "completed",
          createdAt: nowISO(),
        };
        d.exams.push(exam);
        createdExam = exam;
        const subName = input.subjectId ? d.subjects.find((s) => s.id === input.subjectId)?.name : null;
        const subText = subName ? ` (${subName})` : "";
        pushLog(d, "exam.create", `${sessionUser?.name} created exam “${input.name}${subText}”.`);
        return d;
      });
      return createdExam!;
    },

    saveMarks: ({ examId, subjectId, maxMarks, entries }) => {
      const bad = entries.find((e) => e.marksObtained !== null && e.marksObtained > maxMarks);
      if (bad) return { saved: 0, error: `Marks cannot be more than the maximum marks (${maxMarks}).` };
      let saved = 0;
      patch((d) => {
        for (const e of entries) {
          const idx = d.marks.findIndex((m) => m.examId === examId && m.studentId === e.studentId && m.subjectId === subjectId);
          if (e.marksObtained === null) {
            if (idx >= 0) d.marks.splice(idx, 1);
            continue;
          }
          if (idx >= 0) {
            d.marks[idx].marksObtained = e.marksObtained;
            d.marks[idx].maxMarks = maxMarks;
          } else {
            d.marks.push({
              id: nextId(d.marks),
              examId,
              studentId: e.studentId,
              subjectId,
              marksObtained: e.marksObtained,
              maxMarks,
              addedByName: sessionUser?.name ?? null,
              createdAt: nowISO(),
            });
          }
          saved++;
        }
        const exam = d.exams.find((x) => x.id === examId);
        const subject = d.subjects.find((x) => x.id === subjectId);
        pushLog(d, "marks.save", `${sessionUser?.name} saved ${subject?.name} marks for ${saved} students in “${exam?.name}”.`);
        pushNote(d, "marks", "Marks added", `${subject?.name} marks entered for “${exam?.name}” by ${sessionUser?.name}.`, "/marks", "info");
        return d;
      });
      return { saved };
    },

    generateResults: (examId) => {
      const examMarks = state.marks.filter((m) => m.examId === examId);
      if (!examMarks.length) return { generated: 0, error: "No marks have been entered for this exam yet." };
      let generated = 0;
      patch((d) => {
        const rows = d.marks.filter((m) => m.examId === examId);
        const totals = new Map<number, { total: number; max: number }>();
        for (const m of rows) {
          const cur = totals.get(m.studentId) ?? { total: 0, max: 0 };
          cur.total += m.marksObtained;
          cur.max += m.maxMarks;
          totals.set(m.studentId, cur);
        }
        const ranked = [...totals.entries()]
          .map(([studentId, t]) => ({ studentId, ...t, percentage: t.max ? (t.total / t.max) * 100 : 0 }))
          .sort((a, b) => b.percentage - a.percentage);

        d.results = d.results.filter((r) => r.examId !== examId);
        let rid = nextId(d.results);
        for (let i = 0; i < ranked.length; i++) {
          const r = ranked[i];
          d.results.push({
            id: rid++,
            examId,
            studentId: r.studentId,
            totalObtained: Math.round(r.total * 100) / 100,
            totalMax: r.max,
            percentage: Math.round(r.percentage * 100) / 100,
            grade: gradeFor(r.percentage, d.settings.gradeBands).grade,
            rank: d.settings.rankEnabled ? i + 1 : null,
            resultStatus: r.percentage >= d.settings.passPercentage ? "pass" : "fail",
            generatedByName: sessionUser?.name ?? null,
            generatedAt: nowISO(),
          });
        }
        generated = ranked.length;
        const exam = d.exams.find((x) => x.id === examId);
        if (exam) {
          exam.status = "completed";
          exam.resultDate = exam.resultDate ?? nowISO().slice(0, 10);
        }
        pushLog(d, "result.generate", `${sessionUser?.name} generated results for “${exam?.name}” (${generated} students).`);
        pushNote(d, "result", "Result generated", `Results for “${exam?.name}” are ready for ${generated} students.`, "/results", "success");
        return d;
      });
      return { generated };
    },

    saveAssistant: (input, id) => {
      const email = (input.email ?? "").trim().toLowerCase();
      if (!id) {
        if (!input.name || input.name.trim().length < 2) return { ok: false, error: "Name is required." };
        if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email." };
        if (!input.password || input.password.length < 6) return { ok: false, error: "Set a password of at least 6 characters." };
        if (state.users.some((u) => u.email.toLowerCase() === email)) return { ok: false, error: "An account with this email already exists." };
      }
      patch((d) => {
        if (id) {
          const u = d.users.find((x) => x.id === id);
          if (u) {
            if (input.name) u.name = input.name;
            if (input.email) u.email = email;
            if (input.mobile !== undefined) u.mobile = input.mobile || null;
            if (input.status) u.status = input.status;
            if (input.permissions) u.permissions = input.permissions;
            if (input.assignedStandards) u.assignedStandards = input.assignedStandards;
            if (input.password) u.password = input.password;
            pushLog(d, "assistant.update", `${sessionUser?.name} updated assistant ${u.name}${input.status ? ` (status: ${input.status})` : ""}.`);
          }
        } else {
          const newId = nextId(d.users);
          d.users.push({
            id: newId,
            name: input.name!,
            email,
            mobile: input.mobile ?? null,
            password: input.password!,
            role: "assistant",
            status: (input.status as User["status"]) ?? "active",
            permissions: input.permissions ?? [],
            assignedStandards: input.assignedStandards ?? [],
            avatarColor: colorFor(email),
            lastLoginAt: null,
            createdAt: nowISO(),
          });
          pushLog(d, "assistant.create", `Assistant account created for ${input.name} with ${(input.permissions ?? []).length} permissions.`);
          pushNote(d, "assistant", "Assistant created", `${input.name} can now sign in with ${email}.`, "/assistants", "info");
        }
        return d;
      });
      return { ok: true };
    },

    deleteAssistant: (id) =>
      patch((d) => {
        const u = d.users.find((x) => x.id === id);
        d.users = d.users.filter((x) => x.id !== id || x.role === "admin");
        if (u) pushLog(d, "assistant.delete", `${sessionUser?.name} deleted assistant ${u.name}. Access revoked immediately.`);
        return d;
      }),

    saveTemplate: (key, body) =>
      patch((d) => {
        d.templates[key] = body;
        pushLog(d, "whatsapp.template", `${sessionUser?.name} updated the ${key} WhatsApp message template.`);
        return d;
      }),

    sendWhatsapp: (messages) => {
      patch((d) => {
        let mid = nextId(d.messages);
        for (const m of messages) {
          d.messages.unshift({
            id: mid++,
            studentId: m.studentId ?? null,
            toNumber: m.to,
            body: m.body,
            channel: "manual",
            status: "queued",
            sentByName: sessionUser?.name ?? null,
            createdAt: nowISO(),
          });
          if (m.attendanceId) {
            const a = d.attendance.find((x) => x.id === m.attendanceId);
            if (a) a.notified = true;
          }
        }
        d.messages = d.messages.slice(0, 120);
        pushLog(d, "whatsapp.send", `${sessionUser?.name} prepared ${messages.length} WhatsApp message(s) for guardians.`);
        pushNote(d, "whatsapp", "WhatsApp messages ready", `${messages.length} guardian message(s) prepared for sending.`, "/whatsapp", "info");
        return d;
      });
      return messages.length;
    },

    saveSettings: (p) =>
      patch((d) => {
        d.settings = { ...d.settings, ...p };
        pushLog(d, "settings.update", `${sessionUser?.name} updated application settings.`);
        return d;
      }),

    addAcademic: (type, name, standardId) => {
      if (!name.trim()) return { ok: false, error: "Name is required." };
      patch((d) => {
        if (type === "standard") {
          const id = nextId(d.standards);
          d.standards.push({ id, name: name.trim(), sortOrder: 90 + id });
          d.divisions.push({ id: nextId(d.divisions), standardId: id, name: "A" });
        } else if (type === "division" && standardId) {
          d.divisions.push({ id: nextId(d.divisions), standardId, name: name.trim() });
        } else if (type === "subject") {
          d.subjects.push({ id: nextId(d.subjects), name: name.trim(), code: null, active: true });
        }
        pushLog(d, `${type}.create`, `${sessionUser?.name} added ${type} “${name.trim()}”.`);
        return d;
      });
      return { ok: true };
    },

    removeAcademic: (type, id) => {
      if (type === "standard" && state.students.some((s) => s.standardId === id)) {
        return { ok: false, error: "Students exist in this standard. Move them first." };
      }
      if (type === "division" && state.students.some((s) => s.divisionId === id)) {
        return { ok: false, error: "Students exist in this division. Move them first." };
      }
      patch((d) => {
        if (type === "standard") {
          d.standards = d.standards.filter((s) => s.id !== id);
          d.divisions = d.divisions.filter((x) => x.standardId !== id);
        } else if (type === "division") {
          d.divisions = d.divisions.filter((x) => x.id !== id);
        } else {
          d.subjects = d.subjects.filter((x) => x.id !== id);
        }
        pushLog(d, `${type}.delete`, `${sessionUser?.name} removed a ${type}.`);
        return d;
      });
      return { ok: true };
    },

    markAllNotificationsRead: () =>
      patch((d) => {
        d.notifications = d.notifications.map((n) => ({ ...n, isRead: true }));
        return d;
      }),

    resetDemo: () => {
      const fresh = buildDemoState();
      fresh.sessionUserId = state.sessionUserId;
      setState(fresh);
    },
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
