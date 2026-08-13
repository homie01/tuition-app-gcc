"use client";

import * as React from "react";
import { useParams, useSearchParams } from "@/lib/next-compat";
import { Card, EmptyState } from "@/components/ui";
import { useDemo } from "@/lib/demo/store";
import ResultDocument from "./result-client";

function ResultInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { state, standardName, divisionName, subjectName } = useDemo();

  const id = Number(params.id);
  const s = state.students.find((x) => x.id === id);
  if (!s) {
    return (
      <Card>
        <EmptyState title="Student not found" />
      </Card>
    );
  }

  const resultRows = state.results
    .filter((r) => r.studentId === id)
    .map((r) => ({ r, exam: state.exams.find((e) => e.id === r.examId)! }))
    .filter((x) => Boolean(x.exam))
    .sort((a, b) => a.exam.examDate.localeCompare(b.exam.examDate));

  const examIdParam = Number(search.get("examId") ?? 0);
  const picked =
    resultRows.find((x) => x.exam.id === examIdParam) ?? resultRows[resultRows.length - 1] ?? null;
  const pickedIndex = picked ? resultRows.findIndex((x) => x.exam.id === picked.exam.id) : -1;
  const previous = pickedIndex > 0 ? resultRows[pickedIndex - 1] : null;

  const subjects = picked
    ? state.marks
        .filter((m) => m.examId === picked.exam.id && m.studentId === id)
        .map((m) => ({ subject: subjectName(m.subjectId), obtained: m.marksObtained, max: m.maxMarks }))
        .sort((a, b) => a.subject.localeCompare(b.subject))
    : [];

  const att = state.attendance.filter((a) => a.studentId === id);
  const present = att.filter((a) => a.status === "present" || a.status === "late").length;
  const absent = att.filter((a) => a.status === "absent").length;
  const late = att.filter((a) => a.status === "late").length;
  const leave = att.filter((a) => a.status === "leave").length;

  // Compute class average for the selected exam
  const examResults = picked ? state.results.filter((r) => r.examId === picked.exam.id) : [];
  const classAverage = examResults.length
    ? Number((examResults.reduce((a, b) => a + b.percentage, 0) / examResults.length).toFixed(2))
    : 0;

  return (
    <ResultDocument
      settings={{
        tuitionName: state.settings.tuitionName,
        logoText: state.settings.logoText,
        address: state.settings.address,
        phone: state.settings.phone,
        email: state.settings.email,
      }}
      student={{
        id: s.id,
        studentCode: s.studentCode,
        fullName: s.fullName,
        fatherName: s.fatherName,
        standard: standardName(s.standardId),
        division: divisionName(s.divisionId),
        shift: s.shift,
        rollNumber: s.rollNumber,
        stream: s.stream,
      }}
      exams={resultRows.map((x) => ({ examId: x.exam.id, name: x.exam.name, date: x.exam.examDate }))}
      selected={
        picked
          ? {
              examId: picked.exam.id,
              name: picked.exam.name,
              examDate: picked.exam.examDate,
              resultDate: picked.exam.resultDate,
              totalObtained: picked.r.totalObtained,
              totalMax: picked.r.totalMax,
              percentage: picked.r.percentage,
              grade: picked.r.grade,
              rank: picked.r.rank,
              resultStatus: picked.r.resultStatus,
            }
          : null
      }
      previous={previous ? { name: previous.exam.name, percentage: previous.r.percentage, grade: previous.r.grade } : null}
      subjects={subjects}
      attendanceSummary={{ total: att.length, present, absent, late, leave }}
      classAverage={classAverage}
    />
  );
}

export default function StudentResultPage() {
  return (
    <React.Suspense fallback={<div className="skeleton h-96 w-full rounded-2xl" />}>
      <ResultInner />
    </React.Suspense>
  );
}
