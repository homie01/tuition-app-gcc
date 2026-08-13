"use client";

import * as React from "react";
import { useRouter } from "@/lib/next-compat";
import {
  Download,
  Printer,
  Share2,
  Trophy,
  Award,
  Sparkles,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Building2,
  FileSpreadsheet,
  Palette,
  MessageSquare,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader, Select, useToast } from "@/components/ui";
import { formatDate, pct } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";

type Props = {
  settings: { tuitionName: string; logoText: string; address: string; phone: string; email: string };
  student: {
    id: number;
    studentCode: string;
    fullName: string;
    fatherName: string | null;
    standard: string;
    division: string;
    shift: string;
    rollNumber: string | null;
    stream?: string | null;
  };
  exams: { examId: number; name: string; date: string }[];
  selected: {
    examId: number;
    name: string;
    examDate: string;
    resultDate: string | null;
    totalObtained: number;
    totalMax: number;
    percentage: number;
    grade: string;
    rank: number | null;
    resultStatus: string;
  } | null;
  previous: { name: string; percentage: number; grade: string } | null;
  subjects: { subject: string; obtained: number; max: number }[];
  attendanceSummary: { total: number; present: number; absent: number; late?: number; leave?: number };
  classAverage?: number;
};

export type TemplateId = "modern" | "classic" | "dashboard" | "minimal" | "creative";

export default function ResultDocument(props: Props) {
  const { settings, student, selected, previous, subjects, attendanceSummary, classAverage = 0 } = props;
  const router = useRouter();
  const { push } = useToast();

  const [activeTemplate, setActiveTemplate] = React.useState<TemplateId>("modern");
  const [downloading, setDownloading] = React.useState(false);
  const [teacherRemark, setTeacherRemark] = React.useState(
    selected?.percentage && selected.percentage >= 80
      ? "Outstanding performance! Shows deep subject understanding and consistent effort."
      : selected?.percentage && selected.percentage >= 60
      ? "Good progress. With steady practice in key subjects, results can improve even further."
      : "Needs focused attention in weaker subjects. Regular class attendance is recommended."
  );

  // Customization Toggles
  const [showGraph, setShowGraph] = React.useState(true);
  const [showAttendance, setShowAttendance] = React.useState(true);
  const [showRemark, setShowRemark] = React.useState(true);
  const [showStamp, setShowStamp] = React.useState(true);

  const attPct = pct(attendanceSummary.present, attendanceSummary.total);

  async function downloadPdf() {
    if (!selected) return;
    setDownloading(true);
    try {
      const element = document.getElementById("result-report-card");
      if (!element) throw new Error("Report element not found");

      const { default: jsPDF } = await import("jspdf");
      let imgData = "";

      // Attempt 1: html-to-image (uses native browser rendering, handles oklab/oklch/CSS variables natively)
      try {
        const { toPng } = await import("html-to-image");
        imgData = await toPng(element, {
          quality: 0.95,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
          skipFonts: true,
        });
      } catch (err1) {
        console.warn("html-to-image failed, trying html2canvas fallback:", err1);
        // Attempt 2: html2canvas fallback with style sanitization
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            const styleElements = clonedDoc.querySelectorAll("style");
            styleElements.forEach((style) => {
              if (style.textContent) {
                style.textContent = style.textContent
                  .replace(/oklab\([^)]+\)/gi, "#2563eb")
                  .replace(/oklch\([^)]+\)/gi, "#2563eb");
              }
            });
          },
        });
        imgData = canvas.toDataURL("image/png");
      }

      if (!imgData || !imgData.startsWith("data:image")) {
        throw new Error("Failed to render card image");
      }

      // Create HTML image element to read natural dimensions accurately
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = img.naturalWidth || 800;
      const imgHeight = img.naturalHeight || 1100;
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

      if (pdfHeight > pdfPageHeight) {
        // Multi-page PDF if content is very tall
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdfPageHeight;

        while (heightLeft > 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pdfPageHeight;
        }
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`${student.studentCode}-${selected.name.replace(/\s+/g, "-")}-${activeTemplate}-result.pdf`);
      push("success", "Result PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      push("error", "Direct PDF download failed. Opening browser print/PDF preview...");
      window.print();
    } finally {
      setDownloading(false);
    }
  }

  const templatesList: { id: TemplateId; name: string; desc: string; icon: React.ReactNode }[] = [
    { id: "modern", name: "Modern Infographic", desc: "Sleek banner with visual progress bars & attendance ring", icon: <Sparkles className="h-4 w-4 text-[#2563eb]" /> },
    { id: "classic", name: "Classic Academic", desc: "Formal border framing with calligraphic seal & stamp", icon: <Award className="h-4 w-4 text-[#d97706]" /> },
    { id: "dashboard", name: "Executive Dashboard", desc: "Interactive charts, class metrics & comparative analytics", icon: <BarChart3 className="h-4 w-4 text-[#7c3aed]" /> },
    { id: "minimal", name: "Minimalist Ink Saver", desc: "Clean high-contrast layout optimized for fast printing", icon: <FileSpreadsheet className="h-4 w-4 text-[#059669]" /> },
    { id: "creative", name: "Vibrant Progress Card", desc: "Colorful subject grid cards with teacher remark notes", icon: <Palette className="h-4 w-4 text-[#ec4899]" /> },
  ];

  return (
    <div>
      <PageHeader
        title="Student Result Report"
        subtitle="Preview and export multi-template student result cards with graphs & attendance."
        breadcrumb={[
          { label: "Students", href: "/students" },
          { label: student.fullName, href: `/students/${student.id}` },
          { label: "Result" },
        ]}
        actions={
          <>
            {props.exams.length > 1 ? (
              <Select
                className="w-52"
                value={selected?.examId ?? ""}
                onChange={(e) => router.push(`/students/${student.id}/result?examId=${e.target.value}`)}
              >
                {props.exams.map((x) => (
                  <option key={x.examId} value={x.examId}>{x.name}</option>
                ))}
              </Select>
            ) : null}
            <Button variant="soft" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button onClick={downloadPdf} loading={downloading} disabled={!selected}>
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </>
        }
      />

      {/* Design Template Selector & Options Toolbar */}
      {selected ? (
        <Card className="mb-6 p-4 print:hidden">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-[#2563eb]" />
                <h3 className="text-sm font-bold text-slate-800">Choose PDF Design Template (5 Styles)</h3>
              </div>
              <span className="text-[12px] font-medium text-slate-500">
                Active: <strong className="capitalize text-slate-900">{activeTemplate}</strong>
              </span>
            </div>

            {/* Template Buttons */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {templatesList.map((tmpl) => {
                const isActive = activeTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setActiveTemplate(tmpl.id)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                      isActive
                        ? "border-[#2563eb] bg-[#eff6ff] shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center gap-2 font-semibold text-slate-900 text-[13px]">
                      {tmpl.icon}
                      {tmpl.name}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{tmpl.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Customization Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-3 text-xs">
              <div className="flex flex-wrap items-center gap-4 text-slate-700">
                <span className="font-semibold text-slate-900">Include:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showGraph} onChange={(e) => setShowGraph(e.target.checked)} className="rounded text-[#2563eb]" />
                  Visual Graphs
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showAttendance} onChange={(e) => setShowAttendance(e.target.checked)} className="rounded text-[#2563eb]" />
                  Class Attendance
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showRemark} onChange={(e) => setShowRemark(e.target.checked)} className="rounded text-[#2563eb]" />
                  Teacher Remark
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showStamp} onChange={(e) => setShowStamp(e.target.checked)} className="rounded text-[#2563eb]" />
                  Official Seal/Stamp
                </label>
              </div>

              {showRemark && (
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <MessageSquare className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={teacherRemark}
                    onChange={(e) => setTeacherRemark(e.target.value)}
                    placeholder="Teacher comment / remark..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-[#2563eb] focus:outline-none sm:w-80"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      {!selected ? (
        <Card>
          <EmptyState
            icon={<Share2 className="h-6 w-6" />}
            title="No result available yet"
            message="Enter marks for an exam and generate the result to create a report for this student."
          />
        </Card>
      ) : (
        /* Printable & PDF Element Container */
        <div id="result-report-card" className="bg-white p-1">
          {activeTemplate === "modern" && (
            <ModernTemplate
              settings={settings}
              student={student}
              selected={selected}
              previous={previous}
              subjects={subjects}
              attendanceSummary={attendanceSummary}
              attPct={attPct}
              classAverage={classAverage}
              showGraph={showGraph}
              showAttendance={showAttendance}
              showRemark={showRemark}
              showStamp={showStamp}
              teacherRemark={teacherRemark}
            />
          )}

          {activeTemplate === "classic" && (
            <ClassicTemplate
              settings={settings}
              student={student}
              selected={selected}
              previous={previous}
              subjects={subjects}
              attendanceSummary={attendanceSummary}
              attPct={attPct}
              classAverage={classAverage}
              showGraph={showGraph}
              showAttendance={showAttendance}
              showRemark={showRemark}
              showStamp={showStamp}
              teacherRemark={teacherRemark}
            />
          )}

          {activeTemplate === "dashboard" && (
            <DashboardTemplate
              settings={settings}
              student={student}
              selected={selected}
              previous={previous}
              subjects={subjects}
              attendanceSummary={attendanceSummary}
              attPct={attPct}
              classAverage={classAverage}
              showGraph={showGraph}
              showAttendance={showAttendance}
              showRemark={showRemark}
              showStamp={showStamp}
              teacherRemark={teacherRemark}
            />
          )}

          {activeTemplate === "minimal" && (
            <MinimalTemplate
              settings={settings}
              student={student}
              selected={selected}
              previous={previous}
              subjects={subjects}
              attendanceSummary={attendanceSummary}
              attPct={attPct}
              classAverage={classAverage}
              showGraph={showGraph}
              showAttendance={showAttendance}
              showRemark={showRemark}
              showStamp={showStamp}
              teacherRemark={teacherRemark}
            />
          )}

          {activeTemplate === "creative" && (
            <CreativeTemplate
              settings={settings}
              student={student}
              selected={selected}
              previous={previous}
              subjects={subjects}
              attendanceSummary={attendanceSummary}
              attPct={attPct}
              classAverage={classAverage}
              showGraph={showGraph}
              showAttendance={showAttendance}
              showRemark={showRemark}
              showStamp={showStamp}
              teacherRemark={teacherRemark}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* SHARED HELPER TYPES & COMPONENTS                                           */
/* ========================================================================= */

type RenderProps = {
  settings: Props["settings"];
  student: Props["student"];
  selected: NonNullable<Props["selected"]>;
  previous: Props["previous"];
  subjects: Props["subjects"];
  attendanceSummary: Props["attendanceSummary"];
  attPct: number;
  classAverage: number;
  showGraph: boolean;
  showAttendance: boolean;
  showRemark: boolean;
  showStamp: boolean;
  teacherRemark: string;
};

/* ========================================================================= */
/* TEMPLATE 1: MODERN INFOGRAPHIC                                            */
/* ========================================================================= */
function ModernTemplate(p: RenderProps) {
  const { settings, student, selected, subjects, attendanceSummary, attPct, showGraph, showAttendance, showRemark, showStamp, teacherRemark } = p;

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-md">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-6 text-white sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#2563eb] text-xl font-bold shadow-md">
              {settings.logoText}
            </span>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">{settings.tuitionName}</h2>
              <p className="text-[12.5px] text-slate-300">{settings.address}</p>
              <p className="text-[12px] text-slate-400">
                {settings.phone} {settings.email ? `• ${settings.email}` : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block rounded-xl bg-white/10 px-3.5 py-1.5 text-right backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-wider text-slate-300">Exam Report Card</p>
              <p className="text-base font-bold text-white">{selected.name}</p>
              <p className="text-[11px] text-indigo-200">{formatDate(selected.examDate)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Student Credentials Grid */}
        <div className="mb-6 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3 lg:grid-cols-6 border border-slate-200/80">
          <InfoItem label="Student Name" value={student.fullName} bold />
          <InfoItem label="Father Name" value={student.fatherName || "—"} />
          <InfoItem label="Student Code" value={student.studentCode} />
          <InfoItem label="Class & Div" value={`${student.standard} - Div ${student.division}`} />
          {student.stream ? <InfoItem label="Stream" value={student.stream} /> : <InfoItem label="Shift" value={student.shift} />}
          <InfoItem label="Roll Number" value={student.rollNumber || "N/A"} />
        </div>

        {/* Key KPI Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <BoxStat label="Total Obtained" value={`${selected.totalObtained} / ${selected.totalMax}`} tone="#1E293B" />
          <BoxStat label="Overall Percentage" value={`${selected.percentage.toFixed(2)}%`} tone="#2563EB" />
          <BoxStat label="Grade & Status" value={`${selected.grade} (${selected.resultStatus.toUpperCase()})`} tone={selected.resultStatus === "pass" ? "#16A34A" : "#DC2626"} />
          <BoxStat label="Class Rank" value={selected.rank ? `#${selected.rank}` : "—"} tone="#7C3AED" />
        </div>

        {/* Visual Progress Bar Chart per subject */}
        {showGraph && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-[#2563eb]" /> Subject Performance Breakdown
            </h4>
            <div className="space-y-3">
              {subjects.map((s) => {
                const scorePct = pct(s.obtained, s.max);
                const barColor = scorePct >= 80 ? "bg-emerald-500" : scorePct >= 60 ? "bg-blue-600" : scorePct >= 40 ? "bg-amber-500" : "bg-red-500";
                return (
                  <div key={s.subject}>
                    <div className="mb-1 flex justify-between text-xs font-semibold text-slate-800">
                      <span>{s.subject}</span>
                      <span>{s.obtained} / {s.max} ({scorePct}%)</span>
                    </div>
                    <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${scorePct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Marksheet Table */}
        <div className="mb-6 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e293b] text-white text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 text-right font-semibold">Obtained</th>
                <th className="px-4 py-3 text-right font-semibold">Max Marks</th>
                <th className="px-4 py-3 text-right font-semibold">Percentage</th>
                <th className="px-4 py-3 text-center font-semibold">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {subjects.map((s) => {
                const p = pct(s.obtained, s.max);
                const g = p >= 80 ? "A+" : p >= 70 ? "A" : p >= 60 ? "B" : p >= 40 ? "C" : "F";
                return (
                  <tr key={s.subject} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{s.subject}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{s.obtained}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{s.max}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#2563eb]">{p}%</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${g === "A+" || g === "A" ? "bg-emerald-100 text-emerald-800" : g === "F" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                        {g}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
              <tr>
                <td className="px-4 py-3">TOTAL AGGREGATE</td>
                <td className="px-4 py-3 text-right">{selected.totalObtained}</td>
                <td className="px-4 py-3 text-right">{selected.totalMax}</td>
                <td className="px-4 py-3 text-right text-[#2563eb]">{selected.percentage.toFixed(2)}%</td>
                <td className="px-4 py-3 text-center">{selected.grade}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Integrated Class Attendance Widget */}
        {showAttendance && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50/50 to-slate-50 p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CalendarCheck className="h-4 w-4 text-[#2563eb]" /> Student Class Attendance Summary
            </h4>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SvgCircularGauge percent={attPct} />
                <div>
                  <p className="text-xl font-bold text-slate-900">{attPct}% Attendance</p>
                  <p className="text-xs text-slate-500">
                    {attendanceSummary.present} days present out of {attendanceSummary.total} total academic days
                  </p>
                  <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${attPct >= 80 ? "bg-emerald-100 text-emerald-800" : attPct >= 65 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                    {attPct >= 80 ? "Excellent Regularity" : attPct >= 65 ? "Average Attendance" : "Low Attendance Warning"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-200/60">
                  <p className="text-base font-bold text-slate-800">{attendanceSummary.total}</p>
                  <p className="text-[10px] text-slate-500">Total Classes</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-2.5 shadow-sm border border-emerald-200/60">
                  <p className="text-base font-bold text-emerald-700">{attendanceSummary.present}</p>
                  <p className="text-[10px] text-emerald-600">Present</p>
                </div>
                <div className="rounded-xl bg-red-50 p-2.5 shadow-sm border border-red-200/60">
                  <p className="text-base font-bold text-red-700">{attendanceSummary.absent}</p>
                  <p className="text-[10px] text-red-600">Absent</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teacher Remark Banner */}
        {showRemark && teacherRemark && (
          <div className="mb-6 rounded-xl bg-amber-50/80 border border-amber-200/80 p-4 text-xs text-amber-900 flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Teacher Remarks & Conduct Assessment:</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">{teacherRemark}</p>
            </div>
          </div>
        )}

        {/* Footer & Signature Stamp */}
        <FooterStamp p={p} />
      </div>
    </Card>
  );
}

/* ========================================================================= */
/* TEMPLATE 2: CLASSIC ACADEMIC CERTIFICATE                                  */
/* ========================================================================= */
function ClassicTemplate(p: RenderProps) {
  const { settings, student, selected, subjects, attendanceSummary, attPct, showAttendance, showRemark, showStamp, teacherRemark } = p;

  return (
    <div className="rounded-2xl border-4 border-amber-700/80 bg-[#fffdfa] p-3 shadow-lg">
      <div className="rounded-xl border-2 border-slate-800 p-6 sm:p-8">
        {/* Calligraphic Header */}
        <div className="text-center border-b-2 border-slate-800 pb-5 mb-6">
          <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full bg-[#1e293b] text-white text-xl font-serif font-bold shadow">
            {settings.logoText}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide text-slate-900 uppercase">
            {settings.tuitionName}
          </h1>
          <p className="text-xs text-slate-600 font-serif italic">{settings.address} • Tel: {settings.phone}</p>
          <div className="mt-3 inline-block bg-slate-900 px-6 py-1 text-white text-xs uppercase font-serif tracking-widest rounded-sm">
            OFFICIAL STATEMENT OF MARKS
          </div>
        </div>

        {/* Student Credential Grid */}
        <div className="mb-6 grid grid-cols-2 gap-y-2 gap-x-6 text-xs text-slate-800 border-b border-slate-300 pb-5 font-serif">
          <div><strong className="text-slate-900 uppercase">Student Name:</strong> {student.fullName}</div>
          <div><strong className="text-slate-900 uppercase">Father Name:</strong> {student.fatherName || "—"}</div>
          <div><strong className="text-slate-900 uppercase">Student Reg ID:</strong> {student.studentCode}</div>
          <div><strong className="text-slate-900 uppercase">Class & Div:</strong> {student.standard} - {student.division}</div>
          <div><strong className="text-slate-900 uppercase">Examination:</strong> {selected.name} ({formatDate(selected.examDate)})</div>
          <div><strong className="text-slate-900 uppercase">Stream / Shift:</strong> {student.stream || student.shift}</div>
        </div>

        {/* Formal Marksheet Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-left text-xs font-serif border-collapse border border-slate-800">
            <thead>
              <tr className="bg-slate-800 text-white uppercase text-[11px]">
                <th className="border border-slate-800 px-3 py-2">Subject Name</th>
                <th className="border border-slate-800 px-3 py-2 text-right">Max Marks</th>
                <th className="border border-slate-800 px-3 py-2 text-right">Obtained</th>
                <th className="border border-slate-800 px-3 py-2 text-right">Percentage</th>
                <th className="border border-slate-800 px-3 py-2 text-center">Division/Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {subjects.map((s) => {
                const p = pct(s.obtained, s.max);
                const tag = p >= 75 ? "Distinction" : p >= 60 ? "First Class" : p >= 50 ? "Second Class" : p >= 35 ? "Pass" : "Needs Improvement";
                return (
                  <tr key={s.subject}>
                    <td className="border border-slate-400 px-3 py-2 font-semibold">{s.subject}</td>
                    <td className="border border-slate-400 px-3 py-2 text-right">{s.max}</td>
                    <td className="border border-slate-400 px-3 py-2 text-right font-bold">{s.obtained}</td>
                    <td className="border border-slate-400 px-3 py-2 text-right">{p}%</td>
                    <td className="border border-slate-400 px-3 py-2 text-center font-bold text-slate-700">{tag}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-200 font-bold border-t-2 border-slate-800 text-slate-900">
              <tr>
                <td className="border border-slate-800 px-3 py-2 uppercase">GRAND TOTAL</td>
                <td className="border border-slate-800 px-3 py-2 text-right">{selected.totalMax}</td>
                <td className="border border-slate-800 px-3 py-2 text-right text-indigo-900">{selected.totalObtained}</td>
                <td className="border border-slate-800 px-3 py-2 text-right text-indigo-900">{selected.percentage.toFixed(2)}%</td>
                <td className="border border-slate-800 px-3 py-2 text-center uppercase text-emerald-800">{selected.resultStatus.toUpperCase()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Academic Attendance Summary */}
        {showAttendance && (
          <div className="mb-6 border border-slate-800 bg-slate-50 p-4 font-serif text-xs">
            <h4 className="font-bold uppercase tracking-wide text-slate-900 mb-2 border-b border-slate-300 pb-1">
              Class Attendance Summary Record
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><p className="text-slate-500">Total Working Days</p><p className="font-bold text-slate-900">{attendanceSummary.total}</p></div>
              <div><p className="text-slate-500">Days Attended</p><p className="font-bold text-emerald-800">{attendanceSummary.present}</p></div>
              <div><p className="text-slate-500">Days Absent</p><p className="font-bold text-red-700">{attendanceSummary.absent}</p></div>
              <div><p className="text-slate-500">Attendance Ratio</p><p className="font-bold text-indigo-900">{attPct}%</p></div>
            </div>
          </div>
        )}

        {showRemark && teacherRemark && (
          <div className="mb-6 font-serif italic text-xs text-slate-800 border-l-2 border-slate-800 pl-3">
            <strong>Principal Notes:</strong> “{teacherRemark}”
          </div>
        )}

        <FooterStamp p={p} classicMode />
      </div>
    </div>
  );
}

/* ========================================================================= */
/* TEMPLATE 3: EXECUTIVE ANALYTICS DASHBOARD                                */
/* ========================================================================= */
function DashboardTemplate(p: RenderProps) {
  const { settings, student, selected, previous, subjects, attendanceSummary, attPct, classAverage, showGraph, showAttendance, showRemark, teacherRemark } = p;

  const chartData = subjects.map((s) => ({
    name: s.subject.length > 8 ? s.subject.substring(0, 8) + "…" : s.subject,
    Score: s.obtained,
    Max: s.max,
    Pct: pct(s.obtained, s.max),
  }));

  const attendancePieData = [
    { name: "Present", value: attendanceSummary.present, fill: "#10B981" },
    { name: "Absent", value: attendanceSummary.absent, fill: "#EF4444" },
  ];

  return (
    <Card className="p-6 sm:p-8 bg-slate-900 text-slate-100 rounded-2xl shadow-xl">
      {/* Executive Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#38bdf8]">EXECUTIVE ANALYTICS REPORT</span>
          <h2 className="text-2xl font-black text-white">{settings.tuitionName}</h2>
          <p className="text-xs text-slate-400">{student.fullName} ({student.studentCode}) • {student.standard} - {student.division}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-800 p-3 text-right border border-slate-700">
            <p className="text-[10px] uppercase text-slate-400">Exam</p>
            <p className="text-sm font-bold text-white">{selected.name}</p>
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
        <DashBox title="Overall %" value={`${selected.percentage.toFixed(2)}%`} sub={`Avg: ${classAverage}%`} color="text-blue-400" />
        <DashBox title="Total Score" value={`${selected.totalObtained}/${selected.totalMax}`} sub="Marks" color="text-slate-200" />
        <DashBox title="Grade" value={selected.grade} sub={selected.resultStatus.toUpperCase()} color="text-purple-400" />
        <DashBox title="Class Rank" value={selected.rank ? `#${selected.rank}` : "—"} sub="Position" color="text-amber-400" />
        <DashBox title="Attendance" value={`${attPct}%`} sub={`${attendanceSummary.present}/${attendanceSummary.total} Days`} color="text-emerald-400" />
      </div>

      {/* Analytics Charts Row */}
      {showGraph && (
        <div className="grid gap-4 lg:grid-cols-3 mb-6">
          <div className="lg:col-span-2 rounded-xl bg-slate-800/80 p-4 border border-slate-700/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-400" /> Subject Percentage Comparison
            </h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="Pct" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.Pct >= 80 ? "#10b981" : entry.Pct >= 60 ? "#3b82f6" : "#f59e0b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {showAttendance && (
            <div className="rounded-xl bg-slate-800/80 p-4 border border-slate-700/80 flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-emerald-400" /> Class Attendance
              </h4>
              <div className="h-36 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={attendancePieData} dataKey="value" innerRadius={35} outerRadius={55} paddingAngle={4} isAnimationActive={false} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-bold text-white">{attPct}%</span>
                  <span className="text-[9px] text-slate-400">Regularity</span>
                </div>
              </div>
              <div className="flex justify-around text-xs border-t border-slate-700/80 pt-2 text-slate-300">
                <span>Present: <strong className="text-emerald-400">{attendanceSummary.present}</strong></span>
                <span>Absent: <strong className="text-red-400">{attendanceSummary.absent}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subject Score Table */}
      <div className="mb-6 overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-left text-xs text-slate-200">
          <thead className="bg-slate-800 uppercase text-slate-400 text-[11px]">
            <tr>
              <th className="p-3">Subject</th>
              <th className="p-3 text-right">Obtained</th>
              <th className="p-3 text-right">Maximum</th>
              <th className="p-3 text-right">% Score</th>
              <th className="p-3 text-center">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/60">
            {subjects.map((s) => {
              const p = pct(s.obtained, s.max);
              return (
                <tr key={s.subject}>
                  <td className="p-3 font-semibold text-white">{s.subject}</td>
                  <td className="p-3 text-right">{s.obtained}</td>
                  <td className="p-3 text-right text-slate-400">{s.max}</td>
                  <td className="p-3 text-right font-bold text-blue-400">{p}%</td>
                  <td className="p-3 text-center">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-200">
                      {p >= 80 ? "A+" : p >= 60 ? "A" : p >= 40 ? "B" : "F"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showRemark && teacherRemark && (
        <div className="mb-6 rounded-xl bg-slate-800 p-3 border border-slate-700 text-xs text-slate-300">
          <strong className="text-blue-400">Teacher Evaluation:</strong> {teacherRemark}
        </div>
      )}

      <FooterStamp p={p} darkTheme />
    </Card>
  );
}

function DashBox({ title, value, sub, color }: { title: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl bg-slate-800/90 p-3 border border-slate-700 text-center">
      <p className="text-[10px] text-slate-400 uppercase">{title}</p>
      <p className={`text-lg font-black ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}

/* ========================================================================= */
/* TEMPLATE 4: MINIMALIST INK SAVER                                          */
/* ========================================================================= */
function MinimalTemplate(p: RenderProps) {
  const { settings, student, selected, subjects, attendanceSummary, attPct, showAttendance, showRemark, teacherRemark } = p;

  return (
    <div className="p-6 sm:p-8 border border-slate-300 bg-white text-slate-900 font-sans">
      {/* Clean Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{settings.tuitionName}</h2>
          <p className="text-xs text-slate-600">{settings.address} • {settings.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase font-bold tracking-wider text-slate-500">Student Result Card</p>
          <p className="text-base font-bold">{selected.name}</p>
          <p className="text-xs text-slate-500">{formatDate(selected.examDate)}</p>
        </div>
      </div>

      {/* Student Details Row */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
        <div><span className="text-slate-500">Name:</span> <strong className="text-slate-900">{student.fullName}</strong></div>
        <div><span className="text-slate-500">ID:</span> <strong>{student.studentCode}</strong></div>
        <div><span className="text-slate-500">Class:</span> <strong>{student.standard} ({student.division})</strong></div>
        <div><span className="text-slate-500">Stream/Shift:</span> <strong>{student.stream || student.shift}</strong></div>
      </div>

      {/* Compact Score Table */}
      <table className="w-full text-left text-xs mb-6 border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-800 text-slate-800 uppercase font-bold text-[11px]">
            <th className="py-2">Subject</th>
            <th className="py-2 text-right">Max</th>
            <th className="py-2 text-right">Obtained</th>
            <th className="py-2 text-right">% Score</th>
            <th className="py-2 text-center">Grade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {subjects.map((s) => {
            const p = pct(s.obtained, s.max);
            return (
              <tr key={s.subject}>
                <td className="py-2 font-medium">{s.subject}</td>
                <td className="py-2 text-right text-slate-500">{s.max}</td>
                <td className="py-2 text-right font-bold">{s.obtained}</td>
                <td className="py-2 text-right">{p}%</td>
                <td className="py-2 text-center font-bold">
                  {p >= 80 ? "A+" : p >= 60 ? "A" : p >= 40 ? "B" : "F"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t-2 border-slate-900 font-bold text-slate-900">
          <tr>
            <td className="py-2.5">TOTAL SCORE</td>
            <td className="py-2.5 text-right">{selected.totalMax}</td>
            <td className="py-2.5 text-right">{selected.totalObtained}</td>
            <td className="py-2.5 text-right">{selected.percentage.toFixed(2)}%</td>
            <td className="py-2.5 text-center">{selected.grade}</td>
          </tr>
        </tfoot>
      </table>

      {/* Attendance Horizontal Bar */}
      {showAttendance && (
        <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between items-center">
          <div>
            <strong className="text-slate-900">Class Attendance:</strong> {attendanceSummary.present} / {attendanceSummary.total} Days Present ({attPct}%)
          </div>
          <span className="font-bold text-slate-800">Status: {attPct >= 75 ? "Satisfactory" : "Low Attendance"}</span>
        </div>
      )}

      {showRemark && teacherRemark && (
        <p className="text-xs text-slate-700 italic mb-6">
          <strong>Remark:</strong> “{teacherRemark}”
        </p>
      )}

      <FooterStamp p={p} />
    </div>
  );
}

/* ========================================================================= */
/* TEMPLATE 5: VIBRANT STUDENT PROGRESS CARD                                 */
/* ========================================================================= */
function CreativeTemplate(p: RenderProps) {
  const { settings, student, selected, subjects, attendanceSummary, attPct, showAttendance, showRemark, teacherRemark } = p;

  return (
    <Card className="p-6 sm:p-8 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/70 rounded-3xl border-2 border-purple-200 shadow-xl">
      {/* Playful Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-purple-100">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xl shadow">
            {settings.logoText}
          </span>
          <div>
            <h2 className="text-xl font-black text-purple-950">{settings.tuitionName}</h2>
            <p className="text-xs text-purple-600 font-medium">Student Performance Snapshot</p>
          </div>
        </div>
        <div className="text-right">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
            {selected.name}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">{formatDate(selected.examDate)}</p>
        </div>
      </div>

      {/* Student Badge Card */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 backdrop-blur p-4 rounded-2xl border border-purple-100 text-xs">
        <div><p className="text-slate-400 text-[10px] uppercase">Student</p><p className="font-bold text-slate-900">{student.fullName}</p></div>
        <div><p className="text-slate-400 text-[10px] uppercase">Father Name</p><p className="font-bold text-slate-800">{student.fatherName || "—"}</p></div>
        <div><p className="text-slate-400 text-[10px] uppercase">Class & Div</p><p className="font-bold text-slate-900">{student.standard} - {student.division}</p></div>
        <div><p className="text-slate-400 text-[10px] uppercase">Rank</p><p className="font-bold text-purple-700">{selected.rank ? `#${selected.rank}` : "—"}</p></div>
      </div>

      {/* Subject Cards Grid */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => {
          const p = pct(s.obtained, s.max);
          return (
            <div key={s.subject} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-800">{s.subject}</p>
                <p className="text-lg font-black text-indigo-600">{s.obtained} <span className="text-xs font-normal text-slate-400">/ {s.max}</span></p>
                <div className="mt-1 h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${p}%` }} />
                </div>
              </div>
              <span className={`grid h-10 w-10 place-items-center rounded-xl font-bold text-sm ${p >= 80 ? "bg-emerald-100 text-emerald-800" : p >= 60 ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"}`}>
                {p >= 80 ? "A+" : p >= 60 ? "A" : "B"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-2xl text-white shadow-md">
        <div>
          <p className="text-xs text-purple-200 uppercase font-semibold">Total Score Percentage</p>
          <p className="text-3xl font-black">{selected.percentage.toFixed(2)}%</p>
        </div>
        <div className="flex gap-3 text-center">
          <div className="bg-white/10 px-3 py-1.5 rounded-xl">
            <p className="text-[10px] text-purple-200">Grade</p>
            <p className="font-bold text-lg">{selected.grade}</p>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-xl">
            <p className="text-[10px] text-purple-200">Result</p>
            <p className="font-bold text-lg uppercase">{selected.resultStatus}</p>
          </div>
        </div>
      </div>

      {/* Attendance & Comments Grid */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {showAttendance && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 flex items-center gap-4">
            <SvgCircularGauge percent={attPct} />
            <div>
              <p className="text-xs font-bold text-slate-800">Class Attendance</p>
              <p className="text-lg font-black text-emerald-600">{attPct}%</p>
              <p className="text-[11px] text-slate-500">{attendanceSummary.present} days present out of {attendanceSummary.total}</p>
            </div>
          </div>
        )}

        {showRemark && teacherRemark && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 text-xs">
            <p className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-600" /> Teacher Comment
            </p>
            <p className="text-slate-600 leading-relaxed">{teacherRemark}</p>
          </div>
        )}
      </div>

      <FooterStamp p={p} />
    </Card>
  );
}

/* ========================================================================= */
/* FOOTER & STAMP HELPER                                                      */
/* ========================================================================= */
function FooterStamp({ p, classicMode, darkTheme }: { p: RenderProps; classicMode?: boolean; darkTheme?: boolean }) {
  const { showStamp } = p;

  return (
    <div className={`mt-8 flex flex-wrap items-end justify-between gap-4 border-t pt-5 text-xs ${darkTheme ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
      <div>
        <p className="text-[11px]">Generated on {formatDate(new Date())}</p>
        <p className="text-[10px] opacity-75">Verification Code: {p.student.studentCode}-RES-2026</p>
      </div>

      {showStamp && (
        <div className="flex items-center gap-6">
          {/* Stamp Seal Icon */}
          <div className="relative flex items-center justify-center">
            <div className={`grid h-16 w-16 place-items-center rounded-full border-2 border-dashed p-1 ${classicMode ? "border-amber-800 bg-amber-50/50 text-amber-900" : darkTheme ? "border-blue-400 text-blue-400" : "border-indigo-600 text-indigo-700 bg-indigo-50/40"}`}>
              <div className="text-center text-[8px] font-bold leading-tight uppercase">
                <ShieldCheck className="mx-auto h-4 w-4 mb-0.5" />
                VERIFIED
                <br />
                OFFICIAL
              </div>
            </div>
          </div>

          {/* Authorised Signature */}
          <div className="text-center">
            <div className={`mb-1 h-8 w-36 border-b ${darkTheme ? "border-slate-600" : "border-slate-400"}`} />
            <p className="text-[11px] font-semibold">Authorised Signature</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase font-medium text-slate-400 tracking-wide">{label}</dt>
      <dd className={`mt-0.5 text-xs text-slate-800 truncate ${bold ? "font-bold text-slate-900" : "font-medium"}`}>{value}</dd>
    </div>
  );
}

function BoxStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-sm">
      <p className="text-lg font-black" style={{ color: tone }}>{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-slate-500">{label}</p>
    </div>
  );
}

function SvgCircularGauge({ percent }: { percent: number }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg className="h-14 w-14 -rotate-90 transform" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={radius} className="stroke-slate-200" strokeWidth="6" fill="transparent" />
        <circle
          cx="30"
          cy="30"
          r={radius}
          className="stroke-[#2563eb] transition-all duration-700"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-800">
        {percent}%
      </div>
    </div>
  );
}
