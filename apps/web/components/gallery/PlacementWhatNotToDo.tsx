import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function PlacementWhatNotToDo() {
  const cautions = [
    {
      title: "Covered by Heavy Tint or Frit",
      desc: "Do not place directly behind dark aftermarket window film or inside the solid black ceramic dot matrix (frit) of the windshield where optical contrast drops.",
    },
    {
      title: "Over Mandatory Plates & RFID",
      desc: "Never stick the decal on top of your FASTag, High-Security Registration Plate (HSRP), chassis engraving, or pollution certificate sticker.",
    },
    {
      title: "Over Lighting Elements",
      desc: "Do not apply over headlamps, fog lights, tail lamps, or turn indicator housings. Decals will degrade under lamp heat and obstruct beam projection.",
    },
    {
      title: "Vibrating or High-Heat Surfaces",
      desc: "Avoid engine casings, exhaust heat shields, suspension springs, or flexible rubber flaps where extreme thermal cycles or movement loosen adhesion.",
    },
  ];

  return (
    <section
      aria-labelledby="what-not-to-do-heading"
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
          <span>07 / Common Misplacements</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="what-not-to-do-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            Positions to avoid.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Improper placement can impede optical camera scans, diminish vehicle illumination, or violate windscreen visibility requirements.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cautions.map((item, idx) => (
            <div
              key={idx}
              className="
                rounded-2xl border border-border
                bg-muted/50 p-6
                dark:border-white/[0.08] dark:bg-zinc-900
              "
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#cc785c]/10 text-[#cc785c]">
                <VaahanIcon name="alert" size={16} aria-hidden="true" />
              </div>

              <h3 className="mt-4 font-serif text-lg text-foreground dark:text-zinc-50">
                {item.title}
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-border bg-muted p-4 text-xs text-muted-foreground dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-400">
          <span className="font-mono font-medium text-foreground dark:text-zinc-50">Advisory:</span>{" "}
          This guide provides practical recommendations and does not constitute exhaustive legal advice. Owners remain responsible for ensuring vehicle compliance with applicable local transport regulations.
        </div>
      </div>
    </section>
  );
}
