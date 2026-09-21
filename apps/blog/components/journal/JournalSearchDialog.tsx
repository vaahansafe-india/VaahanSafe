"use client";

import * as React from "react";
import Link from "next/link";
import { BlogPost, CategoryWithCount } from "@vaahansafe/content";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components";

interface JournalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articles: readonly BlogPost[];
  categories: readonly CategoryWithCount[];
}

export function JournalSearchDialog({
  open,
  onOpenChange,
  articles,
  categories,
}: JournalSearchDialogProps) {
  const [query, setQuery] = React.useState("");

  const filteredArticles = React.useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return articles.slice(0, 5);

    return articles
      .filter((article) => {
        return (
          article.title.toLowerCase().includes(clean) ||
          article.excerpt.toLowerCase().includes(clean) ||
          article.category.toLowerCase().includes(clean) ||
          article.tags.some((t) => t.toLowerCase().includes(clean))
        );
      })
      .slice(0, 6);
  }, [articles, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden border-[#e6dfd8] bg-[#faf9f5] dark:border-[#2e2b27] dark:bg-[#181715]">
        <DialogHeader className="p-4 sm:p-5 border-b border-[#e6dfd8] dark:border-[#2e2b27]">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <DialogTitle className="text-xs font-mono font-medium tracking-wider">
              Search Journal
            </DialogTitle>
            <DialogDescription className="sr-only">
              Search safety guides, QR placement, and vehicle identity protocols
            </DialogDescription>
          </div>

          <div className="relative mt-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8e8b82]">
              <VaahanIcon name="search" size={16} aria-hidden="true" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search safety guides, QR placement, DPDP privacy..."
              autoFocus
              className="
                h-11 w-full rounded-xl border border-[#e6dfd8] bg-[#f5f0e8]/50 pl-10 pr-10
                text-sm text-[#141413] placeholder:text-[#8e8b82]
                focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]
                dark:border-[#2e2b27] dark:bg-[#1f1e1b] dark:text-[#faf9f5]
              "
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]"
              >
                <VaahanIcon name="close" size={14} />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Results Stream */}
        <div className="max-h-[380px] overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredArticles.length === 0 ? (
            <div className="py-8 text-center space-y-2 font-sans">
              <div className="font-mono text-xs text-[#cc785c] uppercase tracking-wider">
                No stories found
              </div>
              <p className="text-xs text-[#6c6a64] dark:text-[#a09d96]">
                Try searching for keywords like &quot;CMVR&quot;, &quot;highway&quot;, &quot;VoIP&quot;, or &quot;decal&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82] pb-2">
                {query.trim() ? "MATCHING ARTICLES" : "FEATURED & RECENT"}
              </div>
              {filteredArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="
                    group flex items-baseline justify-between gap-4 p-3 rounded-xl
                    hover:bg-[#f5f0e8] dark:hover:bg-[#1f1e1b] transition-colors
                  "
                >
                  <div className="space-y-1 min-w-0">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                      {article.category}
                    </div>
                    <div className="font-serif text-base text-[#141413] dark:text-[#faf9f5] group-hover:text-[#cc785c] transition-colors truncate">
                      {article.title}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#8e8b82] shrink-0">
                    {article.readingTime}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer Jump Categories */}
        <div className="p-3.5 bg-[#f5f0e8]/40 dark:bg-[#1f1e1b]/40 border-t border-[#e6dfd8] dark:border-[#2e2b27] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
          <span className="text-[#8e8b82]">EXPLORE TOPICS:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.slice(0, 4).map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                onClick={() => onOpenChange(false)}
                className="px-2 py-0.5 rounded border border-[#e6dfd8] text-[#6c6a64] hover:border-[#cc785c] hover:text-[#cc785c] dark:border-[#2e2b27] dark:text-[#a09d96]"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
