import * as React from "react";
import { SAFETY_DISCLAIMER_META } from "../../app/safety-disclaimer/safety-disclaimer-content";

export function SafetyDisclaimerHero() {
  return (
    <section
      aria-labelledby="safety-hero-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        pt-16 pb-16
        sm:pt-24 sm:pb-20
        lg:pt-28 lg:pb-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      {/* Ambient Identity Geometry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className="
            absolute -left-[240px] -top-[240px]
            h-[600px] w-[600px]
            rounded-full
            border border-[#09090b]/[0.035]
            dark:border-white/[0.03]
          "
        />

        <span
          className="
            absolute -right-[220px] top-[12%]
            h-[540px] w-[540px]
            rounded-full
            border border-[#cc785c]/[0.05]
          "
        />

        <span
          className="
            absolute left-1/2 top-0
            hidden h-24 w-px
            -translate-x-1/2
            bg-gradient-to-b from-[#cc785c]/30 to-transparent
            lg:block
          "
        />

        <span
          className="
            absolute left-8 top-1/2
            hidden -rotate-90
            font-mono text-[7px]
            uppercase tracking-[0.25em]
            text-muted-foreground/70
            xl:block
            dark:text-zinc-500
          "
        >
          SAFETY / REF / VS-SAFE-2026
        </span>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* Eyebrow & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span className="h-px w-6 bg-[#cc785c]/40" />
            <span className="font-mono text-[8px] font-medium uppercase tracking-[0.22em] text-muted-foreground dark:text-zinc-400">
              Legal / Safety
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.18em] text-muted-foreground/70 dark:text-zinc-500">
            <span>{SAFETY_DISCLAIMER_META.documentId}</span>
            <span className="h-1 w-1 rounded-full bg-[#cc785c]/60" />
            <span>VaahanSafe Safety Disclaimer</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="mt-8 max-w-[880px]">
          <h1
            id="safety-hero-heading"
            className="
              font-serif
              text-[2.75rem] font-normal
              leading-[0.98]
              tracking-[-0.04em]
              text-foreground
              sm:text-5xl
              md:text-6xl
              lg:text-[4.25rem]
              dark:text-zinc-50
            "
          >
            Useful information
            <br />
            <span className="text-[#cc785c]">when it matters.</span>
          </h1>

          {/* Core Primary Statement Box */}
          <div className="mt-8 rounded-2xl border border-border bg-muted p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-900">
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-[#cc785c]">
              Core Safety Principle
            </span>

            <h2 className="mt-2 font-serif text-2xl font-normal text-foreground sm:text-3xl dark:text-zinc-50">
              VaahanSafe supports connection. It does not replace emergency services.
            </h2>

            <p className="mt-3 max-w-[680px] text-xs leading-relaxed text-[#3f3f46] sm:text-sm sm:leading-7 dark:text-zinc-400">
              This Safety Disclaimer explains the role and limitations of VaahanSafe&apos;s
              vehicle QR decal, safety view, user-configured medical markers, and emergency
              contact relay features.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5db8a6]" />
              <span>
                In any life-threatening situation or collision, bystanders must dial 112, 100, or 108 immediately.
              </span>
            </div>
          </div>
        </div>

        {/* Document Metadata Rail */}
        <div
          className="
            mt-10 flex flex-wrap items-center gap-x-8 gap-y-3
            border-t border-border pt-6
            font-mono text-[8px] uppercase tracking-[0.16em]
            text-muted-foreground
            dark:border-white/[0.08] dark:text-zinc-500
          "
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/70 dark:text-zinc-500">SAFETY DISCLAIMER</span>
          </div>

          <span className="hidden h-3 w-px bg-[#e4e4e7] sm:block dark:bg-[#3f3f46]" />

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/70 dark:text-zinc-500">Effective:</span>
            <span className="font-semibold text-foreground dark:text-zinc-50">
              {SAFETY_DISCLAIMER_META.effectiveDate}
            </span>
          </div>

          <span className="hidden h-3 w-px bg-[#e4e4e7] sm:block dark:bg-[#3f3f46]" />

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/70 dark:text-zinc-500">Version:</span>
            <span className="font-semibold text-foreground dark:text-zinc-50">
              {SAFETY_DISCLAIMER_META.version}
            </span>
          </div>

          <span className="hidden h-3 w-px bg-[#e4e4e7] sm:block dark:bg-[#3f3f46]" />

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
            <span className="text-[#5db8a6]">Active Architecture</span>
          </div>
        </div>
      </div>
    </section>
  );
}
