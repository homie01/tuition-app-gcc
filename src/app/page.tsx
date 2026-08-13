"use client";

import * as React from "react";
import { useRouter } from "@/lib/next-compat";
import { useDemo } from "@/lib/demo/store";

export default function Home() {
  const router = useRouter();
  const { ready, user } = useDemo();

  React.useEffect(() => {
    if (!ready) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [ready, user, router]);

  return (
    <main className="grid min-h-screen place-items-center">
      <div className="flex items-center gap-3 text-slate-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#2563eb]" />
        Loading ClassDesk…
      </div>
    </main>
  );
}
