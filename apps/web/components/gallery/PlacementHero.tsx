import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getCustomerUrl } from "@vaahansafe/config";

export function PlacementHero() {
  const customerUrl = getCustomerUrl();

  return (
    <section
      aria-labelledby="placement-hero-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        pt-12 pb-16
        sm:pt-16 sm:pb-20
        lg:pt-20 lg:pb-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className="
            absolute -right-[180px] -top-[180px]
            h-[520px] w-[520px]
            rounded-full
            border border-[#09090b]/[0.03]
            dark:border-white/[0.025]
          "
        />
        <span
          className="
            absolute left-[6%] top-[30%]
            hidden h-1.5 w-1.5
            rounded-full bg-[#cc785c]/40
            lg:block
          "
        />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground dark:text-zinc-500">
          <span className="flex items-center gap-1.5 text-[#cc785c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            PHYSICAL IDENTITY / PLACEMENT
          </span>
          <span className="h-3 w-px bg-[#e4e4e7] dark:bg-white/[0.1]" />
          <span>VISUAL LOCATION GUIDE</span>
        </div>

        <div className="mt-8 max-w-[880px]">
          <h1
            id="placement-hero-heading"
            className="
              font-serif
              text-[2.75rem]
              font-normal
              leading-[1.02]
              tracking-[-0.04em]
              text-foreground
              sm:text-5xl
              md:text-6xl
              lg:text-[4.6rem]
              dark:text-zinc-50
            "
          >
            Made to belong <br className="hidden sm:block" />
            <span className="text-[#cc785c]">on the vehicle.</span>
          </h1>

          <p className="mt-6 max-w-[680px] text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-8 dark:text-zinc-400">
            Explore how a VaahanSafe QR can be positioned so it remains visible and accessible without interfering with important vehicle elements or obscuring driving sightlines.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={`${customerUrl}/order`}
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md bg-[#cc785c] px-6
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-white transition-colors
                hover:bg-[#a9583e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              <span>Get VaahanSafe</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </a>

            <a
              href={`${customerUrl}/activate`}
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md border border-border bg-white px-5
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-foreground transition-colors
                hover:border-[#cc785c] hover:bg-background
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
                dark:border-white/[0.12] dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-[#2f2c28]
              "
            >
              <span>Activate Retail QR</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Master Story Rail */}
        <div className="mt-14 border-t border-border pt-8 dark:border-white/[0.08]">
          <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>Placement Journey</span>
            <span className="text-[#cc785c]">Physical → Digital</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted p-4 font-mono text-[10px] uppercase tracking-wider text-[#3f3f46] dark:border-white/[0.06] dark:bg-zinc-900 dark:text-zinc-400">
            <span>01 Vehicle</span>
            <span className="text-[#cc785c]">→</span>
            <span>02 Visible Position</span>
            <span className="text-[#cc785c]">→</span>
            <span className="font-semibold text-foreground dark:text-zinc-50">03 VaahanSafe QR</span>
            <span className="text-[#cc785c]">→</span>
            <span>04 Smartphone Scan</span>
            <span className="text-[#cc785c]">→</span>
            <span className="text-[#5db8a6]">05 Vehicle Identity</span>
          </div>
        </div>
      </div>
    </section>
  );
}
