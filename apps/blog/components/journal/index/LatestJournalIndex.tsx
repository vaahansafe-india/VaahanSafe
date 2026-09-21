import * as React from "react";
import Link from "next/link";
import type { BlogPost } from "@vaahansafe/content";

interface LatestJournalIndexProps {
  articles: readonly BlogPost[];
}

export function LatestJournalIndex({ articles }: LatestJournalIndexProps) {
  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby="latest-index-heading"
      className="w-full border-b border-[#e6dfd8] py-16 sm:py-20 lg:py-24 dark:border-[#2e2b27]"
    >
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between border-b border-[#e6dfd8] pb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] dark:border-[#2e2b27] dark:text-[#77736d]">
          <span id="latest-index-heading">LATEST FROM THE JOURNAL</span>
          <span>CHRONOLOGICAL REGISTRY</span>
        </div>

        {/* Full-Width Typographic Registry Rows */}
        <div className="divide-y divide-[#e6dfd8] border-t border-b border-[#e6dfd8] dark:divide-[#2e2b27] dark:border-[#2e2b27]">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="
                group block py-5 sm:py-6
                transition-colors duration-200 hover:bg-[#f5f0e8]/40 dark:hover:bg-[#1f1e1b]/40
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              {/* Desktop Columns: DATE ● CATEGORY STORY READ ↗ */}
              <div className="hidden md:flex items-center justify-between gap-6 lg:gap-10">
                {/* DATE */}
                <time
                  dateTime={article.publishedAt}
                  className="w-28 shrink-0 font-mono text-xs uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]"
                >
                  {article.date}
                </time>

                {/* SIGNAL DOT */}
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#cc785c] group-hover:scale-125 transition-transform" />

                {/* CATEGORY */}
                <span className="w-36 shrink-0 font-mono text-[11px] font-medium uppercase tracking-wider text-[#cc785c]">
                  {article.category}
                </span>

                {/* STORY TITLE */}
                <h4 className="flex-1 font-serif text-lg lg:text-[1.3rem] font-normal text-[#141413] transition-colors duration-200 group-hover:text-[#cc785c] dark:text-[#faf9f5] dark:group-hover:text-[#cc785c] line-clamp-1">
                  {article.title}
                </h4>

                {/* READ & TIME */}
                <div className="shrink-0 flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
                  <span>{article.readingTime}</span>
                  <span
                    className="inline-block transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#cc785c]"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </div>
              </div>

              {/* Mobile Layout: 21 SEP / PRIVACY -> Title -> 06 MIN ↗ */}
              <div className="flex md:hidden flex-col space-y-2">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
                  <time dateTime={article.publishedAt}>{article.date}</time>
                  <span>/</span>
                  <span className="text-[#cc785c] font-medium">{article.category}</span>
                </div>

                <h4 className="font-serif text-lg font-normal text-[#141413] transition-colors group-hover:text-[#cc785c] dark:text-[#faf9f5]">
                  {article.title}
                </h4>

                <div className="flex items-center justify-between pt-1 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
                  <span>{article.readingTime}</span>
                  <span className="group-hover:text-[#cc785c] transition-colors">↗</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
