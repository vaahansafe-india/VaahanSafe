import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function ReplacementContinuityFlow() {
  return (
    <section
      aria-labelledby="replacement-continuity-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        py-16
        sm:py-20
        lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left: Sequence Diagram */}
          <div className="rounded-2xl border border-border bg-muted p-6 dark:border-white/[0.08] dark:bg-zinc-900 sm:p-8">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Hardware Lifecycle</span>
              <span className="text-[#cc785c]">Preserved Identity</span>
            </div>

            {/* Vertical/Horizontal Transition Rail */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <div>
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                    Current Physical Decal
                  </span>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
                    VS / QR / 01
                  </p>
                </div>
                <span className="rounded bg-[#c64545]/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#c64545]">
                  Damaged / Replaced
                </span>
              </div>

              <div className="flex justify-center font-mono text-xs text-[#cc785c]">
                ↓ Replacement Request &amp; Verification
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#cc785c]/30 bg-background p-4 dark:border-[#cc785c]/40 dark:bg-zinc-950">
                <div>
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#cc785c]">
                    New Physical Decal
                  </span>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
                    VS / QR / 02
                  </p>
                </div>
                <span className="rounded bg-[#5db8a6]/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#5db8a6]">
                  Activated
                </span>
              </div>

              <div className="flex justify-center font-mono text-xs text-[#5db8a6]">
                ↓ Reconnected To Same Vehicle Record
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#5db8a6]/40 bg-[#5db8a6]/[0.06] p-4">
                <div>
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#5db8a6]">
                    Continuous Vehicle Identity
                  </span>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
                    VS-7F3K-9021 &bull; DEMO
                  </p>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-[#5db8a6]">
                  PRESERVED
                </span>
              </div>
            </div>
          </div>

          {/* Right: Editorial Narrative */}
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              10 / Physical Resilience
            </span>

            <h2
              id="replacement-continuity-heading"
              className="
                mt-3 font-serif
                text-3xl font-normal leading-[1.1]
                tracking-[-0.03em]
                text-foreground
                sm:text-4xl
                lg:text-5xl
                dark:text-zinc-50
              "
            >
              The physical sticker can change.
              <br />
              The identity remains intact.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
              Windshields crack, vehicles get repainted, and exterior stickers
              encounter weathering over years of road use. VaahanSafe is built so
              that physical decal replacement does not require starting your
              vehicle history from scratch.
            </p>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-6 dark:text-muted-foreground">
              Where supported by the applicable replacement process, an authorized
              new QR can be paired to the same vehicle identity, safely retiring
              the previous decal.
            </p>

            <div className="mt-8">
              <Link
                href="/shipping-replacement"
                className="
                  inline-flex items-center gap-2 font-mono text-[11px]
                  font-medium uppercase tracking-[0.14em] text-[#cc785c]
                  hover:text-[#a9583e]
                "
              >
                <span>Read Shipping &amp; Replacement Policy</span>
                <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
