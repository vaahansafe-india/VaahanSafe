import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function PublicSafetyViewDemo() {
  return (
    <section
      aria-labelledby="public-view-demo-heading"
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
        <div className="max-w-2xl">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5db8a6]">
            04 / Roadside Reality
          </span>

          <h2
            id="public-view-demo-heading"
            className="
              mt-3 font-serif
              text-3xl font-normal leading-[1.08]
              tracking-[-0.035em]
              text-[#fafafa]
              sm:text-4xl
              lg:text-5xl
            "
          >
            What another person sees.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-[#a1a1aa] sm:text-base sm:leading-7">
            When your vehicle is scanned on the street, this is the exact,
            restrained safety projection that appears. Teal indicators highlight
            active roadside relays.
          </p>
        </div>

        {/* Centered Specimen Screen */}
        <div className="mt-14 flex justify-center">
          <div className="w-full max-w-[440px] rounded-2xl border border-white/[0.1] bg-[#18181b] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#5db8a6]" />
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#fafafa]">
                  DEMO SAFETY VIEW
                </span>
              </div>
              <span className="rounded border border-[#5db8a6]/30 bg-[#5db8a6]/[0.08] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#5db8a6]">
                PUBLIC PROJECTION
              </span>
            </div>

            {/* Vehicle Identification Strip */}
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#09090b] p-4">
              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                Registered Vehicle Asset
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-serif text-lg text-[#fafafa]">
                  Honda &bull; Demo Vehicle
                </span>
                <span className="font-mono text-[10px] font-semibold text-[#cc785c]">
                  VS-7F3K-9021
                </span>
              </div>
              <div className="mt-1 font-mono text-[9px] text-[#71717a]">
                Masked Plate: DL 01 &bull;&bull;&bull;&bull; 4821
              </div>
            </div>

            {/* Primary Action Relay */}
            <div className="mt-4 rounded-xl border border-[#5db8a6]/30 bg-[#5db8a6]/[0.06] p-4">
              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#5db8a6]">
                Owner-Configured Contact Relay
              </span>
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
                  <span>Call Relay</span>
                </button>
              </div>
            </div>

            {/* Medical Marker */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#09090b] p-4 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
                <span className="text-[#a1a1aa]">Owner Blood Group:</span>
              </div>
              <span className="text-base font-bold text-[#fafafa]">O+</span>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4 font-mono text-[8px] text-muted-foreground">
              <span>TEAL = PUBLIC PROJECTION</span>
              <span>NO ADDRESS BROADCAST</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
