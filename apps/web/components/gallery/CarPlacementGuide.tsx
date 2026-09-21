import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function CarPlacementGuide() {
  return (
    <section
      aria-labelledby="car-placement-heading"
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
          <span>03 / Four-Wheelers</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="car-placement-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            Positioning on cars and SUVs.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            On four-wheeled vehicles, the primary objective is immediate roadside scan access without infringing upon driver sightlines or vehicle safety sensors.
          </p>
        </div>

        {/* Asymmetric Editorial Composition */}
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Line art / Visual specimen */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-muted p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-border pb-4 dark:border-white/[0.08]">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-foreground dark:text-zinc-50">
                  <VaahanIcon name="car" size={14} className="text-[#cc785c]" aria-hidden="true" />
                  <span>Passenger Windshield Corner Placement</span>
                </div>
                <span className="rounded bg-[#e4e4e7] px-2 py-0.5 font-mono text-[9px] text-muted-foreground dark:bg-white/[0.08] dark:text-zinc-400">
                  Recommended Example
                </span>
              </div>

              {/* Windshield Photographic Specimen */}
              <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-white shadow-sm dark:border-white/[0.08] dark:bg-zinc-950">
                <img
                  src="/images/gallery/car-windshield-placement.jpg"
                  alt="Close-up photograph of passenger windshield corner with VaahanSafe QR safety decal"
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />

                <div className="absolute bottom-3 left-3 rounded-md bg-[#09090b]/80 px-2.5 py-1 font-mono text-[9px] text-white backdrop-blur-xs">
                  Passenger lower quadrant • Clear of ADAS &amp; wipers
                </div>
              </div>

              {/* Secondary Alternate Option */}
              <div className="mt-6 rounded-xl border border-border bg-white p-4 dark:border-white/[0.08] dark:bg-zinc-950">
                <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-foreground dark:text-zinc-50">
                  Alternate: Rear Fixed Quarter Glass
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  For vehicles with heated or solar-coated front windshields, the fixed rear quarter window provides an unobstructed, stationary glass surface at natural pedestrian eye level.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Placement Criteria */}
          <div className="space-y-4 lg:col-span-5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
              Placement Callouts & Considerations
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-white p-4 dark:border-white/[0.08] dark:bg-zinc-900">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground dark:text-zinc-50">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c]/15 text-[10px] text-[#cc785c]">01</span>
                  <span>Visible From Footpath & Curb</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  Position the decal on the passenger side so bystanders or parking attendants can scan it safely from the curb rather than standing in oncoming traffic.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white p-4 dark:border-white/[0.08] dark:bg-zinc-900">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground dark:text-zinc-50">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c]/15 text-[10px] text-[#cc785c]">02</span>
                  <span>Natural Scanning Distance</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  Decal geometry is optimized for effortless capture at 25 to 50 cm with any modern phone camera without awkward angles.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white p-4 dark:border-white/[0.08] dark:bg-zinc-900">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground dark:text-zinc-50">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c]/15 text-[10px] text-[#cc785c]">03</span>
                  <span>Driver Sightline Preservation</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  Never affix the decal in the primary forward vision field of the driver. Always keep the upper half and driver&apos;s frontal view 100% transparent.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white p-4 dark:border-white/[0.08] dark:bg-zinc-900">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground dark:text-zinc-50">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c]/15 text-[10px] text-[#cc785c]">04</span>
                  <span>Separate From Official Stickers</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  Maintain clear separation from mandatory government items such as FASTag, high-security registration plates (HSRP), and emission discs.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white p-4 dark:border-white/[0.08] dark:bg-zinc-900">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground dark:text-zinc-50">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c]/15 text-[10px] text-[#cc785c]">05</span>
                  <span>Wiper & Defrost Clearance</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  Ensure exterior wiper blades do not constantly sweep directly over the decal edges to maintain maximum adhesive seal longevity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
