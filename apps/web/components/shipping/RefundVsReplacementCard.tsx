import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function RefundVsReplacementCard() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border bg-background p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>Policy Relationship</span>
        </div>

        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#cc785c]">
          REFUND ≠ REPLACEMENT
        </span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal text-foreground sm:text-2xl dark:text-zinc-50">
        A replacement request is different from a refund request.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
        Under our commercial policy, completed purchases are generally non-refundable. However, verified product damage, shipping defects, or weathered decals can be resolved through hardware replacement.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/60 p-4 dark:border-white/[0.06] dark:bg-zinc-900">
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
            Commercial Refund Policy
          </span>
          <p className="mt-1 font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
            Refund Requests
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground dark:text-zinc-400">
            <li>• Completed purchases are generally non-refundable</li>
            <li>• Customized QR allocations cannot be unassigned</li>
            <li>• Discretionary change of mind is not refundable</li>
          </ul>
        </div>

        <div className="rounded-lg border border-[#cc785c]/30 bg-muted/60 p-4 dark:border-[#cc785c]/20 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#cc785c]">
              Hardware Lifecycle
            </span>
            <span className="font-mono text-[8px] text-[#5db8a6]">Supported Resolution</span>
          </div>
          <p className="mt-1 font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
            Replacement Requests
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground dark:text-zinc-400">
            <li>• Transit-damaged stickers replaced under warranty</li>
            <li>• Weathered decals renewed while keeping identity</li>
            <li>• Replaces hardware without altering subscription history</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 dark:border-white/[0.06]">
        <div className="text-xs text-muted-foreground dark:text-zinc-400">
          For complete payment, cancellation, and statutory exception guidelines, view our{" "}
          <Link
            href="/refund-policy"
            className="font-medium text-[#cc785c] underline hover:text-[#a9583e]"
          >
            Refund Policy
          </Link>
          .
        </div>

        <VaahanIcon name="arrow-right" size={12} className="text-[#cc785c]" />
      </div>
    </div>
  );
}
