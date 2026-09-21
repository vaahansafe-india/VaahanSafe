import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function SafetyViewPresentation() {
  return (
    <section
      aria-labelledby="safety-view-heading"
      className="
        relative isolate overflow-hidden
        border-b border-white/[0.08]
        bg-[#09090b]
        py-20 text-[#fafafa]
        sm:py-24
        lg:py-28
        dark:bg-zinc-950
      "
    >
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          {/* Left: Explanation */}
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5db8a6]">
              05 / The Safety View
            </span>

            <h2
              id="safety-view-heading"
              className="
                mt-3 font-serif
                text-3xl font-normal leading-[1.08]
                tracking-[-0.035em]
                text-[#fafafa]
                sm:text-4xl
                lg:text-5xl
              "
            >
              The useful information
              <br />
              comes forward.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-[#a1a1aa] sm:text-base sm:leading-7">
              When a bystander or official scans the decal, the screen presents
              only what the vehicle owner has deliberately made visible.
            </p>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-6">
              A scan reveals the configured safety view — never the complete
              VaahanSafe account, payment details, or personal home address.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
                <VaahanIcon name="check" size={14} className="text-[#5db8a6]" aria-hidden="true" />
                <span>Immediate emergency contact relay button</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
                <VaahanIcon name="check" size={14} className="text-[#5db8a6]" aria-hidden="true" />
                <span>Optional blood group and medical notes for first aid context</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
                <VaahanIcon name="check" size={14} className="text-[#5db8a6]" aria-hidden="true" />
                <span>Vehicle type and identification confirmation</span>
              </div>
            </div>
          </div>

          {/* Right: Dark SafetyProjection Specimen */}
          <div className="flex justify-center">
            <div className="w-full max-w-[420px] rounded-2xl border border-white/[0.1] bg-[#18181b] p-6 shadow-2xl sm:p-8">
              {/* Header with DEMO badge */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#5db8a6]" />
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#fafafa]">
                    VAAHANSAFE SAFETY VIEW
                  </span>
                </div>
                <span className="rounded border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#cc785c]">
                  DEMO SPECIMEN
                </span>
              </div>

              {/* Vehicle Context */}
              <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#09090b] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                    Vehicle Asset
                  </span>
                  <span className="font-mono text-[8px] text-[#cc785c]">
                    VS-7F3K-9021
                  </span>
                </div>
                <div className="mt-2 font-serif text-lg text-[#fafafa]">
                  Honda &bull; Demo Vehicle
                </div>
                <div className="mt-1 font-mono text-[9px] text-[#71717a]">
                  DL 01 &bull;&bull;&bull;&bull; 4821
                </div>
              </div>

              {/* Emergency Contact Action */}
              <div className="mt-4 rounded-xl border border-[#5db8a6]/25 bg-[#5db8a6]/[0.05] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#5db8a6]">
                    Emergency Contact Relay
                  </span>
                  <span className="font-mono text-[8px] text-muted-foreground">Primary</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[#fafafa]">
                      Emergency Contact (Spouse)
                    </div>
                    <div className="mt-0.5 font-mono text-[9px] text-[#a1a1aa]">
                      +91 &bull;&bull;&bull;&bull;&bull; &bull;&bull;001
                    </div>
                  </div>
                  <button
                    type="button"
                    className="flex h-8 items-center gap-1.5 rounded bg-[#5db8a6] px-3 font-mono text-[9px] font-medium uppercase tracking-wider text-foreground"
                  >
                    <VaahanIcon name="phone" size={11} aria-hidden="true" />
                    <span>Connect</span>
                  </button>
                </div>
              </div>

              {/* Optional Medical Note */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="col-span-1 rounded-xl border border-white/[0.06] bg-[#09090b] p-3 text-center">
                  <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-muted-foreground">
                    Blood Group
                  </span>
                  <div className="mt-1 font-mono text-base font-bold text-[#cc785c]">
                    O+
                  </div>
                </div>

                <div className="col-span-2 rounded-xl border border-white/[0.06] bg-[#09090b] p-3">
                  <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-muted-foreground">
                    Safety Note
                  </span>
                  <p className="mt-1 text-[10px] leading-relaxed text-[#a1a1aa]">
                    In case of an incident, please notify primary contact promptly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
