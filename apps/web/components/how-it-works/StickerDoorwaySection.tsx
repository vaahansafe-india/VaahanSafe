import * as React from "react";
import { ALL_CORNERS_PATH, DEMO_QR_PATH } from "@vaahansafe/ui/brand";
import { VaahanIcon } from "@vaahansafe/icons";

export function StickerDoorwaySection() {
  return (
    <section
      aria-labelledby="sticker-doorway-heading"
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
          {/* Left: Editorial Context */}
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              02 / The Decal Specimen
            </span>

            <h2
              id="sticker-doorway-heading"
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
              A small doorway
              <br />
              to the identity behind it.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
              Every VaahanSafe physical decal contains a precision-rendered,
              high-contrast QR code and a visible alphanumeric identity mark.
              On authorized retail sticker packs, it also includes a tamper-evident,
              concealed scratch activation area.
            </p>

            {/* Core Architectural Rule Callout */}
            <div className="mt-8 rounded-xl border border-[#cc785c]/25 bg-muted p-6 dark:border-[#cc785c]/30 dark:bg-zinc-900">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
                Fundamental Product Boundary
              </div>
              <div className="mt-2 font-serif text-xl font-medium text-foreground dark:text-zinc-50">
                PUBLIC QR ≠ ACTIVATION INFORMATION
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                Anyone on the road can scan the public QR to view your configured
                safety view. However, scanning the public QR does not grant ownership,
                access to private settings, or the right to claim the sticker.
              </p>
            </div>
          </div>

          {/* Right: Premium Physical Sticker Specimen Artifact */}
          <div className="flex justify-center">
            <div
              className="
                relative w-full max-w-[420px] rounded-2xl
                border border-border bg-muted p-8 shadow-sm
                dark:border-white/[0.08] dark:bg-zinc-900
              "
            >
              <div className="flex items-center justify-between border-b border-border pb-4 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground dark:text-zinc-50">
                    VAHANSAFE &bull; DECAL SPECIMEN
                  </span>
                </div>
                <span className="rounded bg-[#e4e4e7]/60 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground dark:bg-white/[0.08] dark:text-muted-foreground">
                  NON-FUNCTIONAL DEMO
                </span>
              </div>

              {/* Physical Specimen Body */}
              <div className="my-6 rounded-xl border border-white/60 bg-white p-6 shadow-inner dark:border-white/[0.06] dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                    Public Scannable Layer
                  </span>
                  <span className="font-mono text-[9px] font-medium text-[#cc785c]">
                    VS-7F3K-9021
                  </span>
                </div>

                {/* Centered QR SVG */}
                <div className="my-6 flex justify-center">
                  <div className="relative h-36 w-36 rounded-xl border border-border bg-white p-3 dark:border-white/[0.1] dark:bg-white">
                    <svg viewBox="0 0 32 32" className="h-full w-full text-foreground" aria-hidden="true">
                      <path d={ALL_CORNERS_PATH} fill="#cc785c" />
                      <path d={DEMO_QR_PATH} fill="currentColor" fillRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Concealed Retail Activation Area Specimen */}
                <div className="mt-4 rounded-lg border border-dashed border-[#a1a1aa]/40 bg-background p-3 text-center dark:bg-zinc-900">
                  <div className="flex items-center justify-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground dark:text-muted-foreground">
                    <VaahanIcon name="lock" size={11} aria-hidden="true" />
                    <span>Concealed Scratch Area (Retail Only)</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] tracking-[0.3em] text-[#b0aaa2]">
                    &bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between font-mono text-[8px] text-muted-foreground">
                <span>TAMPER-EVIDENT BASE</span>
                <span>SCRATCH PROOF PROJECTION</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
