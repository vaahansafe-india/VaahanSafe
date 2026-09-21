import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function ReplacementNotRefundNotice() {
  return (
    <section
      aria-labelledby="replacement-notice-heading"
      className="
        border-b border-border
        bg-muted/50
        py-16 sm:py-20
        dark:border-border
        dark:bg-zinc-900/50
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-border bg-white p-8 sm:p-10 dark:border-white/[0.08] dark:bg-zinc-950">
          <div className="max-w-[760px]">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              <VaahanIcon name="alert" size={14} aria-hidden="true" />
              <h2 id="replacement-notice-heading" className="m-0 font-mono text-[9px] uppercase tracking-[0.2em]">
                Commercial Policy Distinction
              </h2>
            </div>

            <div className="mt-4 font-mono text-base font-semibold uppercase tracking-wider text-foreground dark:text-zinc-50">
              REPLACEMENT ≠ REFUND
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm dark:text-zinc-400">
              A replacement request provisions a new physical decal asset and binds it to your existing vehicle record. It is not an order cancellation or money-back refund. In accordance with our commercial policy, completed decal orders and subscription activations are generally non-refundable.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6">
              <Link
                href="/refund-policy"
                className="
                  inline-flex items-center gap-1.5 font-mono text-[11px]
                  font-medium uppercase tracking-[0.14em] text-[#cc785c]
                  hover:text-[#a9583e]
                "
              >
                <span>Refund Policy →</span>
              </Link>

              <Link
                href="/shipping-replacement"
                className="
                  inline-flex items-center gap-1.5 font-mono text-[11px]
                  font-medium uppercase tracking-[0.14em] text-muted-foreground
                  hover:text-foreground dark:text-zinc-400 dark:hover:text-white
                "
              >
                <span>Shipping &amp; Replacement Policy →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
