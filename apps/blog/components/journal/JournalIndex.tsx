import * as React from "react";
import Link from "next/link";
import { CategoryWithCount } from "@vaahansafe/content";

interface JournalIndexProps {
  categories: readonly CategoryWithCount[];
  activeSlug?: string;
}

export function JournalIndex({ categories, activeSlug }: JournalIndexProps) {
  return (
    <section aria-label="Journal Topic Index" className="py-6 border-b border-[#e6dfd8] dark:border-[#2e2b27]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82]">
          <span>JOURNAL INDEX</span>
          <span className="h-px w-8 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
        </div>

        <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const isActive = cat.slug === activeSlug;
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={`
                  group block p-3.5 rounded-xl border transition-all
                  ${
                    isActive
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c]"
                      : "border-[#e6dfd8]/80 bg-[#f5f0e8]/30 hover:border-[#cc785c]/50 hover:bg-[#f5f0e8] text-[#3d3d3a] dark:border-[#2e2b27] dark:bg-[#1f1e1b]/40 dark:hover:bg-[#1f1e1b] dark:text-[#a09d96] dark:hover:text-[#faf9f5]"
                  }
                `}
              >
                <div className="flex items-center justify-between font-mono text-[9px] tracking-wider mb-1.5 text-[#8e8b82]">
                  <span className="font-semibold text-[#cc785c]">{cat.indexNumber}</span>
                  <span>{cat.count}</span>
                </div>
                <div className="font-mono text-xs font-semibold uppercase tracking-wider line-clamp-1 group-hover:text-[#cc785c] transition-colors">
                  {cat.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
