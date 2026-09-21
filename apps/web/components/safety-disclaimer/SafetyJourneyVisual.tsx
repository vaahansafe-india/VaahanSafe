import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { SAFETY_JOURNEY_STEPS } from "../../app/safety-disclaimer/safety-disclaimer-content";

export function SafetyJourneyVisual() {
  return (
    <section
      aria-label="VaahanSafe Safety Journey and Emergency Services Boundary"
      className="border-b border-border bg-muted/50 py-12 dark:border-white/[0.08] dark:bg-zinc-950/40"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-[#cc785c]">
            Functional Scope / Digital Connection vs Emergency Responders
          </span>
          <span className="h-px w-8 bg-[#cc785c]/40" />
        </div>

        {/* 4-Stage Digital Journey */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {SAFETY_JOURNEY_STEPS.map((step, idx) => (
            <div
              key={step.index}
              className="relative flex flex-col justify-between rounded-xl border border-border bg-background p-5 dark:border-white/[0.08] dark:bg-zinc-900"
            >
              <div>
                <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#cc785c]">
                  {step.index}
                </span>

                <h3 className="mt-2 font-mono text-sm font-semibold tracking-[0.12em] text-foreground dark:text-zinc-50">
                  {step.label}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                  {step.description}
                </p>
              </div>

              {idx < SAFETY_JOURNEY_STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-500"
                >
                  <VaahanIcon name="arrow-right" size={10} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* The Fundamental Structural Boundary */}
        <div className="mt-8 rounded-2xl border border-border bg-background p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-950">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <div className="border-b border-border pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8 dark:border-white/[0.08]">
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-[#5db8a6]">
                VaahanSafe Digital Experience
              </span>
              <h4 className="mt-1 font-serif text-lg font-normal text-foreground sm:text-xl dark:text-zinc-50">
                Civilian identification and owner contact relay
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                Facilitates bystander vehicle checks, alerts registered emergency contacts via SMS/calls, and presents discretionary medical markers.
              </p>
            </div>

            <div className="lg:pl-2">
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-[#cc785c]">
                Emergency Authorities (Distinct Domain)
              </span>
              <h4 className="mt-1 font-serif text-lg font-normal text-foreground sm:text-xl dark:text-zinc-50">
                Police • Ambulance • Fire & Rescue • Hospital Trauma Care
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                Official state-authorized first responders equipped to provide clinical trauma triage, legal enforcement, and life-saving physical dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
