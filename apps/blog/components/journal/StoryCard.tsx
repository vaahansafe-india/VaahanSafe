import Link from "next/link";
import { resolveArticleMedia, type BlogPost } from "@vaahansafe/content";
import { EditorialMedia } from "./media/EditorialMedia";

export function StoryCard({
  article,
  headingLevel = 3,
}: {
  article: BlogPost;
  headingLevel?: 2 | 3;
}) {
  const preview = resolveArticleMedia(article, "THUMBNAIL");
  const media = preview.src ? preview : resolveArticleMedia(article, "HERO");
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="journal-story">
      <Link
        href={`/articles/${article.slug}`}
        prefetch={false}
        tabIndex={-1}
        aria-hidden="true"
        className="block mb-5"
      >
        <EditorialMedia
          src={media.src}
          alt={media.alt || article.title}
          aspectRatio="3/2"
          category={article.category}
          focalPoint={media.focalPoint}
          role={media.role}
          sizes="(min-width: 1280px) 410px, (min-width: 768px) 30vw, (min-width: 480px) 46vw, 92vw"
        />
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[11px]">
        <Link
          className="journal-label"
          prefetch={false}
          href={`/category/${article.categorySlug}`}
        >
          {article.category}
        </Link>
        <span className="journal-muted">{article.readingTime}</span>
      </div>
      <Heading>
        <Link prefetch={false} href={`/articles/${article.slug}`}>
          {article.title}
        </Link>
      </Heading>
      <p className="journal-story-excerpt mt-3">{article.excerpt}</p>
      <div className="journal-muted mt-4 flex flex-wrap items-center gap-2 text-xs">
        <time dateTime={article.publishedAt}>{article.date}</time>
        <span aria-hidden="true">·</span>
        <span>{article.author.name}</span>
      </div>
      <Link
        className="journal-text-link mt-2"
        prefetch={false}
        href={`/articles/${article.slug}`}
        aria-label={`Read ${article.title}`}
      >
        Read story <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
