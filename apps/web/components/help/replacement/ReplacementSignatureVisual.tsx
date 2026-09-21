import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ReplacementSignatureVisual() {
  return (
    <section
      aria-labelledby="replacement-visual-heading"
      className="
        border-b border-border
        bg-background
        py-16 sm:py-20 lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>Identity Continuity Model</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="replacement-visual-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            How identity continuity works.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Where supported, the replacement process connects the new physical QR decal to your existing vehicle identity without disrupting your configured emergency contacts or past safety profile.
          </p>
        </div>

        {/* Signature Diagram Visual */}
        <div className="mt-12 rounded-2xl border border-border bg-muted/70 p-8 sm:p-12 dark:border-white/[0.08] dark:bg-zinc-900">
          <div className="mx-auto max-w-[780px]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-7 md:items-center">
              {/* Box 1: Current QR */}
              <div className="rounded-xl border border-border bg-white p-6 md:col-span-2 dark:border-white/[0.08] dark:bg-zinc-950">
                <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  01 / Former Decal
                </div>
                <div className="mt-2 font-serif text-xl text-foreground dark:text-zinc-50">
                  Current QR
                </div>
                <div className="mt-2 font-mono text-xs text-muted-foreground">
                  VS / QR / 01
                </div>
                <div className="mt-4 rounded bg-[#e4e4e7] px-2 py-0.5 font-mono text-[8px] text-[#c64545] dark:bg-white/[0.08]">
                  ● To Be Revoked
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="flex justify-center md:col-span-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-[#cc785c] dark:border-white/[0.1] dark:bg-zinc-900">
                  <VaahanIcon name="arrow-right" size={14} aria-hidden="true" />
                </div>
              </div>

              {/* Box 2: Replacement Workflow */}
              <div className="rounded-xl border border-[#cc785c]/30 bg-[#cc785c]/[0.04] p-6 md:col-span-2 dark:bg-[#cc785c]/[0.06]">
                <div className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                  02 / Transition
                </div>
                <div className="mt-2 font-serif text-xl text-[#cc785c]">
                  Replacement
                </div>
                <div className="mt-2 font-mono text-xs text-[#cc785c]">
                  New QR: VS / QR / 02
                </div>
                <div className="mt-4 rounded bg-[#cc785c]/15 px-2 py-0.5 font-mono text-[8px] text-[#cc785c]">
                  Re-pair &amp; Dispatch
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="flex justify-center md:col-span-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-[#5db8a6] dark:border-white/[0.1] dark:bg-zinc-900">
                  <VaahanIcon name="arrow-right" size={14} aria-hidden="true" />
                </div>
              </div>

              {/* Box 3: Persistent Vehicle Identity */}
              <div className="rounded-xl border border-[#5db8a6]/40 bg-white p-6 md:col-span-1 md:col-span-2 dark:border-[#5db8a6]/40 dark:bg-zinc-950">
                <div className="font-mono text-[9px] uppercase tracking-wider text-[#5db8a6]">
                  03 / Constant
                </div>
                <div className="mt-2 font-serif text-xl text-foreground dark:text-zinc-50">
                  Vehicle Identity
                </div>
                <div className="mt-2 font-mono text-xs font-semibold text-[#5db8a6]">
                  VS-7F3K-9021
                </div>
                <div className="mt-4 rounded bg-[#5db8a6]/15 px-2 py-0.5 font-mono text-[8px] text-[#5db8a6]">
                  ● Unchanged &amp; Active
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-border bg-white p-4 text-xs text-muted-foreground dark:border-white/[0.08] dark:bg-zinc-950 dark:text-zinc-400">
              <span className="font-mono font-medium text-[#cc785c]">Continuity Policy:</span>{" "}
              Where supported, the replacement process can connect the new QR to the applicable vehicle identity. Universal continuity cannot be guaranteed if an account has been closed or unverified.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
