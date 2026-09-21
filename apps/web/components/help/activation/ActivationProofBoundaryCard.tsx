import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ActivationProofBoundaryCard() {
  return (
    <section
      aria-labelledby="proof-boundary-heading"
      className="
        border-b border-border
        bg-muted/50
        py-16 sm:py-20
        dark:border-border
        dark:bg-zinc-900/50
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-border bg-white p-8 sm:p-12 dark:border-white/[0.08] dark:bg-zinc-950">
          <div className="max-w-[780px]">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              <VaahanIcon name="shield" size={14} aria-hidden="true" />
              <h2 id="proof-boundary-heading" className="m-0 font-mono text-[9px] uppercase tracking-[0.2em]">
                Ownership &amp; Verification Boundary
              </h2>
            </div>

            <div className="mt-4 font-mono text-lg font-semibold uppercase tracking-wider text-foreground dark:text-zinc-50">
              PUBLIC QR ≠ ACTIVATION PROOF
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[#3f3f46] sm:text-base dark:text-zinc-400">
              Scanning a VaahanSafe QR is not by itself the same as proving the right to activate it. Anyone can optically view or scan the public target printed on a packaged retail box. That scan merely routes the phone to the activation portal.
            </p>

            <div className="mt-6 rounded-xl border border-border bg-background p-5 dark:border-white/[0.06] dark:bg-zinc-900">
              <div className="font-mono text-[10px] font-semibold text-[#cc785c]">
                Why the Concealed Scratch Area Exists:
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                To establish authentic ownership, the platform requires entering the random 6-character activation PIN concealed beneath the scratch-off latex coating. This physical proof-of-possession guarantees that only the customer who unsealed the packaging can bind the decal to their account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
