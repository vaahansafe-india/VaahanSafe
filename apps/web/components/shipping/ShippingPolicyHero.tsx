import * as React from "react";
import { SHIPPING_REPLACEMENT_META } from "../../app/shipping-replacement/shipping-replacement-content";

export function ShippingPolicyHero() {
  return (
    <section
      aria-labelledby="shipping-hero-heading"
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
          SHIPPING / REF / VS-SHIP-2026
        </span>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* Eyebrow & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span className="h-px w-6 bg-[#cc785c]/40" />
            <span className="font-mono text-[8px] font-medium uppercase tracking-[0.22em] text-muted-foreground dark:text-zinc-400">
              Legal / Shipping & Replacement
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.18em] text-muted-foreground/70 dark:text-zinc-500">
            <span>{SHIPPING_REPLACEMENT_META.documentId}</span>
            <span className="h-1 w-1 rounded-full bg-[#cc785c]/60" />
            <span>VaahanSafe Shipping & Replacement Policy</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="mt-8 max-w-[880px]">
          <h1
            id="shipping-hero-heading"
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
            From delivery
            <br />
            to your <span className="text-[#cc785c]">vehicle identity.</span>
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
            This policy explains how physical VaahanSafe orders, delivery issues,
            damaged parcels, and QR replacement requests are handled.
          </p>
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
            <span className="text-muted-foreground/70 dark:text-zinc-500">SHIPPING & REPLACEMENT</span>
          </div>

          <span className="hidden h-3 w-px bg-[#e4e4e7] sm:block dark:bg-[#3f3f46]" />

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/70 dark:text-zinc-500">Effective:</span>
            <span className="font-semibold text-foreground dark:text-zinc-50">
              {SHIPPING_REPLACEMENT_META.effectiveDate}
            </span>
          </div>

          <span className="hidden h-3 w-px bg-[#e4e4e7] sm:block dark:bg-[#3f3f46]" />

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/70 dark:text-zinc-500">Version:</span>
            <span className="font-semibold text-foreground dark:text-zinc-50">
              {SHIPPING_REPLACEMENT_META.version}
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
