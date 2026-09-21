import * as React from "react";
import Link from "next/link";
import type { BlogPost } from "@vaahansafe/content";
import { resolveArticleMedia } from "@vaahansafe/content";
import { EditorialMedia } from "../media/EditorialMedia";

interface CategoryChapterProps {
  article: BlogPost;
  storyCount?: number;
}

export function CategoryChapter({ article, storyCount }: CategoryChapterProps) {
  const media = resolveArticleMedia(article, "HERO");

  return (
    <section
      aria-labelledby="category-chapter-heading"
      className="w-full border-b border-[#e6dfd8] py-16 sm:py-24 lg:py-28 dark:border-[#2e2b27]"
    >
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28">
        {/* Chapter Eyebrow */}
        <div className="mb-10 flex items-center justify-between border-b border-[#e6dfd8] pb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] dark:border-[#2e2b27] dark:text-[#77736d]">
          <span className="text-[#cc785c]">CHAPTER / 04 &bull; PRIVACY PRINCIPLES</span>
          <span>DATA MINIMIZATION &bull; DPDP ACT 2023</span>
        </div>

        {/* 12-Column Magazine Chapter Layout */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-center">
          {/* Left Large Statement (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            <h2
              id="category-chapter-heading"
              className="
                font-serif
                text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem]
                font-normal
                leading-[1.05]
                tracking-[-0.03em]
                text-[#141413]
                dark:text-[#faf9f5]
              "
            >
              Private account. <br className="hidden sm:inline" />
              Controlled public information.
            </h2>

            <p className="max-w-xl font-sans text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
              Traditional paper visiting cards left on dashboards broadcast residential addresses and personal phone numbers to every passerby. VaahanSafe enforces an ironclad three-tier boundary separating private account records from the public safety projection.
            </p>

            {/* Three-Tier Mini Blueprint */}
            <div className="rounded-xl border border-[#e6dfd8] bg-[#f5f0e8]/50 p-5 space-y-3 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/50">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#141413] dark:text-[#faf9f5]">
                THREE-TIER BOUNDARY MODEL
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[10px]">
                <div className="p-2.5 rounded border border-[#e6dfd8] bg-white/70 dark:border-[#2e2b27] dark:bg-[#181715]/70">
                  <div className="text-[#8e8b82]">TIER 01</div>
                  <div className="text-[#141413] dark:text-[#faf9f5] font-semibold">Private Account</div>
                  <div className="text-[9px] text-[#6c6a64] dark:text-[#a09d96] mt-0.5">Zero exposure</div>
                </div>

                <div className="p-2.5 rounded border border-[#e6dfd8] bg-white/70 dark:border-[#2e2b27] dark:bg-[#181715]/70">
                  <div className="text-[#8e8b82]">TIER 02</div>
                  <div className="text-[#cc785c] font-semibold">Owner Controls</div>
                  <div className="text-[9px] text-[#6c6a64] dark:text-[#a09d96] mt-0.5">Relay toggles</div>
                </div>

                <div className="p-2.5 rounded border border-[#e6dfd8] bg-white/70 dark:border-[#2e2b27] dark:bg-[#181715]/70">
                  <div className="text-[#8e8b82]">TIER 03</div>
                  <div className="text-[#5db8a6] font-semibold">Safety View</div>
                  <div className="text-[9px] text-[#6c6a64] dark:text-[#a09d96] mt-0.5">Masked actions</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              {storyCount !== undefined && storyCount > 0 && (
                <span className="font-mono text-xs uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
                  {String(storyCount).padStart(2, "0")} STORIES
                </span>
              )}
              <Link
                href={`/category/${article.categorySlug}`}
                className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#141413] transition-colors hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c]"
              >
                <span>Explore {article.category}</span>
                <span
                  className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </Link>
            </div>
          </div>

          {/* Right Editorial Visual (5 cols) */}
          <div className="lg:col-span-5">
            <Link
              href={`/articles/${article.slug}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]"
              tabIndex={-1}
              aria-hidden="true"
            >
              <EditorialMedia
                src={media.src}
                alt={media.alt || article.title}
                frame="OFFSET_LANDSCAPE"
                aspectRatio="16/10"
                caption={media.caption || `FIG. 05 / ${article.title.toUpperCase()} • PRIVACY`}
                category={article.category}
                indexNumber="04"
                focalPoint={media.focalPoint}
                role="HERO"
                sizes="(min-width: 1024px) 42vw, 100vw"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
