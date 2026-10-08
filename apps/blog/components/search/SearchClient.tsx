"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BlogPost, CategoryWithCount } from "@vaahansafe/content";
import { VaahanIcon } from "@vaahansafe/icons";
import { StoryCard } from "../journal/StoryCard";

export function SearchClient({
  initialArticles,
  categories,
}: {
  initialArticles: readonly BlogPost[];
  categories: readonly CategoryWithCount[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const initialQuery = params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("All");
  const deferredQuery = useDeferredValue(query);
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  const index = useMemo(
    () =>
      initialArticles.map((article) => ({
        article,
        text: [
          article.title,
          article.excerpt,
          article.deck,
          article.intro,
          article.category,
          article.author.name,
          ...article.tags,
          ...article.body.flatMap((section) => [
            section.heading,
            ...section.paragraphs,
            section.callout?.text,
          ]),
        ]
          .join(" ")
          .toLowerCase(),
      })),
    [initialArticles],
  );
  const results = useMemo(
    () =>
      index
        .filter(
          ({ article, text }) =>
            (category === "All" || article.categorySlug === category) &&
            text.includes(deferredQuery.trim().toLowerCase()),
        )
        .map((item) => item.article),
    [index, category, deferredQuery],
  );
  function reset() {
    setQuery("");
    setCategory("All");
    router.replace("/search", { scroll: false });
  }
  return (
    <div className="space-y-8">
      <form
        role="search"
        className="flex max-w-3xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          router.replace(
            query.trim()
              ? `/search?q=${encodeURIComponent(query.trim())}`
              : "/search",
            { scroll: false },
          );
        }}
      >
        <div className="relative min-w-0 flex-1">
          <VaahanIcon
            name="search"
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 journal-muted"
          />
          <label htmlFor="journal-search" className="sr-only">
            Search stories
          </label>
          <input
            id="journal-search"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search safety, privacy, or QR identity…"
            className="h-12 w-full rounded-sm border border-[var(--journal-line)] bg-[var(--journal-paper)] pl-12 pr-4 text-base text-[var(--journal-ink)] placeholder:text-[var(--journal-muted)]"
          />
        </div>
        <button type="submit" className="journal-button journal-button-primary">
          Search
        </button>
      </form>
      <fieldset>
        <legend className="journal-label mb-3">Filter by topic</legend>
        <div className="flex flex-wrap gap-2">
          {[{ slug: "All", name: "All stories" }, ...categories].map(
            (topic) => (
              <button
                type="button"
                key={topic.slug}
                aria-pressed={category === topic.slug}
                onClick={() => setCategory(topic.slug)}
                className={`journal-button ${category === topic.slug ? "journal-button-primary" : ""}`}
              >
                {topic.name}
              </button>
            ),
          )}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--journal-line)] pb-4">
        <p role="status" aria-live="polite" className="journal-muted text-sm">
          {results.length} {results.length === 1 ? "story" : "stories"}
          {query.trim() ? ` matching “${query.trim()}”` : " to explore"}
        </p>
        {(query || category !== "All") && (
          <button type="button" onClick={reset} className="journal-text-link">
            Reset filters
          </button>
        )}
      </div>
      {results.length ? (
        <div className="journal-grid" aria-busy={query !== deferredQuery}>
          {results.map((article) => (
            <StoryCard key={article.slug} article={article} headingLevel={2} />
          ))}
        </div>
      ) : (
        <div className="rounded-sm border border-[var(--journal-line)] p-8 sm:p-12">
          <h2 className="journal-section-title">No stories found this time.</h2>
          <p className="journal-muted mt-4 text-sm leading-7">
            Try a shorter phrase, search another topic, or clear the filters to
            browse all stories.
          </p>
          <button type="button" onClick={reset} className="journal-button mt-5">
            Browse all stories <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
