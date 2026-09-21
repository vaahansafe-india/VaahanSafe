import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function RefundSupportStation() {
  return (
    <section
      aria-labelledby="refund-support-heading"
      className="
        my-16 overflow-hidden
        rounded-[24px]
        border border-border
        bg-muted
        p-8 sm:p-12
        dark:border-white/[0.08]
        dark:bg-zinc-900
      "
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-[#cc785c]">
          12 / Order Support & Inquiries
        </span>
        <span className="h-px w-8 bg-[#cc785c]/40" />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <h2
            id="refund-support-heading"
            className="font-serif text-3xl font-normal tracking-[-0.03em] text-foreground sm:text-4xl dark:text-zinc-50"
          >
            Something went wrong with your purchase?
          </h2>

          <p className="mt-4 max-w-[560px] text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
            Although completed purchases are generally non-refundable, payment discrepancies, logistics failures, and transit damage can still be formally investigated and resolved.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="mailto:support@vaahansafe.com?subject=Order%20Support%20Request%20-%20VaahanSafe"
              className="
                inline-flex h-11 items-center gap-2
                rounded-md bg-[#cc785c] px-5
                font-mono text-[10px] font-semibold
                uppercase tracking-[0.14em]
                text-white transition-colors
                hover:bg-[#a9583e]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#cc785c]/40
              "
            >
              <span>Get Order Support</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </a>

            <Link
              href="/#faq"
              className="
                inline-flex h-11 items-center gap-2
                rounded-md border border-border
                bg-background px-5
                font-mono text-[10px] font-semibold
                uppercase tracking-[0.14em]
                text-foreground transition-colors
                hover:border-[#cc785c] hover:text-[#cc785c]
                dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50
              "
            >
              <span>Shipping & Replacement</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Technical communication specifications */}
        <div className="rounded-xl border border-border bg-background p-5 dark:border-white/[0.06] dark:bg-zinc-950">
          <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-500">
            Official Support Desk
          </span>

          <div className="mt-3 space-y-3 font-mono text-[11px] text-[#3f3f46] dark:text-zinc-200">
            <div>
              <span className="block text-[8px] uppercase tracking-[0.12em] text-muted-foreground dark:text-zinc-500">
                Order Inquiries Email
              </span>
              <a
                href="mailto:support@vaahansafe.com"
                className="font-medium text-foreground hover:text-[#cc785c] transition-colors dark:text-zinc-50"
              >
                support@vaahansafe.com
              </a>
            </div>

            <div className="border-t border-border pt-2.5 dark:border-white/[0.06]">
              <span className="block text-[8px] uppercase tracking-[0.12em] text-muted-foreground dark:text-zinc-500">
                Response Target
              </span>
              <span className="text-muted-foreground dark:text-zinc-400">
                Within 72 business hours
              </span>
            </div>

            <div className="border-t border-border pt-2.5 dark:border-white/[0.06]">
              <span className="block text-[8px] uppercase tracking-[0.12em] text-muted-foreground dark:text-zinc-500">
                Governing Law
              </span>
              <span className="text-muted-foreground dark:text-zinc-400">
                Republic of India
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
