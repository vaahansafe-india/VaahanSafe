import * as React from "react";
import Link from "next/link";
import type { CategoryWithLatest } from "@vaahansafe/content";

interface JournalSignalGridProps {
  categories: readonly CategoryWithLatest[];
}

export function JournalSignalGrid({ categories }: JournalSignalGridProps) {
  const displayCats = categories.filter((c) => c.slug !== "all").slice(0, 5);

  return (
    <section
      aria-label="Editorial Topology Strip"
      className="w-full border-b border-[#e6dfd8] bg-[#faf9f5] py-8 sm:py-10 dark:border-[#2e2b27] dark:bg-[#181715]"
    >
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28">
        {/* Micro Header */}
        <div className="mb-6 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.24em] text-[#8e8b82] dark:text-[#77736d]">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            EDITORIAL TOPOLOGY / ACTIVE FIELD
          </span>
          <span>01 &mdash; 05 TOPOLOGY NODES</span>
        </div>

        {/* Desktop View: Horizontal Continuous Topology Rail */}
        <div className="hidden md:block">
          <div className="grid grid-cols-5 gap-0">
            {displayCats.map((cat, idx) => {
              const indexStr = String(idx + 1).padStart(2, "0");
              const isLast = idx === displayCats.length - 1;

              return (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="
                    group relative flex flex-col justify-between
                    py-2 pr-6
                    transition-colors duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
                  "
                >
                  {/* Continuous Top Connection Rail */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="font-mono text-xs font-semibold text-[#141413] dark:text-[#faf9f5]">
                      {indexStr}
                    </span>
                    <span className="h-2 w-2 rounded-full border border-[#cc785c] bg-[#faf9f5] group-hover:bg-[#cc785c] transition-colors dark:bg-[#181715]" />
                    {!isLast && (
                      <span className="h-px flex-1 bg-[#e6dfd8] group-hover:bg-[#cc785c] transition-colors dark:bg-[#2e2b27]" />
                    )}
                  </div>

                  {/* Category Title & Story Signal */}
                  <div className="space-y-2">
                    <h3 className="font-serif text-lg font-normal tracking-tight text-[#141413] transition-colors duration-200 group-hover:text-[#cc785c] dark:text-[#faf9f5] dark:group-hover:text-[#cc785c]">
                      {cat.name}
                    </h3>
                    <p className="font-sans text-xs leading-relaxed text-[#6c6a64] line-clamp-2 dark:text-[#a09d96]">
                      {cat.latestArticleTitle || cat.description}
                    </p>
                  </div>

                  {/* Read Action with Shifting Indicator */}
                  <div className="pt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82] group-hover:text-[#cc785c] transition-colors dark:text-[#77736d]">
                    <span>Explore node</span>
                    <span
                      className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile View: Vertical Topology Rail (Section BI) */}
        <div className="block md:hidden">
          <div className="relative pl-6 space-y-8 border-l border-[#e6dfd8] dark:border-[#2e2b27]">
            {displayCats.map((cat, idx) => {
              const indexStr = String(idx + 1).padStart(2, "0");

              return (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="group relative block space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]"
                >
                  {/* Vertical Node Indicator */}
                  <div className="absolute -left-[31px] top-1 flex items-center justify-center">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-[#cc785c] bg-[#faf9f5] group-hover:bg-[#cc785c] transition-colors dark:bg-[#181715]" />
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82] dark:text-[#77736d]">
                    <span>NODE {indexStr}</span>
                    <span className="h-2 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]" />
                    <span className="text-[#cc785c] font-semibold">{cat.name}</span>
                  </div>

                  <h3 className="font-serif text-lg font-normal text-[#141413] transition-colors group-hover:text-[#cc785c] dark:text-[#faf9f5]">
                    {cat.latestArticleTitle || cat.name}
                  </h3>

                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#8e8b82] group-hover:text-[#cc785c] transition-colors dark:text-[#77736d]">
                    Explore category &rarr;
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
