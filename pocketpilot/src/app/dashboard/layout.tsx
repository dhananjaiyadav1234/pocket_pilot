"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/budgets", label: "Budgets" },
  { href: "/dashboard/ai-planner", label: "AI Planner" },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-semibold">
              ₹
            </span>
            <div>
              <h1 className="text-base font-semibold tracking-tight">
                PocketPilot
              </h1>
              <p className="text-[11px] text-slate-400">
                Personal finance cockpit · Next.js + MongoDB
              </p>
            </div>
          </div>

          {/* Nav pills */}
          <nav className="flex gap-2 text-xs md:text-sm">
            {NAV_ITEMS.map((item) => (
              <NavPill
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActive(pathname, item.href)}
              />
            ))}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

function NavPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-4 py-1.5 transition-all border",
        active
          ? "border-emerald-400 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]"
          : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-emerald-400/70 hover:text-emerald-200 hover:bg-slate-900",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

/**
 * A route is "active" if:
 *   - it matches exactly, or
 *   - current path starts with href + "/" (so /dashboard/budgets/edit still highlights Budgets)
 */
function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (pathname === href) return true;
  return pathname.startsWith(href + "/");
}