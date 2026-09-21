import * as React from "react";
import { BEFORE_YOU_USE_ITEMS } from "../../app/terms/terms-content";

export function ImportantUnderstandingCard() {
  return (
    <section
      aria-labelledby="important-understanding-heading"
      className="border-b border-border bg-background py-14 sm:py-16 lg:py-20 dark:border-border dark:bg-zinc-950"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* Eyebrow */}
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span className="font-mono text-[8px] font-medium uppercase tracking-[0.22em] text-muted-foreground dark:text-zinc-400">
            Before You Use VaahanSafe
          </span>
          <span className="h-px w-8 bg-[#cc785c]/40" />
        </div>

        {/* Section Heading */}
        <h2
          id="important-understanding-heading"
          className="mt-4 font-serif text-2xl font-normal tracking-[-0.03em] text-foreground sm:text-3xl lg:text-4xl dark:text-zinc-50"
        >
          A few things to understand first.
        </h2>

        {/* Editorial Rows — Not floating cards */}
        <div className="mt-10 divide-y divide-border border-y border-border dark:divide-white/[0.08] dark:border-white/[0.08]">
          {BEFORE_YOU_USE_ITEMS.map((item) => (
            <div
              key={item.index}
              className="grid gap-3 py-6 sm:grid-cols-[180px_1fr] sm:gap-8 lg:grid-cols-[220px_1fr] lg:py-7"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#cc785c]">
                  {item.index}
                </span>
                <span className="h-px w-4 bg-[#cc785c]/40" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground dark:text-zinc-50">
                  {item.title}
                </h3>
              </div>

              <p className="text-xs leading-[1.8] text-[#3f3f46] sm:text-sm sm:leading-7 dark:text-zinc-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Advisory footnote */}
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground dark:text-zinc-500">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8a55a]" />
          <p className="italic">
            These summaries help explain the product architecture but do not
            replace the complete legally binding Terms set out below.
          </p>
        </div>
      </div>
    </section>
  );
}
