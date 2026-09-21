import * as React from "react";
import { NON_REPLACEMENT_ENTITIES } from "../../app/safety-disclaimer/safety-disclaimer-content";

export function NotReplacementCard() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border bg-background p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-950">
      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span>Legal & Operational Invariants</span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal text-foreground sm:text-2xl dark:text-zinc-50">
        What VaahanSafe does not replace.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
        To prevent misreliance during acute roadside situations, VaahanSafe explicitly establishes that its service does not replace:
      </p>

      {/* 10 Entities Grid */}
      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {NON_REPLACEMENT_ENTITIES.map((entity, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 dark:border-white/[0.06] dark:bg-zinc-900"
          >
            <span className="font-mono text-[8px] font-semibold text-muted-foreground dark:text-zinc-500">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="h-px w-3 bg-[#e4e4e7] dark:bg-white/[0.08]" />
            <span className="text-xs font-medium text-[#252523] dark:text-zinc-100">
              {entity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
