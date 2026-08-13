"use client";

import * as React from "react";
import { useRouter } from "@/lib/next-compat";
import { PageHeader } from "@/components/ui";
import StudentForm from "@/components/student-form";
import { useDemo } from "@/lib/demo/store";

export default function NewStudentPage() {
  const router = useRouter();
  const { allows } = useDemo();

  React.useEffect(() => {
    if (!allows("student.add")) router.replace("/no-access");
  }, [allows, router]);

  if (!allows("student.add")) return null;

  return (
    <div>
      <PageHeader
        title="Add Student"
        subtitle="Fill the details below. A unique Student ID is created automatically."
        breadcrumb={[{ label: "Students", href: "/students" }, { label: "Add Student" }]}
      />
      <StudentForm />
    </div>
  );
}
