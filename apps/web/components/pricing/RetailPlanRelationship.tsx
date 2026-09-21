import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getCustomerUrl } from "@vaahansafe/config";

export function RetailPlanRelationship() {
  const customerUrl = getCustomerUrl();

  return (
    <section
      aria-labelledby="retail-relationship-heading"
      className="
        border-b border-border
        bg-background
        py-16 sm:py-20 lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>07 / Retail Kits & Plans</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="retail-relationship-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl
              dark:text-zinc-50
            "
          >
            Bought a retail kit from a dealer or store?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Authorized retail packs already include the physical decal asset. You can enroll your kit immediately into any service tier during online activation.
          </p>
        </div>

        {/* Unified Infrastructure Banner */}
        <div className="mt-8 rounded-xl border border-border bg-muted p-6 dark:border-white/[0.08] dark:bg-zinc-900">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#cc785c]">
                Unified Architecture
              </div>
              <div className="font-mono text-base font-semibold tracking-wider text-foreground dark:text-zinc-50">
                TWO ACQUISITION CHANNELS. ONE QR INFRASTRUCTURE.
              </div>
              <p className="max-w-[620px] text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                Whether you order directly through our website or purchase an authorized packaged decal kit from an automotive partner, your vehicle is protected on the exact same high-availability roadside platform.
              </p>
            </div>

            <div className="shrink-0">
              <a
                href={`${customerUrl}/activate`}
                className="
                  inline-flex h-11 items-center justify-center gap-2
                  rounded-md border border-[#09090b] bg-[#09090b] px-6
                  font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                  text-white transition-colors
                  hover:bg-[#27272a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
                  dark:border-[#fafafa] dark:bg-background dark:text-foreground dark:hover:bg-[#e4e4e7]
                "
              >
                <span>Activate Retail Kit</span>
                <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
