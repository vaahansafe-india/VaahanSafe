import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface FlowStep {
  readonly index: string;
  readonly title: string;
  readonly description: string;
}

const REVIEW_STEPS: readonly FlowStep[] = [
  {
    index: "01",
    title: "Contact",
    description: "Submit your inquiry via our official support channel with registered mobile details.",
  },
  {
    index: "02",
    title: "Identify",
    description: "Provide your order ID, payment reference, and photos if hardware was damaged.",
  },
  {
    index: "03",
    title: "Review",
    description: "Our operations desk inspects payment gateway traces and logistics reports.",
  },
  {
    index: "04",
    title: "Resolution",
    description: "An appropriate resolution (e.g. re-dispatch, reconciliation) is delivered.",
  },
] as const;

export function OrderReviewFlowCard() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border bg-muted p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-900">
      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span>Structured Protocol • Order Review</span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal text-foreground sm:text-2xl dark:text-zinc-50">
        Something went wrong with your order?
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
        We follow a disciplined 4-stage review process to investigate and resolve genuine payment, shipping, or sticker defects.
      </p>

      {/* 4-Step Progression */}
      <div className="mt-6 grid gap-2 sm:grid-cols-4 sm:gap-3">
        {REVIEW_STEPS.map((step) => (
          <div
            key={step.index}
            className="rounded-lg border border-border bg-background p-3.5 dark:border-white/[0.06] dark:bg-zinc-950"
          >
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#cc785c]">
              Step {step.index}
            </span>
            <p className="mt-1 font-mono text-xs font-semibold text-foreground dark:text-zinc-50">
              {step.title}
            </p>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-400">
              {step.description}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground dark:border-white/[0.06] dark:text-zinc-500">
        <VaahanIcon name="shield" size={12} className="text-[#5db8a6]" />
        <span>Submitting an order review does not automatically guarantee a cash refund. Legitimate remedies are provided based on transaction records.</span>
      </div>
    </div>
  );
}
