import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ReplacementLifecycleCard() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border bg-muted p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-900">
      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span>Hardware Lifecycle • Decal Continuity</span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal text-foreground sm:text-2xl dark:text-zinc-50">
        Replacing a lost, damaged, or weathered QR decal.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
        VaahanSafe provides a structured process for replacing physical stickers while preserving your underlying digital vehicle record and emergency settings.
      </p>

      {/* Lifecycle Flow */}
      <div className="mt-6 grid gap-2 sm:grid-cols-4 sm:gap-3">
        <div className="rounded-lg border border-border bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
            Step 01
          </span>
          <p className="mt-1 font-mono text-[11px] font-semibold text-foreground dark:text-zinc-50">
            Current QR
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground dark:text-zinc-400">
            Decal undergoes wear, glass repair, or loss
          </span>
        </div>

        <div className="rounded-lg border border-border bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
            Step 02
          </span>
          <p className="mt-1 font-mono text-[11px] font-semibold text-foreground dark:text-zinc-50">
            Replacement Request
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground dark:text-zinc-400">
            Owner verifies account credentials
          </span>
        </div>

        <div className="rounded-lg border border-border bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
            Step 03
          </span>
          <p className="mt-1 font-mono text-[11px] font-semibold text-foreground dark:text-zinc-50">
            Revocation & Dispatch
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground dark:text-zinc-400">
            Prior code invalidated; replacement shipped
          </span>
        </div>

        <div className="rounded-lg border border-[#cc785c]/40 bg-background p-3 shadow-sm dark:border-[#cc785c]/40 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#cc785c]">
              Step 04
            </span>
            <span className="h-1 w-1 rounded-full bg-[#5db8a6]" />
          </div>
          <p className="mt-1 font-mono text-[11px] font-semibold text-[#5db8a6]">
            Identity Continues
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground dark:text-zinc-400">
            New decal paired to vehicle record
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground dark:border-white/[0.06] dark:text-zinc-400">
        <em>
          “VaahanSafe may provide a process for replacing a lost, damaged, compromised, or otherwise unusable QR decal, subject to applicable identity verification, eligibility, replacement fees, and logistics rules.”
        </em>
      </div>
    </div>
  );
}
