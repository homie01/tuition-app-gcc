export const PERMISSION_GROUPS = [
  {
    group: "Students",
    items: [
      { key: "student.view", label: "Student View", hint: "See the student list and profiles" },
      { key: "student.add", label: "Student Add", hint: "Register new students" },
      { key: "student.edit", label: "Student Edit", hint: "Update student details" },
      { key: "student.delete", label: "Student Deactivate", hint: "Mark students inactive / left" },
    ],
  },
  {
    group: "Attendance",
    items: [
      { key: "attendance.view", label: "Attendance View", hint: "See attendance registers" },
      { key: "attendance.take", label: "Attendance Take", hint: "Mark today's attendance" },
      { key: "attendance.edit", label: "Attendance Edit", hint: "Correct saved attendance" },
    ],
  },
  {
    group: "Marks",
    items: [
      { key: "marks.view", label: "Marks View", hint: "See marks entered" },
      { key: "marks.add", label: "Marks Add", hint: "Enter new marks" },
      { key: "marks.edit", label: "Marks Edit", hint: "Correct entered marks" },
    ],
  },
  {
    group: "Results & Reports",
    items: [
      { key: "result.view", label: "Result View", hint: "See generated results" },
      { key: "result.generate", label: "Result Generate", hint: "Create results & PDFs" },
      { key: "report.view", label: "Reports View", hint: "Open the reports section" },
      { key: "whatsapp.send", label: "WhatsApp Send", hint: "Notify guardians on WhatsApp" },
    ],
  },
] as const;

export const ALL_PERMISSIONS: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((i) => i.key),
);

export const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.label])),
);

export const DEFAULT_ASSISTANT_PERMISSIONS = [
  "student.view",
  "attendance.view",
  "attendance.take",
  "attendance.edit",
  "marks.view",
];

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  role: "admin" | "assistant";
  status: string;
  permissions: string[];
  assignedStandards: number[];
  avatarColor: string | null;
  lastLoginAt: Date | null;
};

export function can(user: Pick<SessionUser, "role" | "permissions">, permission: string) {
  if (user.role === "admin") return true;
  return user.permissions.includes(permission);
}

export function canAny(user: Pick<SessionUser, "role" | "permissions">, permissions: string[]) {
  if (user.role === "admin") return true;
  return permissions.some((p) => user.permissions.includes(p));
}
