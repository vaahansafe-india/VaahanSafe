"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { searchHelpArticles, SearchResult } from "../../lib/help/help-search";
import { HelpArticle } from "../../lib/help/help-content";

interface HelpCenterHeroProps {
  onSelectArticle: (article: HelpArticle) => void;
}

export function HelpCenterHero({ onSelectArticle }: HelpCenterHeroProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const searchResults = useMemo(() => {
    return searchHelpArticles(query);
  }, [query]);

  return (
    <section
      aria-labelledby="help-hero-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        pt-12 pb-16
        sm:pt-16 sm:pb-20
        lg:pt-20 lg:pb-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className="
            absolute -left-[200px] -top-[200px]
            h-[540px] w-[540px]
            rounded-full
            border border-[#09090b]/[0.03]
            dark:border-white/[0.025]
          "
        />
        <span
          className="
            absolute right-[8%] top-[25%]
            hidden h-1.5 w-1.5
            rounded-full bg-[#cc785c]/40
            lg:block
          "
        />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground dark:text-zinc-500">
          <span className="flex items-center gap-1.5 text-[#cc785c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            VAAHANSAFE / HELP
          </span>
          <span className="h-3 w-px bg-[#e4e4e7] dark:bg-white/[0.1]" />
          <span>ACTION &amp; RESOLUTION GUIDE</span>
        </div>

        <div className="mt-8 max-w-[820px]">
          <h1
            id="help-hero-heading"
            className="
              font-serif
              text-[2.75rem]
              font-normal
              leading-[1.02]
              tracking-[-0.04em]
              text-foreground
              sm:text-5xl
              md:text-6xl
              lg:text-[4.4rem]
              dark:text-zinc-50
            "
          >
            What do you need <br className="hidden sm:block" />
            <span className="text-[#cc785c]">help with?</span>
          </h1>

          <p className="mt-6 max-w-[660px] text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-8 dark:text-zinc-400">
            Find guidance for your VaahanSafe vehicle identity, QR, activation, safety information, account and related services.
          </p>

          {/* Accessible Live Search Form */}
          <div className="relative mt-8 max-w-[620px]">
            <form
              role="search"
              onSubmit={(e) => e.preventDefault()}
              className="relative flex items-center"
            >
              <label htmlFor="help-search-input" className="sr-only">
                Search VaahanSafe help articles and guides
              </label>

              <div className="pointer-events-none absolute left-4 text-muted-foreground">
                <VaahanIcon name="search" size={16} aria-hidden="true" />
              </div>

              <input
                id="help-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="Search VaahanSafe help..."
                autoComplete="off"
                className="
                  h-12 w-full rounded-xl border border-border
                  bg-white pl-11 pr-10 text-sm text-foreground
                  shadow-sm placeholder:text-muted-foreground
                  transition-colors
                  focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]
                  dark:border-white/[0.12] dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-muted-foreground
                "
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 text-xs text-muted-foreground hover:text-foreground dark:hover:text-white"
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Live Search Results Dropdown */}
            {query.trim().length > 1 && (
              <div
                role="region"
                aria-label="Search results"
                className="
                  absolute left-0 right-0 top-full z-30 mt-2
                  max-h-[380px] overflow-y-auto rounded-xl
                  border border-border bg-white p-2 shadow-lg
                  dark:border-white/[0.12] dark:bg-zinc-900
                "
              >
                <div className="px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {searchResults.length} {searchResults.length === 1 ? "Result" : "Results"} found for &quot;{query}&quot;
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground dark:text-zinc-400">
                    No articles match your query. Try searching for &quot;damaged&quot;, &quot;activation&quot;, &quot;contacts&quot;, or &quot;replacement&quot;.
                  </div>
                ) : (
                  <div className="divide-y divide-[#f0eae1] dark:divide-white/[0.06]">
                    {searchResults.map(({ article, matchedOn }) => (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => {
                          onSelectArticle(article);
                          setQuery("");
                        }}
                        className="
                          w-full rounded-lg p-3 text-left transition-colors
                          hover:bg-background dark:hover:bg-white/[0.04]
                        "
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                            {article.categoryTitle} &bull; Article {article.articleNumber}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground dark:bg-white/[0.06] dark:text-zinc-400">
                            matched in {matchedOn}
                          </span>
                        </div>

                        <div className="mt-1 font-serif text-base text-foreground dark:text-zinc-50">
                          {article.title}
                        </div>

                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground dark:text-zinc-400">
                          {article.summary}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
