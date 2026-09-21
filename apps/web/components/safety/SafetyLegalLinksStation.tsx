import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function SafetyLegalLinksStation() {
  return (
    <section
      aria-labelledby="safety-legal-links-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        py-16
        sm:py-20
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between border-b border-border pb-4 dark:border-white/[0.08]">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Detailed Legal References
          </span>
          <span className="font-mono text-[9px] text-[#cc785c]">
            FORMAL STATUTORY POLICIES
          </span>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/privacy"
            className="
              group flex items-center justify-between rounded-xl
              border border-border bg-muted p-5 transition-all
              hover:border-[#cc785c]/40 hover:bg-background
              dark:border-white/[0.06] dark:bg-zinc-900 dark:hover:border-[#cc785c]/40
            "
          >
            <div>
              <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                DOCUMENT / 01
              </div>
              <div className="mt-1 font-serif text-lg text-foreground dark:text-zinc-50">
                Privacy Policy
              </div>
              <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                Formal statutory data handling under DPDP Act.
              </p>
            </div>
            <VaahanIcon
              name="arrow-right"
              size={14}
              className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#cc785c]"
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/safety-disclaimer"
            className="
              group flex items-center justify-between rounded-xl
              border border-border bg-muted p-5 transition-all
              hover:border-[#cc785c]/40 hover:bg-background
              dark:border-white/[0.06] dark:bg-zinc-900 dark:hover:border-[#cc785c]/40
            "
          >
            <div>
              <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                DOCUMENT / 05
              </div>
              <div className="mt-1 font-serif text-lg text-foreground dark:text-zinc-50">
                Safety Disclaimer
              </div>
              <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                Emergency boundaries and responder dispatch rules.
              </p>
            </div>
            <VaahanIcon
              name="arrow-right"
              size={14}
              className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#cc785c]"
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/terms"
            className="
              group flex items-center justify-between rounded-xl
              border border-border bg-muted p-5 transition-all
              hover:border-[#cc785c]/40 hover:bg-background
              dark:border-white/[0.06] dark:bg-zinc-900 dark:hover:border-[#cc785c]/40
            "
          >
            <div>
              <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                DOCUMENT / 02
              </div>
              <div className="mt-1 font-serif text-lg text-foreground dark:text-zinc-50">
                Terms of Service
              </div>
              <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                Platform rules, eligibility, and service agreements.
              </p>
            </div>
            <VaahanIcon
              name="arrow-right"
              size={14}
              className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#cc785c]"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
