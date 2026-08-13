"use client";

import * as React from "react";
import { useRouter } from "@/lib/next-compat";
import Link from "@/lib/next-compat";
import { IdCard, Phone, Save } from "lucide-react";
import { Button, Card, CardHead, Field, Input, Select, Textarea, useToast } from "@/components/ui";
import { useDemo } from "@/lib/demo/store";
import type { Student } from "@/lib/demo/types";

export type StudentFormValues = {
  fullName: string;
  fatherName: string;
  motherName: string;
  standardId: string;
  stream: string;
  divisionId: string;
  schoolName: string;
  rollNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  primaryMobile: string;
  secondaryMobile: string;
  whatsappNumber: string;
  relationship: string;
  shift: string;
  joiningDate: string;
  status: string;
  notes: string;
};

const EMPTY: StudentFormValues = {
  fullName: "",
  fatherName: "",
  motherName: "",
  standardId: "",
  stream: "Regular",
  divisionId: "",
  schoolName: "",
  rollNumber: "",
  dateOfBirth: "",
  gender: "male",
  address: "",
  primaryMobile: "",
  secondaryMobile: "",
  whatsappNumber: "",
  relationship: "Father",
  shift: "morning",
  joiningDate: new Date().toISOString().slice(0, 10),
  status: "active",
  notes: "",
};

const PHONE = /^(\+?\d{1,3}[- ]?)?\d{10}$/;

export default function StudentForm({
  initial,
  studentId,
  studentCode,
}: {
  initial?: Partial<StudentFormValues>;
  studentId?: number;
  studentCode?: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { state, visibleStandards, saveStudent } = useDemo();

  const [v, setV] = React.useState<StudentFormValues>({ ...EMPTY, ...initial });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [sameWhatsapp, setSameWhatsapp] = React.useState(!initial?.whatsappNumber);

  const standards = visibleStandards();
  const set = (k: keyof StudentFormValues, val: string) => setV((p) => ({ ...p, [k]: val }));
  const divs = state.divisions.filter((d) => String(d.standardId) === v.standardId);

  const selectedStd = standards.find((s) => String(s.id) === v.standardId);
  const is11or12 = selectedStd
    ? selectedStd.name.toLowerCase().includes("11") || selectedStd.name.toLowerCase().includes("12")
    : false;

  React.useEffect(() => {
    if (divs.length && !divs.some((d) => String(d.id) === v.divisionId)) {
      setV((p) => ({ ...p, divisionId: String(divs[0].id) }));
    }
  }, [v.standardId, divs, v.divisionId]);

  const initialStream = initial?.stream;
  React.useEffect(() => {
    if (is11or12) {
      if (v.stream !== "Science" && v.stream !== "Commerce") {
        setV((p) => ({ ...p, stream: initialStream === "Commerce" ? "Commerce" : "Science" }));
      }
    } else {
      if (v.stream !== "Regular") {
        setV((p) => ({ ...p, stream: "Regular" }));
      }
    }
  }, [is11or12, v.standardId, v.stream, initialStream]);

  function validate() {
    const e: Record<string, string> = {};
    if (v.fullName.trim().length < 2) e.fullName = "Student name is required";
    if (!v.standardId) e.standardId = "Select a standard";
    if (!v.divisionId) e.divisionId = "Select a division";
    if (!PHONE.test(v.primaryMobile.trim())) e.primaryMobile = "Enter a valid 10 digit number";
    if (v.secondaryMobile && !PHONE.test(v.secondaryMobile.trim())) e.secondaryMobile = "Enter a valid 10 digit number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      push("error", "Please correct the highlighted fields.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const payload: Omit<Student, "id" | "studentCode" | "photoColor" | "createdAt"> = {
        fullName: v.fullName.trim(),
        fatherName: v.fatherName.trim() || null,
        motherName: v.motherName.trim() || null,
        standardId: Number(v.standardId),
        stream: is11or12 ? (v.stream || "Science") : "Regular",
        divisionId: Number(v.divisionId),
        schoolName: v.schoolName.trim() || null,
        rollNumber: v.rollNumber.trim() || null,
        dateOfBirth: v.dateOfBirth || null,
        gender: v.gender,
        address: v.address.trim() || null,
        primaryMobile: v.primaryMobile.trim(),
        secondaryMobile: v.secondaryMobile.trim() || null,
        whatsappNumber: (sameWhatsapp ? v.primaryMobile : v.whatsappNumber).trim() || null,
        relationship: v.relationship,
        shift: v.shift,
        joiningDate: v.joiningDate || null,
        status: v.status as Student["status"],
        notes: v.notes.trim() || null,
      };
      const res = saveStudent(payload, studentId);
      push("success", studentId ? "Student details updated." : `Student saved. ID: ${res.code}`);
      router.push(`/students/${res.id}`);
    }, 300);
  }

  return (
    <form onSubmit={submit} className="space-y-4 pb-4">
      <Card>
        <CardHead
          title="Student information"
          subtitle="Basic details of the student"
          icon={<IdCard className="h-4.5 w-4.5" />}
          action={
            studentCode ? (
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-600">ID: {studentCode}</span>
            ) : (
              <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-700">Student ID is generated automatically</span>
            )
          }
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full name" required error={errors.fullName}>
            <Input value={v.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="e.g. Rahul Patel" />
          </Field>
          <Field label="Father's name">
            <Input value={v.fatherName} onChange={(e) => set("fatherName", e.target.value)} placeholder="e.g. Mahesh Patel" />
          </Field>
          <Field label="Mother's name">
            <Input value={v.motherName} onChange={(e) => set("motherName", e.target.value)} placeholder="e.g. Sunita Patel" />
          </Field>
          <Field label="Primary mobile number" required error={errors.primaryMobile} hint="10 digit mobile number">
            <Input inputMode="numeric" value={v.primaryMobile} onChange={(e) => set("primaryMobile", e.target.value)} placeholder="9825012345" />
          </Field>
          <Field label="Secondary mobile number" error={errors.secondaryMobile}>
            <Input inputMode="numeric" value={v.secondaryMobile} onChange={(e) => set("secondaryMobile", e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="WhatsApp number">
            <Input
              inputMode="numeric"
              value={sameWhatsapp ? v.primaryMobile : v.whatsappNumber}
              disabled={sameWhatsapp}
              onChange={(e) => set("whatsappNumber", e.target.value)}
              placeholder="9825012345"
            />
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-[13px] text-slate-600">
              <input type="checkbox" checked={sameWhatsapp} onChange={(e) => setSameWhatsapp(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#2563eb]" />
              Same as primary mobile
            </label>
          </Field>
          <Field label="Shift" required>
            <div className="grid grid-cols-2 gap-2">
              {[{ k: "morning", l: "Morning" }, { k: "afternoon", l: "Afternoon" }].map((s) => (
                <label
                  key={s.k}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm transition ${
                    v.shift === s.k ? "border-[#2563eb] bg-[#eff6ff] font-semibold text-[#1d4ed8]" : "border-[#e2e8f0] text-slate-600"
                  }`}
                >
                  <input type="radio" className="sr-only" checked={v.shift === s.k} onChange={() => set("shift", s.k)} />
                  {s.l}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Standard / Class" required error={errors.standardId}>
            <Select value={v.standardId} onChange={(e) => set("standardId", e.target.value)}>
              <option value="">Select standard</option>
              {standards.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          {is11or12 ? (
            <Field label="Stream Option" required error={errors.stream} hint="Choose for 11th / 12th">
              <div className="grid grid-cols-2 gap-2">
                {["Science", "Commerce"].map((st) => (
                  <label
                    key={st}
                    className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition ${
                      v.stream === st
                        ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8] shadow-sm"
                        : "border-[#e2e8f0] bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="stream"
                      className="sr-only"
                      checked={v.stream === st}
                      onChange={() => set("stream", st)}
                    />
                    {st}
                  </label>
                ))}
              </div>
            </Field>
          ) : (
            <Field label="Stream Option">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-700">Regular Stream</span>
                </div>
                <span className="text-xs font-medium text-slate-400">(Std 5–10)</span>
              </div>
            </Field>
          )}
          <Field label="Division" required error={errors.divisionId}>
            <Select value={v.divisionId} onChange={(e) => set("divisionId", e.target.value)} disabled={!v.standardId}>
              {!v.standardId ? <option value="">Select standard first</option> : null}
              {divs.map((d) => <option key={d.id} value={d.id}>Division {d.name}</option>)}
            </Select>
          </Field>
          <Field label="School name">
            <Input value={v.schoolName} onChange={(e) => set("schoolName", e.target.value)} placeholder="e.g. Little Flower School" />
          </Field>
          <Field label="Roll number">
            <Input value={v.rollNumber} onChange={(e) => set("rollNumber", e.target.value)} placeholder="e.g. 21" />
          </Field>
          <Field label="Date of birth">
            <Input type="date" value={v.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
          </Field>
          <Field label="Gender">
            <div className="flex gap-2">
              {["male", "female", "other"].map((g) => (
                <label
                  key={g}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm capitalize transition ${
                    v.gender === g ? "border-[#2563eb] bg-[#eff6ff] font-semibold text-[#1d4ed8]" : "border-[#e2e8f0] text-slate-600"
                  }`}
                >
                  <input type="radio" className="sr-only" checked={v.gender === g} onChange={() => set("gender", g)} />
                  {g}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Address" className="sm:col-span-2 lg:col-span-3">
            <Textarea rows={2} value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="House / society / area" />
          </Field>
        </div>
      </Card>

      <div className="sticky bottom-16 z-20 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-[#e2e8f0] bg-white/95 p-3 backdrop-blur lg:bottom-4">
        <Link href={studentId ? `/students/${studentId}` : "/students"} className="btn-soft">Cancel</Link>
        <Button type="submit" loading={saving}>
          <Save className="h-4 w-4" />
          {studentId ? "Save changes" : "Save student"}
        </Button>
      </div>
    </form>
  );
}
