"use client";

import * as React from "react";
import { useParams, useSearchParams } from "@/lib/next-compat";
import { Card, EmptyState } from "@/components/ui";
import { useDemo } from "@/lib/demo/store";
import StudentProfile from "./profile-client";

function ProfileInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { state, allows, standardName, divisionName, subjectName } = useDemo();

  const id = Number(params.id);
  const s = state.students.find((x) => x.id === id);
  if (!s) {
    return (
      <Card>
        <EmptyState title="Student not found" message="This student may have been removed from the demo data." />
      </Card>
    );
  }

  const attRows = state.attendance
    .filter((a) => a.studentId === id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 120);

  const markRows = state.marks
    .filter((m) => m.studentId === id)
    .map((m) => {
      const exam = state.exams.find((e) => e.id === m.examId)!;
      return {
        id: m.id,
        examId: m.examId,
        examName: exam?.name ?? "—",
        examDate: exam?.examDate ?? "",
        subject: subjectName(m.subjectId),
        obtained: m.marksObtained,
        max: m.maxMarks,
        addedByName: m.addedByName,
      };
    })
    .sort((a, b) => a.examDate.localeCompare(b.examDate) || a.subject.localeCompare(b.subject));

  const resultRows = state.results
    .filter((r) => r.studentId === id)
    .map((r) => {
      const exam = state.exams.find((e) => e.id === r.examId)!;
      return {
        id: r.id,
        examId: r.examId,
        examName: exam?.name ?? "—",
        examDate: exam?.examDate ?? "",
        totalObtained: r.totalObtained,
        totalMax: r.totalMax,
        percentage: r.percentage,
        grade: r.grade,
        rank: r.rank,
        resultStatus: r.resultStatus,
        generatedAt: r.generatedAt,
        generatedByName: r.generatedByName,
      };
    })
    .sort((a, b) => a.examDate.localeCompare(b.examDate));

  const total = attRows.length;
  const present = attRows.filter((a) => a.status !== "absent").length;

  const upcoming = state.exams
    .filter((e) => e.standardId === s.standardId && e.status === "upcoming")
    .sort((a, b) => a.examDate.localeCompare(b.examDate))
    .slice(0, 3)
    .map((e) => ({ id: e.id, name: e.name, examDate: e.examDate }));

  return (
    <StudentProfile
      student={s}
      standard={standardName(s.standardId)}
      division={divisionName(s.divisionId)}
      attendance={attRows.map((a) => ({
        id: a.id,
        date: a.date,
        status: a.status,
        shift: a.shift,
        takenByName: a.takenByName,
        takenAt: a.takenAt,
        remark: null,
      }))}
      summary={{ totalClasses: total, present, absent: total - present }}
      marks={markRows}
      results={resultRows}
      upcomingExams={upcoming}
      initialTab={search.get("tab") ?? "overview"}
      canEdit={allows("student.edit")}
      canWhatsapp={allows("whatsapp.send")}
      tuitionName={state.settings.tuitionName}
      lowAttendanceThreshold={state.settings.lowAttendanceThreshold}
    />
  );
}

export default function StudentProfilePage() {
  return (
    <React.Suspense fallback={<div className="skeleton h-96 w-full rounded-2xl" />}>
      <ProfileInner />
    </React.Suspense>
  );
}
