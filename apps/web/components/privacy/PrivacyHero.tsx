import * as React from "react";
import { PRIVACY_POLICY_META } from "../../app/privacy/privacy-policy-content";

export function PrivacyHero() {
  return (
    <section
      aria-labelledby="privacy-hero-heading"
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
            border border-[#09090b]/[0.03]
            dark:border-white/[0.025]
          "
        />

        {/* Secondary registration arc */}
        <span
          className="
            absolute -right-[220px] top-[10%]
            h-[540px] w-[540px]
            rounded-full
            border border-[#cc785c]/[0.045]
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

        {/* Sparse registration points */}
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

        {/* Technical vertical coordinate rail */}
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
          POLICY / REF / VS-PRIV-2026
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
              Legal / Privacy
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.18em] text-muted-foreground/70 dark:text-zinc-500">
            <span>{PRIVACY_POLICY_META.documentId}</span>
            <span className="h-1 w-1 rounded-full bg-[#cc785c]/60" />
            <span>VaahanSafe Privacy Policy</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN HEADLINE                                            */}
        {/* ======================================================== */}

        <div className="mt-8 max-w-[880px]">
          <h1
            id="privacy-hero-heading"
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
            Your information.
            <br />
            Your vehicle identity.
            <br />
            <span className="text-[#cc785c]">Your control.</span>
          </h1>

          <p
            className="
              mt-6 max-w-[680px]
              text-base leading-relaxed
              text-muted-foreground
              sm:text-lg
              sm:leading-8
              dark:text-zinc-400
            "
          >
            This Privacy Policy explains how VaahanSafe handles information across
            your account, vehicle identity, QR activation, public safety view, and
            related services.
          </p>
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
            <span className="text-muted-foreground/70 dark:text-zinc-500">Effective:</span>
            <span className="font-semibold text-foreground dark:text-zinc-50">
              {PRIVACY_POLICY_META.effectiveDate}
            </span>
          </div>

          <span className="hidden h-3 w-px bg-[#e4e4e7] sm:block dark:bg-[#3f3f46]" />

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/70 dark:text-zinc-500">Version:</span>
            <span className="font-semibold text-foreground dark:text-zinc-50">
              {PRIVACY_POLICY_META.version}
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
