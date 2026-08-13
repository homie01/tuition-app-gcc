"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Printer, Table, X } from "lucide-react";
import { Button, Modal, Select, useToast } from "@/components/ui";
import { formatDate, pct } from "@/lib/utils";
import { gradeFor } from "@/lib/grading";
import { useDemo } from "@/lib/demo/store";

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
}

export function DivisionMarksExcelModal({
  open,
  onClose,
  defaultStandardId = "",
  defaultDivisionId = "",
  defaultStream = "Science",
}: DivisionMarksExcelModalProps) {
  const { push } = useToast();
  const { state, visibleStandards, standardName, divisionName, getSubjectsForStandard } = useDemo();

  const standards = visibleStandards();
  const [standardId, setStandardId] = React.useState(defaultStandardId || (standards[0] ? String(standards[0].id) : ""));
  const [divisionId, setDivisionId] = React.useState(defaultDivisionId);
  const [stream, setStream] = React.useState(defaultStream);
  const [selectedExamId, setSelectedExamId] = React.useState<string>("all");
  const [viewMode, setViewMode] = React.useState<"subject_wise" | "exam_subject" | "exam_summary">("subject_wise");
  const [pdfPaperSize, setPdfPaperSize] = React.useState<"a4_portrait" | "a4_landscape" | "letter" | "a3" | "a1">("a4_portrait");
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (defaultStandardId) setStandardId(defaultStandardId);
      if (defaultDivisionId) setDivisionId(defaultDivisionId);
      if (defaultStream) setStream(defaultStream);
    }
  }, [open, defaultStandardId, defaultDivisionId, defaultStream]);

  const selectedStd = standards.find((s) => String(s.id) === standardId);
  const is11or12 = Boolean(
    selectedStd && (selectedStd.name.toLowerCase().includes("11") || selectedStd.name.toLowerCase().includes("12"))
  );

  const rawStdName = standardName(Number(standardId)) || "";
  const stdClean = rawStdName.replace(/^(standard|std)\s+/i, "").trim() || rawStdName || "";
  const divNameStr = divisionId ? divisionName(Number(divisionId)) : "";
  const divLabel = divNameStr ? `${stdClean}-${divNameStr}` : `${stdClean} (All Divisions)`;
  const streamLabel = is11or12 ? ` (${stream})` : "";
  const subheaderText = `Standard: ${divLabel}${streamLabel}`;

  const divisions = state.divisions.filter((d) => String(d.standardId) === standardId);

  // Active students in division
  const roster = React.useMemo(() => {
    if (!standardId) return [];
    return state.students
      .filter((s) => {
        if (String(s.standardId) !== standardId) return false;
        if (s.status !== "active") return false;
        if (divisionId && String(s.divisionId) !== divisionId) return false;
        if (is11or12 && (s.stream ?? "Science") !== stream) return false;
        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [state.students, standardId, divisionId, is11or12, stream]);

  // Exams for this standard sorted chronologically by date
  const sortedExams = React.useMemo(() => {
    if (!standardId) return [];
    const exams = state.exams.filter((e) => String(e.standardId) === standardId);
    return exams.sort((a, b) => a.examDate.localeCompare(b.examDate));
  }, [state.exams, standardId]);

  // Subjects for this standard/stream
  const subjects = React.useMemo(() => {
    return getSubjectsForStandard(standardId, is11or12 ? stream : undefined);
  }, [getSubjectsForStandard, standardId, is11or12, stream]);

  // Columns to display based on viewMode and selectedExamId
  const displayColumns = React.useMemo(() => {
    if (viewMode === "subject_wise") {
      if (selectedExamId !== "all") {
        const exam = sortedExams.find((e) => String(e.id) === selectedExamId);
        return subjects.map((sub) => ({
          id: `${selectedExamId}-${sub.id}`,
          subjectId: sub.id,
          examId: exam ? exam.id : undefined,
          title: sub.name.toUpperCase(),
          subtitle: exam ? formatDate(exam.examDate) : "DATE",
        }));
      } else {
        return subjects.map((sub) => ({
          id: `all-${sub.id}`,
          subjectId: sub.id,
          examId: undefined,
          title: sub.name.toUpperCase(),
          subtitle: sortedExams.length > 1 ? `${sortedExams.length} EXAMS` : "MARKS",
        }));
      }
    } else if (viewMode === "exam_subject") {
      const cols: Array<{ id: string; subjectId: number; examId: number; title: string; subtitle: string }> = [];
      const examsToUse = selectedExamId === "all" ? sortedExams : sortedExams.filter((e) => String(e.id) === selectedExamId);
      for (const exam of examsToUse) {
        for (const sub of subjects) {
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
      const examsToUse = selectedExamId === "all" ? sortedExams : sortedExams.filter((e) => String(e.id) === selectedExamId);
      return examsToUse.map((exam) => ({
        id: `exam-${exam.id}`,
        subjectId: undefined,
        examId: exam.id,
        title: exam.name.toUpperCase(),
        subtitle: formatDate(exam.examDate),
      }));
    }
  }, [viewMode, selectedExamId, sortedExams, subjects]);

  // Pre-calculate student marks matrix
  const matrix = React.useMemo(() => {
    return roster.map((student, idx) => {
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
  }, [roster, state.marks, sortedExams, displayColumns, state.settings?.gradeBands]);

  // Calculate column totals/averages for formula row
  const columnAverages = React.useMemo(() => {
    if (!matrix.length) return { cols: [], grandPct: 0 };

    const cols = displayColumns.map((col, cIdx) => {
      const validRows = matrix.filter((r) => r.colValues[cIdx]?.value !== null);
      if (!validRows.length) return { obtainedAvg: 0 };
      const sumObtained = validRows.reduce((a, b) => a + (b.colValues[cIdx]?.value || 0), 0);
      return {
        obtainedAvg: Math.round((sumObtained / validRows.length) * 10) / 10,
      };
    });

    const sumOverallPct = matrix.reduce((a, b) => a + b.overallPct, 0);
    return {
      cols,
      grandPct: Math.round((sumOverallPct / matrix.length) * 10) / 10,
    };
  }, [matrix, displayColumns]);

  // Generate Excel PDF using jspdf-autotable for pixel-perfect vector tables
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
      const dName = divisionId ? `Division ${divisionName(Number(divisionId))}` : "All Divisions";
      const strName = is11or12 ? ` (${stream})` : "";
      const examTitle =
        selectedExamId !== "all"
          ? sortedExams.find((e) => String(e.id) === selectedExamId)?.name.toUpperCase()
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

      // Centered Subtitle Paragraph
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(subFontSize);
      pdf.setTextColor(20, 20, 20);
      pdf.text(subheaderText, pdfWidth / 2, currentY, { align: "center" });
      currentY += (pdfPaperSize === "a1" ? 8 : 4.5);

      // Metadata Info Line
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(metaFontSize);
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        `Date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}   ·   Total Students: ${roster.length}`,
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

      // Construct autoTable Header & Body
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

      const body = matrix.map((row) => [
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
          fontStyle: "bold", // BOLD VISIBLE MARKS!
          lineColor: [0, 0, 0],
          lineWidth: pdfPaperSize === "a1" ? 0.3 : 0.2,
        },
        columnStyles: columnStylesObj,
        margin: { top: currentY, left: margin, right: margin, bottom: margin + 2 },
        didDrawPage: (data) => {
          pdf.setFontSize(pdfPaperSize === "a1" ? 11 : 8.5);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          const totalPages = (pdf as any).internal.getNumberOfPages();
          const label = pdfPaperSize.replace("_", "-").toUpperCase();
          pdf.text(
            `Group Coaching Classes · Division Marks Report (${label}) · Page ${data.pageNumber} of ${totalPages}`,
            margin,
            pdfHeight - (margin / 2)
          );
        },
      });

      const sFile = sName.replace(/\s+/g, "_");
      const dFile = divisionId ? `Div-${divisionName(Number(divisionId))}` : "All-Divs";
      const paperLabel = pdfPaperSize.replace("_", "-").toUpperCase();
      pdf.save(`${sFile}-${dFile}-Marks-Report-${paperLabel}.pdf`);
      push("success", `Division Marks PDF (${paperLabel}) downloaded successfully!`);
    } catch (err) {
      console.error(err);
      push("error", "Failed to generate PDF document.");
    } finally {
      setDownloading(false);
    }
  };

  // Export as XLSX file using xlsx package
  const handleExportXlsx = async () => {
    try {
      const XLSX = await import("xlsx");
      const rows = matrix.map((r) => {
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

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Division Marks");

      const sName = standardName(Number(standardId)) || "Std";
      const dName = divisionId ? `Div-${divisionName(Number(divisionId))}` : "All-Divs";
      XLSX.writeFile(wb, `${sName}-${dName}-Subject-Marks.xlsx`);
      push("success", "Excel spreadsheet exported successfully!");
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
      description="View and download subject-wise student marks for the division in a clean Excel PDF format."
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
        <div className="grid gap-2.5 sm:gap-3 rounded-2xl bg-slate-100 p-3 sm:p-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full">
          <div>
            <label className="field-label">Standard</label>
            <Select
              value={standardId}
              onChange={(e) => {
                setStandardId(e.target.value);
                setDivisionId("");
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
            <label className="field-label">Division</label>
            <Select value={divisionId} onChange={(e) => setDivisionId(e.target.value)}>
              <option value="">All Divisions</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  Division {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="field-label">Exam</label>
            <Select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
              <option value="all">All Exams</option>
              {sortedExams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({formatDate(e.examDate)})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="field-label">Report Layout</label>
            <Select value={viewMode} onChange={(e) => setViewMode(e.target.value as "subject_wise" | "exam_subject" | "exam_summary")}>
              <option value="subject_wise">Subject-Wise Marks</option>
              <option value="exam_subject">Exam & Subject Detailed</option>
              <option value="exam_summary">Exam Totals Only</option>
            </Select>
          </div>

          <div>
            <label className="field-label">PDF Size</label>
            <Select value={pdfPaperSize} onChange={(e) => setPdfPaperSize(e.target.value as any)}>
              <option value="a4_portrait">A4 Portrait (210 × 297 mm)</option>
              <option value="a4_landscape">A4 Landscape (297 × 210 mm)</option>
              <option value="letter">US Letter Portrait (216 × 279 mm)</option>
              <option value="a3">A3 Landscape (Wide)</option>
              <option value="a1">A1 Poster Format</option>
            </Select>
          </div>
        </div>

        {/* Excel Spreadsheet Preview Container */}
        <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm p-1.5 sm:p-3">
          <div id="division-marks-excel-sheet" className="min-w-[650px] sm:min-w-[800px] w-full bg-white p-3 sm:p-6 text-black font-sans">
            {/* Header Title Section for Print/PDF */}
            <div className="mb-6 flex flex-col items-center justify-center text-center border-b-2 border-black pb-4 text-black">
              <img src={GCC_LOGO_DATA_URL} alt="Group Coaching Classes Logo" className="h-24 w-24 object-contain mb-5 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-black tracking-wide uppercase text-black text-center">
                DIVISION MARKS REPORT — {selectedExamId !== "all" ? sortedExams.find(e => String(e.id) === selectedExamId)?.name.toUpperCase() : "SUBJECT-WISE"}
              </h2>
              <p className="text-base sm:text-lg font-bold text-slate-900 tracking-wide mt-1 text-center">
                {subheaderText}
              </p>
              <div className="flex items-center justify-between w-full max-w-3xl text-xs sm:text-sm font-semibold text-black px-2 mt-3 pt-2 border-t border-slate-300">
                <div>Date: {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
                <div>Total Students: {roster.length}</div>
              </div>
            </div>

            {/* Authentic Exact Excel Grid Table matching uploaded image */}
            {!roster.length ? (
              <div className="p-8 text-center text-sm text-slate-500 italic">
                No active students found for the selected Standard and Division.
              </div>
            ) : !displayColumns.length ? (
              <div className="p-8 text-center text-sm text-slate-500 italic">
                No subject or exam records found for this selection.
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
                    {matrix.map((row) => (
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
