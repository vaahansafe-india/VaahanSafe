import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

const TRUST_PRINCIPLES = [
  {
    index: "01",
    label: "Control",
    title: "You manage supported safety information.",
    description: "You decide what can come forward. No forced broadcast of unapproved private data.",
    icon: "shield",
    tone: "coral",
  },
  {
    index: "02",
    label: "Boundary",
    title: "Account and public view are separate.",
    description: "A scan leads to the roadside safety view — never your complete management account.",
    icon: "lock",
    tone: "neutral",
  },
  {
    index: "03",
    label: "Activation",
    title: "Scanning is not ownership.",
    description: "The public QR opens the vehicle identity view; retail activation requires concealed scratch proof.",
    icon: "qr",
    tone: "neutral",
  },
  {
    index: "04",
    label: "Continuity",
    title: "QR access is treated as a critical path.",
    description: "The public scan experience is designed for fast, resilient roadside resolution.",
    icon: "activity",
    tone: "teal",
  },
] as const;

export function SafetyTrustPrinciples() {
  return (
    <section
      aria-labelledby="safety-trust-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        py-16
        sm:py-20
        lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
            09 / Foundation
          </span>

          <h2
            id="safety-trust-heading"
            className="
              mt-3 font-serif
              text-3xl font-normal leading-[1.1]
              tracking-[-0.03em]
              text-foreground
              sm:text-4xl
              lg:text-5xl
              dark:text-zinc-50
            "
          >
            Four trust principles.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
            We avoid marketing hype and fake encryption claims. These four architectural
            rules govern how your data is handled every day.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_PRINCIPLES.map((principle) => (
            <div
              key={principle.index}
              className="rounded-2xl border border-border bg-muted p-6 dark:border-white/[0.08] dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em]">
                <span className={principle.tone === "coral" ? "text-[#cc785c]" : principle.tone === "teal" ? "text-[#5db8a6]" : "text-muted-foreground"}>
                  {principle.index}
                </span>
                <span className="text-muted-foreground">{principle.label}</span>
              </div>

              <div className="mt-4 font-serif text-lg text-foreground dark:text-zinc-50">
                {principle.title}
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
