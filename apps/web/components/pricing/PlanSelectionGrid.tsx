import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { getCustomerUrl } from "@vaahansafe/config";
import { PLANS_CONFIG } from "../../app/pricing/plans-config";

export function PlanSelectionGrid() {
  const customerUrl = getCustomerUrl();

  return (
    <section
      aria-labelledby="plan-selection-heading"
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
          <span>04 / Plan Selection</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="plan-selection-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            Configured service tiers.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Select the service envelope that matches your vehicle use profile. Every tier operates on the unified VaahanSafe QR infrastructure.
          </p>
        </div>

        {/* Commercial Verification Alert */}
        <div className="mt-8 rounded-lg border border-border bg-muted p-4 text-xs text-muted-foreground dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-400">
          <span className="font-mono font-medium text-[#cc785c]">NOTICE:</span>{" "}
          Commercial subscription figures are governed by current regional rollout policies. For active quotes and corporate dispatch provisioning, please reference your customer portal or contact enterprise support.
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {PLANS_CONFIG.map((plan) => {
            const isRec = plan.isRecommended;

            return (
              <div
                key={plan.id}
                className={`
                  relative flex flex-col justify-between
                  rounded-2xl border p-6 sm:p-8
                  transition-all
                  ${
                    isRec
                      ? "border-[#cc785c] bg-white shadow-sm ring-1 ring-[#cc785c]/20 dark:border-[#cc785c] dark:bg-zinc-900"
                      : "border-border bg-muted/50 hover:border-[#cc785c]/50 dark:border-white/[0.08] dark:bg-zinc-950"
                  }
                `}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {plan.id}
                    </span>
                    {plan.badge && (
                      <span className="rounded bg-[#cc785c]/10 px-2 py-0.5 font-mono text-[9px] font-medium tracking-wider text-[#cc785c]">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 font-serif text-2xl text-foreground dark:text-zinc-50">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                    {plan.description}
                  </p>

                  <div className="mt-6 border-t border-b border-border py-4 dark:border-white/[0.08]">
                    <div className="font-mono text-xl font-medium tracking-tight text-foreground dark:text-zinc-50">
                      {plan.priceDisplay}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {plan.periodDisplay}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Best for:
                    </div>
                    <p className="mt-1 text-xs text-[#3f3f46] dark:text-[#c4c0b8]">
                      {plan.bestFor}
                    </p>
                  </div>

                  <div className="mt-6 space-y-2.5">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Included Services:
                    </div>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#3f3f46] dark:text-[#c4c0b8]">
                        <span className="mt-0.5 text-[#5db8a6]">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border dark:border-white/[0.08]">
                  <a
                    href={plan.id === "fleet" ? "mailto:fleet@vaahansafe.com" : `${customerUrl}/order?plan=${plan.id}`}
                    className={`
                      inline-flex h-10 w-full items-center justify-center gap-2
                      rounded-md font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                      transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
                      ${
                        isRec
                          ? "bg-[#cc785c] text-white hover:bg-[#a9583e]"
                          : "border border-border bg-white text-foreground hover:border-[#cc785c] hover:bg-background dark:border-white/[0.12] dark:bg-zinc-900 dark:text-zinc-50"
                      }
                    `}
                  >
                    <span>{plan.ctaLabel}</span>
                    <VaahanIcon name="arrow-right" size={11} aria-hidden="true" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
