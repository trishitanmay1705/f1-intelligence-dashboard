"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import F1Logo from "./F1Logo";

const NAV_LINKS = [
  { href: "/",          label: "Dashboard",  icon: "🏠" },
  { href: "/results",   label: "Results",    icon: "🏁" },
  { href: "/standings", label: "Standings",  icon: "🏆" },
  { href: "/calendar",  label: "Calendar",   icon: "📅" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="racing-stripe bg-f1-carbon border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">

        {/* Top row */}
        <div className="flex items-center justify-between py-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-f1-dark border border-white/10 rounded-lg px-3 py-2 group-hover:border-f1-red/50 transition-colors">
              <F1Logo size="sm" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-500 tracking-widest uppercase">
                Intelligence Dashboard
              </p>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
              <div className="live-dot" />
              <span className="text-green-400 text-xs font-bold uppercase tracking-wider">
                Live
              </span>
            </div>
            <div className="hidden sm:block f1-badge">
              2026 Season
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex gap-0.5">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold",
                  "rounded-t-lg transition-all duration-200",
                  "border-b-2 tracking-wide uppercase",
                  isActive
                    ? ["text-white", "border-f1-red", "bg-white/5"]
                    : ["text-gray-500", "border-transparent",
                       "hover:text-white", "hover:bg-white/5",
                       "hover:border-white/20"]
                )}
              >
                <span className="text-base">{link.icon}</span>
                <span className="hidden sm:block">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}