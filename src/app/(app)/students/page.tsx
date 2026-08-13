"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import { useSearchParams } from "@/lib/next-compat";
import {
  CalendarCheck2,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  FileText,
  Grid3x3,
  LayoutList,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Select,
  StatusPill,
  useToast,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { useDemo } from "@/lib/demo/store";
import type { Student } from "@/lib/demo/types";
import { StudentExcelModal } from "@/components/student-excel-modal";

const PER_PAGE = 12;

function StudentsInner() {
  const params = useSearchParams();
  const { push } = useToast();
  const { state, user, allows, visibleStandards, standardName, divisionName, deleteStudent } = useDemo();

  const [q, setQ] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [standardId, setStandardId] = React.useState(params.get("standardId") ?? "");
  const [stream, setStream] = React.useState("");
  const [divisionId, setDivisionId] = React.useState("");
  const [shift, setShift] = React.useState("");
  const [sort, setSort] = React.useState("name");
  const [page, setPage] = React.useState(1);
  const [view, setView] = React.useState<"table" | "grid">("table");
  const [confirm, setConfirm] = React.useState<Student | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [excelModalOpen, setExcelModalOpen] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setDebounced(q.trim().toLowerCase());
      setLoading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  React.useEffect(() => setPage(1), [debounced, standardId, stream, divisionId, shift, sort]);

  const stds = visibleStandards();
  const selectedStd = stds.find((s) => String(s.id) === standardId);
  const is11or12 = selectedStd
    ? selectedStd.name.toLowerCase().includes("11") || selectedStd.name.toLowerCase().includes("12")
    : false;

  const divs = state.divisions.filter((d) => !standardId || String(d.standardId) === standardId);

  const filtered = React.useMemo(() => {
    let rows = state.students;
    if (user?.role === "assistant" && user.assignedStandards.length) {
      rows = rows.filter((s) => user.assignedStandards.includes(s.standardId));
    }
    if (debounced) {
      rows = rows.filter(
        (s) =>
          s.fullName.toLowerCase().includes(debounced) ||
          s.studentCode.toLowerCase().includes(debounced) ||
          s.primaryMobile.includes(debounced),
      );
    }
    if (standardId) rows = rows.filter((s) => String(s.standardId) === standardId);
    const sel = stds.find((s) => String(s.id) === standardId);
    const isHigherSec = sel ? sel.name.toLowerCase().includes("11") || sel.name.toLowerCase().includes("12") : false;
    if (standardId && isHigherSec && stream) {
      rows = rows.filter((s) => (s.stream ?? "Science") === stream);
    }
    if (divisionId) rows = rows.filter((s) => String(s.divisionId) === divisionId);
    if (shift) rows = rows.filter((s) => s.shift === shift);

    const sorted = [...rows];
    if (sort === "recent") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sort === "code") sorted.sort((a, b) => a.studentCode.localeCompare(b.studentCode));
    else if (sort === "standard") sorted.sort((a, b) => a.standardId - b.standardId || a.fullName.localeCompare(b.fullName));
    else sorted.sort((a, b) => a.fullName.localeCompare(b.fullName));
    return sorted;
  }, [state.students, user, debounced, standardId, stds, stream, divisionId, shift, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const activeFilters = [standardId, stream, divisionId, shift].filter(Boolean).length;

  const canEdit = allows("student.edit");
  const canAdd = allows("student.add");
  const canDelete = allows("student.delete");

  function clearFilters() {
    setStandardId("");
    setStream("");
    setDivisionId("");
    setShift("");
    setQ("");
  }

  function handleDeleteStudent() {
    if (!confirm) return;
    deleteStudent(confirm.id);
    push("success", `${confirm.fullName} was deleted.`);
    setConfirm(null);
  }

  const FilterBar = (
    <>
      <Select
        value={standardId}
        onChange={(e) => {
          setStandardId(e.target.value);
          setDivisionId("");
          setStream("");
        }}
        className="lg:w-40"
      >
        <option value="">All standards</option>
        {stds.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      {is11or12 ? (
        <Select value={stream} onChange={(e) => setStream(e.target.value)} className="lg:w-36">
          <option value="">All streams</option>
          <option value="Science">Science</option>
          <option value="Commerce">Commerce</option>
        </Select>
      ) : null}
      <Select value={divisionId} onChange={(e) => setDivisionId(e.target.value)} className="lg:w-36">
        <option value="">All divisions</option>
        {divs.map((d) => <option key={d.id} value={d.id}>Division {d.name}</option>)}
      </Select>
      <Select value={shift} onChange={(e) => setShift(e.target.value)} className="lg:w-36">
        <option value="">All shifts</option>
        <option value="morning">Morning</option>
        <option value="afternoon">Afternoon</option>
      </Select>
      <Select value={sort} onChange={(e) => setSort(e.target.value)} className="lg:w-36">
        <option value="name">Sort: Name</option>
        <option value="recent">Sort: Newest</option>
        <option value="code">Sort: Student ID</option>
        <option value="standard">Sort: Standard</option>
      </Select>
    </>
  );

  const RowActions = ({ s }: { s: Student }) => (
    <div className="flex items-center justify-end gap-1">
      {[
        { href: `/students/${s.id}`, label: "View", icon: <Eye className="h-4 w-4" /> },
        ...(canEdit ? [{ href: `/students/${s.id}/edit`, label: "Edit", icon: <Pencil className="h-4 w-4" /> }] : []),
        { href: `/attendance/reports?studentId=${s.id}`, label: "Attendance", icon: <CalendarCheck2 className="h-4 w-4" /> },
        { href: `/students/${s.id}?tab=marks`, label: "Marks", icon: <ClipboardList className="h-4 w-4" /> },
        { href: `/students/${s.id}/result`, label: "Result PDF", icon: <FileText className="h-4 w-4" /> },
      ].map((i) => (
        <Link key={i.label} href={i.href} title={i.label} className="rounded-lg p-2 text-slate-400 transition hover:bg-[#eff6ff] hover:text-[#2563eb]">
          {i.icon}
        </Link>
      ))}
      {canDelete ? (
        <button onClick={() => setConfirm(s)} title="Delete student" className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="All students of your tuition class, organised standard-wise."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setExcelModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel Import / Export
            </button>
            {canAdd ? (
              <Link href="/students/new" className="btn-primary">
                <UserPlus className="h-4 w-4" /> Add Student
              </Link>
            ) : null}
          </div>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, student ID or mobile…"
              className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowFilters((s) => !s)} className="btn-soft lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters {activeFilters ? `(${activeFilters})` : ""}
            </button>
            <div className="hidden items-center gap-2 lg:flex">{FilterBar}</div>
            <div className="flex overflow-hidden rounded-xl border border-[#e2e8f0]">
              <button onClick={() => setView("table")} className={`px-3 py-2.5 ${view === "table" ? "bg-[#eff6ff] text-[#2563eb]" : "text-slate-400"}`} title="Table view">
                <LayoutList className="h-4 w-4" />
              </button>
              <button onClick={() => setView("grid")} className={`px-3 py-2.5 ${view === "grid" ? "bg-[#eff6ff] text-[#2563eb]" : "text-slate-400"}`} title="Card view">
                <Grid3x3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        {showFilters ? <div className="grid gap-2 border-t border-[#e2e8f0] p-4 sm:grid-cols-2 lg:hidden">{FilterBar}</div> : null}
        <div className="flex items-center gap-2 border-t border-[#e2e8f0] px-4 py-2.5">
          <span className="text-[13px] text-slate-500">
            Showing <b className="text-slate-800">{filtered.length}</b> student{filtered.length === 1 ? "" : "s"}
          </span>
          {activeFilters || q ? (
            <button onClick={clearFilters} className="ml-auto inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563eb]">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          ) : null}
        </div>
      </Card>

      {loading ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="skeleton h-4 flex-1" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No students found"
            message="Try changing the filters, or add your first student to get started."
            action={canAdd ? <Link href="/students/new" className="btn-primary"><UserPlus className="h-4 w-4" /> Add Student</Link> : undefined}
          />
        </Card>
      ) : view === "table" ? (
        <Card className="overflow-hidden">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr>
                  <th className="th">Student</th>
                  <th className="th">Standard</th>
                  <th className="th">Shift</th>
                  <th className="th">Mobile</th>
                  <th className="th">Joined</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="td">
                      <Link href={`/students/${s.id}`} className="flex items-center gap-3">
                        <Avatar name={s.fullName} color={s.photoColor} size={36} />
                        <span>
                          <span className="block font-semibold text-slate-800">{s.fullName}</span>
                          <span className="block text-[12px] text-slate-400">{s.studentCode}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="td">
                      <Badge tone="brand">
                        {standardName(s.standardId).replace("Standard ", "Std ")}-{divisionName(s.divisionId)}
                        {s.stream && s.stream !== "Regular" ? ` (${s.stream})` : ""}
                      </Badge>
                    </td>
                    <td className="td capitalize">{s.shift}</td>
                    <td className="td">{s.primaryMobile}</td>
                    <td className="td text-slate-500">{formatDate(s.joiningDate)}</td>
                    <td className="td"><RowActions s={s} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={s.fullName} color={s.photoColor} size={44} />
                <div className="min-w-0 flex-1">
                  <Link href={`/students/${s.id}`} className="block truncate font-semibold text-slate-800 hover:text-[#2563eb]">
                    {s.fullName}
                  </Link>
                  <p className="text-[12px] text-slate-400">
                    {s.studentCode} · {standardName(s.standardId)}-{divisionName(s.divisionId)}
                    {s.stream && s.stream !== "Regular" ? ` (${s.stream})` : ""}
                  </p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                <div><dt className="text-slate-400">Shift</dt><dd className="font-medium capitalize text-slate-700">{s.shift}</dd></div>
                <div><dt className="text-slate-400">Mobile</dt><dd className="font-medium text-slate-700">{s.primaryMobile}</dd></div>
                <div><dt className="text-slate-400">Father</dt><dd className="truncate font-medium text-slate-700">{s.fatherName ?? "—"}</dd></div>
                <div><dt className="text-slate-400">Joined</dt><dd className="font-medium text-slate-700">{formatDate(s.joiningDate)}</dd></div>
              </dl>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <Link href={`/students/${s.id}`} className="text-[13px] font-semibold text-[#2563eb]">View profile</Link>
                <RowActions s={s} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] text-slate-500">Page {page} of {pages} · {filtered.length} students</p>
          <div className="flex gap-2">
            <Button variant="soft" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="soft" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this student?"
        message={`Are you sure you want to delete ${confirm?.fullName ?? ""}? Their attendance and marks record will be removed.`}
        confirmLabel="Delete student"
        onCancel={() => setConfirm(null)}
        onConfirm={handleDeleteStudent}
      />

      <StudentExcelModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        filteredStudents={filtered}
      />
    </div>
  );
}

export default function StudentsPage() {
  return (
    <React.Suspense fallback={<div className="skeleton h-96 w-full rounded-2xl" />}>
      <StudentsInner />
    </React.Suspense>
  );
}
