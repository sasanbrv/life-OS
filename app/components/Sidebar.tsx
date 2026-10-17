
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type SidebarProps = {
  userName: string;
};

const sections = [
  { label: "Dashboard", href: "/dashboard", icon: "▦" },
  { label: "Tasks", href: "/tasks", icon: "✓" },
  { label: "Habits", href: "/habits", icon: "↻" },
  { label: "Goals", href: "/goals", icon: "◎" },
  { label: "Focus", href: "/focus", icon: "◷" },
  { label: "Settings", href: "/settings", icon: "⚙" },
];

type SidebarContentProps = {
  userName: string;
  pathname: string;
  loggingOut: boolean;
  logoutError: string;
  onLogout: () => void;
  onNavigate: () => void;
};

function SidebarContent({
  userName,
  pathname,
  loggingOut,
  logoutError,
  onLogout,
  onNavigate,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-[#0D1325] px-5 py-6">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mb-10 flex items-center gap-3"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-xl font-bold">
          L
        </div>
        <div>
          <p className="text-lg font-bold text-white">Life OS</p>
          <p className="text-xs text-slate-400">Personal Workspace</p>
        </div>
      </Link>

      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Workspace
      </p>

      <nav className="space-y-2">
        {sections.map((section) => {
          const active =
            pathname === section.href ||
            (section.href !== "/dashboard" &&
              pathname.startsWith(`${section.href}/`));

          return (
            <Link
              key={section.href}
              href={section.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="w-6 text-center text-lg">
                {section.icon}
              </span>
              <span className="font-medium">{section.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-5">
        <p className="mb-3 px-1 text-xs text-slate-500">
          Signed in as
        </p>

        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
            {userName.trim().charAt(0).toUpperCase() || "U"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-white">{userName}</p>
            <p className="text-xs text-slate-400">Personal Account</p>
          </div>
        </div>

        {logoutError && (
          <p className="mt-3 text-sm text-red-400">{logoutError}</p>
        )}

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
        >
          <span>↪</span>
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/");
      router.refresh();
    } catch {
      setLogoutError("logout faild please try again");
      setLoggingOut(false);
    }
  }

  const contentProps: SidebarContentProps = {
    userName,
    pathname,
    loggingOut,
    logoutError,
    onLogout: handleLogout,
    onNavigate: closeMenu,
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#0D1325] px-5 lg:hidden">
        <Link href="/dashboard" className="font-bold text-white">
          Life OS
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="rounded-lg border border-white/10 px-3 py-2 text-xl text-white"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMenu}
            className="absolute inset-0 bg-black/60"
          />

          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-white/10">
            <SidebarContent {...contentProps} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 lg:block">
        <SidebarContent {...contentProps} />
      </aside>
    </>
  );
}
