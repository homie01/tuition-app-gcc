"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Printer, Table, X } from "lucide-react";
import { Button, Input, Modal, Select, useToast } from "@/components/ui";
import { formatDate, pct } from "@/lib/utils";
import { gradeFor } from "@/lib/grading";
import { useDemo } from "@/lib/demo/store";
import type { Student } from "@/lib/demo/types";

const GCC_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <circle cx="150" cy="150" r="142" fill="#ffffff" stroke="#222222" stroke-width="5"/>
  <circle cx="150" cy="150" r="118" fill="none" stroke="#222222" stroke-width="3"/>
  <path id="topArc" d="M 35,150 A 115,115 0 0,1 265,150" fill="none"/>
  <path id="bottomArc" d="M 265,150 A 115,115 0 0,1 35,150" fill="none"/>
  <text font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="21" fill="#222222">
    <textPath href="#topArc" startOffset="50%" text-anchor="middle">Group Coaching Classes</textPath>
  </text>
  <text font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="17" fill="#008acb">
    <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">Quality Education Center</textPath>
  </text>
  <circle cx="48" cy="195" r="5" fill="#1b2a4a"/>
  <circle cx="252" cy="195" r="5" fill="#1b2a4a"/>
  <g transform="translate(150,152)">
    <polygon points="0,-52 50,-24 0,4 -50,-24" fill="#0099e5" stroke="#0099e5" stroke-width="1"/>
    <polygon points="-50,-24 0,4 0,60 -50,32" fill="#222222" stroke="#222222" stroke-width="1"/>
    <polygon points="0,4 50,-24 50,32 0,60" fill="#222222" stroke="#222222" stroke-width="1"/>
    <text x="0" y="-12" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle">G</text>
    <text x="-25" y="28" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle">C</text>
    <text x="25" y="28" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle">C</text>
  </g>
</svg>`;

const GCC_LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(GCC_LOGO_SVG)}`;

const getGccLogoPng = async (): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, 300, 300);
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve(GCC_LOGO_DATA_URL);
      }
    };
    img.onerror = () => resolve(GCC_LOGO_DATA_URL);
    img.src = GCC_LOGO_DATA_URL;
  });
};

interface DivisionMarksExcelModalProps {
  open: boolean;
  onClose: () => void;
  defaultStandardId?: string;
  defaultDivisionId?: string;
  defaultStream?: string;
  defaultExamId?: string;
}

export function DivisionMarksExcelModal({
  open,
  onClose,
  defaultStandardId = "",
  defaultDivisionId = "",
  defaultStream = "Science",
  defaultExamId = "all",
}: DivisionMarksExcelModalProps) {
  const { push } = useToast();
  const { state, visibleStandards, standardName, divisionName, getSubjectsForStandard } = useDemo();

  const standards = visibleStandards();
  const [standardId, setStandardId] = React.useState(defaultStandardId || (standards[0] ? String(standards[0].id) : ""));
  const [divisionFilter, setDivisionFilter] = React.useState<string>(defaultDivisionId ? `single_${defaultDivisionId}` : "all_separate");
  const [selectedDivisionIds, setSelectedDivisionIds] = React.useState<number[]>([]);
  const [stream, setStream] = React.useState(defaultStream);
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [selectedExamId, setSelectedExamId] = React.useState<string>(defaultExamId || "all");
  const [viewMode, setViewMode] = React.useState<"subject_grouped" | "subject_wise" | "exam_subject" | "exam_summary">("subject_grouped");
  const [pdfPaperSize, setPdfPaperSize] = React.useState<"a4_portrait" | "a4_landscape" | "letter" | "a3" | "a1">("a4_portrait");
  const [downloading, setDownloading] = React.useState(false);

  const divisions = React.useMemo(() => {
    return state.divisions.filter((d) => String(d.standardId) === standardId);
  }, [state.divisions, standardId]);

  // Sync selected division IDs when standard changes or divisions change
  React.useEffect(() => {
    setSelectedDivisionIds(divisions.map((d) => d.id));
  }, [divisions]);

  React.useEffect(() => {
    if (open) {
      if (defaultStandardId) setStandardId(defaultStandardId);
      if (defaultDivisionId) {
        setDivisionFilter(`single_${defaultDivisionId}`);
      } else {
        setDivisionFilter("all_separate");
      }
      if (defaultStream) setStream(defaultStream);
      if (defaultExamId) setSelectedExamId(defaultExamId);
    }
  }, [open, defaultStandardId, defaultDivisionId, defaultStream, defaultExamId]);

  const selectedStd = standards.find((s) => String(s.id) === standardId);
  const is11or12 = Boolean(
    selectedStd && (selectedStd.name.toLowerCase().includes("11") || selectedStd.name.toLowerCase().includes("12"))
  );

  const rawStdName = standardName(Number(standardId)) || "";
  const stdClean = rawStdName.replace(/^(standard|std)\s+/i, "").trim() || rawStdName || "";

  // Subheader description construction
  const subheaderText = React.useMemo(() => {
    const streamLabel = is11or12 ? ` (${stream})` : "";
    if (divisionFilter.startsWith("single_")) {
      const dId = Number(divisionFilter.replace("single_", ""));
      const dName = divisionName(dId);
      return `Standard: ${stdClean}-${dName}${streamLabel}`;
    } else if (divisionFilter === "all_separate") {
      const activeDivs = divisions.filter((d) => selectedDivisionIds.includes(d.id));
      if (activeDivs.length === 1) {
        return `Standard: ${stdClean}-${activeDivs[0].name}${streamLabel}`;
      } else if (activeDivs.length > 1) {
        const names = activeDivs.map((d) => d.name).join(", ");
        return `Standard: ${stdClean} · Divisions: ${names} (Separate Tables)${streamLabel}`;
      }
      return `Standard: ${stdClean} (All Divisions — Separate Tables)${streamLabel}`;
    } else {
      return `Standard: ${stdClean} (All Divisions Combined)${streamLabel}`;
    }
  }, [divisionFilter, divisions, selectedDivisionIds, stdClean, is11or12, stream, divisionName]);

  // Exams for this standard filtered by date range and sorted chronologically
  const sortedExams = React.useMemo(() => {
    if (!standardId) return [];
    let exams = state.exams.filter((e) => String(e.standardId) === standardId);
    if (startDate) {
      exams = exams.filter((e) => e.examDate >= startDate);
    }
    if (endDate) {
      exams = exams.filter((e) => e.examDate <= endDate);
    }
    return exams.sort((a, b) => a.examDate.localeCompare(b.examDate));
  }, [state.exams, standardId, startDate, endDate]);

  // Formatted date range string for display
  const dateRangeLabel = React.useMemo(() => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} to ${formatDate(endDate)}`;
    } else if (startDate) {
      return `From ${formatDate(startDate)}`;
    } else if (endDate) {
      return `Up to ${formatDate(endDate)}`;
    }
    return null;
  }, [startDate, endDate]);

  // Subjects for this standard/stream
  const subjects = React.useMemo(() => {
    return getSubjectsForStandard(standardId, is11or12 ? stream : undefined);
  }, [getSubjectsForStandard, standardId, is11or12, stream]);

  // Current selected exam & its subject
  const currentSelectedExam = React.useMemo(() => {
    if (selectedExamId === "all") return null;
    return sortedExams.find((e) => String(e.id) === selectedExamId) || null;
  }, [selectedExamId, sortedExams]);

  const currentExamSubject = React.useMemo(() => {
    if (!currentSelectedExam?.subjectId) return null;
    return state.subjects.find((s) => s.id === currentSelectedExam.subjectId) || null;
  }, [currentSelectedExam, state.subjects]);

  // Columns to display based on viewMode, date range, and selectedExamId
  // Displays marks organized by subject or specific conducted exams
  const displayColumns = React.useMemo(() => {
    const examsToUse = selectedExamId === "all" ? sortedExams : sortedExams.filter((e) => String(e.id) === selectedExamId);

    if (viewMode === "subject_grouped") {
      const cols: Array<{ id: string; subjectId: number; examId: number; title: string; subtitle: string }> = [];

      // Iterate through subjects first so exams are grouped and organized by subject
      for (const sub of subjects) {
        const examsForSub = examsToUse.filter((e) => {
          if (e.subjectId) return e.subjectId === sub.id;
          return state.marks.some((m) => m.examId === e.id && m.subjectId === sub.id);
        });

        for (const exam of examsForSub) {
          cols.push({
            id: `${sub.id}-${exam.id}`,
            subjectId: sub.id,
            examId: exam.id,
            title: sub.name.toUpperCase(),
            subtitle: `${exam.name} (${formatDate(exam.examDate)})`,
          });
        }
      }

      // If no subject-specific matches found but exams exist, fallback to exam-subject combinations
      if (!cols.length && examsToUse.length > 0) {
        for (const exam of examsToUse) {
          const sub = exam.subjectId ? state.subjects.find((s) => s.id === exam.subjectId) : subjects[0];
          if (sub) {
            cols.push({
              id: `${sub.id}-${exam.id}`,
              subjectId: sub.id,
              examId: exam.id,
              title: sub.name.toUpperCase(),
              subtitle: `${exam.name} (${formatDate(exam.examDate)})`,
            });
          }
        }
      }

      return cols;
    } else if (viewMode === "subject_wise") {
      if (selectedExamId !== "all") {
        const exam = sortedExams.find((e) => String(e.id) === selectedExamId);
        if (!exam) return [];

        // Determine which subjects this exam was conducted for:
        let conductedSubjects = subjects;
        if (exam.subjectId) {
          conductedSubjects = subjects.filter((s) => s.id === exam.subjectId);
          if (!conductedSubjects.length) {
            const found = state.subjects.find((s) => s.id === exam.subjectId);
            if (found) conductedSubjects = [found];
          }
        } else {
          const marksInExam = state.marks.filter((m) => m.examId === exam.id);
          const conductedSubIds = new Set(marksInExam.map((m) => m.subjectId));
          if (conductedSubIds.size > 0) {
            conductedSubjects = subjects.filter((s) => conductedSubIds.has(s.id));
          }
        }

        return conductedSubjects.map((sub) => ({
          id: `${selectedExamId}-${sub.id}`,
          subjectId: sub.id,
          examId: exam.id,
          title: sub.name.toUpperCase(),
          subtitle: formatDate(exam.examDate),
        }));
      } else {
        // "all" exams in subject_wise view
        // Include subjects that have at least one exam conducted or marks recorded in selected date range
        const conductedSubIds = new Set([
          ...sortedExams.map((e) => e.subjectId).filter((id): id is number => typeof id === "number"),
          ...state.marks.filter((m) => sortedExams.some((e) => e.id === m.examId)).map((m) => m.subjectId),
        ]);

        const subsToUse =
          conductedSubIds.size > 0 ? subjects.filter((s) => conductedSubIds.has(s.id)) : subjects;

        return subsToUse.map((sub) => {
          const examsForSub = sortedExams.filter((e) => e.subjectId === sub.id || state.marks.some((m) => m.examId === e.id && m.subjectId === sub.id));
          return {
            id: `all-${sub.id}`,
            subjectId: sub.id,
            examId: undefined,
            title: sub.name.toUpperCase(),
            subtitle: examsForSub.length === 1 ? formatDate(examsForSub[0].examDate) : `${examsForSub.length || sortedExams.length} EXAMS`,
          };
        });
      }
    } else if (viewMode === "exam_subject") {
      const cols: Array<{ id: string; subjectId: number; examId: number; title: string; subtitle: string }> = [];

      for (const exam of examsToUse) {
        let conductedSubs = subjects;
        if (exam.subjectId) {
          conductedSubs = subjects.filter((s) => s.id === exam.subjectId);
          if (!conductedSubs.length) {
            const found = state.subjects.find((s) => s.id === exam.subjectId);
            if (found) conductedSubs = [found];
          }
        } else {
          const marksInExam = state.marks.filter((m) => m.examId === exam.id);
          const conductedSubIds = new Set(marksInExam.map((m) => m.subjectId));
          if (conductedSubIds.size > 0) {
            conductedSubs = subjects.filter((s) => conductedSubIds.has(s.id));
          }
        }

        for (const sub of conductedSubs) {
          cols.push({
            id: `${exam.id}-${sub.id}`,
            subjectId: sub.id,
            examId: exam.id,
            title: `${exam.name} - ${sub.name}`.toUpperCase(),
            subtitle: formatDate(exam.examDate),
          });
        }
      }
      return cols;
    } else {
      return examsToUse.map((exam) => {
        const sub = exam.subjectId ? state.subjects.find((s) => s.id === exam.subjectId) : null;
        return {
          id: `exam-${exam.id}`,
          subjectId: undefined,
          examId: exam.id,
          title: `${exam.name}${sub ? ` (${sub.name})` : ""}`.toUpperCase(),
          subtitle: formatDate(exam.examDate),
        };
      });
    }
  }, [viewMode, selectedExamId, sortedExams, subjects, state.subjects, state.marks]);

  // Active subject for header
  const activeSubjectName = React.useMemo(() => {
    if (currentExamSubject) return currentExamSubject.name;
    if (displayColumns.length === 1 && displayColumns[0].subjectId) {
      return state.subjects.find((s) => s.id === displayColumns[0].subjectId)?.name || null;
    }
    return null;
  }, [currentExamSubject, displayColumns, state.subjects]);

  // Helper to compute matrix for any student roster
  const computeMatrixForRoster = React.useCallback(
    (studentList: Student[]) => {
      return studentList.map((student, idx) => {
        const studentMarks = state.marks.filter((m) => m.studentId === student.id);

        let grandObtained = 0;
        let grandMax = 0;

        const colValues = displayColumns.map((col) => {
          if (col.examId && col.subjectId) {
            const m = studentMarks.find((x) => x.examId === col.examId && x.subjectId === col.subjectId);
            if (m) {
              grandObtained += m.marksObtained;
              grandMax += m.maxMarks;
              return { value: m.marksObtained, max: m.maxMarks };
            }
            return { value: null, max: null };
          } else if (col.subjectId && !col.examId) {
            const mList = studentMarks.filter((x) => x.subjectId === col.subjectId && sortedExams.some((e) => e.id === x.examId));
            const obtained = mList.reduce((a, b) => a + b.marksObtained, 0);
            const max = mList.reduce((a, b) => a + b.maxMarks, 0);
            if (max > 0) {
              grandObtained += obtained;
              grandMax += max;
              return { value: obtained, max };
            }
            return { value: null, max: null };
          } else if (col.examId && !col.subjectId) {
            const mList = studentMarks.filter((x) => x.examId === col.examId);
            const obtained = mList.reduce((a, b) => a + b.marksObtained, 0);
            const max = mList.reduce((a, b) => a + b.maxMarks, 0);
            if (max > 0) {
              grandObtained += obtained;
              grandMax += max;
              return { value: obtained, max };
            }
            return { value: null, max: null };
          }
          return { value: null, max: null };
        });

        const overallPct = grandMax ? pct(grandObtained, grandMax) : 0;

        return {
          rowNum: idx + 1,
          student,
          colValues,
          grandObtained,
          grandMax,
          overallPct,
          grade: grandMax ? gradeFor(overallPct, state.settings?.gradeBands).grade : "—",
        };
      });
    },
    [state.marks, state.settings?.gradeBands, displayColumns, sortedExams]
  );

  // Group students by Division (supports separate stacked tables or merged)
  const divisionGroups = React.useMemo(() => {
    if (!standardId) return [];

    const baseFilter = (s: Student) => {
      if (String(s.standardId) !== standardId) return false;
      if (s.status !== "active") return false;
      if (is11or12 && (s.stream ?? "Science") !== stream) return false;
      return true;
    };

    if (divisionFilter === "all_separate") {
      const activeDivs = divisions.filter((d) => selectedDivisionIds.includes(d.id));
      const divsToProcess = activeDivs.length > 0 ? activeDivs : divisions;

      if (divsToProcess.length > 0) {
        return divsToProcess.map((d) => {
          const divStudents = state.students
            .filter((s) => baseFilter(s) && s.divisionId === d.id)
            .sort((a, b) => a.fullName.localeCompare(b.fullName));

          return {
            divisionId: d.id,
            divisionName: `DIVISION ${d.name.toUpperCase()}`,
            roster: divStudents,
            matrix: computeMatrixForRoster(divStudents),
          };
        });
      }

      const allStudents = state.students
        .filter(baseFilter)
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      return [
        {
          divisionId: null,
          divisionName: "ALL STUDENTS",
          roster: allStudents,
          matrix: computeMatrixForRoster(allStudents),
        },
      ];
    } else if (divisionFilter === "all_combined") {
      const allStudents = state.students
        .filter(baseFilter)
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      return [
        {
          divisionId: null,
          divisionName: "ALL DIVISIONS (COMBINED)",
          roster: allStudents,
          matrix: computeMatrixForRoster(allStudents),
        },
      ];
    } else {
      // Single division selected
      const dId = Number(divisionFilter.replace("single_", ""));
      const dObj = divisions.find((d) => d.id === dId);
      const dName = dObj ? dObj.name : divisionName(dId) || "";
      const divStudents = state.students
        .filter((s) => baseFilter(s) && s.divisionId === dId)
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      return [
        {
          divisionId: dId,
          divisionName: `DIVISION ${dName.toUpperCase()}`,
          roster: divStudents,
          matrix: computeMatrixForRoster(divStudents),
        },
      ];
    }
  }, [
    standardId,
    is11or12,
    stream,
    divisionFilter,
    divisions,
    selectedDivisionIds,
    state.students,
    computeMatrixForRoster,
    divisionName,
  ]);

  // Total student count across displayed groups
  const totalStudents = React.useMemo(() => {
    return divisionGroups.reduce((acc, g) => acc + g.roster.length, 0);
  }, [divisionGroups]);

  // Generate Excel PDF using jspdf-autotable with stacked tables per division
  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default || (autoTableModule as any).autoTable;

      // Paper Size and Orientation (a4_portrait is standard default)
      const isLandscape = pdfPaperSize.endsWith("_landscape") || pdfPaperSize === "a3" || pdfPaperSize === "a1";
      const orientation = isLandscape ? "l" : "p";
      const format = pdfPaperSize.replace("_portrait", "").replace("_landscape", "");

      const pdf = new jsPDF(orientation, "mm", format);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Dynamic scaling parameters optimized for A4 Portrait compact layout
      let margin = 8;
      let logoSize = 18;
      let titleFontSize = 13;
      let subFontSize = 9.5;
      let metaFontSize = 8;
      let headFontSize = 8.5;
      let bodyFontSize = 9; // Clear bold marks for A4 Portrait
      let cellPadding = { top: 1.8, bottom: 1.8, left: 2, right: 2 };
      let headerYOffset = 7;

      if (pdfPaperSize === "a4_landscape" || pdfPaperSize === "letter") {
        margin = 10;
        logoSize = 20;
        titleFontSize = 14;
        subFontSize = 10;
        metaFontSize = 8.5;
        headFontSize = 9;
        bodyFontSize = 9.5;
        cellPadding = { top: 2, bottom: 2, left: 2.5, right: 2.5 };
        headerYOffset = 8;
      } else if (pdfPaperSize === "a3") {
        margin = 14;
        logoSize = 32;
        titleFontSize = 20;
        subFontSize = 13;
        metaFontSize = 10;
        headFontSize = 11;
        bodyFontSize = 11.5;
        cellPadding = { top: 3, bottom: 3, left: 3, right: 3 };
        headerYOffset = 12;
      } else if (pdfPaperSize === "a1") {
        margin = 22;
        logoSize = 50;
        titleFontSize = 30;
        subFontSize = 20;
        metaFontSize = 13;
        headFontSize = 15;
        bodyFontSize = 16;
        cellPadding = { top: 5, bottom: 5, left: 4, right: 4 };
        headerYOffset = 18;
      }

      // Automatically adjust font size and padding if there are many columns on Portrait mode to prevent overflowing
      const totalCols = displayColumns.length + 2;
      if (!isLandscape && totalCols > 5) {
        if (totalCols > 10) {
          headFontSize = 7;
          bodyFontSize = 7;
          cellPadding = { top: 1.2, bottom: 1.2, left: 1, right: 1 };
        } else if (totalCols > 8) {
          headFontSize = 7.5;
          bodyFontSize = 7.5;
          cellPadding = { top: 1.4, bottom: 1.4, left: 1.2, right: 1.2 };
        } else {
          headFontSize = 8;
          bodyFontSize = 8;
          cellPadding = { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 };
        }
      }

      const sName = standardName(Number(standardId)) || "Standard";
      const examTitle = currentSelectedExam
        ? `${currentSelectedExam.name.toUpperCase()}${currentExamSubject ? ` — ${currentExamSubject.name.toUpperCase()}` : ""}`
        : "SUBJECT-WISE";

      // Draw GCC Logo at top center of PDF
      let currentY = headerYOffset;
      try {
        const logoPng = await getGccLogoPng();
        const logoX = (pdfWidth - logoSize) / 2;
        pdf.addImage(logoPng, "PNG", logoX, currentY, logoSize, logoSize);
        currentY += logoSize + (pdfPaperSize === "a1" ? 12 : 7);
      } catch (e) {
        console.warn("Logo drawing fallback", e);
      }

      // Centered H2 Title in PDF
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(titleFontSize);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`DIVISION MARKS REPORT — ${examTitle}`, pdfWidth / 2, currentY, { align: "center" });
      currentY += (pdfPaperSize === "a1" ? 10 : 5);

      // Centered Subtitle Paragraph (Std, Div, Subject & Date Range)
      const pdfSubheader = `${subheaderText}${activeSubjectName ? `   ·   Subject: ${activeSubjectName}` : ""}${dateRangeLabel ? `   ·   Date Range: ${dateRangeLabel}` : ""}`;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(subFontSize);
      pdf.setTextColor(20, 20, 20);
      pdf.text(pdfSubheader, pdfWidth / 2, currentY, { align: "center" });
      currentY += (pdfPaperSize === "a1" ? 8 : 4.5);

      // Metadata Info Line
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(metaFontSize);
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        `Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}   ·   Total Students: ${totalStudents}${selectedExamId !== "all" ? `   ·   Exam: ${currentSelectedExam?.name}` : `   ·   Exams: ${sortedExams.length}`}`,
        pdfWidth / 2,
        currentY,
        { align: "center" }
      );
      currentY += (pdfPaperSize === "a1" ? 6 : 3.5);

      // Horizontal Divider Line
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(pdfPaperSize === "a1" ? 0.8 : 0.4);
      pdf.line(margin, currentY, pdfWidth - margin, currentY);
      currentY += (pdfPaperSize === "a1" ? 6 : 3.5);

      // Column Styles: allow autoTable to size columns according to word lengths
      const columnStylesObj: Record<number, any> = {
        0: { halign: "center", valign: "middle", cellWidth: "auto" },
        1: { halign: "left", valign: "middle", cellWidth: "auto" },
      };

      displayColumns.forEach((_, idx) => {
        columnStylesObj[idx + 2] = {
          halign: "center",
          valign: "middle",
          cellWidth: "auto",
        };
      });

      // Construct autoTable Header
      const head = [
        [
          { content: "#", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [255, 255, 255] } },
          { content: "NAME", rowSpan: 2, styles: { halign: "left", valign: "middle", fillColor: [255, 255, 255] } },
          ...displayColumns.map((col) => ({
            content: col.title,
            styles: { halign: "center", valign: "middle", fillColor: [255, 255, 255] },
          })),
        ],
        displayColumns.map((col) => ({
          content: col.subtitle,
          styles: { halign: "center", valign: "middle", fillColor: [255, 255, 255] },
        })),
      ];

      // Draw each division group table stacked one above the other
      divisionGroups.forEach((group) => {
        if (divisionGroups.length > 1) {
          // If close to page bottom, add a new page
          if (currentY + 28 > pdfHeight - margin) {
            pdf.addPage();
            currentY = margin + 4;
          }

          // Division Subheader Banner
          pdf.setFillColor(240, 243, 246);
          pdf.rect(margin, currentY, pdfWidth - margin * 2, pdfPaperSize === "a1" ? 11 : 6.5, "F");
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(pdfPaperSize === "a1" ? 0.6 : 0.3);
          pdf.rect(margin, currentY, pdfWidth - margin * 2, pdfPaperSize === "a1" ? 11 : 6.5, "S");

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(subFontSize);
          pdf.setTextColor(0, 0, 0);
          pdf.text(
            `${group.divisionName}   (${group.roster.length} ${group.roster.length === 1 ? "STUDENT" : "STUDENTS"})`,
            margin + (pdfPaperSize === "a1" ? 5 : 3),
            currentY + (pdfPaperSize === "a1" ? 7.5 : 4.6)
          );
          currentY += pdfPaperSize === "a1" ? 13 : 8;
        }

        if (group.roster.length === 0) {
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(bodyFontSize);
          pdf.setTextColor(120, 120, 120);
          pdf.text(`No active students found in ${group.divisionName}`, margin + 2, currentY + 4);
          currentY += pdfPaperSize === "a1" ? 14 : 9;
          return;
        }

        const body = group.matrix.map((row) => [
          row.rowNum,
          row.student.fullName.toUpperCase(),
          ...row.colValues.map((cv) => (cv.value !== null ? String(cv.value) : "—")),
        ]);

        autoTable(pdf, {
          startY: currentY,
          head: head as any,
          body: body as any,
          theme: "grid",
          tableWidth: "auto",
          styles: {
            font: "helvetica",
            fontSize: bodyFontSize,
            fontStyle: "bold", // Bold marks for crisp visibility!
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: pdfPaperSize === "a1" ? 0.35 : 0.25,
            cellPadding: cellPadding as any,
            overflow: "linebreak",
          },
          headStyles: {
            textColor: [0, 0, 0],
            fontStyle: "bold",
            fontSize: headFontSize,
            lineColor: [0, 0, 0],
            lineWidth: pdfPaperSize === "a1" ? 0.5 : 0.35,
            fillColor: [248, 249, 250],
          },
          bodyStyles: {
            textColor: [0, 0, 0],
            fontStyle: "bold",
            lineColor: [0, 0, 0],
            lineWidth: pdfPaperSize === "a1" ? 0.3 : 0.2,
          },
          columnStyles: columnStylesObj,
          margin: { top: margin + 5, left: margin, right: margin, bottom: margin + 2 },
          didDrawPage: (data) => {
            pdf.setFontSize(pdfPaperSize === "a1" ? 11 : 8.5);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(100, 100, 100);
            const totalPages = (pdf as any).internal.getNumberOfPages();
            const label = pdfPaperSize.replace("_", "-").toUpperCase();
            pdf.text(
              `Group Coaching Classes · Division Marks Report (${label}) · Page ${data.pageNumber} of ${totalPages}`,
              margin,
              pdfHeight - margin / 2
            );
          },
        });

        currentY = (pdf as any).lastAutoTable.finalY + (pdfPaperSize === "a1" ? 12 : 7);
      });

      const sFile = sName.replace(/\s+/g, "_");
      const dFile =
        divisionFilter === "all_separate"
          ? "Separate_Divisions_Stacked"
          : divisionFilter === "all_combined"
          ? "All_Divisions_Combined"
          : `Div-${divisionName(Number(divisionFilter.replace("single_", "")))}`;
      const paperLabel = pdfPaperSize.replace("_", "-").toUpperCase();
      const dateLabel = dateRangeLabel ? `_${dateRangeLabel.replace(/[\s\/]+/g, "_")}` : "";
      pdf.save(`${sFile}-${dFile}${dateLabel}-Marks-Report-${paperLabel}.pdf`);
      push("success", `Division Marks PDF (${paperLabel}) downloaded successfully!`);
    } catch (err) {
      console.error(err);
      push("error", "Failed to generate PDF document.");
    } finally {
      setDownloading(false);
    }
  };

  // Export as XLSX file using xlsx package with separate stacked tables and individual division tabs
  const handleExportXlsx = async () => {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // 1. Primary Stacked Worksheet with divisions stacked one above another
      const stackedRows: any[] = [];

      divisionGroups.forEach((group, gIdx) => {
        if (divisionGroups.length > 1) {
          if (gIdx > 0) {
            stackedRows.push({}); // Empty blank line
          }
          stackedRows.push({
            "S.No": `=== ${group.divisionName} (${group.roster.length} STUDENTS) ===`,
          });
        }

        group.matrix.forEach((r) => {
          const rowData: Record<string, any> = {
            "S.No": r.rowNum,
            "Roll No / Code": r.student.studentCode,
            "Student Name": r.student.fullName.toUpperCase(),
          };

          displayColumns.forEach((col, cIdx) => {
            const cv = r.colValues[cIdx];
            const keyName = `${col.title} (${col.subtitle})`;
            rowData[keyName] = cv?.value !== null ? cv.value : "—";
          });

          stackedRows.push(rowData);
        });
      });

      const wsStacked = XLSX.utils.json_to_sheet(stackedRows);
      XLSX.utils.book_append_sheet(wb, wsStacked, "Division Marks (Stacked)");

      // 2. If multiple divisions, also create separate tabs per division
      if (divisionGroups.length > 1) {
        divisionGroups.forEach((group) => {
          const divRows = group.matrix.map((r) => {
            const rowData: Record<string, any> = {
              "S.No": r.rowNum,
              "Roll No / Code": r.student.studentCode,
              "Student Name": r.student.fullName.toUpperCase(),
            };

            displayColumns.forEach((col, cIdx) => {
              const cv = r.colValues[cIdx];
              const keyName = `${col.title} (${col.subtitle})`;
              rowData[keyName] = cv?.value !== null ? cv.value : "—";
            });

            return rowData;
          });

          const wsDiv = XLSX.utils.json_to_sheet(divRows);
          const tabName = group.divisionName.slice(0, 31);
          XLSX.utils.book_append_sheet(wb, wsDiv, tabName);
        });
      }

      const sName = standardName(Number(standardId)) || "Std";
      const divFileName =
        divisionFilter === "all_separate"
          ? "Separate_Divisions_Stacked"
          : divisionFilter === "all_combined"
          ? "All_Divisions_Combined"
          : `Div_${divisionName(Number(divisionFilter.replace("single_", "")))}`;
      const dateLabel = dateRangeLabel ? `_${dateRangeLabel.replace(/[\s\/]+/g, "_")}` : "";
      XLSX.writeFile(wb, `${sName}-${divFileName}${dateLabel}-Subject-Marks.xlsx`);
      push("success", "Excel spreadsheet exported successfully with separate division tables!");
    } catch (e) {
      console.error(e);
      push("error", "Could not export XLSX spreadsheet.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Division Marks Report — Excel Sheet PDF"
      description="View and download subject-wise student marks for division(s) within a selected date range in a clean Excel PDF format."
      size="2xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <Button variant="soft" onClick={onClose}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportXlsx}>
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export XLSX
            </Button>
            <Button variant="ok" onClick={handleDownloadPdf} loading={downloading}>
              <Download className="h-4 w-4" /> Download Excel PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 w-full max-w-full">
        {/* Controls Toolbar */}
        <div className="grid gap-2.5 sm:gap-3 rounded-2xl bg-slate-100 p-3 sm:p-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 w-full items-end">
          <div>
            <label className="field-label">Standard</label>
            <Select
              value={standardId}
              onChange={(e) => {
                setStandardId(e.target.value);
                setDivisionFilter("all_separate");
                setSelectedExamId("all");
              }}
            >
              {standards.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          {is11or12 ? (
            <div>
              <label className="field-label">Stream</label>
              <Select value={stream} onChange={(e) => setStream(e.target.value)}>
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
              </Select>
            </div>
          ) : null}

          <div>
            <label className="field-label">Division Display</label>
            <Select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)}>
              {divisions.length > 1 && (
                <option value="all_separate">Separate Tables (Stacked)</option>
              )}
              <option value="all_combined">All Divisions (Combined Table)</option>
              {divisions.map((d) => (
                <option key={d.id} value={`single_${d.id}`}>
                  Division {d.name} Only
                </option>
              ))}
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="field-label">From Date</label>
              {startDate && (
                <button
                  type="button"
                  onClick={() => setStartDate("")}
                  className="text-[10px] text-red-600 hover:underline font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white text-xs h-9"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="field-label">To Date</label>
              {endDate && (
                <button
                  type="button"
                  onClick={() => setEndDate("")}
                  className="text-[10px] text-red-600 hover:underline font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white text-xs h-9"
            />
          </div>

          <div>
            <label className="field-label">Exam Filter</label>
            <Select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
              <option value="all">All Exams in Range ({sortedExams.length})</option>
              {sortedExams.map((e) => {
                const sub = e.subjectId ? state.subjects.find((s) => s.id === e.subjectId) : null;
                return (
                  <option key={e.id} value={e.id}>
                    {e.name}{sub ? ` (${sub.name})` : ""} ({formatDate(e.examDate)})
                  </option>
                );
              })}
            </Select>
          </div>

          <div>
            <label className="field-label">Report Layout</label>
            <Select value={viewMode} onChange={(e) => setViewMode(e.target.value as any)}>
              <option value="subject_grouped">Exams by Subject (Organized)</option>
              <option value="subject_wise">Subject Totals (Summary)</option>
              <option value="exam_subject">Chronological Detailed</option>
              <option value="exam_summary">Exam Totals Only</option>
            </Select>
          </div>

          <div>
            <label className="field-label">PDF Paper Size</label>
            <Select value={pdfPaperSize} onChange={(e) => setPdfPaperSize(e.target.value as any)}>
              <option value="a4_portrait">A4 Portrait (210 × 297 mm)</option>
              <option value="a4_landscape">A4 Landscape (297 × 210 mm)</option>
              <option value="letter">US Letter Portrait (216 × 279 mm)</option>
              <option value="a3">A3 Landscape (Wide)</option>
              <option value="a1">A1 Poster Format</option>
            </Select>
          </div>
        </div>

        {/* Division Selection Pills when in Separate Stacked mode */}
        {divisionFilter === "all_separate" && divisions.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
            <span className="font-semibold text-slate-700">Display Divisions:</span>
            {divisions.map((d) => {
              const isChecked = selectedDivisionIds.includes(d.id);
              return (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => {
                    if (isChecked) {
                      if (selectedDivisionIds.length > 1) {
                        setSelectedDivisionIds((prev) => prev.filter((id) => id !== d.id));
                      } else {
                        push("warning", "At least one division must be selected.");
                      }
                    } else {
                      setSelectedDivisionIds((prev) => [...prev, d.id]);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isChecked
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isChecked ? "bg-emerald-400" : "bg-slate-300"}`} />
                  Division {d.name}
                </button>
              );
            })}
            <span className="text-[11px] text-slate-500 ml-auto italic">
              {selectedDivisionIds.length === 2 ? "2 divisions stacked" : `${selectedDivisionIds.length} divisions stacked`}
            </span>
          </div>
        )}

        {/* Date Filter Badge Indicator */}
        {(startDate || endDate) && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2 text-xs text-blue-900">
            <span className="font-medium">
              Filtered Date Range: <strong className="font-bold">{dateRangeLabel}</strong> ({sortedExams.length} {sortedExams.length === 1 ? "exam" : "exams"} found)
            </span>
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline ml-2"
            >
              Reset Date Range
            </button>
          </div>
        )}

        {/* Excel Spreadsheet Preview Container */}
        <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm p-1.5 sm:p-3">
          <div id="division-marks-excel-sheet" className="min-w-[650px] sm:min-w-[800px] w-full bg-white p-3 sm:p-6 text-black font-sans">
            {/* Header Title Section for Print/PDF */}
            <div className="mb-6 flex flex-col items-center justify-center text-center border-b-2 border-black pb-4 text-black">
              <img src={GCC_LOGO_DATA_URL} alt="Group Coaching Classes Logo" className="h-24 w-24 object-contain mb-5 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-black tracking-wide uppercase text-black text-center">
                DIVISION MARKS REPORT — {currentSelectedExam ? `${currentSelectedExam.name.toUpperCase()}${currentExamSubject ? ` (${currentExamSubject.name.toUpperCase()})` : ""}` : dateRangeLabel ? `SUBJECT-WISE (${dateRangeLabel.toUpperCase()})` : "SUBJECT-WISE"}
              </h2>
              <p className="text-base sm:text-lg font-bold text-slate-900 tracking-wide mt-1 text-center">
                {subheaderText}
                {activeSubjectName ? ` · Subject: ${activeSubjectName}` : ""}
                {dateRangeLabel ? ` · Date Range: ${dateRangeLabel}` : ""}
              </p>
              <div className="flex items-center justify-between w-full max-w-3xl text-xs sm:text-sm font-semibold text-black px-2 mt-3 pt-2 border-t border-slate-300">
                <div>Date: {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
                <div>Total Students: {totalStudents}</div>
              </div>
            </div>

            {/* Render Each Division Table Stacked Separately One Above Another */}
            {!divisionGroups.length || totalStudents === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 italic">
                No active students found for the selected Standard and Division(s).
              </div>
            ) : !displayColumns.length ? (
              <div className="p-8 text-center text-sm text-slate-500 italic">
                No subject or exam records found for this selection.
              </div>
            ) : (
              <div className="space-y-6">
                {divisionGroups.map((group, gIdx) => (
                  <div key={group.divisionId ?? gIdx} className="space-y-2">
                    {divisionGroups.length > 1 && (
                      <div className="flex items-center justify-between bg-slate-100 border border-black px-3.5 py-2 text-xs font-black text-black uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 bg-black" />
                          <span>{group.divisionName}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">
                          {group.roster.length} {group.roster.length === 1 ? "Student" : "Students"}
                        </span>
                      </div>
                    )}

                    {!group.roster.length ? (
                      <div className="p-4 border border-dashed border-slate-300 text-center text-xs text-slate-500 italic">
                        No active students found in {group.divisionName}.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-black text-xs text-black font-sans">
                          <thead>
                            {/* Header Row 1: SUBJECT / Subject Names */}
                            <tr className="bg-white">
                              <th className="border border-black px-2 py-1.5 text-center font-bold text-black w-10"></th>
                              <th className="border border-black px-3 py-1.5 text-left font-bold text-black min-w-[220px]"></th>
                              {displayColumns.map((col) => (
                                <th
                                  key={col.id}
                                  className="border border-black px-3 py-1.5 text-center font-bold text-black uppercase tracking-wider min-w-[95px]"
                                >
                                  {col.title}
                                </th>
                              ))}
                            </tr>

                            {/* Header Row 2: Name / DATE / Subtitle */}
                            <tr className="bg-white">
                              <th className="border border-black px-2 py-1.5 text-center font-bold text-black">#</th>
                              <th className="border border-black px-3 py-1.5 text-left font-bold text-black text-sm">
                                Name
                              </th>
                              {displayColumns.map((col) => (
                                <th
                                  key={col.id}
                                  className="border border-black px-3 py-1.5 text-center font-bold text-black uppercase tracking-wider"
                                >
                                  {col.subtitle}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          {/* Student Marks Rows */}
                          <tbody>
                            {group.matrix.map((row) => (
                              <tr key={row.student.id} className="bg-white hover:bg-slate-50">
                                <td className="border border-black px-2 py-1.5 text-center font-bold text-black">
                                  {row.rowNum}
                                </td>
                                <td className="border border-black px-3 py-1.5 font-bold text-black uppercase tracking-wide">
                                  {row.student.fullName.toUpperCase()}
                                </td>

                                {/* Subject Marks Columns */}
                                {row.colValues.map((cv, idx) => (
                                  <td key={idx} className="border border-black px-3 py-2 text-center text-sm font-bold text-black tracking-wide">
                                    {cv.value !== null ? cv.value : "—"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer stamp */}
            <div className="mt-4 flex items-center justify-between text-[11px] text-black border-t border-black pt-2 font-semibold">
              <div>Excel Sheet Report · Subject-Wise Division Marks</div>
              <div>Generated by School Management System</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
