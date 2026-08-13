"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Upload,
  X,
} from "lucide-react";
import { Button, Card, useToast } from "@/components/ui";
import { useDemo } from "@/lib/demo/store";
import type { Student } from "@/lib/demo/types";

type ParsedRow = {
  rawIndex: number;
  fullName: string;
  fatherName: string;
  motherName: string;
  standardNameInput: string;
  divisionNameInput: string;
  matchedStandardId: number | null;
  matchedDivisionId: number | null;
  shift: string;
  primaryMobile: string;
  secondaryMobile: string;
  whatsappNumber: string;
  schoolName: string;
  rollNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  joiningDate: string;
  isValid: boolean;
  errors: string[];
};

export function exportStudentsToExcel(
  students: Student[],
  standardName: (id: number) => string,
  divisionName: (id: number) => string,
  filename = "Students_List.xlsx"
) {
  const data = students.map((s) => ({
    "Student Code": s.studentCode,
    "Full Name": s.fullName,
    "Father Name": s.fatherName ?? "",
    "Mother Name": s.motherName ?? "",
    "Standard": standardName(s.standardId),
    "Stream": s.stream ?? (standardName(s.standardId).toLowerCase().includes("11") || standardName(s.standardId).toLowerCase().includes("12") ? "Science" : "Regular"),
    "Division": divisionName(s.divisionId),
    "Shift": s.shift,
    "Primary Mobile": s.primaryMobile,
    "Secondary Mobile": s.secondaryMobile ?? "",
    "WhatsApp Number": s.whatsappNumber ?? "",
    "School Name": s.schoolName ?? "",
    "Roll Number": s.rollNumber ?? "",
    "Date of Birth": s.dateOfBirth ?? "",
    "Gender": s.gender ?? "",
    "Address": s.address ?? "",
    "Joining Date": s.joiningDate ?? "",
    "Status": s.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
  XLSX.writeFile(workbook, filename);
}

export function downloadSampleExcelTemplate(
  standards: { id: number; name: string }[],
  divisions: { id: number; standardId: number; name: string }[]
) {
  const sampleData = [
    {
      "Full Name": "Aarav Sharma",
      "Father Name": "Rakesh Sharma",
      "Mother Name": "Sunita Sharma",
      "Standard": standards[0]?.name || "Standard 8",
      "Division": "A",
      "Shift": "morning",
      "Primary Mobile": "9825012345",
      "Secondary Mobile": "9825012346",
      "WhatsApp Number": "9825012345",
      "School Name": "St. Xavier High School",
      "Roll Number": "101",
      "Date of Birth": "2012-05-15",
      "Gender": "male",
      "Address": "Katargam Rd, Surat",
      "Joining Date": new Date().toISOString().slice(0, 10),
    },
    {
      "Full Name": "Diya Patel",
      "Father Name": "Kamlesh Patel",
      "Mother Name": "Rekha Patel",
      "Standard": standards[1]?.name || standards[0]?.name || "Standard 9",
      "Division": "B",
      "Shift": "afternoon",
      "Primary Mobile": "9898054321",
      "Secondary Mobile": "",
      "WhatsApp Number": "9898054321",
      "School Name": "Sardar Patel Vidhyalaya",
      "Roll Number": "102",
      "Date of Birth": "2011-09-20",
      "Gender": "female",
      "Address": "Adajan, Surat",
      "Joining Date": new Date().toISOString().slice(0, 10),
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students Template");
  XLSX.writeFile(workbook, "Students_Import_Template.xlsx");
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  filteredStudents?: Student[];
};

export function StudentExcelModal({ isOpen, onClose, filteredStudents }: Props) {
  const { push } = useToast();
  const { state, visibleStandards, standardName, divisionName, importStudents } = useDemo();
  const [activeTab, setActiveTab] = React.useState<"export" | "import">("import");
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedRows, setParsedRows] = React.useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);

  if (!isOpen) return null;

  const stds = visibleStandards();
  const divs = state.divisions;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processFile(dropped);
    }
  }

  function processFile(selectedFile: File) {
    setFile(selectedFile);
    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const worksheet = wb.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

        const rows: ParsedRow[] = rawJson.map((row, idx) => {
          // Normalize field matching
          const getVal = (keys: string[]) => {
            for (const k of keys) {
              const matchedKey = Object.keys(row).find(
                (rk) => rk.trim().toLowerCase() === k.trim().toLowerCase()
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
                return String(row[matchedKey]).trim();
              }
            }
            return "";
          };

          const fullName = getVal(["Full Name", "FullName", "Student Name", "Name", "Student"]);
          const fatherName = getVal(["Father Name", "FatherName", "Father's Name", "Father"]);
          const motherName = getVal(["Mother Name", "MotherName", "Mother's Name", "Mother"]);
          const standardInput = getVal(["Standard", "Std", "Class", "Grade"]);
          const divisionInput = getVal(["Division", "Div", "Section", "Sec"]);
          const shiftInput = getVal(["Shift", "Session"]).toLowerCase();
          const primaryMobile = getVal(["Primary Mobile", "Mobile", "Mobile Number", "Phone", "Contact"]);
          const secondaryMobile = getVal(["Secondary Mobile", "Alternate Mobile", "Alt Mobile"]);
          const whatsappNumber = getVal(["WhatsApp Number", "Whatsapp Number", "WhatsApp", "Whatsapp"]) || primaryMobile;
          const schoolName = getVal(["School Name", "School"]);
          const rollNumber = getVal(["Roll Number", "Roll No", "RollNo"]);
          const dateOfBirth = getVal(["Date of Birth", "DOB", "Birth Date"]);
          const genderInput = getVal(["Gender", "Sex"]).toLowerCase();
          const address = getVal(["Address", "City"]);
          const joiningDate = getVal(["Joining Date", "Date of Joining", "Joined Date"]) || new Date().toISOString().slice(0, 10);

          // Find standard
          let matchedStd = stds.find((s) => s.name.toLowerCase() === standardInput.toLowerCase());
          if (!matchedStd && standardInput) {
            // Check numeric standard match (e.g., "8" -> "Standard 8")
            matchedStd = stds.find((s) => s.name.toLowerCase().includes(standardInput.toLowerCase()));
          }
          if (!matchedStd && stds.length > 0) {
            // fallback to first standard if only 1 exists or standard missing
            matchedStd = stds[0];
          }

          // Find division
          let matchedDiv: { id: number; name: string } | undefined;
          if (matchedStd) {
            const validDivs = divs.filter((d) => d.standardId === matchedStd.id);
            matchedDiv = validDivs.find((d) => d.name.toLowerCase() === divisionInput.toLowerCase());
            if (!matchedDiv && validDivs.length > 0) {
              matchedDiv = validDivs[0]; // fallback to first division
            }
          }

          const streamInput = getVal(["Stream", "Branch"]);
          const shift = shiftInput.includes("afternoon") ? "afternoon" : "morning";
          const gender = genderInput.startsWith("f") ? "female" : genderInput.startsWith("m") ? "male" : "male";

          const is1112 = matchedStd ? (matchedStd.name.toLowerCase().includes("11") || matchedStd.name.toLowerCase().includes("12")) : false;
          const stream = is1112 ? (streamInput.toLowerCase().includes("commerce") ? "Commerce" : "Science") : "Regular";

          const errors: string[] = [];
          if (!fullName) errors.push("Missing Full Name");
          if (!primaryMobile) errors.push("Missing Primary Mobile");
          if (!matchedStd) errors.push("Invalid or unmapped Standard");
          if (!matchedDiv) errors.push("Invalid or unmapped Division");

          return {
            rawIndex: idx + 1,
            fullName,
            fatherName,
            motherName,
            standardNameInput: standardInput || matchedStd?.name || "",
            divisionNameInput: divisionInput || matchedDiv?.name || "",
            matchedStandardId: matchedStd?.id ?? null,
            matchedDivisionId: matchedDiv?.id ?? null,
            stream,
            shift,
            primaryMobile,
            secondaryMobile,
            whatsappNumber,
            schoolName,
            rollNumber,
            dateOfBirth,
            gender,
            address,
            joiningDate,
            isValid: errors.length === 0,
            errors,
          };
        });

        setParsedRows(rows);
      } catch (err) {
        console.error("Excel parse error:", err);
        push("error", "Failed to parse Excel file. Please check file format.");
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  }

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  function handleExecuteImport() {
    if (validRows.length === 0) return;

    const importPayload = validRows.map((r) => ({
      fullName: r.fullName,
      fatherName: r.fatherName || null,
      motherName: r.motherName || null,
      standardId: r.matchedStandardId!,
      stream: r.stream,
      divisionId: r.matchedDivisionId!,
      schoolName: r.schoolName || null,
      rollNumber: r.rollNumber || null,
      dateOfBirth: r.dateOfBirth || null,
      gender: r.gender || "male",
      address: r.address || null,
      primaryMobile: r.primaryMobile,
      secondaryMobile: r.secondaryMobile || null,
      whatsappNumber: r.whatsappNumber || r.primaryMobile,
      relationship: "Father",
      shift: r.shift,
      joiningDate: r.joiningDate,
      status: "active" as const,
      notes: "Imported via Excel",
    }));

    const count = importStudents(importPayload);
    push("success", `Successfully imported ${count} student(s) from Excel file!`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#2563eb]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Excel Import & Export</h3>
              <p className="text-xs text-slate-500">Manage student records easily using Excel or CSV spreadsheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#e2e8f0] bg-slate-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab("import")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "import"
                ? "border-[#2563eb] text-[#2563eb]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="h-4 w-4" /> Import Students from Excel
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "export"
                ? "border-[#2563eb] text-[#2563eb]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Download className="h-4 w-4" /> Export Students
          </button>
        </div>

        <div className="p-6">
          {activeTab === "export" ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#2563eb]" />
                  <div>
                    <p className="font-semibold text-blue-900">Export Student Database</p>
                    <p className="mt-1 text-xs text-blue-700">
                      Download all currently filtered or selected student records formatted in a clean Excel `.xlsx` file.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Export Filtered List</p>
                      <h4 className="mt-1 text-lg font-bold text-slate-800">
                        {filteredStudents ? filteredStudents.length : state.students.length} Students
                      </h4>
                      <p className="text-xs text-slate-500">Based on your current search/filters</p>
                    </div>
                    <FileSpreadsheet className="h-8 w-8 text-blue-500 opacity-80" />
                  </div>
                  <Button
                    onClick={() => {
                      const list = filteredStudents || state.students;
                      exportStudentsToExcel(list, standardName, divisionName, "Filtered_Students.xlsx");
                      push("success", `Exported ${list.length} students to Excel.`);
                    }}
                    className="mt-4 w-full justify-center"
                  >
                    <Download className="h-4 w-4" /> Export Filtered (.xlsx)
                  </Button>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Export All Records</p>
                      <h4 className="mt-1 text-lg font-bold text-slate-800">{state.students.length} Total Students</h4>
                      <p className="text-xs text-slate-500">Full student database backup</p>
                    </div>
                    <FileText className="h-8 w-8 text-emerald-500 opacity-80" />
                  </div>
                  <Button
                    variant="soft"
                    onClick={() => {
                      exportStudentsToExcel(state.students, standardName, divisionName, "All_Students_Full_Backup.xlsx");
                      push("success", `Exported all ${state.students.length} students to Excel.`);
                    }}
                    className="mt-4 w-full justify-center"
                  >
                    <Download className="h-4 w-4" /> Export All Students
                  </Button>
                </Card>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Sample Template for New Data</h5>
                <p className="mt-1 text-xs text-slate-600">
                  Need to fill out student data in Excel first? Download our sample pre-formatted template.
                </p>
                <button
                  onClick={() => downloadSampleExcelTemplate(stds, divs)}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#2563eb] hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> Download Students_Import_Template.xlsx
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Step 1: Upload Box */}
              {!file || parsedRows.length === 0 ? (
                <div>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/20"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-[#2563eb]">
                      <Upload className="h-6 w-6" />
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-slate-800">Upload your Excel or CSV file</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Supports <span className="font-semibold text-slate-700">.xlsx, .xls, or .csv</span> files
                    </p>
                    <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700">
                      <FileSpreadsheet className="h-4 w-4" /> Browse Excel File
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600">
                    <span className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" /> Need standard headers format?
                    </span>
                    <button
                      onClick={() => downloadSampleExcelTemplate(stds, divs)}
                      className="font-bold text-[#2563eb] hover:underline"
                    >
                      Download Sample Template (.xlsx)
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Parsed Preview */
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-[#2563eb]" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{file.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Total {parsedRows.length} rows parsed · {validRows.length} valid · {invalidRows.length} invalid
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Change File
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                      <button
                        onClick={() => {
                          setFile(null);
                          setParsedRows([]);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {invalidRows.length > 0 && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>
                        {invalidRows.length} row(s) have missing required fields (Full Name or Primary Mobile). Only valid rows will be imported.
                      </span>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="max-h-80 overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-semibold">#</th>
                          <th className="px-3 py-2 font-semibold">Status</th>
                          <th className="px-3 py-2 font-semibold">Full Name</th>
                          <th className="px-3 py-2 font-semibold">Father Name</th>
                          <th className="px-3 py-2 font-semibold">Standard & Div</th>
                          <th className="px-3 py-2 font-semibold">Shift</th>
                          <th className="px-3 py-2 font-semibold">Mobile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((r) => (
                          <tr
                            key={r.rawIndex}
                            className={r.isValid ? "hover:bg-slate-50" : "bg-red-50/50 hover:bg-red-50"}
                          >
                            <td className="px-3 py-2 font-medium text-slate-400">{r.rawIndex}</td>
                            <td className="px-3 py-2">
                              {r.isValid ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                                </span>
                              ) : (
                                <span
                                  title={r.errors.join(", ")}
                                  className="inline-flex items-center gap-1 font-semibold text-red-600"
                                >
                                  <AlertCircle className="h-3.5 w-3.5" /> {r.errors[0]}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-semibold text-slate-800">{r.fullName || "—"}</td>
                            <td className="px-3 py-2 text-slate-600">{r.fatherName || "—"}</td>
                            <td className="px-3 py-2 text-slate-600">
                              {r.matchedStandardId ? standardName(r.matchedStandardId) : r.standardNameInput}{" "}
                              {r.matchedDivisionId ? `- ${divisionName(r.matchedDivisionId)}` : r.divisionNameInput}
                            </td>
                            <td className="px-3 py-2 capitalize text-slate-600">{r.shift}</td>
                            <td className="px-3 py-2 font-mono text-slate-700">{r.primaryMobile || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-500">
                      Ready to import <b className="text-slate-800">{validRows.length}</b> student(s) into your class desk.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        disabled={validRows.length === 0}
                        onClick={handleExecuteImport}
                        className="bg-[#2563eb] text-white hover:bg-blue-700"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Import {validRows.length} Students
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
