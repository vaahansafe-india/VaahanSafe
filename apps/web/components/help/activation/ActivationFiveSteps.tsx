import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ActivationFiveSteps() {
  const steps = [
    {
      num: "01",
      title: "SCAN",
      subtitle: "Scan the VaahanSafe QR",
      desc: "Use your smartphone camera to scan the physical retail decal. Tap the prompt to open activate.vaahansafe.com.",
      icon: "eye" as const,
    },
    {
      num: "02",
      title: "REVEAL",
      subtitle: "Reveal activation PIN",
      desc: "Gently scratch the concealed silver coating on the pack to reveal your unique 6-character activation secret.",
      icon: "qr-code" as const,
    },
    {
      num: "03",
      title: "VERIFY",
      subtitle: "Verify with mobile OTP",
      desc: "Sign in with your registered mobile phone number. Submit the revealed activation PIN to verify your ownership right.",
      icon: "shield" as const,
    },
    {
      num: "04",
      title: "CONNECT",
      subtitle: "Bind to your vehicle",
      desc: "Select an existing vehicle from your garage or enter the registration number of your new car or two-wheeler.",
      icon: "car" as const,
    },
    {
      num: "05",
      title: "ACTIVE",
      subtitle: "Instant roadside protection",
      desc: "Activation completes instantly. Clean the windshield or body panel, peel the decal, and apply it firmly to your vehicle.",
      icon: "check" as const,
    },
  ];

  return (
    <section
      aria-labelledby="five-steps-heading"
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
          <span>The 5-Step Process</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="five-steps-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            How to activate in five steps.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Follow this simple five-step sequence from unboxing your retail decal to live roadside protection.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s) => (
            <div
              key={s.num}
              className="
                relative flex flex-col justify-between
                rounded-2xl border border-border
                bg-muted/50 p-6 shadow-sm
                dark:border-white/[0.08] dark:bg-zinc-900
              "
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#cc785c]">
                    STEP {s.num}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-foreground shadow-sm dark:bg-zinc-900 dark:text-zinc-50">
                    <VaahanIcon name={s.icon} size={14} aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-4 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground dark:text-zinc-50">
                  {s.num} {s.title}
                </div>

                <h3 className="mt-1 font-serif text-lg text-foreground dark:text-zinc-50">
                  {s.subtitle}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  {s.desc}
                </p>
              </div>

              <div className="mt-6 border-t border-border pt-3 font-mono text-[8px] uppercase tracking-wider text-muted-foreground dark:border-white/[0.06]">
                Sequential Gate
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
