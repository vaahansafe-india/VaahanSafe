import * as React from "react";
import Link from "next/link";
import { SystemStateHeader } from "./SystemStateHeader";
import { SystemSignalRail, SystemStateType } from "./SystemSignalRail";

interface JournalSystemStateProps {
  statusCode?: string;
  stateLabel: string;
  headline: React.ReactNode;
  description: React.ReactNode;
  railType: SystemStateType;
  actions?: React.ReactNode;
  referenceId?: string;
  children?: React.ReactNode;
  headerStatusLabel?: string;
}

export function JournalSystemState({
  statusCode,
  stateLabel,
  headline,
  description,
  railType,
  actions,
  referenceId,
  children,
  headerStatusLabel,
}: JournalSystemStateProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      {/* 1. Minimal Publication Masthead */}
      <SystemStateHeader statusLabel={headerStatusLabel || stateLabel.split("•")[0]?.trim()} />

      {/* 2. Main Center Editorial Layout */}
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="w-full max-w-2xl space-y-8">
          {/* Eyebrow / State Label */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] dark:text-[#77736d]">
            <span className="flex items-center gap-1.5 font-semibold text-[#cc785c]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              {stateLabel}
            </span>
            {referenceId && (
              <>
                <span className="h-2.5 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]" />
                <span>REF: {referenceId}</span>
              </>
            )}
          </div>

          {/* Large Status Code & Serif Headline */}
          <div className="space-y-4">
            {statusCode && (
              <div className="font-mono text-5xl sm:text-6xl font-normal tracking-tight text-[#141413]/25 dark:text-[#faf9f5]/25">
                {statusCode}
              </div>
            )}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[3.25rem] font-normal leading-[1.08] tracking-tight text-[#141413] dark:text-[#faf9f5]">
              {headline}
            </h1>
          </div>

          {/* Signature Identity Signal Geometry */}
          <div className="pt-2">
            <SystemSignalRail type={railType} />
          </div>

          {/* Human Readable Explanation */}
          <div className="max-w-xl font-sans text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
            {description}
          </div>

          {/* Actions Block */}
          {actions && <div className="pt-4">{actions}</div>}

          {/* Optional Content Inset (e.g. recent safe stories for 404) */}
          {children && <div className="pt-6 border-t border-[#e6dfd8] dark:border-[#2e2b27]">{children}</div>}
        </div>
      </main>

      {/* 3. Minimal Technical Footer */}
      <footer className="w-full border-t border-[#e6dfd8] py-4 dark:border-[#2e2b27]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 font-mono text-[9px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
          <div>VAAHANSAFE JOURNAL &bull; CALM SYSTEM ARCHITECTURE</div>
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:text-[#cc785c] transition-colors">
              Journal Home
            </Link>
            <span>&bull;</span>
            <Link href="/guides" className="hover:text-[#cc785c] transition-colors">
              Guides
            </Link>
            <span>&bull;</span>
            <a
              href="https://status.vaahansafe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#cc785c] transition-colors"
            >
              Status ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
