import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function PlacementPrincipleVisual() {
  return (
    <section
      aria-labelledby="placement-principle-heading"
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
          <span>02 / Placement Principle</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="placement-principle-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            A physical doorway to the vehicle&apos;s identity.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            The physical QR is intentionally compact. It does not advertise private information to passersby; it exists as a clean, standardized roadside beacon that resolves directly to the owner-controlled safety profile.
          </p>
        </div>

        {/* Large Editorial Vehicle Composition with Placement Anchor */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-muted/70 p-6 sm:p-10 lg:p-12 dark:border-white/[0.08] dark:bg-zinc-900">
          <div className="relative mx-auto max-w-[820px]">
            {/* Editorial Photographic Vehicle with Placement Anchor */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-white shadow-sm dark:border-white/[0.08] dark:bg-zinc-950">
              <img
                src="/images/gallery/vehicle-placement-hero.jpg"
                alt="Editorial automotive photograph showing VaahanSafe QR placement on front passenger windshield corner"
                className="h-full w-full object-cover object-center"
                loading="eager"
              />

              {/* Position Marker Pin over Passenger Windshield Corner */}
              <div className="absolute left-[52.5%] top-[38.5%] -translate-x-1/2 -translate-y-1/2">
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-8 w-8 animate-ping rounded-full bg-[#cc785c]/40" />
                  <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c] text-white shadow-md">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </span>
                </div>
              </div>

              {/* Callout Label */}
              <div className="absolute left-[55%] top-[24%] rounded-md border border-[#cc785c]/40 bg-background/95 px-3 py-1.5 shadow-md backdrop-blur-xs dark:bg-zinc-900/95">
                <div className="font-mono text-[9px] font-semibold text-[#cc785c]">
                  ● VAAHANSAFE QR
                </div>
                <div className="font-mono text-[8px] font-medium text-[#252523] dark:text-zinc-50">
                  Passenger Windshield Corner
                </div>
              </div>
            </div>

            {/* Principle Flow Strip */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-white p-4 font-mono text-[10px] text-[#3f3f46] dark:border-white/[0.08] dark:bg-zinc-950 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
                <span className="font-semibold text-foreground dark:text-zinc-50">Physical Vehicle</span>
              </div>
              <span className="text-[#cc785c]">→</span>
              <div className="flex items-center gap-2">
                <VaahanIcon name="eye" size={12} className="text-muted-foreground" aria-hidden="true" />
                <span>Visible Entry Point</span>
              </div>
              <span className="text-[#cc785c]">→</span>
              <div className="flex items-center gap-2">
                <VaahanIcon name="qr-code" size={12} className="text-[#cc785c]" aria-hidden="true" />
                <span className="font-medium text-[#cc785c]">VaahanSafe QR</span>
              </div>
              <span className="text-[#cc785c]">→</span>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#5db8a6]" />
                <span className="font-semibold text-[#5db8a6]">Digital Safety Identity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
