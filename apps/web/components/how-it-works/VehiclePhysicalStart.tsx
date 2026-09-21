import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function VehiclePhysicalStart() {
  return (
    <section
      aria-labelledby="physical-start-heading"
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
          {/* Visual stage: line art silhouette + coral entry point */}
          <div className="relative rounded-2xl border border-border bg-muted p-8 dark:border-white/[0.08] dark:bg-zinc-900 sm:p-12">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Stage 01 / Physical World</span>
              <span className="text-[#cc785c]">Entry Point</span>
            </div>

            {/* Vehicle Outline Composition */}
            <div className="relative my-8 flex h-[240px] items-center justify-center sm:h-[280px]">
              {/* Registration concentric circle */}
              <div
                aria-hidden="true"
                className="absolute h-56 w-56 rounded-full border border-border dark:border-white/[0.06]"
              />

              {/* Vehicle SVG Icon line-art */}
              <div className="relative text-[#3f3f46] opacity-85 dark:text-zinc-400">
                <VaahanIcon name="car" size={140} strokeWidth={0.75} aria-hidden="true" />

                {/* Coral QR Entry Point on windshield/body */}
                <div
                  className="
                    absolute right-12 top-6 flex items-center gap-2
                    rounded-full border border-[#cc785c]/40 bg-background px-2.5 py-1
                    shadow-sm dark:bg-zinc-950
                  "
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#cc785c] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#cc785c]" />
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#cc785c]">
                    QR Entry
                  </span>
                </div>
              </div>
            </div>

            {/* Micro rail caption */}
            <div className="flex items-center justify-between border-t border-border pt-4 font-mono text-[8px] text-muted-foreground dark:border-white/[0.06] dark:text-muted-foreground">
              <span>PHYSICAL VEHICLE</span>
              <span className="text-[#cc785c]">→</span>
              <span>QR ENTRY POINT</span>
            </div>
          </div>

          {/* Editorial Explanation */}
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              01 / The Physical Anchor
            </span>

            <h2
              id="physical-start-heading"
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
              It starts in the physical world.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
              A vehicle lives on roads, in parking spaces, and along highways.
              The physical VaahanSafe QR sticker attached to your windshield or
              bodywork serves as the visible bridge between the real vehicle and
              its secure digital safety record.
            </p>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-6 dark:text-muted-foreground">
              The QR itself does not store your private home address or account
              credentials on the sticker surface. Instead, it provides another
              person or emergency responder a direct, frictionless entry point to
              the verified vehicle identity.
            </p>

            <div className="mt-8 flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4 dark:border-white/[0.08] dark:bg-zinc-900">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5db8a6]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#3f3f46] dark:text-zinc-400">
                Physical QR = Access doorway &bull; Private account remains protected
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
