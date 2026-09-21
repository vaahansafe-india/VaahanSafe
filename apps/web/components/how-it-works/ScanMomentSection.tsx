import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { ALL_CORNERS_PATH, DEMO_QR_PATH } from "@vaahansafe/ui/brand";

export function ScanMomentSection() {
  return (
    <section
      aria-labelledby="scan-moment-heading"
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
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
            03 / The Roadside Event
          </span>

          <h2
            id="scan-moment-heading"
            className="
              mt-3 font-serif
              text-3xl font-normal leading-[1.08]
              tracking-[-0.035em]
              text-[#fafafa]
              sm:text-4xl
              lg:text-5xl
            "
          >
            Someone scans the QR.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-[#a1a1aa] sm:text-base sm:leading-7">
            A passerby, building guard, fellow driver, or first responder points
            any modern smartphone camera at the sticker. No specialized app
            download or login is demanded from the scanner.
          </p>
        </div>

        {/* 3-Step Detection Sequence Architecture */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {/* Step A: QR Detected */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#18181b] p-6 sm:p-8">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-[#cc785c]">
              <span>Sequence 01</span>
              <span>Optical</span>
            </div>

            <div className="my-8 flex h-36 items-center justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-lg border border-white/[0.12] bg-white p-2">
                <svg viewBox="0 0 32 32" className="h-full w-full text-foreground" aria-hidden="true">
                  <path d={ALL_CORNERS_PATH} fill="#cc785c" />
                  <path d={DEMO_QR_PATH} fill="currentColor" fillRule="evenodd" />
                </svg>
                {/* One-time scan laser animation */}
                <div
                  aria-hidden="true"
                  className="
                    absolute inset-x-2 top-2 h-0.5 bg-[#cc785c]
                    shadow-[0_0_8px_#cc785c]
                    motion-safe:animate-[vaahanQrScan_2.4s_cubic-bezier(0.16,1,0.3,1)_1_forwards]
                    motion-reduce:hidden
                  "
                />
              </div>
            </div>

            <div className="font-serif text-lg font-medium text-[#fafafa]">
              QR Detected
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#a1a1aa]">
              Standard camera or scanner app parses the permanent URL structure
              and launches the browser session instantly.
            </p>
          </div>

          {/* Step B: Identity Found */}
          <div className="rounded-2xl border border-[#cc785c]/30 bg-[#18181b] p-6 sm:p-8">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-[#cc785c]">
              <span>Sequence 02</span>
              <span>Resolution</span>
            </div>

            <div className="my-8 flex h-36 flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-[#09090b] p-4 text-center font-mono">
              <span className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                Active Vehicle Identity
              </span>
              <span className="mt-2 text-lg font-semibold tracking-wider text-[#cc785c]">
                VS-7F3K-9021
              </span>
              <div className="mt-3 flex items-center gap-1.5 text-[8px] text-[#5db8a6]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
                <span>ACTIVE RECORD CONFIRMED</span>
              </div>
            </div>

            <div className="font-serif text-lg font-medium text-[#fafafa]">
              Identity Found
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#a1a1aa]">
              The platform confirms the vehicle association and loads the
              owner-configured public safety parameters.
            </p>
          </div>

          {/* Step C: Safety View */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#18181b] p-6 sm:p-8">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-[#5db8a6]">
              <span>Sequence 03</span>
              <span>Presentation</span>
            </div>

            <div className="my-8 flex h-36 flex-col justify-center rounded-xl border border-white/[0.08] bg-[#09090b] p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[#fafafa]">
                <VaahanIcon name="shield" size={14} className="text-[#5db8a6]" aria-hidden="true" />
                <span>Public Safety View</span>
              </div>
              <div className="mt-3 space-y-1.5 font-mono text-[9px] text-[#a1a1aa]">
                <div className="flex justify-between border-b border-white/[0.06] pb-1">
                  <span>Vehicle:</span>
                  <span className="text-[#fafafa]">Honda (Demo)</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-1">
                  <span>Emergency Relay:</span>
                  <span className="text-[#5db8a6]">Configured</span>
                </div>
              </div>
            </div>

            <div className="font-serif text-lg font-medium text-[#fafafa]">
              Safety View Displayed
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#a1a1aa]">
              Critical roadside context and owner-approved contact relays appear
              promptly on the scanner&apos;s phone screen.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
