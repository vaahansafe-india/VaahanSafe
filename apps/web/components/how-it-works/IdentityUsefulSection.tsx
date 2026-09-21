import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function IdentityUsefulSection() {
  return (
    <section
      aria-labelledby="identity-useful-heading"
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
          {/* Identity Relationship Card */}
          <div className="rounded-2xl border border-border bg-muted p-6 dark:border-white/[0.08] dark:bg-zinc-900 sm:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4 dark:border-white/[0.08]">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                Verified Digital Entity Record
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#cc785c]">
                SYNTHETIC DEMO
              </span>
            </div>

            {/* Grid of Verified Identity Attributes */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                  VaahanSafe ID
                </span>
                <p className="mt-1 font-mono text-base font-semibold text-[#cc785c]">
                  VS-7F3K-9021
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                  Status
                </span>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-sm font-medium text-[#5db8a6]">
                  <span className="h-2 w-2 rounded-full bg-[#5db8a6]" />
                  <span>ACTIVE</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                  Vehicle Asset
                </span>
                <p className="mt-1 font-serif text-base text-foreground dark:text-zinc-50">
                  Demo Vehicle
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                  Safety Profile
                </span>
                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[#3f3f46] dark:text-zinc-400">
                  Owner Controlled
                </p>
              </div>
            </div>

            {/* Triad Binding Diagram */}
            <div className="mt-6 rounded-xl border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
              <div className="flex items-center justify-between text-center font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground dark:text-muted-foreground">
                <span>VEHICLE</span>
                <span className="text-[#cc785c]">↔</span>
                <span>QR CODE</span>
                <span className="text-[#cc785c]">↔</span>
                <span>SAFETY VIEW</span>
              </div>
            </div>
          </div>

          {/* Editorial Context */}
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              04 / The Digital Identity
            </span>

            <h2
              id="identity-useful-heading"
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
              The QR leads
              <br />
              somewhere useful.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
              A generic QR code might just link to a static homepage or social media link.
              A VaahanSafe QR resolves to an authenticated vehicle identity that binds
              the physical machine to a carefully managed set of safety and contact
              capabilities.
            </p>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-6 dark:text-muted-foreground">
              The vehicle identity acts as the persistent orchestrator: even if a
              decal is replaced due to windshield damage, the identity, its historical
              associations, and its configured safety controls remain coherent.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
