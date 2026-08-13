import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^(\+?\d{1,3}[- ]?)?\d{10}$/, "Enter a valid 10 digit mobile number");

const optionalPhone = z
  .union([phone, z.literal("")])
  .optional()
  .transform((v) => (v ? v : null));

export const studentSchema = z.object({
  fullName: z.string().trim().min(2, "Student name is required"),
  fatherName: z.string().trim().optional().nullable(),
  motherName: z.string().trim().optional().nullable(),
  standardId: z.coerce.number().int().positive("Select a standard"),
  divisionId: z.coerce.number().int().positive("Select a division"),
  schoolName: z.string().trim().optional().nullable(),
  rollNumber: z.string().trim().optional().nullable(),
  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  address: z.string().trim().optional().nullable(),

  primaryMobile: phone,
  secondaryMobile: optionalPhone,
  whatsappNumber: optionalPhone,
  guardianName: z.string().trim().optional().nullable(),
  relationship: z.string().trim().optional().nullable(),

  shift: z.enum(["morning", "afternoon", "evening"]),
  joiningDate: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  monthlyFees: z.coerce.number().min(0).optional().default(0),
  status: z.enum(["active", "inactive", "left"]).default("active"),
  notes: z.string().trim().optional().nullable(),
});
export type StudentInput = z.input<typeof studentSchema>;

export const assistantSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  mobile: optionalPhone,
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  permissions: z.array(z.string()).default([]),
  assignedStandards: z.array(z.coerce.number()).default([]),
  status: z.enum(["active", "disabled"]).default("active"),
});

export const attendanceSaveSchema = z.object({
  date: z.string().min(8),
  standardId: z.coerce.number().int().positive(),
  divisionId: z.coerce.number().int().positive(),
  shift: z.string().min(3),
  overwrite: z.boolean().optional().default(false),
  entries: z
    .array(
      z.object({
        studentId: z.coerce.number().int().positive(),
        status: z.enum(["present", "absent", "late", "leave"]),
        remark: z.string().optional().nullable(),
      }),
    )
    .min(1, "No students to save"),
});

export const marksSaveSchema = z.object({
  examId: z.coerce.number().int().positive(),
  subjectId: z.coerce.number().int().positive(),
  maxMarks: z.coerce.number().int().positive().default(100),
  entries: z.array(
    z.object({
      studentId: z.coerce.number().int().positive(),
      marksObtained: z.union([z.coerce.number().min(0), z.null()]),
    }),
  ),
});

export const examSchema = z.object({
  name: z.string().trim().min(2, "Exam name is required"),
  standardId: z.coerce.number().int().positive(),
  divisionId: z.coerce.number().int().nullable().optional(),
  examDate: z.string().min(8),
  resultDate: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  maxMarksDefault: z.coerce.number().int().positive().default(100),
});

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Please check the entered values.";
}
