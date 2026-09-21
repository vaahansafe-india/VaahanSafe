import * as React from "react";
import Link from "next/link";
import type { BlogPost } from "@vaahansafe/content";
import { resolveArticleMedia, resolveArticlePreviewMedia } from "@vaahansafe/content";
import { EditorialMedia } from "../media/EditorialMedia";
import { StoryCoordinate } from "../signal/StoryCoordinate";

interface StoryFieldProps {
  leadStory: BlogPost;
  verticalStory: BlogPost;
  textStory: BlogPost;
}

export function StoryField({
  leadStory,
  verticalStory,
  textStory,
}: StoryFieldProps) {
  const leadMedia = resolveArticleMedia(leadStory, "HERO");
  const verticalMedia = resolveArticlePreviewMedia(verticalStory);

  return (
    <section
      aria-labelledby="story-field-heading"
      className="w-full border-b border-[#e6dfd8] py-14 sm:py-20 lg:py-24 dark:border-[#2e2b27]"
    >
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28">
        {/* Section Label */}
        <div className="mb-10 flex items-center justify-between border-b border-[#e6dfd8] pb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] dark:border-[#2e2b27] dark:text-[#77736d]">
          <span id="story-field-heading">STORY FIELD / PERSPECTIVES</span>
          <span>12-COL ASYMMETRIC GRID</span>
        </div>

        {/* 1. Asymmetric Grid Row: Lead Story (Cols 1-7) + Vertical Story (Cols 8-12) */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          {/* STORY 01: Lead Story (7 cols) */}
          <article className="group flex flex-col space-y-5 lg:col-span-7">
            <Link
              href={`/articles/${leadStory.slug}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]"
              tabIndex={-1}
              aria-hidden="true"
            >
              <EditorialMedia
                src={leadMedia.src}
                alt={leadMedia.alt || leadStory.title}
                frame="OFFSET_LANDSCAPE"
                aspectRatio="16/10"
                caption={leadMedia.caption || `FIG. 02 / ${leadStory.title.toUpperCase()} • CERAMIC FRIT EXCLUSION`}
                category={leadStory.category}
                indexNumber="01"
                focalPoint={leadMedia.focalPoint}
                role="HERO"
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            </Link>

            <StoryCoordinate
              indexNumber="01"
              category={leadStory.category}
              date={leadStory.date}
              readingTime={leadStory.readingTime}
            />

            <h3 className="pt-1">
              <Link
                href={`/articles/${leadStory.slug}`}
                className="font-serif text-2xl sm:text-3xl lg:text-[2rem] font-normal leading-[1.15] tracking-[-0.02em] text-[#141413] transition-colors group-hover:text-[#cc785c] dark:text-[#faf9f5] dark:group-hover:text-[#cc785c]"
              >
                {leadStory.title}
              </Link>
            </h3>

            <p className="font-sans text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
              {leadStory.excerpt}
            </p>

            <div className="pt-2">
              <Link
                href={`/articles/${leadStory.slug}`}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider text-[#141413] transition-colors hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c]"
              >
                <span>Read article</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                  ↗
                </span>
              </Link>
            </div>
          </article>

          {/* STORY 02: Vertical Story with Tall R2 Media (5 cols) */}
          <article className="group flex flex-col space-y-5 lg:col-span-5 lg:border-l lg:border-[#e6dfd8] lg:pl-12 dark:lg:border-[#2e2b27]">
            <Link
              href={`/articles/${verticalStory.slug}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]"
              tabIndex={-1}
              aria-hidden="true"
            >
              <EditorialMedia
                src={verticalMedia.src}
                alt={verticalMedia.alt || verticalStory.title}
                frame="TALL_PORTRAIT"
                aspectRatio="3/4"
                caption={verticalMedia.caption || `FIG. 03 / ${verticalStory.title.toUpperCase()} • DYNAMICS`}
                category={verticalStory.category}
                indexNumber="02"
                focalPoint={verticalMedia.focalPoint}
                role={verticalMedia.role}
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
            </Link>

            <StoryCoordinate
              indexNumber="02"
              category={verticalStory.category}
              date={verticalStory.date}
              readingTime={verticalStory.readingTime}
            />

            <h3 className="pt-1">
              <Link
                href={`/articles/${verticalStory.slug}`}
                className="font-serif text-xl sm:text-2xl font-normal leading-[1.2] tracking-[-0.02em] text-[#141413] transition-colors group-hover:text-[#cc785c] dark:text-[#faf9f5] dark:group-hover:text-[#cc785c]"
              >
                {verticalStory.title}
              </Link>
            </h3>

            <p className="font-sans text-xs sm:text-sm leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
              {verticalStory.excerpt}
            </p>

            <div className="pt-2">
              <Link
                href={`/articles/${verticalStory.slug}`}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider text-[#141413] transition-colors hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c]"
              >
                <span>Read article</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                  ↗
                </span>
              </Link>
            </div>
          </article>
        </div>

        {/* 2. Horizontal Divider & Text-Led Story (Story 03) */}
        <div className="mt-16 pt-12 sm:mt-20 sm:pt-16 border-t border-[#e6dfd8] dark:border-[#2e2b27]">
          <article className="group grid grid-cols-1 gap-8 md:grid-cols-12 items-center">
            {/* Left Technical Story Coordinate (4 cols) */}
            <div className="md:col-span-4 space-y-4">
              <StoryCoordinate
                indexNumber="03"
                category={textStory.category}
                date={textStory.date}
                readingTime={textStory.readingTime}
              />

              {/* Statutory Citation Badge */}
              <div className="rounded-lg border border-[#e6dfd8] bg-[#f5f0e8]/50 p-4 font-mono text-[10px] text-[#6c6a64] dark:border-[#2e2b27] dark:bg-[#1f1e1b]/50 dark:text-[#a09d96]">
                <div className="text-[#cc785c] font-semibold">LEGAL SAFEGUARD</div>
                <div className="mt-1">
                  MVA Section 134A &bull; Good Samaritan Immunity Charter &bull; Supreme Court 235/2012
                </div>
              </div>
            </div>

            {/* Right Typography-Dominant Headline & Excerpt (8 cols) */}
            <div className="md:col-span-8 space-y-4">
              <h3 className="font-serif text-2xl sm:text-3xl lg:text-[2.5rem] font-normal leading-[1.1] tracking-[-0.025em] text-[#141413] transition-colors group-hover:text-[#cc785c] dark:text-[#faf9f5] dark:group-hover:text-[#cc785c]">
                <Link href={`/articles/${textStory.slug}`}>
                  {textStory.title}
                </Link>
              </h3>

              <p className="max-w-2xl font-sans text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
                {textStory.deck || textStory.excerpt}
              </p>

              {/* Minimal Diagram Line */}
              <div className="py-2 flex items-center gap-3 font-mono text-[9px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
                <span>INCIDENT</span>
                <span className="h-px w-8 bg-[#cc785c]" />
                <span>SEC 134A</span>
                <span className="h-px w-8 bg-[#5db8a6]" />
                <span>FULL IMMUNITY</span>
              </div>

              <div>
                <Link
                  href={`/articles/${textStory.slug}`}
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider text-[#141413] transition-colors hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c]"
                >
                  <span>Read full analysis</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
