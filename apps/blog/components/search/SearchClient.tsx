"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BlogPost, CategoryWithCount } from "@vaahansafe/content";
import { VaahanIcon } from "@vaahansafe/icons";

interface SearchClientProps {
  initialArticles: readonly BlogPost[];
  categories: readonly CategoryWithCount[];
}

export function SearchClient({ initialArticles, categories }: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = React.useState(queryParam);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");

  // Keep state in sync if external queryParam changes
  React.useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  // Debounced URL synchronization without interrupting fast typing
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const currentParam = searchParams.get("q") || "";
      const trimmed = searchQuery.trim();
      if (trimmed !== currentParam) {
        const params = new URLSearchParams(searchParams.toString());
        if (trimmed) {
          params.set("q", trimmed);
        } else {
          params.delete("q");
        }
        const newUrl = params.toString() ? `/search?${params.toString()}` : "/search";
        React.startTransition(() => {
          try {
            router.replace(newUrl, { scroll: false });
          } catch {
            // Ignore any navigation cancellation
          }
        });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, router, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    React.startTransition(() => {
      try {
        router.replace("/search", { scroll: false });
      } catch {
        // Ignore navigation cancellation
      }
    });
  };

  const filteredArticles = React.useMemo(() => {
    const clean = searchQuery.trim().toLowerCase();
    return initialArticles.filter((article) => {
      // Category filter
      const matchesCategory =
        selectedCategory === "All" || article.categorySlug === selectedCategory;

      // Text search
      if (!clean) return matchesCategory;

      const matchesQuery =
        article.title.toLowerCase().includes(clean) ||
        article.excerpt.toLowerCase().includes(clean) ||
        article.deck?.toLowerCase().includes(clean) ||
        article.intro.toLowerCase().includes(clean) ||
        article.category.toLowerCase().includes(clean) ||
        article.tags.some((t) => t.toLowerCase().includes(clean)) ||
        article.author.name.toLowerCase().includes(clean) ||
        article.body.some(
          (s) =>
            s.heading?.toLowerCase().includes(clean) ||
            s.paragraphs.some((p) => p.toLowerCase().includes(clean))
        );

      return matchesCategory && matchesQuery;
    });
  }, [initialArticles, searchQuery, selectedCategory]);

  return (
    <div className="space-y-10">
      {/* Large Editorial Search Bar */}
      <div className="max-w-2xl mx-auto sm:mx-0 space-y-4">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#8e8b82]">
            <VaahanIcon name="search" size={18} aria-hidden="true" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Search guides, CMVR compliance, DPDP privacy, or decals..."
            aria-label="Search stories"
            className="
              h-13 w-full rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/40 pl-12 pr-12
              text-sm sm:text-base text-[#141413] placeholder:text-[#8e8b82]
              focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]
              transition-all shadow-xs dark:border-[#2e2b27] dark:bg-[#1f1e1b] dark:text-[#faf9f5]
            "
          />

          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]"
              aria-label="Clear search input"
            >
              <VaahanIcon name="close" size={16} />
            </button>
          )}
        </form>

        {/* Quick Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className={`
              rounded-full px-3.5 py-1 transition-colors
              ${
                selectedCategory === "All"
                  ? "bg-[#cc785c] text-white font-semibold"
                  : "border border-[#e6dfd8] text-[#6c6a64] hover:border-[#cc785c] dark:border-[#2e2b27] dark:text-[#a09d96]"
              }
            `}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`
                  rounded-full px-3.5 py-1 transition-colors
                  ${
                    isActive
                      ? "bg-[#cc785c] text-white font-semibold"
                      : "border border-[#e6dfd8] text-[#6c6a64] hover:border-[#cc785c] dark:border-[#2e2b27] dark:text-[#a09d96]"
                  }
                `}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#2e2b27] pb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82]">
        <span>
          {searchQuery.trim()
            ? `SHOWING ${filteredArticles.length} ${
                filteredArticles.length === 1 ? "STORY" : "STORIES"
              } FOR "${searchQuery.trim().toUpperCase()}"`
            : `ALL STORIES (${filteredArticles.length})`}
        </span>

        {(searchQuery.trim() || selectedCategory !== "All") && (
          <button
            type="button"
            onClick={() => {
              clearSearch();
              setSelectedCategory("All");
            }}
            className="text-[#cc785c] hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Results or Empty State */}
      {filteredArticles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e6dfd8] dark:border-[#2e2b27] p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c] font-semibold">
            NO STORIES FOUND
          </div>
          <p className="text-sm text-[#6c6a64] dark:text-[#a09d96] font-sans">
            We couldn&apos;t find any stories matching &ldquo;{searchQuery}&rdquo;. Try another search phrase or explore by category below.
          </p>

          <div className="flex flex-wrap justify-center gap-2 pt-2 font-mono text-[10px] uppercase">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="rounded-lg border border-[#e6dfd8] px-3 py-1 text-[#3d3d3a] hover:border-[#cc785c] hover:text-[#cc785c] dark:border-[#2e2b27] dark:text-[#a09d96]"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <article
              key={article.slug}
              className="
                flex flex-col justify-between rounded-2xl border border-[#e6dfd8]
                bg-[#f5f0e8]/30 p-6 transition-all hover:border-[#cc785c]/40 hover:bg-[#f5f0e8]/70 hover:shadow-xs
                dark:border-[#2e2b27] dark:bg-[#1f1e1b]/30 dark:hover:bg-[#1f1e1b]/70
              "
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
                  <span className="text-[#cc785c] font-semibold">
                    {article.category}
                  </span>
                  <span>{article.readingTime}</span>
                </div>

                <h3 className="font-serif text-xl font-normal text-[#141413] dark:text-[#faf9f5] leading-snug hover:text-[#cc785c] transition-colors">
                  <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                </h3>

                <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] line-clamp-3">
                  {article.excerpt}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#e6dfd8]/60 dark:border-[#2e2b27]/60 flex items-center justify-between">
                <Link
                  href={`/articles/${article.slug}`}
                  className="font-mono text-xs uppercase tracking-wider text-[#cc785c] hover:underline"
                >
                  Read story &rarr;
                </Link>
                <span className="font-mono text-[9px] text-[#8e8b82]">
                  {article.date}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
