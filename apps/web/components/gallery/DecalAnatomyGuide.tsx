import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function DecalAnatomyGuide() {
  return (
    <section
      aria-labelledby="decal-anatomy-heading"
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
          <span>06 / Decal Specimen & Anatomy</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="decal-anatomy-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            Engineered for scannability and privacy.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Every visual zone on the VaahanSafe decal serves a defined operational role: immediate scan resolution for bystanders, human-readable ID for voice dispatch, and concealed verification for retail activation.
          </p>
        </div>

        {/* Specimen Box */}
        <div className="mt-12 rounded-2xl border border-border bg-muted p-6 sm:p-10 dark:border-white/[0.08] dark:bg-zinc-900">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Visual Decal Diagram */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-[380px] rounded-2xl border-2 border-[#09090b] bg-background p-6 shadow-md dark:border-white/[0.15] dark:bg-zinc-950">
                {/* Header Zone */}
                <div className="flex items-center justify-between border-b border-border pb-4 dark:border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-[#cc785c] text-white">
                      <VaahanIcon name="qr-code" size={16} aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-mono text-xs font-bold tracking-widest text-foreground dark:text-zinc-50">
                        VAAHANSAFE
                      </div>
                      <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                        Vehicle Safety Identity
                      </div>
                    </div>
                  </div>
                  <span className="rounded bg-[#5db8a6]/15 px-2 py-0.5 font-mono text-[8px] font-semibold text-[#5db8a6]">
                    OFFICIAL
                  </span>
                </div>

                {/* Main QR Target: Section A */}
                <div className="relative mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cc785c] bg-white p-6 dark:bg-zinc-900">
                  <div className="grid h-32 w-32 grid-cols-5 gap-1 p-2">
                    {/* Simulated Clean QR Grid Pattern */}
                    <div className="col-span-2 row-span-2 rounded border-2 border-[#09090b] p-1 dark:border-[#fafafa]"><div className="h-full w-full bg-[#09090b] dark:bg-background" /></div>
                    <div className="bg-[#cc785c]" />
                    <div className="col-span-2 row-span-2 rounded border-2 border-[#09090b] p-1 dark:border-[#fafafa]"><div className="h-full w-full bg-[#09090b] dark:bg-background" /></div>
                    <div className="bg-[#09090b] dark:bg-background" />
                    <div className="col-span-2 row-span-2 rounded border-2 border-[#09090b] p-1 dark:border-[#fafafa]"><div className="h-full w-full bg-[#09090b] dark:bg-background" /></div>
                    <div className="bg-[#cc785c]" />
                    <div className="bg-[#09090b] dark:bg-background" />
                    <div className="bg-[#09090b] dark:bg-background" />
                  </div>

                  <span className="absolute -top-3 left-4 rounded bg-[#cc785c] px-2 py-0.5 font-mono text-[9px] font-bold text-white">
                    Zone A: Public QR
                  </span>
                </div>

                {/* Human Readable ID: Section B */}
                <div className="relative mt-4 rounded-lg border border-border bg-white p-3 text-center dark:border-white/[0.08] dark:bg-zinc-900">
                  <span className="absolute -top-2.5 left-4 rounded bg-[#09090b] px-2 py-0.5 font-mono text-[8px] font-medium text-white dark:bg-background dark:text-foreground">
                    Zone B: Alphanumeric ID
                  </span>
                  <div className="font-mono text-sm font-bold tracking-widest text-foreground dark:text-zinc-50">
                    VS-7F3K-9021
                  </div>
                </div>

                {/* Concealed Activation Zone: Section C */}
                <div className="relative mt-4 rounded-lg border border-dashed border-[#a1a1aa] bg-[#e4e4e7]/40 p-3 text-center dark:border-white/[0.1] dark:bg-white/[0.03]">
                  <span className="absolute -top-2.5 left-4 rounded bg-[#a1a1aa] px-2 py-0.5 font-mono text-[8px] font-medium text-white">
                    Zone C: Scratch Activation (Retail Only)
                  </span>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    [ CONCEALED SECURITY PIN ]
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Descriptions */}
            <div className="space-y-4 lg:col-span-6">
              <div className="rounded-xl border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-950">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-[#cc785c] font-mono text-[10px] font-bold text-white">
                    A
                  </span>
                  <h3 className="font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
                    Public Scannable Target
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  High-contrast QR symbology rendered with error correction. Opens the lightweight roadside safety page in mobile web browsers without app dependencies.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-950">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-[#09090b] font-mono text-[10px] font-bold text-white dark:bg-background dark:text-foreground">
                    B
                  </span>
                  <h3 className="font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
                    Human-Readable Alphanumeric ID
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  Allows traffic police, roadside mechanics, or parking attendants to report or reference the vehicle by voice or phone keypad even if their camera lens is obstructed.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-950">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-[#a1a1aa] font-mono text-[10px] font-bold text-white">
                    C
                  </span>
                  <h3 className="font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
                    Concealed Activation Layer
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  On packaged retail units, the activation secret is shielded until purchased and peeled by the rightful vehicle owner, preventing unauthorized registration.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-950">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-[#5db8a6] font-mono text-[10px] font-bold text-white">
                    D
                  </span>
                  <h3 className="font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
                    Substrate & Adhesive
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  Manufactured on automotive grade synthetic film. Pressure-sensitive acrylic adhesive adheres firmly to clean automotive safety glass without leaving sticky gummy residue upon removal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
