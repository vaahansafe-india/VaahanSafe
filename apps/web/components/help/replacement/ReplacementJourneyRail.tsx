import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ReplacementJourneyRail() {
  const steps = [
    {
      num: "01",
      title: "Identify the Issue",
      desc: "Determine whether the QR decal is scratched, lost, or degraded due to windshield replacement.",
    },
    {
      num: "02",
      title: "Open Your Account",
      desc: "Sign in to your customer dashboard at app.vaahansafe.com using your registered mobile number.",
    },
    {
      num: "03",
      title: "Select Vehicle / QR",
      desc: "Locate the affected vehicle in your garage list and navigate to the 'My QR' settings tab.",
    },
    {
      num: "04",
      title: "Request Replacement",
      desc: "Submit a replacement order. State the reason (e.g. glass repair or unreadable decal) for records.",
    },
    {
      num: "05",
      title: "Complete Verification",
      desc: "Confirm your registered dispatch address and verify your identity through secure mobile authorization.",
    },
    {
      num: "06",
      title: "Follow Replacement Process",
      desc: "Receive your new automotive decal. Follow the placement guide and verify continuity upon arrival.",
    },
  ];

  return (
    <section
      id="replacement-journey"
      aria-labelledby="replacement-journey-heading"
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
          <span>The Procedural Workflow</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="replacement-journey-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            The replacement journey.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Follow these six clear steps to request a new physical decal while keeping your vehicle profile active.
          </p>
        </div>

        {/* 6 Steps Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.num}
              className="
                relative flex flex-col justify-between
                rounded-2xl border border-border
                bg-muted/50 p-6 sm:p-7
                dark:border-white/[0.08] dark:bg-zinc-900
              "
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#cc785c]">
                    STEP {s.num}
                  </span>
                  <VaahanIcon name="check" size={14} className="text-[#5db8a6]" aria-hidden="true" />
                </div>

                <h3 className="mt-4 font-serif text-xl text-foreground dark:text-zinc-50">
                  {s.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm dark:text-zinc-400">
                  {s.desc}
                </p>
              </div>

              <div className="mt-6 border-t border-border pt-3 font-mono text-[9px] text-muted-foreground dark:border-white/[0.06]">
                Sequential Stage
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
