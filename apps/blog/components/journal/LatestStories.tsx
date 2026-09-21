import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@vaahansafe/content";

interface LatestStoriesProps {
  articles: readonly BlogPost[];
}

export function LatestStories({ articles }: LatestStoriesProps) {
  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby="latest-stories-heading"
      className="border-b border-[#e6dfd8] py-12 sm:py-16 lg:py-20 dark:border-[#2e2b27]"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div
          id="latest-stories-heading"
          className="mb-6 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] sm:mb-8 dark:text-[#77736d]"
        >
          LATEST
        </div>

        {/* Editorial Rows (Thin Hairlines, No Floating Cards) */}
        <div className="divide-y divide-[#e6dfd8] border-t border-[#e6dfd8] dark:divide-[#2e2b27] dark:border-[#2e2b27]">
          {articles.map((article, index) => {
            const indexNumber = String(index + 1).padStart(2, "0");
            const imageUrl = article.featuredImageUrl;

            return (
              <article
                key={article.id}
                className="group py-8 sm:py-12 lg:py-14"
              >
                <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 md:grid-cols-12 md:gap-10">
                  {/* Article Text Content (8 cols on desktop) */}
                  <div className={`${imageUrl ? "md:col-span-8" : "md:col-span-12"} space-y-3 sm:space-y-4`}>
                    {/* Index & Category: e.g. 01 / PRIVACY */}
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82] sm:text-[11px] dark:text-[#77736d]">
                      <span className="font-medium text-[#3d3d3a] dark:text-[#c2bfb6]">
                        {indexNumber}
                      </span>
                      <span className="mx-2 text-[#e6dfd8] dark:text-[#2e2b27]">/</span>
                      <Link
                        href={`/category/${article.categorySlug}`}
                        className="font-semibold text-[#cc785c] transition-colors hover:text-[#a9583e]"
                      >
                        {article.category}
                      </Link>
                    </div>

                    {/* Article Title */}
                    <h3 className="font-serif text-xl font-normal leading-[1.18] tracking-[-0.02em] text-[#141413] transition-colors duration-200 group-hover:text-[#cc785c] sm:text-2xl lg:text-[1.75rem] dark:text-[#faf9f5] dark:group-hover:text-[#cc785c]">
                      <Link href={`/articles/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    {/* Short Introduction / Excerpt */}
                    <p className="max-w-2xl font-sans text-sm leading-relaxed text-[#6c6a64] sm:text-base dark:text-[#a09d96]">
                      {article.excerpt}
                    </p>

                    {/* Metadata & Read Link */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 font-mono text-[11px] uppercase tracking-wider text-[#8e8b82] sm:text-xs dark:text-[#77736d]">
                      <div>
                        <time dateTime={article.publishedAt}>{article.date}</time>
                        <span className="mx-2 text-[#e6dfd8] dark:text-[#2e2b27]">&bull;</span>
                        <span>{article.readingTime}</span>
                      </div>

                      <Link
                        href={`/articles/${article.slug}`}
                        className="inline-flex items-center gap-1.5 font-medium text-[#141413] transition-colors duration-200 group-hover:text-[#cc785c] dark:text-[#faf9f5] dark:group-hover:text-[#cc785c]"
                      >
                        <span>Read</span>
                        <span
                          className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                          aria-hidden="true"
                        >
                          &rarr;
                        </span>
                      </Link>
                    </div>
                  </div>

                  {/* Restrained Editorial Image (4 cols on desktop) */}
                  {imageUrl && (
                    <div className="order-first md:order-last md:col-span-4">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="block overflow-hidden rounded-xl bg-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#cc785c] sm:rounded-2xl dark:bg-[#252320]"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={article.title}
                            fill
                            sizes="(min-width: 768px) 33vw, 100vw"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                          />
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
