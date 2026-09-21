import * as React from "react";
import { PLANS_FAQ } from "../../app/pricing/plans-config";

export function PlansFaqSection() {
  return (
    <section
      aria-labelledby="plans-faq-heading"
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
          <span>09 / Common Questions</span>
        </div>

        <div className="mt-4 max-w-[720px]">
          <h2
            id="plans-faq-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl
              dark:text-zinc-50
            "
          >
            Frequently asked questions about plans.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Clear, straightforward answers about how decals, identities, and software services intersect.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {PLANS_FAQ.map((item, idx) => (
            <div
              key={idx}
              className="
                rounded-2xl border border-border
                bg-muted/60 p-6 sm:p-7
                dark:border-white/[0.08] dark:bg-zinc-900
              "
            >
              <h3 className="font-serif text-xl text-foreground dark:text-zinc-50">
                {item.q}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#3f3f46] sm:text-sm dark:text-zinc-400">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
