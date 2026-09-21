"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { HELP_CATEGORIES, HelpArticle } from "../../lib/help/help-content";

interface HelpCategoriesGridProps {
  onSelectArticle: (article: HelpArticle) => void;
}

export function HelpCategoriesGrid({ onSelectArticle }: HelpCategoriesGridProps) {
  return (
    <section
      aria-labelledby="help-categories-heading"
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
          <span>Knowledge &amp; Support Directory</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="help-categories-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            Browse by subject area.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Select any guide to open step-by-step resolution walkthroughs, prerequisites, and system specifications.
          </p>
        </div>

        {/* 6 Categories Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {HELP_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="
                flex flex-col justify-between
                rounded-2xl border border-border
                bg-muted/60 p-6 sm:p-7
                dark:border-white/[0.08] dark:bg-zinc-900
              "
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#cc785c]">
                    CATEGORY {cat.index}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-foreground shadow-sm dark:bg-zinc-900 dark:text-zinc-50">
                    <VaahanIcon name={cat.icon} size={14} aria-hidden="true" />
                  </div>
                </div>

                <h3 className="mt-4 font-serif text-2xl text-foreground dark:text-zinc-50">
                  {cat.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground dark:text-zinc-400">
                  {cat.description}
                </p>

                {/* Articles List */}
                <div className="mt-6 space-y-2">
                  {cat.articles.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => onSelectArticle(article)}
                      className="
                        group flex w-full items-center justify-between rounded-lg
                        border border-transparent bg-white/70 px-3.5 py-2.5 text-left text-xs
                        transition-all hover:border-[#cc785c]/40 hover:bg-white
                        dark:bg-zinc-950/60 dark:hover:border-[#cc785c]/40 dark:hover:bg-[#09090b]
                      "
                    >
                      <span className="font-medium text-foreground group-hover:text-[#cc785c] dark:text-zinc-50 dark:group-hover:text-[#cc785c]">
                        {article.title}
                      </span>
                      <VaahanIcon
                        name="arrow-right"
                        size={11}
                        className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#cc785c]"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-3 font-mono text-[9px] text-muted-foreground dark:border-white/[0.06]">
                {cat.articles.length} Step-by-Step Guides
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
