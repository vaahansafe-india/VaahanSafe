import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function QrVsPlanDistinction() {
  return (
    <section
      aria-labelledby="qr-vs-plan-heading"
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
        <div className="rounded-2xl border border-border bg-muted p-8 dark:border-white/[0.08] dark:bg-zinc-900 sm:p-12">
          <div className="max-w-2xl">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              09 / Commercial Architecture
            </span>

            <h2
              id="qr-vs-plan-heading"
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
              The QR is the identity.
              <br />
              The plan is what surrounds it.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
              A key principle of VaahanSafe is that your vehicle identity and your
              service tier remain distinct concepts.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Box 1: QR Identity */}
            <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.06] dark:bg-zinc-950">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#cc785c]">
                <VaahanIcon name="qr" size={13} aria-hidden="true" />
                <span>The QR Identity</span>
              </div>

              <div className="mt-3 font-serif text-xl text-foreground dark:text-zinc-50">
                Permanent Physical Association
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                Identifies and establishes the vehicle entry point. Does not expire
                or become invalid just because an optional software tier changes.
              </p>
            </div>

            {/* Box 2: The Plan */}
            <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.06] dark:bg-zinc-950">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#5db8a6]">
                <VaahanIcon name="shield" size={13} aria-hidden="true" />
                <span>The Plan</span>
              </div>

              <div className="mt-3 font-serif text-xl text-foreground dark:text-zinc-50">
                Service Capabilities
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                Determines applicable notification channels, multi-contact relays,
                extended scan history logs, and priority decal replacement assistance.
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-border pt-6 dark:border-white/[0.08]">
            <Link
              href="/pricing"
              className="
                inline-flex items-center gap-2 font-mono text-[11px]
                font-medium uppercase tracking-[0.14em] text-[#cc785c]
                hover:text-[#a9583e]
              "
            >
              <span>Explore Plans &amp; Capabilities</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </Link>

            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
              IDENTITY &ne; PLAN
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
