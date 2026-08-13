"use client";

import * as React from "react";
import { useParams, useRouter } from "@/lib/next-compat";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import StudentForm from "@/components/student-form";
import { useDemo } from "@/lib/demo/store";

export default function EditStudentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, allows } = useDemo();
  const id = Number(params.id);
  const s = state.students.find((x) => x.id === id);

  React.useEffect(() => {
    if (!allows("student.edit")) router.replace("/no-access");
  }, [allows, router]);

  if (!allows("student.edit")) return null;
  if (!s) {
    return (
      <Card>
        <EmptyState title="Student not found" message="This student may have been removed." />
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${s.fullName}`}
        subtitle="Update the student's information."
        breadcrumb={[{ label: "Students", href: "/students" }, { label: s.fullName, href: `/students/${s.id}` }, { label: "Edit" }]}
      />
      <StudentForm
        studentId={s.id}
        studentCode={s.studentCode}
        initial={{
          fullName: s.fullName,
          fatherName: s.fatherName ?? "",
          motherName: s.motherName ?? "",
          standardId: String(s.standardId),
          stream: s.stream ?? "Regular",
          divisionId: String(s.divisionId),
          schoolName: s.schoolName ?? "",
          rollNumber: s.rollNumber ?? "",
          dateOfBirth: s.dateOfBirth ?? "",
          gender: s.gender ?? "male",
          address: s.address ?? "",
          primaryMobile: s.primaryMobile,
          secondaryMobile: s.secondaryMobile ?? "",
          whatsappNumber: s.whatsappNumber ?? "",
          relationship: s.relationship ?? "Father",
          shift: s.shift,
          joiningDate: s.joiningDate ?? "",
          status: s.status,
          notes: s.notes ?? "",
        }}
      />
    </div>
  );
}
