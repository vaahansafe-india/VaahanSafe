import * as React from "react";
import Link from "next/link";
import { BlogPost } from "@vaahansafe/content";
import { VaahanIcon } from "@vaahansafe/icons";

interface FeaturedStoryProps {
  article: BlogPost;
}

export function FeaturedStory({ article }: FeaturedStoryProps) {
  return (
    <section aria-labelledby="featured-story-title" className="py-12 sm:py-16 border-b border-[#e6dfd8] dark:border-[#2e2b27]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82]">
              <span className="font-semibold text-[#cc785c]">FEATURED</span>
              <span>&bull;</span>
              <span>{article.category}</span>
              <span>&bull;</span>
              <span>{article.readingTime}</span>
            </div>

            <h2
              id="featured-story-title"
              className="
                font-serif
                text-3xl sm:text-4xl lg:text-5xl
                font-normal
                leading-[1.08]
                tracking-[-0.03em]
                text-[#141413]
                dark:text-[#faf9f5]
              "
            >
              <Link
                href={`/articles/${article.slug}`}
                className="hover:text-[#cc785c] transition-colors"
              >
                {article.title}
              </Link>
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96] font-sans">
              {article.deck || article.excerpt}
            </p>

            <div className="pt-2 flex items-center justify-between">
              <Link
                href={`/articles/${article.slug}`}
                className="
                  inline-flex items-center gap-2
                  font-mono text-xs font-semibold uppercase tracking-wider
                  text-[#cc785c] hover:text-[#a9583e] transition-colors
                  group
                "
              >
                <span>Read story</span>
                <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
                  &rarr;
                </span>
              </Link>

              <span className="font-mono text-[10px] text-[#8e8b82]">
                By {article.author.name}
              </span>
            </div>
          </div>

          {/* Right Visual / Editorial Card (7 cols) */}
          <div className="lg:col-span-7">
            <Link
              href={`/articles/${article.slug}`}
              className="
                group block relative overflow-hidden rounded-3xl
                border border-[#e6dfd8] bg-gradient-to-br from-[#efe9de] via-[#f5f0e8] to-[#faf9f5]
                p-8 sm:p-12 lg:p-14 transition-all duration-300
                hover:border-[#cc785c]/40 hover:shadow-md
                dark:border-[#2e2b27] dark:from-[#252320] dark:via-[#1f1e1b] dark:to-[#181715]
              "
            >
              {/* Architectural Visual Identity Geometry */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#2e2b27] pb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82]">
                  <span>VAAHANSAFE PROTOCOL REF</span>
                  <span className="text-[#cc785c]">VS / DOC-001</span>
                </div>

                <div className="py-6 sm:py-10 space-y-4 max-w-lg">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#5db8a6] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
                    <span>PUBLIC SAFETY RESOLVER &bull; SUB-50MS LATENCY</span>
                  </div>
                  <p className="font-serif text-2xl sm:text-3xl text-[#141413] dark:text-[#faf9f5] italic font-normal leading-snug">
                    &ldquo;{article.intro.slice(0, 140)}...&rdquo;
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#e6dfd8] dark:border-[#2e2b27] font-mono text-[10px] text-[#8e8b82]">
                  <div className="flex items-center gap-2">
                    <VaahanIcon name="shield" size={13} className="text-[#cc785c]" />
                    <span>ZERO-EXPOSURE MASKED RELAY</span>
                  </div>
                  <span className="group-hover:text-[#cc785c] transition-colors">
                    OPEN ESSAY &rarr;
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
