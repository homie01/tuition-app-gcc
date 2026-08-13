import Link from "@/lib/next-compat";
import { ShieldAlert } from "lucide-react";

export default function NoAccessPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">You don&apos;t have access to this page</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your admin has not enabled this permission for your account. Please ask the class admin to turn it on from
          Assistants → Permissions.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/dashboard" className="btn-primary">Back to dashboard</Link>
        </div>
      </div>
    </main>
  );
}
