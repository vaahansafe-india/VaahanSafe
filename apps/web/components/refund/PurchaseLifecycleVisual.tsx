import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface StepNode {
  readonly index: string;
  readonly label: string;
  readonly description: string;
  readonly isFinal?: boolean;
}

const LIFECYCLE_STEPS: readonly StepNode[] = [
  {
    index: "01",
    label: "PURCHASE",
    description: "Cart submission & payment authorization via secure gateway",
  },
  {
    index: "02",
    label: "CONFIRM",
    description: "Order verification, vehicle pairing & account linkage",
  },
  {
    index: "03",
    label: "FULFILL",
    description: "Customized decal assignment, packaging or service commencement",
  },
  {
    index: "04",
    label: "FINAL PURCHASE",
    description: "Transaction completed; physical & digital identity allocated",
    isFinal: true,
  },
] as const;

export function PurchaseLifecycleVisual() {
  return (
    <section
      aria-label="VaahanSafe Purchase Lifecycle"
      className="border-b border-white/[0.08] bg-[#09090b] py-12 text-[#fafafa]"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* Section Label */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-[#cc785c]">
            Commercial Model / Purchase Lifecycle
          </span>
          <span className="h-px w-8 bg-[#cc785c]/40" />
        </div>

        {/* ======================================================== */}
        {/* DESKTOP HORIZONTAL PROGRESSION (lg and up)                */}
        {/* ======================================================== */}
        <div className="mt-8 hidden lg:grid lg:grid-cols-4 lg:gap-5 xl:gap-6">
          {LIFECYCLE_STEPS.map((step, idx) => (
            <div
              key={step.index}
              className={`
                relative flex flex-col justify-between
                rounded-xl border p-5 transition-colors
                ${
                  step.isFinal
                    ? "border-[#cc785c]/40 bg-[#18181b] shadow-[0_4px_24px_rgba(204,120,92,0.12)]"
                    : "border-white/[0.08] bg-[#18181b]"
                }
              `}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[9px] font-semibold tracking-[0.14em] ${
                      step.isFinal ? "text-[#cc785c]" : "text-[#71717a]"
                    }`}
                  >
                    {step.index}
                  </span>

                  {step.isFinal ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-[#cc785c]/15 px-2.5 py-0.5 font-mono text-[7px] font-semibold uppercase tracking-[0.16em] text-[#cc785c]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
                      <span>NON-REFUNDABLE</span>
                    </span>
                  ) : (
                    <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#71717a]">
                      In Progress
                    </span>
                  )}
                </div>

                <h3
                  className={`mt-3 font-mono text-sm font-semibold tracking-[0.12em] ${
                    step.isFinal ? "text-[#cc785c]" : "text-[#fafafa]"
                  }`}
                >
                  {step.label}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-[#a1a1aa]">
                  {step.description}
                </p>
              </div>

              {/* Right connector arrow on desktop */}
              {idx < LIFECYCLE_STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 hidden xl:flex h-6 w-6 items-center justify-center rounded-full border border-[#3f3f46] bg-[#09090b] text-muted-foreground shadow-sm"
                >
                  <VaahanIcon name="arrow-right" size={10} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ======================================================== */}
        {/* MOBILE & TABLET VERTICAL PROGRESSION                      */}
        {/* ======================================================== */}
        <div className="mt-8 space-y-3 lg:hidden">
          {LIFECYCLE_STEPS.map((step, idx) => (
            <React.Fragment key={step.index}>
              <div
                className={`
                  rounded-xl border p-4
                  ${
                    step.isFinal
                      ? "border-[#cc785c]/40 bg-[#18181b]"
                      : "border-white/[0.08] bg-[#18181b]"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`font-mono text-[9px] font-semibold tracking-[0.14em] ${
                        step.isFinal ? "text-[#cc785c]" : "text-[#71717a]"
                      }`}
                    >
                      {step.index}
                    </span>
                    <h3
                      className={`font-mono text-xs font-semibold tracking-[0.12em] ${
                        step.isFinal ? "text-[#cc785c]" : "text-[#fafafa]"
                      }`}
                    >
                      {step.label}
                    </h3>
                  </div>

                  {step.isFinal && (
                    <span className="flex items-center gap-1 rounded-full bg-[#cc785c]/15 px-2 py-0.5 font-mono text-[7px] font-semibold uppercase tracking-[0.14em] text-[#cc785c]">
                      <span className="h-1 w-1 rounded-full bg-[#cc785c]" />
                      <span>NON-REFUNDABLE</span>
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs leading-relaxed text-[#a1a1aa]">
                  {step.description}
                </p>
              </div>

              {/* Vertical connector arrow */}
              {idx < LIFECYCLE_STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="flex justify-center py-0.5 text-[#cc785c]/60"
                >
                  <VaahanIcon name="chevron-down" size={14} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Supporting statement */}
        <div className="mt-8 border-t border-white/[0.08] pt-5">
          <p className="max-w-[760px] text-xs leading-relaxed text-[#e4e4e7] sm:text-sm sm:leading-7">
            Once a purchase reaches the applicable non-refundable stage, it cannot
            normally be returned for a refund. Physical decal pairing and digital identity
            infrastructure are allocated specifically to the designated vehicle.
          </p>

          <div className="mt-3 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-[#5db8a6]" />
            <span>
              Product Policy Architecture • Trigger threshold subject to formal legal confirmation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
