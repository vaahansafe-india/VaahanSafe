import * as React from "react";
import { REFUND_POLICY_META } from "../../app/refund-policy/refund-policy-content";

export function RefundPolicyHero() {
  return (
    <section
      aria-labelledby="refund-hero-heading"
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
      {/* ========================================================== */}
      {/* AMBIENT IDENTITY GEOMETRY                                  */}
      {/* ========================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Large registration arc */}
        <span
          className="
            absolute -left-[240px] -top-[240px]
            h-[600px] w-[600px]
            rounded-full
            border border-[#09090b]/[0.035]
            dark:border-white/[0.03]
          "
        />

        {/* Secondary registration arc */}
        <span
          className="
            absolute -right-[220px] top-[12%]
            h-[540px] w-[540px]
            rounded-full
            border border-[#cc785c]/[0.05]
          "
        />

        {/* Center alignment rail */}
        <span
          className="
            absolute left-1/2 top-0
            hidden h-24 w-px
            -translate-x-1/2
            bg-gradient-to-b from-[#cc785c]/30 to-transparent
            lg:block
          "
        />

        {/* Registration points */}
        <span
          className="
            absolute left-[10%] top-[35%]
            hidden h-1.5 w-1.5
            rounded-full bg-[#cc785c]/50
            lg:block
          "
        />

        <span
          className="
            absolute right-[12%] top-[45%]
            hidden h-1.5 w-1.5
            rounded-full bg-[#5db8a6]/40
            lg:block
          "
        />

        {/* Vertical technical coordinate rail */}
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
          REFUND / REF / VS-RFND-2026
        </span>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* ======================================================== */}
        {/* EYEBROW & METADATA                                       */}
        {/* ======================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span className="h-px w-6 bg-[#cc785c]/40" />
            <span className="font-mono text-[8px] font-medium uppercase tracking-[0.22em] text-muted-foreground dark:text-zinc-400">
              Legal / Refunds
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.18em] text-muted-foreground/70 dark:text-zinc-500">
            <span>{REFUND_POLICY_META.documentId}</span>
            <span className="h-1 w-1 rounded-full bg-[#cc785c]/60" />
            <span>VaahanSafe Refund Policy</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN HEADLINE                                            */}
        {/* ======================================================== */}
        <div className="mt-8 max-w-[880px]">
          <h1
            id="refund-hero-heading"
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
            Clear before
            <br />
            <span className="text-[#cc785c]">you purchase.</span>
          </h1>

          {/* ====================================================== */}
          {/* PROMINENT POLICY STATEMENT (NOT HIDDEN)                 */}
          {/* ====================================================== */}
          <div className="mt-8 rounded-2xl border border-border bg-muted p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-900">
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-[#cc785c]">
              Purchase Policy
            </span>

            <h2 className="mt-2 font-serif text-2xl font-normal text-foreground sm:text-3xl dark:text-zinc-50">
              Completed VaahanSafe purchases are generally non-refundable.
            </h2>

            <p className="mt-3 max-w-[680px] text-xs leading-relaxed text-[#3f3f46] sm:text-sm sm:leading-7 dark:text-zinc-400">
              Please review your vehicle registration details, QR decal selection,
              delivery address, and subscription plans carefully before completing a
              purchase.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5db8a6]" />
              <span>
                Exceptions may apply where a refund or another remedy is required under
                applicable law.
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DOCUMENT METADATA RAIL                                   */}
        {/* ======================================================== */}
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
            <span className="text-muted-foreground/70 dark:text-zinc-500">REFUND POLICY</span>
          </div>

          <span className="hidden h-3 w-px bg-[#e4e4e7] sm:block dark:bg-[#3f3f46]" />

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/70 dark:text-zinc-500">Effective:</span>
            <span className="font-semibold text-foreground dark:text-zinc-50">
              {REFUND_POLICY_META.effectiveDate}
            </span>
          </div>

          <span className="hidden h-3 w-px bg-[#e4e4e7] sm:block dark:bg-[#3f3f46]" />

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/70 dark:text-zinc-500">Version:</span>
            <span className="font-semibold text-foreground dark:text-zinc-50">
              {REFUND_POLICY_META.version}
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
