import * as React from "react";
import Link from "next/link";
import type { BlogPost } from "@vaahansafe/content";
import { resolveArticleMedia } from "@vaahansafe/content";
import { IdentitySignal } from "../signal/IdentitySignal";
import { EditorialMedia } from "../media/EditorialMedia";

interface JournalHeroProps {
  article: BlogPost;
}

export function JournalHero({ article }: JournalHeroProps) {
  const heroMedia = resolveArticleMedia(article, "HERO");

  return (
    <section
      aria-labelledby="journal-hero-heading"
      className="w-full border-b border-[#e6dfd8] pt-6 pb-14 sm:pt-10 sm:pb-20 lg:pt-14 lg:pb-24 dark:border-[#2e2b27]"
    >
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28">
        {/* 1. Publication Masthead Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6dfd8] pb-4 dark:border-[#2e2b27]">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] dark:text-[#77736d]">
            <span className="flex items-center gap-1.5 font-semibold text-[#141413] dark:text-[#faf9f5]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              JOURNAL / VAAHANSAFE
            </span>
            <span className="h-3 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]" />
            <span className="text-[#cc785c]">ISSUE / CURRENT</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8e8b82] dark:text-[#77736d]">
            <span>EDITORIAL ARCHIVE</span>
            <span className="h-3 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]" />
            <span>PUBLIC PUBLICATION</span>
          </div>
        </div>

        {/* 2. Full-Width Typographic Statement: Magazine Cover Header */}
        <div className="mt-8 sm:mt-10 lg:mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16 items-end">
          {/* Left Large Statement: 88-120px scale on desktop viewports */}
          <div className="lg:col-span-8 xl:col-span-8">
            <h1
              id="journal-hero-heading"
              className="
                font-serif
                text-[2.5rem] sm:text-[3.75rem] md:text-[4.75rem] lg:text-[5.5rem] xl:text-[6.5rem] 2xl:text-[7.25rem]
                font-normal
                leading-[0.98]
                tracking-[-0.035em]
                text-[#141413]
                dark:text-[#faf9f5]
              "
            >
              Stories about vehicles, identity{" "}
              <span className="text-[#6c6a64] dark:text-[#a09d96]">
                and the moments that connect them.
              </span>
            </h1>
          </div>

          {/* Right Column: Editorial Mission & Live Identity Signal */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col justify-end space-y-5 lg:border-l lg:border-[#e6dfd8] lg:pl-8 xl:pl-10 dark:lg:border-[#2e2b27]">
            <p className="font-sans text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
              Guides for the road, the vehicle and the identity. FIELD NOTES on vehicle safety, QR identity, privacy and responsible connection.
            </p>
            <div className="pt-1">
              <IdentitySignal />
            </div>
          </div>
        </div>

        {/* 3. Oversized Cloudflare R2 Hero Media Field */}
        <div className="mt-10 sm:mt-14 lg:mt-16 w-full">
          <Link
            href={`/articles/${article.slug}`}
            className="group/img block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]"
            tabIndex={-1}
            aria-hidden="true"
          >
            <EditorialMedia
              src={heroMedia.src}
              alt={heroMedia.alt || article.title}
              frame="OFFSET_LANDSCAPE"
              aspectRatio="21/9"
              caption={heroMedia.caption || `FIG. 01 / ${article.title.toUpperCase()} • EDITORIAL VISUAL ARCHIVE`}
              category={article.category}
              indexNumber="01"
              priority={true}
              focalPoint={heroMedia.focalPoint}
              role="HERO"
              sizes="(min-width: 1536px) 90vw, (min-width: 1024px) 94vw, 100vw"
              className="w-full"
            />
          </Link>
        </div>

        {/* 4. Editorial Registration Metadata Rail (Section Z) */}
        <div className="mt-8 pt-4 border-t border-[#e6dfd8] dark:border-[#2e2b27]">
          <div className="flex flex-wrap items-center justify-between gap-y-3 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#8e8b82] dark:text-[#77736d]">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">
                FEATURE / 01
              </span>
              <span className="h-1 w-1 rounded-full bg-[#cc785c]" />
              <Link
                href={`/category/${article.categorySlug}`}
                className="text-[#cc785c] hover:underline font-semibold tracking-wider"
              >
                {article.category}
              </Link>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <span className="hidden md:inline-block h-px w-12 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
              <time dateTime={article.publishedAt}>{article.date}</time>
              <span className="h-px w-8 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
              <span>{article.readingTime}</span>
            </div>
          </div>
        </div>

        {/* 5. Connected Story Headline & Deck */}
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-12 items-baseline">
          <div className="lg:col-span-8">
            <h2>
              <Link
                href={`/articles/${article.slug}`}
                className="
                  font-serif
                  text-2xl sm:text-3xl lg:text-[2.25rem] xl:text-[2.65rem]
                  font-normal
                  leading-[1.1]
                  tracking-[-0.025em]
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
            <p className="mt-3 font-sans text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96] max-w-3xl">
              {article.deck || article.excerpt}
            </p>
          </div>

          <div className="lg:col-span-4 lg:flex lg:justify-end">
            <Link
              href={`/articles/${article.slug}`}
              className="group inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#141413] transition-colors hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c]"
            >
              <span>Read featured story</span>
              <span
                className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                ↗
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
