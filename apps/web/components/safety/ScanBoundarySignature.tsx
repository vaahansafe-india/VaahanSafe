import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ScanBoundarySignature() {
  return (
    <section
      aria-labelledby="scan-boundary-heading"
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
        <div className="max-w-2xl">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
            01 / The Core Boundary
          </span>

          <h2
            id="scan-boundary-heading"
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
            A scan should not open your account.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
            When another driver, passerby, or bystander scans the physical QR decal
            on your vehicle, they encounter a controlled projection — not an open
            window into your personal identity or account details.
          </p>
        </div>

        {/* Signature Architecture Visual */}
        <div className="mt-14 rounded-2xl border border-border bg-muted p-8 dark:border-white/[0.08] dark:bg-zinc-900 sm:p-12">
          <div className="grid gap-6 md:grid-cols-3 md:items-center">
            {/* Box 1: Private Account */}
            <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.06] dark:bg-zinc-950">
              <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>Entity 01</span>
                <span className="text-muted-foreground">Private Core</span>
              </div>
              <div className="mt-4 font-serif text-2xl text-foreground dark:text-zinc-50">
                Private Account
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                Home address, login email, phone authentication tokens, and purchase records.
              </p>
              <div className="mt-4 rounded border border-border bg-muted px-3 py-1 font-mono text-[8px] uppercase tracking-wider text-muted-foreground dark:border-white/[0.06] dark:bg-zinc-900 dark:text-muted-foreground">
                Protected Boundary
              </div>
            </div>

            {/* Middle: Owner Controls */}
            <div className="rounded-xl border border-[#cc785c]/30 bg-[#cc785c]/[0.04] p-6 dark:bg-[#cc785c]/[0.06]">
              <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-[#cc785c]">
                <span>Entity 02</span>
                <span>Governance</span>
              </div>
              <div className="mt-4 font-serif text-2xl text-[#cc785c]">
                Your Controls
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                You decide which emergency numbers, blood group tags, and vehicle details cross over.
              </p>
              <div className="mt-4 rounded border border-[#cc785c]/25 bg-background px-3 py-1 font-mono text-[8px] uppercase tracking-wider text-[#cc785c] dark:bg-zinc-950">
                Owner Toggles &bull; Instant Sync
              </div>
            </div>

            {/* Box 3: Selected Safety View */}
            <div className="rounded-xl border border-[#5db8a6]/30 bg-[#5db8a6]/[0.04] p-6 dark:bg-[#5db8a6]/[0.06]">
              <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-[#5db8a6]">
                <span>Entity 03</span>
                <span>Public Scan</span>
              </div>
              <div className="mt-4 font-serif text-2xl text-[#5db8a6]">
                Selected Safety View
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                Only the chosen vehicle context and immediate emergency contact actions appear.
              </p>
              <div className="mt-4 rounded border border-[#5db8a6]/25 bg-background px-3 py-1 font-mono text-[8px] uppercase tracking-wider text-[#5db8a6] dark:bg-zinc-950">
                Roadside Access Only
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
