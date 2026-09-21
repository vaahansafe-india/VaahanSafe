import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getActivateUrl } from "@vaahansafe/config";

export function RetailActivationHero() {
  const activateUrl = getActivateUrl();

  return (
    <section
      aria-labelledby="activation-hero-heading"
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
            absolute -left-[200px] -top-[200px]
            h-[540px] w-[540px]
            rounded-full
            border border-[#09090b]/[0.03]
            dark:border-white/[0.025]
          "
        />
        <span
          className="
            absolute right-[8%] top-[25%]
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
            HELP / RETAIL ACTIVATION
          </span>
          <span className="h-3 w-px bg-[#e4e4e7] dark:bg-white/[0.1]" />
          <span>MODEL B ENROLLMENT</span>
        </div>

        <div className="mt-8 max-w-[820px]">
          <h1
            id="activation-hero-heading"
            className="
              font-serif
              text-[2.75rem]
              font-normal
              leading-[1.02]
              tracking-[-0.04em]
              text-foreground
              sm:text-5xl
              md:text-6xl
              lg:text-[4.4rem]
              dark:text-zinc-50
            "
          >
            Already have a <br className="hidden sm:block" />
            <span className="text-[#cc785c]">VaahanSafe QR?</span>
          </h1>

          <p className="mt-6 max-w-[660px] text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-8 dark:text-zinc-400">
            If you purchased a VaahanSafe QR through an automotive dealership, accessory store, or service partner, activation connects that pre-issued physical decal to your private account and vehicle profile.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={activateUrl}
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md bg-[#cc785c] px-6
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-white transition-colors
                hover:bg-[#a9583e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              <span>Activate Retail QR</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </a>

            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/80 px-4 py-2 font-mono text-[10px] text-muted-foreground dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
              <span>Instant Roadside Binding</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
