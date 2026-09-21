import * as React from "react";
import Link from "next/link";
import type { BlogPost } from "@vaahansafe/content";

interface RecentJournalProps {
  articles: readonly BlogPost[];
}

export function RecentJournal({ articles }: RecentJournalProps) {
  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby="recent-journal-heading"
      className="border-b border-[#e6dfd8] py-12 sm:py-16 dark:border-[#2e2b27]"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div
          id="recent-journal-heading"
          className="mb-6 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] sm:mb-8 dark:text-[#77736d]"
        >
          RECENT JOURNAL
        </div>

        {/* Compact Editorial Stream (Hairline Rows) */}
        <div className="divide-y divide-[#e6dfd8] border-t border-b border-[#e6dfd8] dark:divide-[#2e2b27] dark:border-[#2e2b27]">
          {articles.map((article) => {
            const dateObj = new Date(article.publishedAt);
            const monthStr = dateObj
              .toLocaleString("en-US", { month: "short" })
              .toUpperCase();
            const dayStr = String(dateObj.getDate()).padStart(2, "0");
            const compactDate = `${dayStr} ${monthStr}`;

            return (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="
                  group flex flex-col sm:flex-row sm:items-center justify-between
                  gap-3 sm:gap-6 py-4 sm:py-6
                  transition-colors hover:bg-[#f5f0e8]/40 dark:hover:bg-[#1f1e1b]/40
                  focus:outline-none focus:ring-2 focus:ring-[#cc785c] rounded
                "
              >
                {/* Left: Date + Category + Title */}
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 lg:gap-10 flex-1 min-w-0">
                  <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                    {/* Date in JetBrains Mono */}
                    <div className="w-16 shrink-0 font-mono text-xs uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
                      {compactDate}
                    </div>

                    {/* Category */}
                    <div className="w-28 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#cc785c]">
                      {article.category}
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="font-serif text-base font-normal text-[#141413] transition-colors duration-200 group-hover:text-[#cc785c] sm:text-lg lg:text-xl dark:text-[#faf9f5] dark:group-hover:text-[#cc785c] line-clamp-2 sm:line-clamp-none">
                    {article.title}
                  </h4>
                </div>

                {/* Right: Reading time + Arrow */}
                <div className="shrink-0 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 font-mono text-xs uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
                  <span className="inline-flex items-center gap-2 group-hover:text-[#cc785c] transition-colors">
                    <span>{article.readingTime}</span>
                    <span
                      className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      &rarr;
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
