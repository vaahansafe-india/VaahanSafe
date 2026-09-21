"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  BlogPost,
  BlogCategory,
  BLOG_CATEGORIES,
} from "@vaahansafe/content";

interface BlogIndexClientProps {
  initialPosts: readonly BlogPost[];
  featuredPost: BlogPost;
}

export function BlogIndexClient({ initialPosts, featuredPost }: BlogIndexClientProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredPosts = React.useMemo(() => {
    return initialPosts.filter((post) => {
      // Category filter
      const matchesCategory =
        selectedCategory === "All" || post.category === selectedCategory;

      // Search filter
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        post.author.name.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [initialPosts, selectedCategory, searchQuery]);

  const isFiltering = selectedCategory !== "All" || searchQuery.trim().length > 0;
  const remainingPosts = isFiltering
    ? filteredPosts
    : filteredPosts.filter((p) => p.slug !== featuredPost.slug);

  return (
    <div className="space-y-12">
      {/* Search & Category Filter Station */}
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto sm:mx-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
            <VaahanIcon name="search" size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, CMVR rules, DPDP privacy, or highway safety..."
            className="
              h-11 w-full rounded-xl border border-border bg-card/60 pl-10 pr-10
              text-xs sm:text-sm text-foreground placeholder:text-muted-foreground
              focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]
              transition-all shadow-xs
            "
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <VaahanIcon name="close" size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-border/70 pb-6">
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className={`
              rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider
              transition-all
              ${
                selectedCategory === "All"
                  ? "bg-[#cc785c] text-white shadow-xs font-semibold"
                  : "border border-border/80 bg-card/60 text-muted-foreground hover:border-[#cc785c] hover:text-foreground"
              }
            `}
          >
            All Notes
          </button>
          {BLOG_CATEGORIES.map((cat) => {
            const isActive = cat === selectedCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`
                  rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider
                  transition-all whitespace-nowrap
                  ${
                    isActive
                      ? "bg-[#cc785c] text-white shadow-xs font-semibold"
                      : "border border-border/80 bg-card/60 text-muted-foreground hover:border-[#cc785c] hover:text-foreground"
                  }
                `}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Story Station (Only shown when not actively filtering) */}
      {!isFiltering && (
        <section
          aria-labelledby="featured-story-heading"
          className="
            relative overflow-hidden rounded-3xl border border-border/90
            bg-gradient-to-br from-card via-card/90 to-muted/30
            p-7 sm:p-10 lg:p-12 shadow-sm
          "
        >
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="rounded-full bg-[#cc785c]/15 px-2.5 py-0.5 text-[#cc785c] font-semibold border border-[#cc785c]/25">
              FEATURED ESSAY &bull; {featuredPost.category}
            </span>
            <span>&bull;</span>
            <span>{featuredPost.date}</span>
            <span>&bull;</span>
            <span>{featuredPost.readingTime}</span>
          </div>

          <h2
            id="featured-story-heading"
            className="mt-4 font-serif text-2xl sm:text-3xl lg:text-4xl font-normal leading-tight tracking-tight text-foreground"
          >
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="hover:text-[#cc785c] transition-colors"
            >
              {featuredPost.title}
            </Link>
          </h2>

          <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            {featuredPost.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {featuredPost.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-border/60"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-border/70 flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{featuredPost.author.name}</span>
              <span>&bull;</span>
              <span>{featuredPost.author.role}</span>
            </div>

            <Link
              href={`/blog/${featuredPost.slug}`}
              className="
                inline-flex h-10 items-center justify-center gap-2
                rounded-xl bg-[#cc785c] px-5
                font-mono text-xs font-semibold uppercase tracking-wider
                text-white transition-all
                hover:bg-[#b8674d] shadow-xs hover:shadow-md
              "
            >
              <span>Read Full Guide</span>
              <VaahanIcon name="arrow-right" size={13} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {/* Grid of Articles */}
      <section aria-label="Field notes directory">
        <div className="flex items-center justify-between pb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            {isFiltering
              ? `Search Results (${filteredPosts.length} ${filteredPosts.length === 1 ? "Guide" : "Guides"})`
              : "Recent Publications"}
          </div>
          {isFiltering && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="text-xs text-[#cc785c] hover:underline font-mono"
            >
              Reset Filters &rarr;
            </button>
          )}
        </div>

        {remainingPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <VaahanIcon name="search" size={20} />
            </div>
            <div className="text-sm font-medium text-foreground">
              No matching field notes found
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              We couldn't find any guides matching "{searchQuery}". Try searching for keywords like "CMVR", "highway", "VoIP", or "decal".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {remainingPosts.map((post) => (
              <article
                key={post.slug}
                className="
                  group flex flex-col justify-between rounded-2xl
                  border border-border/80 bg-card p-6 sm:p-7
                  transition-all duration-200
                  hover:-translate-y-1 hover:border-[#cc785c]/40 hover:shadow-md
                "
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    <span className="rounded bg-[#cc785c]/10 text-[#cc785c] px-2 py-0.5 font-semibold">
                      {post.category}
                    </span>
                    <span>{post.readingTime}</span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-normal leading-snug text-foreground group-hover:text-[#cc785c] transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>

                  <p className="text-xs sm:text-[13px] leading-relaxed text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {post.date}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#cc785c] group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Read Essay</span>
                    <VaahanIcon name="arrow-right" size={11} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Safety Alert Newsletter Station */}
      <section
        aria-labelledby="newsletter-heading"
        className="
          rounded-2xl border border-border/80 bg-muted/20 p-6 sm:p-8
          flex flex-col md:flex-row md:items-center justify-between gap-6
        "
      >
        <div className="space-y-1 max-w-lg">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c] font-semibold">
            DISPATCH ARCHIVE
          </div>
          <h3 id="newsletter-heading" className="font-serif text-xl font-medium text-foreground">
            Receive Road Safety Field Notes
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Monthly executive digests covering CMVR regulatory changes, Golden Hour rescue case studies, and optical vehicle identity research. No marketing spam.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Thank you for subscribing to VaahanSafe Field Notes.");
          }}
          className="flex flex-col sm:flex-row gap-2 w-full md:w-auto"
        >
          <input
            type="email"
            required
            placeholder="responder@transport.org"
            className="h-10 rounded-xl border border-border bg-card px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#cc785c] focus:outline-none sm:w-64"
          />
          <button
            type="submit"
            className="h-10 rounded-xl bg-foreground text-background px-4 font-mono text-xs font-semibold hover:bg-foreground/90 transition-colors shrink-0"
          >
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}
