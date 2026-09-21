import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function PlacementToConnectionFlow() {
  const steps = [
    {
      num: "01",
      label: "Place",
      desc: "Affixed cleanly to passenger glass or frame panel.",
      icon: "qr-code" as const,
    },
    {
      num: "02",
      label: "Scan",
      desc: "Captured instantly by smartphone camera from curb.",
      icon: "eye" as const,
    },
    {
      num: "03",
      label: "Identify",
      desc: "Encrypted route resolves vehicle identity record.",
      icon: "shield" as const,
    },
    {
      num: "04",
      label: "Safety View",
      desc: "Configured emergency context presented to scanner.",
      icon: "document" as const,
    },
    {
      num: "05",
      label: "Connect",
      desc: "Direct private relay triggers call or SMS alert.",
      icon: "phone" as const,
    },
  ];

  return (
    <section
      aria-labelledby="placement-flow-heading"
      className="
        border-b border-border
        bg-muted/60
        py-16 sm:py-20 lg:py-24
        dark:border-border
        dark:bg-zinc-900/60
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>08 / Full Loop</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="placement-flow-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            From vehicle placement to useful connection.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Placement is not an aesthetic afterthought; it is the physical foundation that powers roadside resolution when every second matters.
          </p>
        </div>

        {/* Step Flow Architecture */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s) => (
            <div
              key={s.num}
              className="
                relative flex flex-col justify-between
                rounded-2xl border border-border
                bg-white p-6 shadow-sm
                dark:border-white/[0.08] dark:bg-zinc-950
              "
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold text-[#cc785c]">
                    STEP {s.num}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-background text-foreground dark:bg-zinc-900 dark:text-zinc-50">
                    <VaahanIcon name={s.icon} size={14} aria-hidden="true" />
                  </div>
                </div>

                <h3 className="mt-5 font-serif text-xl text-foreground dark:text-zinc-50">
                  {s.label}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  {s.desc}
                </p>
              </div>

              <div className="mt-6 border-t border-[#f0eae1] pt-3 font-mono text-[9px] text-muted-foreground dark:border-white/[0.06]">
                Physical → Cloud Relay
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
