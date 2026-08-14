import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui";
import { DemoProvider } from "@/lib/demo/store";

export const metadata: Metadata = {
  title: "ClassDesk — Tuition Class Management (Demo)",
  description:
    "Frontend demo: manage students, attendance, marks, results, assistants and guardian communication from one dashboard.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563EB",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased">
        <DemoProvider>
          <ToastProvider>{children}</ToastProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
