import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { DemoProvider, useDemo } from "@/lib/demo/store";
import { ToastProvider } from "@/components/ui";
import Shell from "@/components/shell";

import LoginPage from "@/app/login/page";
import DashboardPage from "@/app/(app)/dashboard/page";
import StudentsPage from "@/app/(app)/students/page";
import NewStudentPage from "@/app/(app)/students/new/page";
import StudentDetailPage from "@/app/(app)/students/[id]/page";
import EditStudentPage from "@/app/(app)/students/[id]/edit/page";
import StudentResultPage from "@/app/(app)/students/[id]/result/page";
import AttendancePage from "@/app/(app)/attendance/page";
import AttendanceHistoryPage from "@/app/(app)/attendance/history/page";
import AttendanceReportsPage from "@/app/(app)/attendance/reports/page";
import MarksPage from "@/app/(app)/marks/page";
import ResultsPage from "@/app/(app)/results/page";
import ReportsPage from "@/app/(app)/reports/page";
import AssistantsPage from "@/app/(app)/assistants/page";
import WhatsAppPage from "@/app/(app)/whatsapp/page";
import NotificationsPage from "@/app/(app)/notifications/page";
import ActivityPage from "@/app/(app)/activity/page";
import SettingsPage from "@/app/(app)/settings/page";
import ProfilePage from "@/app/(app)/profile/page";
import NoAccessPage from "@/app/no-access/page";

function Booting() {
  return (
    <div className="min-h-screen">
      <div className="fixed inset-y-0 left-0 hidden w-[264px] border-r border-[#e2e8f0] bg-white lg:block">
        <div className="space-y-3 p-5">
          <div className="skeleton h-10 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="lg:pl-[264px]">
        <div className="h-16 border-b border-[#e2e8f0] bg-white" />
        <div className="mx-auto grid max-w-[1400px] gap-4 p-6">
          <div className="skeleton h-28 w-full" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
          <div className="skeleton h-72 w-full" />
        </div>
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const { ready, user } = useDemo();

  if (!ready) return <Booting />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/new" element={<NewStudentPage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />
              <Route path="/students/:id/edit" element={<EditStudentPage />} />
              <Route path="/students/:id/result" element={<StudentResultPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/attendance/history" element={<AttendanceHistoryPage />} />
              <Route path="/attendance/reports" element={<AttendanceReportsPage />} />
              <Route path="/marks" element={<MarksPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/assistants" element={<AssistantsPage />} />
              <Route path="/whatsapp" element={<WhatsAppPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/no-access" element={<NoAccessPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </DemoProvider>
  );
}
