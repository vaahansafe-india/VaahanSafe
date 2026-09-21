import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function PrePlacementChecklist() {
  const checklist = [
    {
      step: "01",
      title: "Choose a Visible Location",
      desc: "Select a position easily spotted by emergency responders or parking marshals from the footpath or curb without opening doors.",
    },
    {
      step: "02",
      title: "Check Required Information",
      desc: "Confirm the chosen spot does not cover FASTag stickers, toll sensors, state tax discs, or vehicle chassis stamps.",
    },
    {
      step: "03",
      title: "Avoid Lights & Controls",
      desc: "Never apply over headlamps, indicator lenses, rearview mirrors, wiper blade sweep areas, or vehicle sensor radomes.",
    },
    {
      step: "04",
      title: "Clean & Prepare Substrate",
      desc: "Thoroughly degrease the glass or body surface with a lint-free alcohol wipe. Ensure the area is 100% dry and dust-free before peeling.",
    },
    {
      step: "05",
      title: "Follow Local Regulations",
      desc: "Ensure placement complies with applicable Central Motor Vehicle Rules (CMVR) regarding driver forward vision and glazing transparency.",
    },
  ];

  return (
    <section
      aria-labelledby="checklist-heading"
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
          <span>05 / Pre-Placement Protocol</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="checklist-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            Checklist before peeling the adhesive.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Taking two minutes to inspect your vehicle surface guarantees a lasting, bubble-free application that stays compliant and easy to scan.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {checklist.map((item) => (
            <div
              key={item.step}
              className="
                relative flex flex-col justify-between
                rounded-2xl border border-border
                bg-muted/60 p-6 sm:p-7
                dark:border-white/[0.08] dark:bg-zinc-900
              "
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#cc785c]">
                    STEP {item.step}
                  </span>
                  <VaahanIcon name="check" size={14} className="text-[#5db8a6]" aria-hidden="true" />
                </div>

                <h3 className="mt-4 font-serif text-xl text-foreground dark:text-zinc-50">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm dark:text-zinc-400">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
