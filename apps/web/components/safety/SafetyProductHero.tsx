import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getCustomerUrl } from "@vaahansafe/config";

export function SafetyProductHero() {
  const customerUrl = getCustomerUrl();

  return (
    <section
      aria-labelledby="safety-product-hero-heading"
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
      {/* Registration background geometry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className="
            absolute -left-[200px] -top-[200px]
            h-[560px] w-[560px]
            rounded-full
            border border-[#09090b]/[0.03]
            dark:border-white/[0.025]
          "
        />
        <span
          className="
            absolute right-[10%] top-[25%]
            hidden h-1.5 w-1.5
            rounded-full bg-[#5db8a6]/50
            lg:block
          "
        />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground dark:text-zinc-500">
          <span className="flex items-center gap-1.5 text-[#5db8a6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
            PRODUCT / SAFETY &amp; PRIVACY
          </span>
          <span className="h-3 w-px bg-[#e4e4e7] dark:bg-white/[0.1]" />
          <span>INFORMATION ARCHITECTURE</span>
        </div>

        <div className="mt-8 max-w-[880px]">
          <h1
            id="safety-product-hero-heading"
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
            Useful when scanned.{" "}
            <br className="hidden sm:block" />
            <span className="text-[#cc785c]">
              Private where it matters.
            </span>
          </h1>

          <p className="mt-6 max-w-[680px] text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-8 dark:text-zinc-400">
            Your VaahanSafe account and the safety view opened by your vehicle QR
            are different experiences. You control the supported information made
            available through the public safety view.
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

            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/80 px-4 py-2 font-mono text-[10px] text-muted-foreground dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
              <span>Zero Public Account Exposure</span>
            </div>
          </div>
        </div>

        {/* 4-Step Core Story Indicator */}
        <div className="mt-14 border-t border-border pt-8 dark:border-white/[0.08]">
          <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>Information Progression</span>
            <span className="text-[#cc785c]">Core Model</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted p-4 dark:border-white/[0.06] dark:bg-zinc-900">
              <span className="font-mono text-[8px] text-muted-foreground">01</span>
              <div className="mt-1 font-serif text-base text-foreground dark:text-zinc-50">Private</div>
              <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">Account Data</div>
            </div>

            <div className="rounded-xl border border-[#cc785c]/30 bg-[#cc785c]/[0.04] p-4">
              <span className="font-mono text-[8px] text-[#cc785c]">02</span>
              <div className="mt-1 font-serif text-base text-[#cc785c]">Control</div>
              <div className="font-mono text-[8px] uppercase tracking-wider text-[#cc785c]">Owner Switches</div>
            </div>

            <div className="rounded-xl border border-border bg-muted p-4 dark:border-white/[0.06] dark:bg-zinc-900">
              <span className="font-mono text-[8px] text-muted-foreground">03</span>
              <div className="mt-1 font-serif text-base text-foreground dark:text-zinc-50">Select</div>
              <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">Chosen Fields</div>
            </div>

            <div className="rounded-xl border border-[#5db8a6]/30 bg-[#5db8a6]/[0.04] p-4">
              <span className="font-mono text-[8px] text-[#5db8a6]">04</span>
              <div className="mt-1 font-serif text-base text-[#5db8a6]">Public View</div>
              <div className="font-mono text-[8px] uppercase tracking-wider text-[#5db8a6]">Scanned Context</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
