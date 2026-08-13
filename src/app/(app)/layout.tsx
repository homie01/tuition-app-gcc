"use client";

import * as React from "react";
import { useRouter } from "@/lib/next-compat";
import Shell from "@/components/shell";
import { useDemo } from "@/lib/demo/store";

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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, user } = useDemo();

  React.useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return <Booting />;
  return <Shell>{children}</Shell>;
}
