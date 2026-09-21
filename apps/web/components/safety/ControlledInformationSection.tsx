import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ControlledInformationSection() {
  return (
    <section
      aria-labelledby="controlled-info-heading"
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
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {/* Left: Controlled Fields Grid */}
          <div className="rounded-2xl border border-[#cc785c]/30 bg-[#cc785c]/[0.03] p-6 dark:border-[#cc785c]/40 dark:bg-[#cc785c]/[0.06] sm:p-8">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.18em] text-[#cc785c]">
              <span>Controlled Safety Layer</span>
              <span>OWNER GOVERNED</span>
            </div>

            <div className="mt-6 space-y-3 font-mono text-[11px]">
              <div className="flex items-center justify-between rounded-xl border border-[#cc785c]/20 bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <div className="flex items-center gap-2.5">
                  <VaahanIcon name="phone" size={13} className="text-[#cc785c]" aria-hidden="true" />
                  <span className="font-medium text-foreground dark:text-zinc-50">Emergency Contact Numbers</span>
                </div>
                <span className="rounded bg-[#cc785c]/10 px-2 py-0.5 text-[8px] font-semibold text-[#cc785c]">
                  Selectable
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#cc785c]/20 bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <div className="flex items-center gap-2.5">
                  <VaahanIcon name="activity" size={13} className="text-[#cc785c]" aria-hidden="true" />
                  <span className="font-medium text-foreground dark:text-zinc-50">Blood Group Indicator</span>
                </div>
                <span className="rounded bg-[#cc785c]/10 px-2 py-0.5 text-[8px] font-semibold text-[#cc785c]">
                  Optional
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#cc785c]/20 bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <div className="flex items-center gap-2.5">
                  <VaahanIcon name="document" size={13} className="text-[#cc785c]" aria-hidden="true" />
                  <span className="font-medium text-foreground dark:text-zinc-50">Allergy &amp; Safety Notes</span>
                </div>
                <span className="rounded bg-[#cc785c]/10 px-2 py-0.5 text-[8px] font-semibold text-[#cc785c]">
                  Optional
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#cc785c]/20 bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <div className="flex items-center gap-2.5">
                  <VaahanIcon name="car" size={13} className="text-[#cc785c]" aria-hidden="true" />
                  <span className="font-medium text-foreground dark:text-zinc-50">Vehicle Context &amp; Plate Mask</span>
                </div>
                <span className="rounded bg-[#cc785c]/10 px-2 py-0.5 text-[8px] font-semibold text-[#cc785c]">
                  Configurable
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#cc785c]/20 pt-4 font-mono text-[8px] text-[#cc785c]">
              <span>CORAL = OWNER CONTROL</span>
              <span>SYNCED INSTANTLY</span>
            </div>
          </div>

          {/* Right: Explanatory Context */}
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              03 / Granular Control
            </span>

            <h2
              id="controlled-info-heading"
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
              You decide what can
              <br />
              come forward.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
              Every vehicle owner has different comfort levels and safety considerations.
              VaahanSafe provides precise toggle controls in your portal so you can
              curate the exact profile that assists first responders or helpful bystanders.
            </p>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-6 dark:text-muted-foreground">
              Change emergency contacts when traveling, add specific medication notes
              during long road journeys, or mask public vehicle display details whenever
              you choose.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
