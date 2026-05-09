"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

// Define our navigation links
const NAV_LINKS = [
  { href: "/",           label: "Dashboard",   icon: "🏠" },
  { href: "/results",    label: "Results",      icon: "🏁" },
  { href: "/standings",  label: "Standings",    icon: "🏆" },
  { href: "/calendar",   label: "Calendar",     icon: "📅" },
];

export default function Navbar() {
  // usePathname() = tells us which page we're on
  // Used to highlight the active nav link
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">

        {/* Top row - Logo + Status */}
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🏎️</span>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">
                F1 Intelligence
              </h1>
              <p className="text-gray-400 text-xs">2026 Season</p>
            </div>
          </Link>

          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm">Live Data</span>
          </div>
        </div>

        {/* Bottom row - Nav Links */}
        <nav className="flex gap-1 pb-0">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  // Base styles for all links
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium",
                  "rounded-t-lg transition-colors border-b-2",
                  // Active page styles
                  isActive
                    ? "text-white border-red-500 bg-gray-800"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-gray-800"
                )}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}