import {
  DEFAULT_ABSENCE_TEMPLATE,
  DEFAULT_GRADE_BANDS,
  DEFAULT_RESULT_TEMPLATE,
  gradeFor,
} from "@/lib/grading";
import { ALL_PERMISSIONS, DEFAULT_ASSISTANT_PERMISSIONS } from "@/lib/permissions";
import type {
  ActivityLog,
  Attendance,
  DemoState,
  Division,
  Exam,
  Mark,
  Result,
  Standard,
  Student,
  Subject,
  User,
} from "@/lib/demo/types";

export const DEMO_VERSION = 14;

/* deterministic pseudo-random so the demo always looks the same */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function iso(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}
function shiftDate(days: number, hour = 12) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

export function buildDemoState(): DemoState {
  /* ---------------- users ---------------- */
  const users: User[] = [
    {
      id: 1,
      name: "Janak Tapaniya Sir",
      email: "janak@gcc.in",
      mobile: "9825044120",
      password: "admin123",
      role: "admin",
      status: "active",
      permissions: ALL_PERMISSIONS,
      assignedStandards: [],
      avatarColor: "#2563EB",
      lastLoginAt: new Date().toISOString(),
      createdAt: shiftDate(-420).toISOString(),
    },
    {
      id: 2,
      name: "Rohit Tapaniya Sir",
      email: "rohit@gcc.in",
      mobile: "9825044121",
      password: "admin123",
      role: "admin",
      status: "active",
      permissions: ALL_PERMISSIONS,
      assignedStandards: [],
      avatarColor: "#7C3AED",
      lastLoginAt: shiftDate(-2).toISOString(),
      createdAt: shiftDate(-300).toISOString(),
    },
    {
      id: 3,
      name: "Amit Joshi",
      email: "amit@gcc.in",
      mobile: "9924011223",
      password: "assistant123",
      role: "assistant",
      status: "active",
      permissions: [...DEFAULT_ASSISTANT_PERMISSIONS, "attendance.edit", "marks.add", "result.view", "whatsapp.send"],
      assignedStandards: [],
      avatarColor: "#16A34A",
      lastLoginAt: shiftDate(-1).toISOString(),
      createdAt: shiftDate(-180).toISOString(),
    },
  ];

  /* ---------------- academics ---------------- */
  const standards: Standard[] = [
    { id: 1, name: "Standard 5", sortOrder: 5 },
    { id: 2, name: "Standard 6", sortOrder: 6 },
    { id: 3, name: "Standard 7", sortOrder: 7 },
    { id: 4, name: "Standard 8", sortOrder: 8 },
    { id: 5, name: "Standard 9", sortOrder: 9 },
    { id: 6, name: "Standard 10", sortOrder: 10 },
    { id: 7, name: "Standard 11", sortOrder: 11 },
    { id: 8, name: "Standard 12", sortOrder: 12 },
  ];
  const divisions: Division[] = standards.flatMap((s, i) => [
    { id: i * 2 + 1, standardId: s.id, name: "A" },
    { id: i * 2 + 2, standardId: s.id, name: "B" },
  ]);
  const subjects: Subject[] = [
    { id: 1, name: "English", code: "ENG", active: true },
    { id: 2, name: "Hindi", code: "HIN", active: true },
    { id: 3, name: "Gujarati", code: "GUJ", active: true },
    { id: 4, name: "Mathematics", code: "MAT", active: true },
    { id: 5, name: "Science", code: "SCI", active: true },
    { id: 6, name: "Social Science", code: "SOC", active: true },
    { id: 7, name: "Physics", code: "PHY", active: true },
    { id: 8, name: "Chemistry", code: "CHE", active: true },
    { id: 9, name: "Biology", code: "BIO", active: true },
    { id: 10, name: "Accountancy", code: "ACC", active: true },
    { id: 11, name: "Business Studies", code: "BST", active: true },
    { id: 12, name: "Economics", code: "ECO", active: true },
  ];

  /* ---------------- students & records (clean empty state) ---------------- */
  const students: Student[] = [];
  const attendance: Attendance[] = [];
  const exams: Exam[] = [];
  const marks: Mark[] = [];
  const results: Result[] = [];
  const activity: ActivityLog[] = [
    { id: 1, userName: "System", userRole: "admin", action: "settings.update", description: "ClassDesk initialized with clean workspace.", createdAt: new Date().toISOString() },
  ];
  const notifications: any[] = [];

  return {
    version: DEMO_VERSION,
    sessionUserId: null,
    users,
    standards,
    divisions,
    subjects,
    students,
    attendance,
    exams,
    marks,
    results,
    notifications,
    activity,
    messages: [],
    templates: { absence: DEFAULT_ABSENCE_TEMPLATE, result: DEFAULT_RESULT_TEMPLATE },
    settings: {
      tuitionName: "Group Coaching Classes",
      tagline: "Learn • Practice • Excel",
      logoText: "GCC",
      address: "Katargam Rd, Near Jain Temple, Paras Society, Kubernagar, Katargam, Surat, Gujarat 395004",
      phone: "+91 98250 44120",
      email: "office@brightfuture.in",
      gradeBands: DEFAULT_GRADE_BANDS,
      passPercentage: 35,
      lowAttendanceThreshold: 75,
      lowMarksThreshold: 40,
      rankEnabled: true,
      whatsappAutoNotify: true,
      whatsappProvider: "none",
      whatsappPhoneNumberId: "",
    },
  };
}
