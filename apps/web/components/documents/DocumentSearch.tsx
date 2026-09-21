"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { OFFICIAL_GUIDES, OfficialGuide } from "../../lib/documents/official-guides";

interface SearchResult {
  guide: OfficialGuide;
  matchedTitle: string;
  matchedSection?: string;
  sectionId?: string;
  context: string;
}

export function DocumentSearch() {
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const results = React.useMemo<SearchResult[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];

    const matches: SearchResult[] = [];

    for (const guide of OFFICIAL_GUIDES) {
      // Check title or purpose
      if (
        guide.title.toLowerCase().includes(trimmed) ||
        guide.subtitle.toLowerCase().includes(trimmed) ||
        guide.docId.toLowerCase().includes(trimmed)
      ) {
        matches.push({
          guide,
          matchedTitle: guide.title,
          context: guide.purpose,
        });
        continue;
      }

      // Check "what it covers"
      const covered = guide.whatItCovers.find((item) => item.toLowerCase().includes(trimmed));
      if (covered) {
        matches.push({
          guide,
          matchedTitle: guide.title,
          context: covered,
        });
        continue;
      }

      // Check sections and subsections
      for (const section of guide.sections) {
        if (section.title.toLowerCase().includes(trimmed)) {
          matches.push({
            guide,
            matchedTitle: guide.title,
            matchedSection: section.title,
            sectionId: section.id,
            context: section.content[0] || guide.subtitle,
          });
          break;
        }

        const matchingContent = section.content.find((p) => p.toLowerCase().includes(trimmed));
        if (matchingContent) {
          matches.push({
            guide,
            matchedTitle: guide.title,
            matchedSection: section.title,
            sectionId: section.id,
            context: matchingContent,
          });
          break;
        }

        if (section.subsections) {
          const matchingSub = section.subsections.find(
            (sub) =>
              sub.title.toLowerCase().includes(trimmed) ||
              sub.content.some((sp) => sp.toLowerCase().includes(trimmed))
          );
          if (matchingSub) {
            matches.push({
              guide,
              matchedTitle: guide.title,
              matchedSection: matchingSub.title,
              sectionId: section.id,
              context: matchingSub.content[0] || guide.subtitle,
            });
            break;
          }
        }
      }
    }

    return matches.slice(0, 6);
  }, [query]);

  return (
    <div className="relative w-full max-w-[620px]">
      <label htmlFor="document-library-search" className="sr-only">
        Search documents by title, heading, or keyword
      </label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-muted-foreground dark:text-zinc-500">
          <VaahanIcon name="search" size={15} aria-hidden="true" />
        </span>
        <input
          id="document-library-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search documents by topic, keyword, or rule..."
          className="
            h-11 w-full rounded-md border border-border bg-white
            pl-10 pr-10 text-xs text-foreground shadow-2xs transition-colors
            placeholder:text-muted-foreground
            focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]
            dark:border-white/[0.12] dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-[#71717a]
          "
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 text-xs text-muted-foreground hover:text-foreground dark:hover:text-zinc-50"
            aria-label="Clear document search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim().length >= 2 && (
        <div
          className="
            absolute left-0 right-0 top-full z-30 mt-2
            divide-y divide-border rounded-md border border-border
            bg-white shadow-lg overflow-hidden
            dark:divide-white/[0.08] dark:border-white/[0.12] dark:bg-zinc-950
          "
        >
          {results.length > 0 ? (
            results.map((res, idx) => {
              const targetUrl = res.sectionId
                ? `/documents/${res.guide.slug}#${res.sectionId}`
                : `/documents/${res.guide.slug}`;

              return (
                <Link
                  key={idx}
                  href={targetUrl}
                  onClick={() => setIsOpen(false)}
                  className="
                    flex flex-col gap-1 p-3.5 transition-colors
                    hover:bg-muted/60 dark:hover:bg-white/[0.03]
                  "
                >
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    <span className="text-[#cc785c]">{res.guide.docId}</span>
                    <span>{res.guide.stepName}</span>
                  </div>
                  <div className="font-serif text-sm font-medium text-foreground dark:text-zinc-50">
                    {res.matchedTitle}
                    {res.matchedSection && (
                      <span className="font-sans text-xs font-normal text-muted-foreground dark:text-zinc-400">
                        {" "}
                        / {res.matchedSection}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground dark:text-zinc-400">
                    {res.context}
                  </p>
                </Link>
              );
            })
          ) : (
            <div className="p-4 text-center font-mono text-xs text-muted-foreground">
              No guides match &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
