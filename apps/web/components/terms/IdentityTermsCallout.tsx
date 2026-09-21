import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function IdentityTermsCallout() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border bg-muted p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-900">
      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span>Signature Architecture • Vehicle Identity</span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal text-foreground sm:text-2xl dark:text-zinc-50">
        The identity belongs to the vehicle experience.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
        A VaahanSafe vehicle identity is anchored to the physical automobile rather than treated as a generic user profile.
      </p>

      {/* 4-Stage Technical Progression */}
      <div className="mt-6 grid gap-2 sm:grid-cols-4 sm:gap-3">
        <div className="rounded-lg border border-border bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
            Layer 01
          </span>
          <p className="mt-1 font-mono text-[11px] font-semibold text-foreground dark:text-zinc-50">
            Physical Vehicle
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground dark:text-zinc-400">
            The designated automobile or two-wheeler
          </span>
        </div>

        <div className="rounded-lg border border-border bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
            Layer 02
          </span>
          <p className="mt-1 font-mono text-[11px] font-semibold text-foreground dark:text-zinc-50">
            Physical QR
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground dark:text-zinc-400">
            Decal interface & public scanning surface
          </span>
        </div>

        <div className="rounded-lg border border-[#cc785c]/40 bg-background p-3 shadow-sm dark:border-[#cc785c]/40 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#cc785c]">
              Layer 03
            </span>
            <span className="h-1 w-1 rounded-full bg-[#cc785c]" />
          </div>
          <p className="mt-1 font-mono text-[11px] font-semibold text-[#cc785c]">
            VaahanSafe ID
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground dark:text-zinc-400">
            Digital identity & owner-managed record
          </span>
        </div>

        <div className="rounded-lg border border-border bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
            Layer 04
          </span>
          <p className="mt-1 font-mono text-[11px] font-semibold text-foreground dark:text-zinc-50">
            Safety View
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground dark:text-zinc-400">
            Configured public roadside presentation
          </span>
        </div>
      </div>

      {/* Scope Invariants */}
      <div className="mt-6 border-t border-border pt-4 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground dark:border-white/[0.06] dark:text-zinc-500">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-1.5">
            <VaahanIcon name="shield" size={10} className="text-[#5db8a6]" />
            Independent Vehicle Safety Service
          </span>
          <span>•</span>
          <span>Not Government Affiliated (HSRP / RTO Separate)</span>
          <span>•</span>
          <span>Service Subject to Active Plan Terms</span>
        </div>
      </div>
    </div>
  );
}
