import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function TwoWheelerPlacementGuide() {
  return (
    <section
      aria-labelledby="twowheeler-placement-heading"
      className="
        border-b border-border
        bg-muted/50
        py-16 sm:py-20 lg:py-24
        dark:border-border
        dark:bg-zinc-900/50
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>04 / Two-Wheelers</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="twowheeler-placement-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            Positioning on motorcycles and scooters.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Two-wheelers operate in exposed environments with tight packaging. Placement requires choosing clean, rigid body panels that remain scannable when parked on a side stand.
          </p>
        </div>

        {/* Motorcycle & Scooter Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Motorcycle Specimen */}
          <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-border pb-4 dark:border-white/[0.08]">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-foreground dark:text-zinc-50">
                <VaahanIcon name="motorcycle" size={14} className="text-[#cc785c]" aria-hidden="true" />
                <span>Motorcycle Specimen</span>
              </div>
              <span className="rounded bg-[#e4e4e7] px-2 py-0.5 font-mono text-[9px] text-muted-foreground dark:bg-white/[0.08] dark:text-zinc-400">
                Rigid Body Surface
              </span>
            </div>

            {/* Motorcycle Photographic Specimen */}
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm dark:border-white/[0.08] dark:bg-zinc-900">
              <img
                src="/images/gallery/motorcycle-placement.jpg"
                alt="Motorcycle placement photograph with VaahanSafe QR safety decal on side utility panel"
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />

              <div className="absolute bottom-3 left-3 rounded-md bg-[#09090b]/80 px-2.5 py-1 font-mono text-[9px] text-white backdrop-blur-xs">
                Side body panel • Stationary rigid frame surface
              </div>
            </div>

            <div className="mt-6 space-y-2 text-xs text-[#3f3f46] dark:text-zinc-400">
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                Illustrative Motorcycle Locations:
              </div>
              <p>• <strong>Flat Side Frame Cover:</strong> Smooth plastic or metal side utility panels below the seat.</p>
              <p>• <strong>Fuel Tank Flank:</strong> Clean upper quadrant of the tank clear of knees and tank grips.</p>
              <p>• <strong>Rear Fender Flank:</strong> Above the rear number plate bracket on stationary bodywork.</p>
            </div>
          </div>

          {/* Scooter Specimen */}
          <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-border pb-4 dark:border-white/[0.08]">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-foreground dark:text-zinc-50">
                <VaahanIcon name="bike" size={14} className="text-[#cc785c]" aria-hidden="true" />
                <span>Scooter Specimen</span>
              </div>
              <span className="rounded bg-[#e4e4e7] px-2 py-0.5 font-mono text-[9px] text-muted-foreground dark:bg-white/[0.08] dark:text-zinc-400">
                Front Apron / Flank
              </span>
            </div>

            {/* Scooter Photographic Specimen */}
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm dark:border-white/[0.08] dark:bg-zinc-900">
              <img
                src="/images/gallery/scooter-placement.jpg"
                alt="Scooter placement photograph with VaahanSafe QR safety decal on front apron legshield"
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />

              <div className="absolute bottom-3 left-3 rounded-md bg-[#09090b]/80 px-2.5 py-1 font-mono text-[9px] text-white backdrop-blur-xs">
                Front apron / legshield • Direct scan upon parking
              </div>
            </div>

            <div className="mt-6 space-y-2 text-xs text-[#3f3f46] dark:text-zinc-400">
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                Illustrative Scooter Locations:
              </div>
              <p>• <strong>Front Inner Legshield / Apron:</strong> Protected from direct stone chips and immediate upon parking.</p>
              <p>• <strong>Rear Engine Cowl / Side Flank:</strong> Expansive flat surface visible from the curb side.</p>
              <p>• <strong>Front Bezel / Windscreen Flange:</strong> Compact visor mount away from handlebar controls.</p>
            </div>
          </div>
        </div>

        {/* Helmet Advisory Box */}
        <div className="mt-8 rounded-xl border border-border bg-white p-6 dark:border-white/[0.08] dark:bg-zinc-950">
          <div className="flex items-start gap-3">
            <VaahanIcon name="alert" size={18} className="shrink-0 text-[#cc785c] mt-0.5" aria-hidden="true" />
            <div className="space-y-1 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              <strong className="font-mono text-xs uppercase tracking-wider text-foreground dark:text-zinc-50">
                Important Helmet Placement Notice:
              </strong>
              <p>
                We do <strong>not</strong> recommend placing vehicle identity decals on rider helmets. Helmets undergo safety compliance certifications (such as ISI / DOT / ECE) where unverified adhesives or chemical solvents can potentially weaken polycarbonate or composite shells. Additionally, a helmet is detached from the vehicle when parked, breaking the physical link between the vehicle and its identity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
