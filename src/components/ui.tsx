"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, Info, Loader2, X } from "lucide-react";

/* ---------------------------------- Card --------------------------------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardHead({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8f0] px-4 sm:px-5 py-4", className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon ? (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-slate-900 truncate">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">{action}</div> : null}
    </div>
  );
}

/* --------------------------------- Badge ---------------------------------- */
const TONES: Record<string, string> = {
  neutral: "bg-slate-100 text-slate-700",
  brand: "bg-blue-50 text-blue-700",
  ok: "bg-green-50 text-green-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
  violet: "bg-violet-50 text-violet-700",
};
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES | string;
  className?: string;
}) {
  return <span className={cn("chip", TONES[tone] ?? TONES.neutral, className)}>{children}</span>;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    active: { tone: "ok", label: "Active" },
    inactive: { tone: "warn", label: "Inactive" },
    left: { tone: "bad", label: "Left" },
    disabled: { tone: "bad", label: "Disabled" },
    present: { tone: "ok", label: "Present" },
    absent: { tone: "bad", label: "Absent" },
    late: { tone: "warn", label: "Late" },
    leave: { tone: "violet", label: "Leave" },
    pass: { tone: "ok", label: "Pass" },
    fail: { tone: "bad", label: "Fail" },
    upcoming: { tone: "brand", label: "Upcoming" },
    completed: { tone: "ok", label: "Completed" },
  };
  const s = map[status] ?? { tone: "neutral", label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/* --------------------------------- Avatar --------------------------------- */
export function Avatar({ name, color, size = 38 }: { name: string; color?: string | null; size?: number }) {
  const text = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ background: color || "#2563EB", width: size, height: size, fontSize: size * 0.36 }}
    >
      {text}
    </span>
  );
}

/* --------------------------------- Buttons -------------------------------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "ghost" | "danger" | "ok" | "outline";
  loading?: boolean;
};
export function Button({ variant = "primary", loading, className, children, ...rest }: BtnProps) {
  const map: Record<string, string> = {
    primary: "btn-primary",
    soft: "btn-soft",
    ghost: "btn-ghost",
    danger: "btn-danger",
    ok: "btn-ok",
    outline: "btn-outline",
  };
  return (
    <button className={cn("btn", map[variant] ?? map.primary, className)} disabled={loading || rest.disabled} {...rest}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
      {children}
    </button>
  );
}

/* --------------------------------- Fields --------------------------------- */
export function Field({
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? (
        <label className="field-label">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("input", props.className)} />;
}
export function Textarea({
  ref,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: React.Ref<HTMLTextAreaElement>;
}) {
  return <textarea ref={ref} {...props} className={cn("input", props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("input appearance-none pr-8", props.className)} />;
}

/* ---------------------------------- Tabs ---------------------------------- */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth rounded-xl border border-[#e2e8f0] bg-white p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition",
            active === t.key ? "bg-[#2563eb] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100",
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- Modal ---------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}) {
  React.useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);
  if (!open) return null;

  const sizeMap = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-6xl",
    full: "max-w-[96vw]",
  };
  const computedWidth = width || sizeMap[size] || "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div
        className={cn(
          "w-full rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl",
          computedWidth,
          "max-h-[92vh] overflow-y-auto",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e2e8f0] px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-1 text-[13px] text-slate-500">{description}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        {children ? <div className="px-5 py-4">{children}</div> : null}
        {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-[#e2e8f0] px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  tone = "danger",
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={message}
      width="max-w-md"
      footer={
        <>
          <Button variant="soft" onClick={onCancel}>Cancel</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}

/* ------------------------------- Empty state ------------------------------ */
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        {icon ?? <Info className="h-6 w-6" />}
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">{title}</p>
        {message ? <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{message}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/* --------------------------------- Toasts --------------------------------- */
type Toast = { id: number; kind: "success" | "error" | "info" | "warning"; text: string };
const ToastCtx = React.createContext<{ push: (kind: Toast["kind"], text: string) => void }>({
  push: () => {},
});
export const useToast = () => React.useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Toast[]>([]);
  const push = React.useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setItems((p) => [...p, { id, kind, text }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg",
              t.kind === "success" && "border-green-200",
              t.kind === "error" && "border-red-200",
              t.kind === "warning" && "border-amber-200",
              t.kind === "info" && "border-slate-200",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white",
                t.kind === "success" && "bg-[#16a34a]",
                t.kind === "error" && "bg-[#dc2626]",
                t.kind === "warning" && "bg-[#d97706]",
                t.kind === "info" && "bg-[#2563eb]",
              )}
            >
              {t.kind === "success" ? (
                <Check className="h-3.5 w-3.5" />
              ) : t.kind === "error" || t.kind === "warning" ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <Info className="h-3.5 w-3.5" />
              )}
            </span>
            <p className="text-sm font-medium text-slate-700">{t.text}</p>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------- Page header ------------------------------ */
export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {breadcrumb?.length ? (
          <nav className="mb-1 flex flex-wrap items-center gap-1 text-[12px] text-slate-400">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {b.href ? (
                  <Link href={b.href} className="hover:text-[#2563eb]">{b.label}</Link>
                ) : (
                  <span>{b.label}</span>
                )}
                {i < breadcrumb.length - 1 ? <span>/</span> : null}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
