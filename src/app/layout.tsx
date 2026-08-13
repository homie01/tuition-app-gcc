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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var f = window.fetch;
                  Object.defineProperty(window, 'fetch', {
                    get: function() { return f; },
                    set: function(v) { f = v; },
                    configurable: true,
                    enumerable: true
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased">
        <DemoProvider>
          <ToastProvider>{children}</ToastProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
