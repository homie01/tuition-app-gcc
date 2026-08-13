"use client";

import * as React from "react";
import Link from "@/lib/next-compat";
import { usePathname, useRouter } from "@/lib/next-compat";
import {
  Activity,
  Bell,
  CalendarCheck2,
  ChevronDown,
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn, initials, timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { useDemo } from "@/lib/demo/store";
import { SmoothScroll } from "@/components/smooth-scroll";

type NavItem = { href: string; label: string; icon: React.ReactNode; perm?: string; adminOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
  { href: "/students", label: "Students", icon: <Users className="h-[18px] w-[18px]" />, perm: "student.view" },
  { href: "/attendance", label: "Attendance", icon: <CalendarCheck2 className="h-[18px] w-[18px]" />, perm: "attendance.view" },
  { href: "/marks", label: "Marks & Results", icon: <ClipboardList className="h-[18px] w-[18px]" />, perm: "marks.view" },
  { href: "/reports", label: "Reports", icon: <FileBarChart2 className="h-[18px] w-[18px]" />, perm: "report.view" },
  { href: "/assistants", label: "Assistants", icon: <UserCog className="h-[18px] w-[18px]" />, adminOnly: true },
  { href: "/whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-[18px] w-[18px]" />, perm: "whatsapp.send" },
  { href: "/activity", label: "Activity Logs", icon: <Activity className="h-[18px] w-[18px]" />, adminOnly: true },
  { href: "/settings", label: "Settings", icon: <Settings className="h-[18px] w-[18px]" />, adminOnly: true },
];

const MOBILE_NAV = ["/dashboard", "/students", "/attendance", "/marks", "/reports"];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, user, logout, standardName, divisionName, markAllNotificationsRead } = useDemo();

  const [sidebar, setSidebar] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const [bell, setBell] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    setSidebar(false);
    setMenu(false);
    setBell(false);
    setSearchOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [q]);

  if (!user) return null;

  const allowed = NAV.filter((n) => {
    if (user.role === "admin") return true;
    if (n.adminOnly) return false;
    if (!n.perm) return true;
    return user.permissions.includes(n.perm);
  });

  const unread = state.notifications.filter((n) => !n.isRead).length;

  const scoped =
    user.role === "assistant" && user.assignedStandards.length
      ? state.students.filter((s) => user.assignedStandards.includes(s.standardId))
      : state.students;

  const hits = debounced
    ? scoped
        .filter((s) => {
          const std = standardName(s.standardId).toLowerCase();
          const div = divisionName(s.divisionId).toLowerCase();
          return (
            s.fullName.toLowerCase().includes(debounced) ||
            s.studentCode.toLowerCase().includes(debounced) ||
            s.primaryMobile.includes(debounced) ||
            std.includes(debounced) ||
            div === debounced
          );
        })
        .slice(0, 10)
    : [];

  function doLogout() {
    logout();
    router.replace("/login");
  }

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563eb] text-[15px] font-bold text-white">
          {state.settings.logoText}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-slate-900">{state.settings.tuitionName}</p>
          <p className="text-[12px] text-slate-500">Class Management</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {allowed.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition",
                active ? "bg-[#eff6ff] text-[#1d4ed8] ring-1 ring-blue-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <span className={cn(active ? "text-[#2563eb]" : "text-slate-400")}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#e2e8f0] p-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
          <Avatar name={user.name} color={user.avatarColor} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-slate-800">{user.name}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{user.role}</p>
          </div>
          <button onClick={doLogout} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-[#e2e8f0] bg-white lg:block">{SidebarBody}</aside>

      <AnimatePresence>
        {sidebar ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setSidebar(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute inset-y-0 left-0 w-[272px] bg-white shadow-2xl"
            >
              <button onClick={() => setSidebar(false)} className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
              {SidebarBody}
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-white/85 backdrop-blur">
          <div className="flex h-16 items-center gap-2 sm:gap-3 px-3 sm:px-6">
            <button onClick={() => setSidebar(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open sidebar">
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative min-w-0 max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-3.5" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search student, mobile…"
                className="w-full truncate rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2 sm:py-2.5 pl-9 sm:pl-10 pr-2.5 sm:pr-3 text-xs sm:text-sm outline-none transition focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
              <AnimatePresence>
                {searchOpen && q.trim() ? (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSearchOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-12 z-20 max-h-[60vh] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white p-2 shadow-xl"
                    >
                      {hits.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-slate-400">No students matched “{q}”.</p>
                      ) : (
                        hits.map((h) => (
                          <Link key={h.id} href={`/students/${h.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eff6ff] text-[11px] font-bold text-[#2563eb]">
                              {initials(h.fullName)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-800">{h.fullName}</span>
                              <span className="block truncate text-xs text-slate-500">
                                {h.studentCode} · {standardName(h.standardId)}-{divisionName(h.divisionId)} · {h.primaryMobile}
                              </span>
                            </span>
                          </Link>
                        ))
                      )}
                    </motion.div>
                  </>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="relative shrink-0">
              <button onClick={() => setBell((b) => !b)} className="relative rounded-xl p-2 sm:p-2.5 text-slate-500 hover:bg-slate-100">
                <Bell className="h-5 w-5" />
                {unread > 0 ? (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#dc2626] px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </button>
              <AnimatePresence>
                {bell ? (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBell(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-20 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-xl"
                    >
                      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800">Notifications</p>
                        <button onClick={markAllNotificationsRead} className="text-xs font-semibold text-[#2563eb] hover:underline">
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto">
                        {state.notifications.length === 0 ? (
                          <p className="px-4 py-8 text-center text-sm text-slate-400">You are all caught up 🎉</p>
                        ) : (
                          state.notifications.slice(0, 12).map((n) => (
                            <Link
                              key={n.id}
                              href={n.link ?? "/notifications"}
                              className={cn("block border-b border-slate-100 px-4 py-3 hover:bg-slate-50", !n.isRead && "bg-blue-50/40")}
                            >
                              <p className="text-[13px] font-semibold text-slate-800">{n.title}</p>
                              <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-500">{n.message}</p>
                              <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                            </Link>
                          ))
                        )}
                      </div>
                      <Link href="/notifications" className="block bg-slate-50 px-4 py-2.5 text-center text-[13px] font-semibold text-[#2563eb]">
                        View all notifications
                      </Link>
                    </motion.div>
                  </>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="relative shrink-0">
              <button
                onClick={() => setMenu((m) => !m)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-[#e2e8f0] p-1.5 sm:py-1.5 sm:pl-1.5 sm:pr-2.5 hover:bg-slate-50"
              >
                <Avatar name={user.name} color={user.avatarColor} size={28} />
                <span className="hidden text-left sm:block">
                  <span className="block text-[13px] font-semibold leading-4 text-slate-800">{user.name}</span>
                  <span className="block text-[11px] capitalize text-slate-400">{user.role}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              <AnimatePresence>
                {menu ? (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white py-1.5 shadow-xl"
                    >
                      <Link href="/profile" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">My profile</Link>
                      {user.role === "admin" ? (
                        <Link href="/settings" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Application settings</Link>
                      ) : null}
                      <button
                        onClick={doLogout}
                        className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </motion.div>
                  </>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          <SmoothScroll>{children}</SmoothScroll>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e2e8f0] bg-white/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {allowed
            .filter((n) => MOBILE_NAV.includes(n.href))
            .slice(0, 5)
            .map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] sm:text-[11px] font-medium min-w-0 truncate text-center", active ? "text-[#2563eb]" : "text-slate-500")}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate w-full">{item.label.split(" ")[0]}</span>
                </Link>
              );
            })}
        </div>
      </nav>
    </div>
  );
}
