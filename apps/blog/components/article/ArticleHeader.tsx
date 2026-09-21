import * as React from "react";
import Link from "next/link";
import { BlogPost, resolveArticleMedia } from "@vaahansafe/content";
import { EditorialMedia } from "../journal/media/EditorialMedia";

interface ArticleHeaderProps {
  article: BlogPost;
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
  const heroMedia = resolveArticleMedia(article, "HERO");

  return (
    <header className="w-full border-b border-[#e6dfd8] dark:border-[#2e2b27] bg-[#faf9f5] dark:bg-[#181715] pt-8 pb-10 sm:pt-12 sm:pb-14 lg:pt-14 lg:pb-16">
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28">
        {/* Top Editorial Breadcrumbs & Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6dfd8] pb-4 dark:border-[#2e2b27]">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]"
          >
            <Link href="/" className="hover:text-[#cc785c] transition-colors">
              JOURNAL
            </Link>
            <span>/</span>
            <Link
              href={`/category/${article.categorySlug}`}
              className="text-[#cc785c] hover:underline font-semibold"
            >
              {article.category}
            </Link>
            <span>/</span>
            <span className="text-[#3d3d3a] dark:text-[#a09d96]">
              {article.readingTime}
            </span>
          </nav>

          <div className="font-mono text-[10px] uppercase tracking-wider text-[#8e8b82]">
            <span>PUBLISHED &bull; </span>
            <time dateTime={article.publishedAt}>{article.date}</time>
          </div>
        </div>

        {/* Headline & Deck */}
        <div className="mt-8 sm:mt-12 space-y-4 sm:space-y-6">
          <h1 className="max-w-5xl font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4.25rem] font-normal leading-[1.08] tracking-tight text-[#141413] dark:text-[#faf9f5]">
            {article.title}
          </h1>

          {article.deck && (
            <p className="max-w-4xl font-serif text-lg sm:text-xl md:text-2xl text-[#6c6a64] dark:text-[#a09d96] font-normal leading-relaxed">
              {article.deck}
            </p>
          )}

          {/* Author Metadata Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-[#8e8b82]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
              <span className="text-[#141413] dark:text-[#faf9f5] font-semibold">
                {article.author.name}
              </span>
              <span>&bull;</span>
              <span>{article.author.role}</span>
            </div>

            {article.wordCount && (
              <>
                <span className="text-[#e6dfd8] dark:text-[#2e2b27]">&bull;</span>
                <span>{article.wordCount.toLocaleString()} WORDS</span>
              </>
            )}

            <span className="text-[#e6dfd8] dark:text-[#2e2b27]">&bull;</span>
            <span className="text-[#5db8a6]">STANDARDS-ALIGNED</span>
          </div>
        </div>

        {/* Featured Hero Media (or architectural fallback) */}
        <div className="mt-10 w-full max-w-6xl">
          <EditorialMedia
            src={heroMedia.src}
            alt={heroMedia.alt || article.title}
            priority
            aspectRatio="16/9"
            frame="OFFSET_LANDSCAPE"
            caption={heroMedia.caption}
            category={article.category}
            focalPoint={heroMedia.focalPoint}
            role="HERO"
            sizes="(min-width: 1280px) 1152px, 100vw"
          />
        </div>
      </div>
    </header>
  );
}
