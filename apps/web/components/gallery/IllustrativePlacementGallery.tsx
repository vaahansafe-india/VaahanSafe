import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function IllustrativePlacementGallery() {
  const specimens = [
    {
      id: "car-windshield",
      title: "Passenger Lower Windshield",
      category: "Four-Wheeler",
      location: "Bottom Left (RHD Passenger Corner)",
      scannability: "Optimal from curb",
      notes: "Mounted from interior or exterior grade substrate depending on vehicle glass coating.",
      image: "/images/gallery/car-windshield-placement.jpg",
      alt: "Passenger lower windshield placement with VaahanSafe QR safety decal",
    },
    {
      id: "car-quarter",
      title: "Fixed Rear Quarter Window",
      category: "Sedan / Compact SUV",
      location: "Fixed C-Pillar Glazing",
      scannability: "Direct eye-level access",
      notes: "Ideal when front windshield has extensive sensor clusters or factory thermal tinting.",
      image: "/images/gallery/vehicle-placement-hero.jpg",
      alt: "Fixed rear quarter window C-pillar placement on luxury vehicle",
    },
    {
      id: "moto-side",
      title: "Chassis Flank / Side Cowl",
      category: "Motorcycle",
      location: "Mid-frame Utility Panel",
      scannability: "Accessible on side stand",
      notes: "Rigid, non-vibrational body section safely separated from exhaust piping.",
      image: "/images/gallery/motorcycle-placement.jpg",
      alt: "Motorcycle chassis flank placement with VaahanSafe QR safety decal",
    },
    {
      id: "scooter-apron",
      title: "Front Inner Legshield",
      category: "Scooter",
      location: "Upper Glovebox / Bag Hook Flank",
      scannability: "Sheltered & immediately visible",
      notes: "Protected from road debris and weather splash when parked in public bays.",
      image: "/images/gallery/scooter-placement.jpg",
      alt: "Scooter front inner legshield apron placement with VaahanSafe QR decal",
    },
  ];

  return (
    <section
      aria-labelledby="gallery-specimens-heading"
      className="
        border-b border-border
        bg-background
        py-16 sm:py-20 lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span>09 / Visual Reference Specimens</span>
          </div>

          <span className="rounded bg-[#e4e4e7] px-2.5 py-0.5 font-mono text-[9px] font-medium text-muted-foreground dark:bg-white/[0.08] dark:text-zinc-400">
            Illustrative placement examples
          </span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="gallery-specimens-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            Placement contexts across vehicle formats.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Examine how the physical decal integrates onto distinct vehicle geometries. Every specimen balances immediate optical visibility with vehicle design harmony.
          </p>
        </div>

        {/* Asymmetric Specimen Layout */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {specimens.map((item, idx) => (
            <div
              key={item.id}
              className="
                flex flex-col justify-between
                overflow-hidden rounded-2xl border border-border
                bg-muted/50 p-6 sm:p-8
                dark:border-white/[0.08] dark:bg-zinc-900
              "
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                    SPECIMEN 0{idx + 1} {"//"} {item.category}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    ILLUSTRATIVE
                  </span>
                </div>

                <h3 className="mt-3 font-serif text-2xl text-foreground dark:text-zinc-50">
                  {item.title}
                </h3>

                {/* Photographic Specimen Container */}
                <div className="group relative mt-6 aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-white shadow-xs dark:border-white/[0.08] dark:bg-zinc-950">
                  <img
                    src={item.image}
                    alt={item.alt}
                    className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Top Bar Overlay */}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/75 via-black/40 to-transparent p-3.5">
                    <div className="flex items-center gap-2">
                      <VaahanIcon name="qr-code" size={13} className="text-[#cc785c]" aria-hidden="true" />
                      <span className="font-mono text-[9px] font-semibold tracking-wider text-white">
                        POSITIONAL GEOMETRY
                      </span>
                    </div>
                    <span className="rounded bg-white/20 px-2 py-0.5 font-mono text-[8px] font-medium tracking-wider text-white backdrop-blur-xs">
                      REF #{item.id}
                    </span>
                  </div>

                  {/* Bottom Bar Overlay */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3.5">
                    <span className="font-mono text-[10px] font-medium text-white">
                      {item.location}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[9px] font-medium text-[#5db8a6]">
                      ✓ Compliant
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-b border-border/60 pb-3 font-mono text-[10px] text-muted-foreground dark:border-white/[0.06] dark:text-zinc-400">
                  <span>Scan: {item.scannability}</span>
                  <span className="text-[#cc785c]">Verified geometry</span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  {item.notes}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
