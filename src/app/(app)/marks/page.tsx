"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import { CalendarPlus, ClipboardList, FileSpreadsheet, Save, Sparkles, Table2, Trophy } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHead,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  useToast,
} from "@/components/ui";
import { formatDate, pct, todayISO } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";
import { DivisionMarksExcelModal } from "@/components/division-marks-excel-modal";

export default function MarksPage() {
  const { push } = useToast();
  const { state, allows, visibleStandards, saveMarks, generateResults, createExam, getSubjectsForStandard } = useDemo();

  const standards = visibleStandards();
  const [standardId, setStandardId] = React.useState(standards[0] ? String(standards[0].id) : "");
  const [stream, setStream] = React.useState("Science");

  const selectedStd = standards.find((s) => String(s.id) === standardId);
  const is11or12 = Boolean(
    selectedStd && (selectedStd.name.toLowerCase().includes("11") || selectedStd.name.toLowerCase().includes("12"))
  );

  const subjects = React.useMemo(() => {
    return getSubjectsForStandard(standardId, is11or12 ? stream : undefined);
  }, [getSubjectsForStandard, standardId, is11or12, stream]);

  const [examId, setExamId] = React.useState("");
  const [divisionId, setDivisionId] = React.useState("");
  const [subjectId, setSubjectId] = React.useState(subjects[0] ? String(subjects[0].id) : "");
  const [maxMarks, setMaxMarks] = React.useState("100");
  const [values, setValues] = React.useState<Record<number, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [mode, setMode] = React.useState<"entry" | "overview">("entry");
  const [newExam, setNewExam] = React.useState(false);
  const [showExcelModal, setShowExcelModal] = React.useState(false);

  const canAdd = allows("marks.add");
  const canGenerate = allows("result.generate");

  React.useEffect(() => {
    if (subjects.length && !subjects.some((s) => String(s.id) === subjectId)) {
      setSubjectId(String(subjects[0].id));
    }
  }, [subjects, subjectId]);

  const examsForStandard = React.useMemo(
    () => state.exams.filter((e) => String(e.standardId) === standardId).sort((a, b) => b.examDate.localeCompare(a.examDate)),
    [state.exams, standardId],
  );
  const divs = state.divisions.filter((d) => String(d.standardId) === standardId);

  React.useEffect(() => {
    if (examsForStandard.length && !examsForStandard.some((e) => String(e.id) === examId)) {
      setExamId(String(examsForStandard[0].id));
    }
    if (!examsForStandard.length) setExamId("");
  }, [standardId, examsForStandard, examId]);

  const selectedExam = state.exams.find((e) => String(e.id) === examId);

  React.useEffect(() => {
    if (selectedExam) {
      if (selectedExam.subjectId) {
        setSubjectId(String(selectedExam.subjectId));
      }
      if (selectedExam.stream) {
        setStream(selectedExam.stream);
      }
    }
  }, [selectedExam]);

  const roster = React.useMemo(() => {
    if (!selectedExam) return [];
    return state.students
      .filter((s) => {
        if (s.standardId !== selectedExam.standardId) return false;
        if (s.status !== "active") return false;
        if (divisionId && String(s.divisionId) !== divisionId) return false;
        if (is11or12) {
          const st = s.stream ?? "Science";
          if (st !== stream) return false;
        }
        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [state.students, selectedExam, divisionId, is11or12, stream]);

  const examMarks = React.useMemo(
    () => (selectedExam ? state.marks.filter((m) => m.examId === selectedExam.id) : []),
    [state.marks, selectedExam],
  );

  React.useEffect(() => {
    const v: Record<number, string> = {};
    for (const r of roster) {
      const m = examMarks.find((x) => x.studentId === r.id && String(x.subjectId) === subjectId);
      v[r.id] = m ? String(m.marksObtained) : "";
    }
    setValues(v);
    const first = examMarks.find((x) => String(x.subjectId) === subjectId);
    if (first) {
      setMaxMarks(String(first.maxMarks));
    } else if (selectedExam) {
      setMaxMarks(String(selectedExam.maxMarksDefault ?? 100));
    } else {
      setMaxMarks("100");
    }
  }, [roster, examMarks, subjectId, selectedExam]);

  function handleSave() {
    if (!selectedExam) return;
    setSaving(true);
    setTimeout(() => {
      const res = saveMarks({
        examId: selectedExam.id,
        subjectId: Number(subjectId),
        maxMarks: Number(maxMarks || 100),
        entries: roster.map((r) => ({
          studentId: r.id,
          marksObtained: values[r.id] === "" || values[r.id] === undefined ? null : Number(values[r.id]),
        })),
      });
      if (res.error) push("error", res.error);
      else push("success", `Marks saved for ${res.saved} students.`);
      setSaving(false);
    }, 250);
  }

  function handleGenerate() {
    if (!selectedExam) return;
    setGenerating(true);
    setTimeout(() => {
      const res = generateResults(selectedExam.id);
      if (res.error) push("error", res.error);
      else push("success", `Results generated for ${res.generated} students.`);
      setGenerating(false);
    }, 300);
  }

  return (
    <div>
      <PageHeader
        title="Marks & Results"
        subtitle="Enter marks subject-wise, then generate results with grades and ranks in one click."
        actions={<Link href="/results" className="btn-soft"><Trophy className="h-4 w-4" /> All results</Link>}
      />

      <Card className="mb-4">
        <CardHead
          title="Select exam and subject"
          subtitle="Choose the class and exam, then enter marks subject by subject."
          icon={<ClipboardList className="h-4.5 w-4.5" />}
          action={canAdd ? <Button variant="soft" onClick={() => setNewExam(true)}><CalendarPlus className="h-4 w-4" /> New exam</Button> : null}
        />
        <div className={`grid gap-3 p-4 sm:grid-cols-2 ${is11or12 ? "lg:grid-cols-6" : "lg:grid-cols-5"}`}>
          <Field label="Standard">
            <Select value={standardId} onChange={(e) => setStandardId(e.target.value)}>
              {standards.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          {is11or12 ? (
            <Field label="Stream">
              <Select value={stream} onChange={(e) => setStream(e.target.value)}>
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
              </Select>
            </Field>
          ) : null}
          <Field label="Division">
            <Select value={divisionId} onChange={(e) => setDivisionId(e.target.value)}>
              <option value="">All divisions</option>
              {divs.map((d) => <option key={d.id} value={d.id}>Division {d.name}</option>)}
            </Select>
          </Field>
          <Field label="Exam / Test">
            <Select
              value={examId}
              onChange={(e) => {
                const newId = e.target.value;
                setExamId(newId);
                const ex = state.exams.find((x) => String(x.id) === newId);
                if (ex?.subjectId) {
                  setSubjectId(String(ex.subjectId));
                }
              }}
            >
              {!examsForStandard.length ? <option value="">No exams yet</option> : null}
              {examsForStandard.map((e) => {
                const sub = e.subjectId ? state.subjects.find((s) => s.id === e.subjectId) : null;
                return (
                  <option key={e.id} value={e.id}>
                    {e.name}{sub ? ` (${sub.name})` : ""} — {formatDate(e.examDate)}
                  </option>
                );
              })}
            </Select>
          </Field>
          <Field label="Subject">
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={mode === "overview"}>
              {subjects.map((s) => {
                const isExamSub = selectedExam?.subjectId === s.id;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name}{isExamSub ? " ★ (Exam Subject)" : ""}
                  </option>
                );
              })}
            </Select>
          </Field>
          <Field label="Maximum marks">
            <Input inputMode="numeric" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} disabled={mode === "overview"} />
          </Field>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#e2e8f0] px-4 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-full sm:w-auto">
              <button
                onClick={() => setMode("entry")}
                className={`flex-1 sm:flex-initial rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition ${mode === "entry" ? "bg-white text-[#2563eb] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Enter marks
              </button>
              <button
                onClick={() => setMode("overview")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition ${mode === "overview" ? "bg-white text-[#2563eb] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Table2 className="h-3.5 w-3.5" /> All subjects
              </button>
            </div>
            <Button variant="outline" onClick={() => setShowExcelModal(true)} className="w-full sm:w-auto justify-center">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" /> Division PDF (Excel)
            </Button>
          </div>
          {selectedExam ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              {selectedExam.subjectId ? (
                <Badge tone="brand">
                  Subject: {state.subjects.find((s) => s.id === selectedExam.subjectId)?.name ?? "Subject"}
                </Badge>
              ) : (
                <Badge tone="neutral">All Subjects</Badge>
              )}
              <Badge tone="neutral">Exam date {formatDate(selectedExam.examDate)}</Badge>
              {canGenerate ? (
                <Button variant="ok" onClick={handleGenerate} loading={generating} disabled={!examMarks.length} className="grow sm:grow-0 justify-center">
                  <Sparkles className="h-4 w-4 shrink-0" /> Generate results
                </Button>
              ) : null}
              <Link href={`/results?examId=${selectedExam.id}`} className="btn-soft grow sm:grow-0 text-center justify-center"><Trophy className="h-4 w-4 shrink-0 inline mr-1.5" /> View results</Link>
            </div>
          ) : null}
        </div>
      </Card>

      {!examId ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title="No exam selected"
            message="Create an exam for this standard to start entering marks."
            action={canAdd ? <Button onClick={() => setNewExam(true)}><CalendarPlus className="h-4 w-4" /> Create exam</Button> : undefined}
          />
        </Card>
      ) : !roster.length ? (
        <Card><EmptyState title="No active students in this class" message="Add students or pick another division." /></Card>
      ) : mode === "entry" ? (
        <Card className="overflow-hidden">
          <div className="max-h-[62vh] overflow-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr>
                  <th className="th w-12">#</th>
                  <th className="th">Student</th>
                  <th className="th">Student ID</th>
                  <th className="th w-44 text-right">
                    Marks (out of {maxMarks})
                    <span className="block text-[11px] font-normal text-slate-400">
                      {state.subjects.find((s) => String(s.id) === subjectId)?.name ?? "Subject"}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roster.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="td text-slate-400">{i + 1}</td>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.fullName} color={r.photoColor} size={32} />
                        <span className="font-semibold text-slate-800">{r.fullName}</span>
                      </div>
                    </td>
                    <td className="td text-slate-500">{r.studentCode}</td>
                    <td className="td">
                      <input
                        inputMode="numeric"
                        disabled={!canAdd}
                        value={values[r.id] ?? ""}
                        onChange={(e) => setValues((p) => ({ ...p, [r.id]: e.target.value.replace(/[^\d.]/g, "") }))}
                        placeholder="—"
                        className="ml-auto block w-28 rounded-xl border border-[#e2e8f0] px-3 py-2 text-right text-sm outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canAdd ? (
            <div className="flex items-center justify-between gap-3 border-t border-[#e2e8f0] p-3">
              <p className="text-[13px] text-slate-500">Leave blank to remove a student&apos;s mark for this subject.</p>
              <Button onClick={handleSave} loading={saving}><Save className="h-4 w-4" /> Save marks</Button>
            </div>
          ) : null}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="max-h-[62vh] overflow-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr>
                  <th className="th">Student</th>
                  {subjects.map((s) => {
                    const isExamSub = selectedExam?.subjectId === s.id;
                    return (
                      <th key={s.id} className={`th text-right ${isExamSub ? "text-[#2563eb] font-bold bg-blue-50/50" : ""}`}>
                        {s.name}
                        {isExamSub ? <span className="block text-[10px] text-[#2563eb] font-semibold uppercase tracking-wider">Exam Subject</span> : null}
                      </th>
                    );
                  })}
                  <th className="th text-right">Total</th>
                  <th className="th text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roster.map((r) => {
                  const rowMarks = examMarks.filter((m) => m.studentId === r.id);
                  const total = rowMarks.reduce((a, b) => a + b.marksObtained, 0);
                  const max = rowMarks.reduce((a, b) => a + b.maxMarks, 0);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="td font-semibold text-slate-800">{r.fullName}</td>
                      {subjects.map((s) => {
                        const m = rowMarks.find((x) => x.subjectId === s.id);
                        const isExamSub = selectedExam?.subjectId === s.id;
                        return (
                          <td key={s.id} className={`td text-right ${isExamSub ? "font-semibold text-slate-900 bg-blue-50/20" : ""}`}>
                            {m ? m.marksObtained : "—"}
                          </td>
                        );
                      })}
                      <td className="td text-right font-semibold">{max ? `${total}/${max}` : "—"}</td>
                      <td className="td text-right">
                        {max ? <Badge tone={pct(total, max) >= 60 ? "ok" : pct(total, max) >= 35 ? "warn" : "bad"}>{pct(total, max)}%</Badge> : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <NewExamModal
        open={newExam}
        onClose={() => setNewExam(false)}
        standards={standards}
        defaultStandardId={standardId}
        defaultSubjectId={subjectId}
        defaultStream={stream}
        onCreate={(name, stdId, subId, streamVal, date, max) => {
          const exam = createExam({
            name,
            standardId: stdId,
            subjectId: subId,
            stream: streamVal,
            examDate: date,
            maxMarksDefault: max,
          });
          push("success", "Exam created successfully.");
          setStandardId(String(stdId));
          if (streamVal) setStream(streamVal);
          setExamId(String(exam.id));
          if (subId) {
            setSubjectId(String(subId));
          }
          setMaxMarks(String(max));
          setNewExam(false);
        }}
      />

      <DivisionMarksExcelModal
        open={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        defaultStandardId={standardId}
        defaultDivisionId={divisionId}
        defaultStream={stream}
        defaultExamId={examId}
      />
    </div>
  );
}

function NewExamModal({
  open,
  onClose,
  standards,
  defaultStandardId,
  defaultSubjectId,
  defaultStream,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  standards: { id: number; name: string }[];
  defaultStandardId: string;
  defaultSubjectId?: string;
  defaultStream?: string;
  onCreate: (
    name: string,
    standardId: number,
    subjectId: number | null,
    stream: string | null,
    examDate: string,
    maxMarks: number
  ) => void;
}) {
  const { getSubjectsForStandard } = useDemo();
  const [name, setName] = React.useState("Unit Test");
  const [standardId, setStandardId] = React.useState(defaultStandardId);
  const [stream, setStream] = React.useState(defaultStream || "Science");
  const [subjectId, setSubjectId] = React.useState(defaultSubjectId || "");
  const [examDate, setExamDate] = React.useState(todayISO());
  const [maxMarksDefault, setMaxMarksDefault] = React.useState("100");

  const selectedStd = standards.find((s) => String(s.id) === standardId);
  const is11or12 = selectedStd
    ? selectedStd.name.toLowerCase().includes("11") || selectedStd.name.toLowerCase().includes("12")
    : false;

  const modalSubjects = React.useMemo(() => {
    return getSubjectsForStandard(standardId, is11or12 ? stream : undefined);
  }, [getSubjectsForStandard, standardId, is11or12, stream]);

  React.useEffect(() => {
    if (open) {
      setStandardId(defaultStandardId);
      setName("Unit Test");
      setStream(defaultStream || "Science");
      setSubjectId(defaultSubjectId || "");
      setExamDate(todayISO());
      setMaxMarksDefault("100");
    }
  }, [defaultStandardId, defaultSubjectId, defaultStream, open]);

  React.useEffect(() => {
    if (modalSubjects.length && (!subjectId || !modalSubjects.some((s) => String(s.id) === subjectId))) {
      setSubjectId(String(modalSubjects[0].id));
    }
  }, [modalSubjects, subjectId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a new exam"
      description="Choose standard and subject for this test, or create a comprehensive exam."
      footer={
        <>
          <Button variant="soft" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() =>
              onCreate(
                name.trim() || "Unit Test",
                Number(standardId),
                subjectId ? Number(subjectId) : null,
                is11or12 ? stream : null,
                examDate,
                Number(maxMarksDefault) || 100
              )
            }
          >
            Create exam
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Exam name" required className="sm:col-span-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Unit Test 3, Mid Term Exam" />
        </Field>
        <Field label="Standard" required>
          <Select
            value={standardId}
            onChange={(e) => {
              setStandardId(e.target.value);
            }}
          >
            {standards.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        {is11or12 ? (
          <Field label="Stream" required>
            <Select value={stream} onChange={(e) => setStream(e.target.value)}>
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
            </Select>
          </Field>
        ) : null}
        <Field label="Subject" required className={is11or12 ? "" : "sm:col-span-1"}>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">All Subjects (Multi-subject Exam)</option>
            {modalSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Exam date" required>
          <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </Field>
        <Field label="Default maximum marks" required>
          <Input inputMode="numeric" value={maxMarksDefault} onChange={(e) => setMaxMarksDefault(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
