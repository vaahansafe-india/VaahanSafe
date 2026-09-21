import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import Link from "next/link";

export function InstallationHelpStation() {
  return (
    <section
      aria-labelledby="install-help-heading"
      className="
        border-b border-border
        bg-muted/50
        py-16 sm:py-20
        dark:border-border
        dark:bg-zinc-900/50
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 rounded-2xl border border-border bg-white p-8 sm:p-10 md:flex-row md:items-center md:justify-between dark:border-white/[0.08] dark:bg-zinc-950">
          <div className="max-w-[680px]">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span>10 / Installation Assistance</span>
            </div>

            <h2
              id="install-help-heading"
              className="
                mt-3 font-serif text-2xl font-normal tracking-[-0.03em]
                text-foreground sm:text-3xl
                dark:text-zinc-50
              "
            >
              Need help deciding where your decal fits best?
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm dark:text-zinc-400">
              Every VaahanSafe physical shipment arrives with a pre-moistened surface prep wipe and a vehicle positioning template. If you have custom glass or non-standard bodywork, our support team can review photos before you apply.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Link
              href="/how-it-works"
              className="
                inline-flex h-10 items-center justify-center gap-2
                rounded-md border border-border bg-background px-5
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-foreground transition-colors
                hover:border-[#cc785c]
                dark:border-white/[0.1] dark:bg-zinc-900 dark:text-zinc-50
              "
            >
              <span>See How It Works</span>
              <VaahanIcon name="arrow-right" size={11} aria-hidden="true" />
            </Link>

            <Link
              href="/shipping-replacement"
              className="
                inline-flex h-10 items-center justify-center gap-2
                rounded-md bg-[#09090b] px-5
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-white transition-colors
                hover:bg-[#27272a]
                dark:bg-background dark:text-foreground dark:hover:bg-[#e4e4e7]
              "
            >
              <span>Replacement Policy</span>
              <VaahanIcon name="arrow-right" size={11} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
