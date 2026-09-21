import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface StepNode {
  readonly index: string;
  readonly label: string;
  readonly description: string;
  readonly isAnchor?: boolean;
}

const RELATIONSHIP_STEPS: readonly StepNode[] = [
  {
    index: "01",
    label: "YOU",
    description: "Vehicle owner or authorized operator registering with mobile verification",
  },
  {
    index: "02",
    label: "ACCOUNT",
    description: "Authenticated credentials maintaining access, configuration & privacy controls",
  },
  {
    index: "03",
    label: "VEHICLE",
    description: "Physical motor vehicle designated by the owner for safety identification",
  },
  {
    index: "04",
    label: "IDENTITY",
    description: "VaahanSafe QR access point bridging the physical vehicle to the digital platform",
    isAnchor: true,
  },
  {
    index: "05",
    label: "SERVICES",
    description: "Controlled safety view, emergency relay notifications, and active plan features",
  },
] as const;

export function TermsRelationshipModel() {
  return (
    <section
      aria-label="VaahanSafe Terms Relationship Model"
      className="border-b border-border bg-muted/50 py-12 dark:border-white/[0.08] dark:bg-zinc-950/40"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* Section Label */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-[#cc785c]">
            Conceptual Model / Terms Relationship
          </span>
          <span className="h-px w-8 bg-[#cc785c]/40" />
        </div>

        {/* ======================================================== */}
        {/* DESKTOP HORIZONTAL PROGRESSION (lg and up)                */}
        {/* ======================================================== */}
        <div className="mt-8 hidden lg:grid lg:grid-cols-5 lg:gap-4 xl:gap-6">
          {RELATIONSHIP_STEPS.map((step, idx) => (
            <div
              key={step.index}
              className={`
                relative flex flex-col justify-between
                rounded-xl border p-5 transition-colors
                ${
                  step.isAnchor
                    ? "border-[#cc785c]/40 bg-background shadow-[0_4px_20px_rgba(204,120,92,0.08)] dark:border-[#cc785c]/40 dark:bg-zinc-900"
                    : "border-border bg-background/80 dark:border-white/[0.08] dark:bg-zinc-950"
                }
              `}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[9px] font-semibold tracking-[0.14em] ${
                      step.isAnchor ? "text-[#cc785c]" : "text-muted-foreground dark:text-zinc-500"
                    }`}
                  >
                    {step.index}
                  </span>

                  {step.isAnchor && (
                    <span className="flex items-center gap-1.5 rounded-full bg-[#cc785c]/10 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.16em] text-[#cc785c]">
                      <span className="h-1 w-1 rounded-full bg-[#cc785c]" />
                      <span>Anchor</span>
                    </span>
                  )}
                </div>

                <h3
                  className={`mt-3 font-mono text-sm font-semibold tracking-[0.12em] ${
                    step.isAnchor
                      ? "text-[#cc785c]"
                      : "text-foreground dark:text-zinc-50"
                  }`}
                >
                  {step.label}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  {step.description}
                </p>
              </div>

              {/* Right connector arrow on desktop */}
              {idx < RELATIONSHIP_STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden xl:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-500"
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
          {RELATIONSHIP_STEPS.map((step, idx) => (
            <React.Fragment key={step.index}>
              <div
                className={`
                  rounded-xl border p-4
                  ${
                    step.isAnchor
                      ? "border-[#cc785c]/40 bg-background shadow-sm dark:border-[#cc785c]/40 dark:bg-zinc-900"
                      : "border-border bg-background/80 dark:border-white/[0.08] dark:bg-zinc-950"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`font-mono text-[9px] font-semibold tracking-[0.14em] ${
                        step.isAnchor ? "text-[#cc785c]" : "text-muted-foreground dark:text-zinc-500"
                      }`}
                    >
                      {step.index}
                    </span>
                    <h3
                      className={`font-mono text-xs font-semibold tracking-[0.12em] ${
                        step.isAnchor ? "text-[#cc785c]" : "text-foreground dark:text-zinc-50"
                      }`}
                    >
                      {step.label}
                    </h3>
                  </div>

                  {step.isAnchor && (
                    <span className="flex items-center gap-1 rounded-full bg-[#cc785c]/10 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.14em] text-[#cc785c]">
                      <span className="h-1 w-1 rounded-full bg-[#cc785c]" />
                      <span>Anchor</span>
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  {step.description}
                </p>
              </div>

              {/* Vertical connector arrow */}
              {idx < RELATIONSHIP_STEPS.length - 1 && (
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

        {/* Supporting Copy & Legal Confirmation Notice */}
        <div className="mt-8 border-t border-border/80 pt-5 dark:border-white/[0.06]">
          <p className="max-w-[760px] text-xs leading-relaxed text-[#3f3f46] sm:text-sm sm:leading-7 dark:text-zinc-400">
            Using VaahanSafe creates a structured relationship between your account,
            the vehicle information you provide, the QR identity associated with that
            vehicle, and the services available around that identity.
          </p>

          <div className="mt-3 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground dark:text-zinc-500">
            <span className="h-1 w-1 rounded-full bg-[#5db8a6]" />
            <span>Product Architecture Model • Final legal wording subject to counsel validation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
