import type { GradeBand } from "@/lib/grading";

export type Role = "admin" | "assistant";

export type User = {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  password: string;
  role: Role;
  status: "active" | "disabled";
  permissions: string[];
  assignedStandards: number[];
  avatarColor: string;
  lastLoginAt: string | null;
  createdAt: string;
};

export type Standard = { id: number; name: string; sortOrder: number };
export type Division = { id: number; standardId: number; name: string };
export type Subject = { id: number; name: string; code: string | null; active: boolean };

export type Student = {
  id: number;
  studentCode: string;
  fullName: string;
  fatherName: string | null;
  motherName: string | null;
  standardId: number;
  stream?: string | null;
  divisionId: number;
  schoolName: string | null;
  rollNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  primaryMobile: string;
  secondaryMobile: string | null;
  whatsappNumber: string | null;
  guardianName?: string | null;
  relationship: string | null;
  shift: string;
  joiningDate: string | null;
  monthlyFees?: number;
  status: "active" | "inactive" | "left";
  photoColor: string;
  notes: string | null;
  createdAt: string;
};

export type AttendanceStatus = "present" | "absent" | "late" | "leave";

export type Attendance = {
  id: number;
  studentId: number;
  date: string;
  standardId: number;
  divisionId: number;
  shift: string;
  status: AttendanceStatus;
  takenBy: number | null;
  takenByName: string | null;
  takenAt: string;
  updatedAt: string;
  deviceInfo: string;
  notified: boolean;
};

export type Exam = {
  id: number;
  name: string;
  standardId: number;
  subjectId?: number | null;
  stream?: string | null;
  examDate: string;
  resultDate: string | null;
  maxMarksDefault: number;
  status: "upcoming" | "completed";
  createdAt: string;
};

export type Mark = {
  id: number;
  examId: number;
  studentId: number;
  subjectId: number;
  marksObtained: number;
  maxMarks: number;
  addedByName: string | null;
  createdAt: string;
};

export type Result = {
  id: number;
  examId: number;
  studentId: number;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  rank: number | null;
  resultStatus: "pass" | "fail";
  generatedByName: string | null;
  generatedAt: string;
};

export type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  severity: "info" | "success" | "warning" | "danger";
  isRead: boolean;
  createdAt: string;
};

export type ActivityLog = {
  id: number;
  userName: string;
  userRole: Role;
  action: string;
  description: string;
  createdAt: string;
};

export type WaMessage = {
  id: number;
  studentId: number | null;
  toNumber: string;
  body: string;
  channel: "manual" | "api";
  status: "queued" | "sent" | "failed";
  sentByName: string | null;
  createdAt: string;
};

export type Settings = {
  tuitionName: string;
  tagline: string;
  logoText: string;
  address: string;
  phone: string;
  email: string;
  gradeBands: GradeBand[];
  passPercentage: number;
  lowAttendanceThreshold: number;
  lowMarksThreshold: number;
  rankEnabled: boolean;
  whatsappAutoNotify: boolean;
  whatsappProvider: string;
  whatsappPhoneNumberId: string;
};

export type DemoState = {
  version: number;
  sessionUserId: number | null;
  users: User[];
  standards: Standard[];
  divisions: Division[];
  subjects: Subject[];
  students: Student[];
  attendance: Attendance[];
  exams: Exam[];
  marks: Mark[];
  results: Result[];
  notifications: Notification[];
  activity: ActivityLog[];
  messages: WaMessage[];
  templates: { absence: string; result: string };
  settings: Settings;
};
