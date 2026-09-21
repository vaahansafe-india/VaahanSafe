import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function PhysicalRetailSpecimen() {
  return (
    <section
      aria-labelledby="specimen-heading"
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
          <span>Retail Pack Inspection</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="specimen-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            What is on your retail pack.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Every official retail pack contains two distinct visual elements: the public scannable identity target and a concealed security scratch key.
          </p>
        </div>

        {/* Specimen Inspection Card */}
        <div className="mt-12 rounded-2xl border border-border bg-muted p-6 sm:p-10 dark:border-white/[0.08] dark:bg-zinc-900">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* Visual Pack Specimen */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-[360px] rounded-2xl border-2 border-[#09090b] bg-background p-6 shadow-md dark:border-white/[0.15] dark:bg-zinc-950">
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
                        Retail Security Pack
                      </div>
                    </div>
                  </div>
                  <span className="rounded bg-[#5db8a6]/15 px-2 py-0.5 font-mono text-[8px] font-semibold text-[#5db8a6]">
                    SEALED
                  </span>
                </div>

                {/* Target A: Public QR */}
                <div className="relative mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cc785c] bg-white p-5 dark:bg-zinc-900">
                  <span className="absolute -top-3 left-4 rounded bg-[#cc785c] px-2 py-0.5 font-mono text-[8px] font-bold text-white">
                    01 / Public QR
                  </span>
                  <div className="grid h-28 w-28 grid-cols-4 gap-1 p-1">
                    <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                    <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                    <div className="rounded-sm bg-[#cc785c]" />
                    <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                    <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                    <div className="rounded-sm bg-transparent" />
                    <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                    <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                    <div className="rounded-sm bg-[#cc785c]" />
                    <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                    <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                    <div className="rounded-sm bg-transparent" />
                  </div>
                  <span className="mt-2 font-mono text-[8px] text-muted-foreground">
                    Scannable by phone camera
                  </span>
                </div>

                {/* Target B: Public ID */}
                <div className="relative mt-4 rounded-lg border border-border bg-white p-3 text-center dark:border-white/[0.08] dark:bg-zinc-900">
                  <span className="absolute -top-2.5 left-4 rounded bg-[#09090b] px-2 py-0.5 font-mono text-[8px] text-white dark:bg-background dark:text-foreground">
                    02 / Public Identity
                  </span>
                  <div className="font-mono text-sm font-bold tracking-widest text-foreground dark:text-zinc-50">
                    VS-7F3K-9021
                  </div>
                </div>

                {/* Target C: Concealed Scratch PIN */}
                <div className="relative mt-4 rounded-lg border-2 border-dashed border-[#a1a1aa] bg-[#e4e4e7]/40 p-3.5 text-center dark:border-white/[0.1] dark:bg-white/[0.03]">
                  <span className="absolute -top-2.5 left-4 rounded bg-[#a1a1aa] px-2 py-0.5 font-mono text-[8px] text-white">
                    03 / Concealed Activation Key
                  </span>
                  <div className="font-mono text-xs font-semibold tracking-wider text-muted-foreground dark:text-zinc-400">
                    [ SCRATCH TO REVEAL 6-DIGIT PIN ]
                  </div>
                </div>
              </div>
            </div>

            {/* Specimen Annotations */}
            <div className="space-y-4 lg:col-span-6">
              <div className="rounded-xl border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-950">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
                  Public Scannable QR
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  Points to the emergency resolver. Scanning this code initiates the activation sequence by opening the retail onboarding portal.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-950">
                <div className="font-mono text-[10px] uppercase tracking-wider text-foreground dark:text-zinc-50">
                  Visible Public ID
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  The alphanumeric vehicle identity printed on the decal. Used by support and voice dispatchers to identify the asset.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-950">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Concealed Scratch Area
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  Contains a randomized activation key sealed under latex. Only the buyer who scratches this panel can claim and register the decal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
