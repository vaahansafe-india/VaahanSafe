"use client";

import { cn } from "@vaahansafe/ui/lib/utils";
import { VaahanIcon } from "@vaahansafe/icons";
import type { FulfillmentRailStep, OrderFulfillmentStage } from "@/lib/orders-types";

interface FulfillmentRailProps {
  steps: FulfillmentRailStep[];
  stage: OrderFulfillmentStage;
  className?: string;
  isCompact?: boolean;
}

export function FulfillmentRail({
  steps,
  stage,
  className,
  isCompact = false,
}: FulfillmentRailProps) {
  if (stage === "CANCELLED") {
    return (
      <div className={cn("rounded-xl border border-destructive/20 bg-destructive/5 p-4", className)}>
        <div className="flex items-center gap-2.5 text-destructive">
          <VaahanIcon name="alert" className="size-4 shrink-0" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider">
            Order Cancelled
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          This order was cancelled before fulfillment completed.
        </p>
      </div>
    );
  }

  const completedIndex = steps.reduce(
    (acc, step, idx) => (step.state === "completed" ? idx : acc),
    -1
  );

  return (
    <div className={cn("w-full", className)}>
      {/* DESKTOP HORIZONTAL RAIL (md and up) */}
      <div className={cn("hidden md:block", isCompact ? "py-2" : "py-3")}>
        <div className="relative flex items-start justify-between">
          {/* Background track line - runs through exact center of all circles */}
          {steps.length > 1 && (
            <div
              className="absolute top-3 h-0.5 bg-border -translate-y-1/2 z-0"
              style={{
                left: `${100 / (steps.length * 2)}%`,
                right: `${100 / (steps.length * 2)}%`,
              }}
            />
          )}

          {/* Active progress track line */}
          {completedIndex >= 0 && steps.length > 1 && (
            <div
              className="absolute top-3 h-0.5 bg-teal-600 -translate-y-1/2 z-0 transition-all duration-300"
              style={{
                left: `${100 / (steps.length * 2)}%`,
                width: `${(completedIndex / (steps.length - 1)) * (100 - 100 / steps.length)}%`,
              }}
            />
          )}

          {steps.map((step, idx) => {
            const isCompleted = step.state === "completed";
            const isCurrent = step.state === "current";
            const isFailed = step.state === "failed";
            const isFuture = step.state === "future";

            return (
              <div
                key={step.id}
                className="relative z-10 flex flex-1 flex-col items-center text-center px-1"
              >
                {/* Node indicator - anchored to top-0, center at y = 12px */}
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono font-bold transition-all duration-300",
                    isCompleted && "border-teal-600 bg-teal-600 text-white shadow-xs",
                    isCurrent && "border-[#cc785c] bg-[#cc785c] text-white ring-4 ring-[#cc785c]/20 shadow-xs",
                    isFailed && "border-destructive bg-destructive text-white",
                    isFuture && "border-border bg-background text-muted-foreground/60"
                  )}
                >
                  {isCompleted ? (
                    <VaahanIcon name="check" className="size-3.5 stroke-[2.5]" />
                  ) : isFailed ? (
                    <VaahanIcon name="alert" className="size-3.5 stroke-[2.5]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Node Labels - centered under node indicator */}
                <div className="mt-2 space-y-0.5 w-full">
                  <div
                    className={cn(
                      "font-mono text-[11px] font-medium tracking-tight leading-snug",
                      isCurrent
                        ? "font-semibold text-[#cc785c]"
                        : isCompleted
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </div>
                  {step.sublabel && (
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {step.sublabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE VERTICAL RAIL (<md) */}
      <div className="block md:hidden">
        <div className="relative space-y-4 pl-7 before:absolute before:left-[9px] before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-border">
          {steps.map((step, idx) => {
            const isCompleted = step.state === "completed";
            const isCurrent = step.state === "current";
            const isFailed = step.state === "failed";
            const isFuture = step.state === "future";

            return (
              <div key={step.id} className="relative flex items-start gap-2.5">
                {/* Node circle on vertical rail line */}
                <div
                  className={cn(
                    "absolute -left-7 top-0.5 flex size-5 items-center justify-center rounded-full border text-[9px] font-mono font-bold transition-all shrink-0",
                    isCompleted && "border-teal-600 bg-teal-600 text-white",
                    isCurrent && "border-[#cc785c] bg-[#cc785c] text-white ring-2 ring-[#cc785c]/20",
                    isFailed && "border-destructive bg-destructive text-white",
                    isFuture && "border-border bg-background text-muted-foreground/60"
                  )}
                >
                  {isCompleted ? (
                    <VaahanIcon name="check" className="size-3 stroke-[2.5]" />
                  ) : isFailed ? (
                    <VaahanIcon name="alert" className="size-3" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <span
                      className={cn(
                        "font-mono text-xs font-semibold",
                        isCurrent ? "text-[#cc785c]" : isCompleted ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                    {step.sublabel && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {step.sublabel}
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
