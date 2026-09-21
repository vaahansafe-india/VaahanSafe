import * as React from "react";
import Link from "next/link";
import type { CategoryWithCount } from "@vaahansafe/content";

interface ExploreCategoriesProps {
  categories: readonly CategoryWithCount[];
}

export function ExploreCategories({ categories }: ExploreCategoriesProps) {
  // Filter out any categories without articles, or ensure primary 5 are present
  const displayCategories = categories.filter((c) => c.slug !== "all");

  return (
    <section
      aria-labelledby="explore-categories-heading"
      className="border-b border-[#e6dfd8] py-12 sm:py-16 dark:border-[#2e2b27]"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div
          id="explore-categories-heading"
          className="mb-6 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] sm:mb-8 dark:text-[#77736d]"
        >
          EXPLORE
        </div>

        {/* Minimal Category Strip (Desktop: 2-column or horizontal grid, Mobile: vertical list) */}
        <div className="grid grid-cols-1 divide-y divide-[#e6dfd8] border-t border-b border-[#e6dfd8] md:grid-cols-2 md:divide-y-0 md:gap-x-12 dark:divide-[#2e2b27] dark:border-[#2e2b27]">
          {displayCategories.map((cat, idx) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="
                group flex items-center justify-between py-4 sm:py-5
                border-b border-[#e6dfd8] dark:border-[#2e2b27]
                focus:outline-none focus:ring-2 focus:ring-[#cc785c]
              "
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-[#8e8b82] dark:text-[#77736d]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-lg font-normal text-[#141413] transition-colors duration-200 group-hover:text-[#cc785c] sm:text-xl dark:text-[#faf9f5] dark:group-hover:text-[#cc785c]">
                  {cat.name}
                </span>
                {cat.count > 0 && (
                  <span className="font-mono text-[10px] text-[#8e8b82] dark:text-[#77736d]">
                    ({cat.count})
                  </span>
                )}
              </div>

              <span
                className="font-mono text-sm text-[#8e8b82] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#cc785c] dark:text-[#77736d] dark:group-hover:text-[#cc785c]"
                aria-hidden="true"
              >
                &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
