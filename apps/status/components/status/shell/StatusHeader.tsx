"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getWebUrl } from "@vaahansafe/config";
import { VaahanSafeMark } from "@vaahansafe/ui/brand";

import { StatusThemeToggle } from "./StatusThemeToggle";

interface StatusHeaderProps {
  statusLabel?: string;
  isDegradedOrOutage?: boolean;
}

export function StatusHeader({ statusLabel, isDegradedOrOutage }: StatusHeaderProps) {
  const webUrl =
    typeof getWebUrl === "function"
      ? getWebUrl()
      : process.env.NEXT_PUBLIC_WEB_URL || "https://vaahansafe.com";
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e6dfd8] bg-[#faf9f5]/95 backdrop-blur-md antialiased transition-colors dark:border-[#2e2b27] dark:bg-[#181715]/95">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left: Brand Identity & Active Condition */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-colors shrink-0"
            aria-label="VaahanSafe Status Home"
          >
            {/* Professional Brand Mark Emblem with Status Pulse Badge */}
            <div className="relative flex items-center justify-center shrink-0">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white border border-[#e6dfd8] text-[#141413] shadow-xs dark:bg-[#201f1c] dark:border-[#2e2b27] dark:text-[#faf9f5] dark:shadow-none transition-all group-hover:scale-105">
                <VaahanSafeMark size={18} variant="brand" aria-hidden="true" />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-[#181715] ${
                  isDegradedOrOutage
                    ? "bg-[#c64545] animate-pulse"
                    : "bg-[#5db872]"
                }`}
                title={isDegradedOrOutage ? "Degraded or Outage" : "Operational"}
              />
            </div>

            {/* Brand & Portal Title */}
            <div className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs font-semibold tracking-[0.16em] sm:tracking-[0.2em] text-[#141413] dark:text-[#faf9f5] transition-colors">
              <span className="group-hover:text-[#cc785c] transition-colors">VAAHANSAFE</span>
              <span className="text-[#8e8b82] dark:text-[#77736d] font-normal">/</span>
              <span className="text-[#cc785c]">STATUS</span>
            </div>
          </Link>

          {statusLabel && (
            <span className="hidden sm:inline-flex items-center font-mono text-[9px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d] shrink-0">
              &bull; {statusLabel}
            </span>
          )}
        </div>

        {/* Right: Actions & Navigation */}
        <div className="flex items-center gap-2 sm:gap-5">
          {/* Desktop Navigation */}
          <nav
            aria-label="Status navigation"
            className="hidden md:flex items-center gap-5 lg:gap-6 font-mono text-xs uppercase tracking-wider text-[#6c6a64] dark:text-[#a09d96]"
          >
            <Link
              href="/history"
              className={`hover:text-[#cc785c] dark:hover:text-[#cc785c] transition-colors ${
                pathname === "/history" ? "text-[#cc785c] font-semibold" : ""
              }`}
            >
              History
            </Link>
            <Link
              href="/methodology"
              className={`hover:text-[#cc785c] dark:hover:text-[#cc785c] transition-colors ${
                pathname === "/methodology" ? "text-[#cc785c] font-semibold" : ""
              }`}
            >
              Methodology
            </Link>
            <a
              href={webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#cc785c] dark:hover:text-[#cc785c] transition-colors"
            >
              <span>VaahanSafe</span>
              <span className="text-[10px]">↗</span>
            </a>
          </nav>

          <div className="hidden md:block h-4 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]" aria-hidden="true" />

          {/* Theme Toggle (Always accessible) */}
          <StatusThemeToggle />

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg border border-[#e6dfd8] text-[#141413] hover:bg-[#f5f0e8] dark:border-[#2e2b27] dark:text-[#faf9f5] dark:hover:bg-[#1f1e1b] transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-[#faf9f5]/98 dark:bg-[#181715]/98 backdrop-blur-lg border-b border-[#e6dfd8] dark:border-[#2e2b27] px-6 py-8 animate-in fade-in slide-in-from-top-2 duration-200 overflow-y-auto">
          <div className="flex flex-col gap-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
              NAVIGATION &bull; STATUS PORTAL
            </div>

            <nav className="flex flex-col gap-4 font-mono text-sm uppercase tracking-wider">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 border-b border-[#e6dfd8] dark:border-[#2e2b27] flex items-center justify-between ${
                  pathname === "/" ? "text-[#cc785c] font-semibold" : "text-[#141413] dark:text-[#faf9f5]"
                }`}
              >
                <span>Current Status &bull; Pulse</span>
                <span className="text-xs">&rarr;</span>
              </Link>
              <Link
                href="/history"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 border-b border-[#e6dfd8] dark:border-[#2e2b27] flex items-center justify-between ${
                  pathname === "/history" ? "text-[#cc785c] font-semibold" : "text-[#141413] dark:text-[#faf9f5]"
                }`}
              >
                <span>Reliability History</span>
                <span className="text-xs">&rarr;</span>
              </Link>
              <Link
                href="/methodology"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 border-b border-[#e6dfd8] dark:border-[#2e2b27] flex items-center justify-between ${
                  pathname === "/methodology" ? "text-[#cc785c] font-semibold" : "text-[#141413] dark:text-[#faf9f5]"
                }`}
              >
                <span>Status Methodology</span>
                <span className="text-xs">&rarr;</span>
              </Link>
              <a
                href={webUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-[#e6dfd8] dark:border-[#2e2b27] flex items-center justify-between text-[#6c6a64] dark:text-[#a09d96]"
              >
                <span>VaahanSafe Main Site</span>
                <span className="text-xs">↗</span>
              </a>
            </nav>

            <div className="pt-4 space-y-2 font-mono text-[10px] text-[#8e8b82] dark:text-[#77736d]">
              <div>INDEPENDENT REPORTING RUNTIME</div>
              <div>CLOUDFLARE EDGE &bull; REAL LIVE TELEMETRY</div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
