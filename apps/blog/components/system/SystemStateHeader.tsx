import * as React from "react";
import Link from "next/link";

interface SystemStateHeaderProps {
  statusLabel?: string;
}

export function SystemStateHeader({
  statusLabel = "SYSTEM NOTICE",
}: SystemStateHeaderProps) {
  return (
    <header className="w-full border-b border-[#e6dfd8] py-4 dark:border-[#2e2b27]">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#141413] hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]"
          aria-label="Return to VaahanSafe Journal front page"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span className="font-semibold">VAAHANSAFE / JOURNAL</span>
        </Link>

        <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#8e8b82] dark:text-[#77736d]">
          <span>{statusLabel}</span>
          <span className="h-2 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]" />
          <span className="text-[#cc785c]">RELIABILITY DISCIPLINE</span>
        </div>
      </div>
    </header>
  );
}
