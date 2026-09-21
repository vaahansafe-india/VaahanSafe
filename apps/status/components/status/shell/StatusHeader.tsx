import * as React from "react";
import Link from "next/link";
import { getWebUrl } from "@vaahansafe/config";

import { StatusThemeToggle } from "./StatusThemeToggle";

interface StatusHeaderProps {
  statusLabel?: string;
  isDegradedOrOutage?: boolean;
}

export function StatusHeader({ statusLabel, isDegradedOrOutage }: StatusHeaderProps) {
  const webUrl = getWebUrl();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e6dfd8] bg-[#faf9f5]/90 backdrop-blur-md antialiased transition-colors dark:border-[#2e2b27] dark:bg-[#181715]/90">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity & Active Indicator */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#141413] hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c] transition-colors"
          >
            <span className="flex h-2 w-2 items-center justify-center">
              <span
                className={`h-2 w-2 rounded-full ${
                  isDegradedOrOutage
                    ? "bg-[#c64545] animate-pulse"
                    : "bg-[#5db872]"
                }`}
              />
            </span>
            <span>VAAHANSAFE / STATUS</span>
          </Link>
          {statusLabel && (
            <span className="hidden sm:inline-flex items-center font-mono text-[9px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
              &bull; {statusLabel}
            </span>
          )}
        </div>

        {/* Right: Technical Links & Theme Toggle */}
        <div className="flex items-center gap-4 sm:gap-6">
          <nav aria-label="Status navigation" className="flex items-center gap-4 sm:gap-6 font-mono text-xs uppercase tracking-wider text-[#6c6a64] dark:text-[#a09d96]">
            <Link
              href="/history"
              className="hover:text-[#cc785c] dark:hover:text-[#cc785c] transition-colors"
            >
              History
            </Link>
            <Link
              href="/methodology"
              className="hover:text-[#cc785c] dark:hover:text-[#cc785c] transition-colors"
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

          <div className="h-4 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]" aria-hidden="true" />

          <StatusThemeToggle />
        </div>
      </div>
    </header>
  );
}
