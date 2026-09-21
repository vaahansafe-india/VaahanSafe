import * as React from "react";
import { COMPARISON_ITEMS } from "../../app/refund-policy/refund-policy-content";

export function RefundVsOrderProblemCard() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border bg-background p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>Issue Classification</span>
        </div>

        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#cc785c]">
          REFUND REQUEST ≠ ORDER PROBLEM
        </span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal text-foreground sm:text-2xl dark:text-zinc-50">
        Understanding the difference between refund requests and order support.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
        While completed purchases are generally non-refundable, genuine payment and logistics problems receive active support and review.
      </p>

      {/* Comparison Matrix Table */}
      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-muted/40 dark:divide-white/[0.06] dark:border-white/[0.06] dark:bg-zinc-900">
        {COMPARISON_ITEMS.map((item, idx) => (
          <div
            key={idx}
            className="grid gap-2 p-4 sm:grid-cols-[180px_1fr_180px] sm:items-center sm:gap-4"
          >
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground dark:text-zinc-500">
                Category
              </span>
              <p className="font-medium text-xs text-foreground dark:text-zinc-50">
                {item.category}
              </p>
            </div>

            <div className="text-xs text-muted-foreground dark:text-zinc-400">
              {item.situation}
            </div>

            <div className="sm:text-right">
              <span
                className={`inline-flex rounded px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${
                  item.policyOutcome.includes("Not Refundable")
                    ? "bg-[#cc785c]/10 text-[#cc785c]"
                    : "bg-[#5db8a6]/10 text-[#5db8a6]"
                }`}
              >
                {item.policyOutcome}
              </span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground dark:text-zinc-500">
                {item.note}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground dark:text-zinc-500">
        <span className="h-1 w-1 rounded-full bg-[#cc785c]" />
        <span>Submitting an issue for review does not guarantee a cash refund. Legitimate remedies are provided based on transaction records and verified facts.</span>
      </div>
    </div>
  );
}
