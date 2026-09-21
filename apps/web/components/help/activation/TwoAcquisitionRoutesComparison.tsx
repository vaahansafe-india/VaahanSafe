import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function TwoAcquisitionRoutesComparison() {
  return (
    <section
      aria-labelledby="acquisition-routes-heading"
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
          <span>System Architecture</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="acquisition-routes-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            Two acquisition routes.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Whether you order directly through our website or purchase an authorized packaged kit from a dealership, both paths converge on the exact same high-availability roadside platform.
          </p>
        </div>

        {/* Comparison Split Rail */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Route A: Online */}
          <div className="rounded-2xl border border-border bg-muted/50 p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-900">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#cc785c]">
              ONLINE
            </div>
            <h3 className="mt-2 font-serif text-2xl text-foreground dark:text-zinc-50">
              Direct Order &amp; Delivery
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              Configured during checkout. The QR arrives pre-associated with your vehicle identity.
            </p>

            <div className="mt-6 space-y-2 font-mono text-[11px] text-[#3f3f46] dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="text-[#cc785c]">01</span>
                <span>Get VaahanSafe</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#cc785c]">→</span>
                <span>Receive QR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#cc785c]">→</span>
                <span>Vehicle identity</span>
              </div>
            </div>
          </div>

          {/* Route B: Retail */}
          <div className="rounded-2xl border border-border bg-muted/50 p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-900">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#5db8a6]">
              RETAIL
            </div>
            <h3 className="mt-2 font-serif text-2xl text-foreground dark:text-zinc-50">
              Dealer &amp; In-Store Kit
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              Purchased in-store from partner dealerships or accessories shops. Activated on-demand via the scratch security key.
            </p>

            <div className="mt-6 space-y-2 font-mono text-[11px] text-[#3f3f46] dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="text-[#5db8a6]">01</span>
                <span>Buy QR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#5db8a6]">→</span>
                <span>Activate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#5db8a6]">→</span>
                <span>Vehicle identity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Platform Banner */}
        <div className="mt-8 rounded-xl border border-border bg-white p-5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground dark:border-white/[0.08] dark:bg-zinc-950 dark:text-muted-foreground">
          TWO ACQUISITION CHANNELS. ONE QR INFRASTRUCTURE.
        </div>
      </div>
    </section>
  );
}
