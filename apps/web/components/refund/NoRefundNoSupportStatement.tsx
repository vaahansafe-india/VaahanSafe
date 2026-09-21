import * as React from "react";

export function NoRefundNoSupportStatement() {
  return (
    <div className="my-12 overflow-hidden rounded-2xl border border-border bg-muted p-8 sm:p-12 dark:border-white/[0.08] dark:bg-zinc-900">
      <div className="max-w-[680px]">
        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.22em] text-[#cc785c]">
          Editorial Principle
        </span>

        <h2 className="mt-3 font-serif text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl lg:text-4xl dark:text-zinc-50">
          No refund does not mean
          <br />
          <span className="text-[#cc785c]">no support.</span>
        </h2>

        <p className="mt-4 text-xs leading-relaxed text-[#3f3f46] sm:text-sm sm:leading-7 dark:text-zinc-400">
          Completed VaahanSafe purchases are generally non-refundable once allocated.
          That does not mean VaahanSafe ignores duplicate charges, failed banking transactions,
          delayed logistics, damaged stickers, or remedies required under Indian consumer law.
        </p>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-muted-foreground">
          If an order encounters a genuine fulfillment or payment discrepancy, our operations
          team is committed to reviewing the facts and providing an appropriate remedy.
        </p>
      </div>
    </div>
  );
}
