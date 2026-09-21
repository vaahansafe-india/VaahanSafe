import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@vaahansafe/content";

interface FeaturedArticleProps {
  article: BlogPost;
}

export function FeaturedArticle({ article }: FeaturedArticleProps) {
  const imageUrl = article.featuredImageUrl || "/images/editorial/vehicle-placement-hero.jpg";

  return (
    <section
      aria-labelledby="featured-story-heading"
      className="border-b border-[#e6dfd8] py-12 sm:py-16 lg:py-20 dark:border-[#2e2b27]"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] sm:mb-8 dark:text-[#77736d]">
          FEATURED
        </div>

        {/* Asymmetric Dominant Composition (58% image / 42% text on desktop) */}
        <article className="group grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-14">
          {/* Dominant Editorial Image (7 cols ~ 58%) */}
          <div className="lg:col-span-7">
            <Link
              href={`/articles/${article.slug}`}
              className="block overflow-hidden rounded-xl bg-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#cc785c] focus:ring-offset-4 sm:rounded-2xl dark:bg-[#252320]"
              tabIndex={-1}
              aria-hidden="true"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={article.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.018]"
                />
              </div>
            </Link>
          </div>

          {/* Article Information (5 cols ~ 42%) */}
          <div className="flex flex-col justify-center space-y-4 lg:col-span-5 sm:space-y-5">
            {/* Category */}
            <div>
              <Link
                href={`/category/${article.categorySlug}`}
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#cc785c] transition-colors hover:text-[#a9583e] sm:text-[11px]"
              >
                {article.category}
              </Link>
            </div>

            {/* Title */}
            <h2 id="featured-story-heading">
              <Link
                href={`/articles/${article.slug}`}
                className="
                  font-serif
                  text-2xl sm:text-3xl lg:text-[2.25rem]
                  font-normal
                  leading-[1.12]
                  tracking-[-0.02em]
                  text-[#141413]
                  transition-colors
                  duration-200
                  hover:text-[#cc785c]
                  dark:text-[#faf9f5]
                  dark:hover:text-[#cc785c]
                "
              >
                {article.title}
              </Link>
            </h2>

            {/* Excerpt */}
            <p className="font-sans text-sm leading-relaxed text-[#6c6a64] sm:text-base dark:text-[#a09d96]">
              {article.deck || article.excerpt}
            </p>

            {/* Metadata (Date & Reading Time) */}
            <div className="pt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#8e8b82] sm:text-xs dark:text-[#77736d]">
              <time dateTime={article.publishedAt}>{article.date}</time>
              <span className="mx-2 text-[#e6dfd8] dark:text-[#2e2b27]">&bull;</span>
              <span>{article.readingTime}</span>
            </div>

            {/* Read Link */}
            <div className="pt-1">
              <Link
                href={`/articles/${article.slug}`}
                className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#141413] transition-colors duration-200 hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c]"
              >
                <span>Read article</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
