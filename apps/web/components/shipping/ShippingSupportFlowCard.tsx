import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface FlowStep {
  readonly index: string;
  readonly title: string;
  readonly description: string;
}

const SUPPORT_STEPS: readonly FlowStep[] = [
  {
    index: "01",
    title: "Identify Order",
    description: "Provide your order ID, registered mobile number, and recipient PIN code.",
  },
  {
    index: "02",
    title: "Describe Issue",
    description: "Specify whether the package is delayed, damaged in transit, or missing items.",
  },
  {
    index: "03",
    title: "Submit Photos",
    description: "Attach clear photographs of the envelope and damaged decal if applicable.",
  },
  {
    index: "04",
    title: "Operations Review",
    description: "Our desk investigates courier manifests, tracking logs, and scannability.",
  },
  {
    index: "05",
    title: "Resolution",
    description: "Receive re-dispatch tracking or an appropriate warranty replacement.",
  },
] as const;

export function ShippingSupportFlowCard() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border bg-muted p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-900">
      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span>Resolution Workflow • Order Support</span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal text-foreground sm:text-2xl dark:text-zinc-50">
        Something wrong with your order?
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
        Follow our 5-step order support workflow to resolve delayed delivery, transit damage, or hardware defects.
      </p>

      {/* 5-Stage Progression Grid */}
      <div className="mt-6 grid gap-2 sm:grid-cols-5 sm:gap-2.5">
        {SUPPORT_STEPS.map((step) => (
          <div
            key={step.index}
            className="rounded-lg border border-border bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950"
          >
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#cc785c]">
              Step {step.index}
            </span>
            <p className="mt-1 font-mono text-xs font-semibold text-foreground dark:text-zinc-50">
              {step.title}
            </p>
            <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground dark:text-zinc-400">
              {step.description}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground dark:border-white/[0.06] dark:text-zinc-500">
        <VaahanIcon name="shield" size={12} className="text-[#5db8a6]" />
        <span>Reporting issues promptly ensures swift coordination with logistics carriers and immediate dispatch of replacement hardware.</span>
      </div>
    </div>
  );
}
