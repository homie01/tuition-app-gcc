"use client";

import * as React from "react";
import { useRouter } from "@/lib/next-compat";
import { CalendarCheck2, Eye, EyeOff, FileText, GraduationCap, KeyRound, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { useDemo } from "@/lib/demo/store";

const DEMO_ACCOUNTS = [
  { label: "Admin (Janak Tapaniya Sir)", email: "janak@gcc.in", password: "admin123", note: "Full access" },
  { label: "Admin (Rohit Tapaniya Sir)", email: "rohit@gcc.in", password: "admin123", note: "Full access" },
  { label: "Assistant (Amit Joshi)", email: "amit@gcc.in", password: "assistant123", note: "All standards · Attendance & Marks" },
];

export default function LoginPage() {
  const router = useRouter();
  const { ready, user, state, login } = useDemo();

  const [email, setEmail] = React.useState("janak@gcc.in");
  const [password, setPassword] = React.useState("admin123");
  const [remember, setRemember] = React.useState(true);
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [forgot, setForgot] = React.useState(false);

  React.useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // small delay so the loading state is visible, like a real request
    setTimeout(() => {
      const res = login(email, password);
      if (!res.ok) {
        setError(res.error ?? "Unable to sign in");
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
    }, 350);
  }

  const features = [
    { icon: <GraduationCap className="h-4 w-4" />, text: "Student records, standards & divisions in one place" },
    { icon: <CalendarCheck2 className="h-4 w-4" />, text: "Daily attendance in under a minute" },
    { icon: <FileText className="h-4 w-4" />, text: "Marks, results and printable PDF reports" },
    { icon: <MessageCircle className="h-4 w-4" />, text: "WhatsApp updates for guardians" },
  ];

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#0f172a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(900px 480px at 10% 0%, rgba(37,99,235,0.55), transparent 60%), radial-gradient(700px 400px at 90% 100%, rgba(124,58,237,0.35), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-lg font-bold ring-1 ring-white/20">
            {state.settings.logoText}
          </span>
          <div>
            <p className="text-lg font-semibold">{state.settings.tuitionName}</p>
            <p className="text-sm text-white/60">{state.settings.tagline}</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Replace registers, marksheets and paperwork with one simple dashboard.
          </h1>
          <ul className="mt-8 space-y-3.5">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-[15px] text-white/85">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/50">
          Frontend demo — all data is generated in your browser and saved locally.
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#2563eb] text-lg font-bold text-white">
              {state.settings.logoText}
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-900">{state.settings.tuitionName}</p>
              <p className="text-[13px] text-slate-500">Tuition class management</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Welcome back 👋</h2>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to manage your tuition class.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field label="Email or mobile number" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@tuition.in" required />
              </div>
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-10 pr-11"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                />
                Remember me
              </label>
              <button type="button" onClick={() => setForgot((f) => !f)} className="text-sm font-medium text-[#2563eb] hover:underline">
                Forgot password?
              </button>
            </div>

            {forgot ? (
              <div className="rounded-xl border border-blue-100 bg-[#eff6ff] px-4 py-3 text-[13px] text-blue-800">
                Ask your class admin to set a new password from{" "}
                <span className="font-semibold">Assistants → Edit → Reset password</span>.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
            ) : null}

            <Button type="submit" loading={loading} className="w-full py-3 text-[15px]">
              Sign in
            </Button>

            <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-[#16a34a]" /> Tap an account to fill it in
              </p>
              <div className="mt-3 grid gap-2">
                {DEMO_ACCOUNTS.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => {
                      setEmail(d.email);
                      setPassword(d.password);
                      setError(null);
                    }}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] px-3 py-2 text-left text-[13px] transition hover:border-[#2563eb] hover:bg-[#eff6ff]"
                  >
                    <span className="min-w-0">
                      <span className="font-semibold text-slate-800">{d.label}</span>
                      <span className="ml-2 text-slate-500">{d.email}</span>
                    </span>
                    <span className="shrink-0 text-slate-400">{d.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
