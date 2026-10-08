import Link from "next/link";
import { resolveArticleMedia, type BlogPost } from "@vaahansafe/content";
import { EditorialMedia } from "../journal/media/EditorialMedia";

export function ArticleHeader({ article }: { article: BlogPost }) {
  const media = resolveArticleMedia(article, "HERO");
  return (
    <header className="border-b border-[var(--journal-line)] py-9 sm:py-14">
      <div className="journal-container">
        <nav
          aria-label="Breadcrumb"
          className="journal-muted flex flex-wrap items-center gap-3 text-xs"
        >
          <Link
            href="/"
            prefetch={false}
            className="inline-flex min-h-11 items-center"
          >
            The Journal
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            prefetch={false}
            href={`/category/${article.categorySlug}`}
            className="inline-flex min-h-11 items-center text-[var(--journal-accent)]"
          >
            {article.category}
          </Link>
        </nav>
        <div className="mx-auto mb-9 mt-5 max-w-[1000px] sm:mt-8">
          <p className="journal-label">
            {article.isGuide ? "The practical guide" : "The field note"} ·{" "}
            {article.readingTime}
          </p>
          <h1
            className="journal-title mt-4"
            style={{
              fontSize: "clamp(2.5rem, 4.5vw, 4.5rem)",
              lineHeight: 1.06,
            }}
          >
            {article.title}
          </h1>
          <p className="journal-muted mt-5 max-w-3xl text-base leading-8 sm:text-lg">
            {article.deck || article.excerpt}
          </p>
          <div className="journal-muted mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            <span className="font-semibold text-[var(--journal-ink)]">
              {article.author.name}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt}>{article.date}</time>
            {article.updatedAt && (
              <span>
                Updated{" "}
                {new Intl.DateTimeFormat("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "Asia/Kolkata",
                }).format(new Date(article.updatedAt))}
              </span>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-[1120px]">
          <EditorialMedia
            src={media.src}
            alt={media.alt || article.title}
            priority
            aspectRatio="16/9"
            frame="OFFSET_LANDSCAPE"
            caption={media.caption}
            category={article.category}
            focalPoint={media.focalPoint}
            sizes="(min-width: 1200px) 1120px, 92vw"
          />
        </div>
      </div>
    </header>
  );
}
