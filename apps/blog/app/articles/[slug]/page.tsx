import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import {
  resolveArticleMedia,
} from "@vaahansafe/content";
import { getJournalRepository } from "@vaahansafe/database";
import {
  getLiveArticleBySlug,
  getLiveRelatedArticles,
  getLivePublishedArticles,
} from "../../../lib/journal";
import { JournalHeader } from "../../../components/journal/JournalHeader";
import { JournalFooter } from "../../../components/journal/JournalFooter";
import { ReadingProgressBar } from "../../../components/journal/ReadingProgressBar";
import { ArticleHeader } from "../../../components/article/ArticleHeader";
import { ArticleBody } from "../../../components/article/ArticleBody";
import { ArticleShare } from "../../../components/article/ArticleShare";
import { ArticleDocumentRef } from "../../../components/article/ArticleDocumentRef";
import { ArticleRelated } from "../../../components/article/ArticleRelated";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}
export const revalidate = 60; // Refresh every 60s for live CMS updates
export async function generateStaticParams() {
  const articles = await getLivePublishedArticles();
  return articles.map((article) => ({ slug: article.slug }));
}
export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const article = await getLiveArticleBySlug((await params).slug);
  if (!article) return { title: "Story Not Found — VaahanSafe Journal" };
  const media = resolveArticleMedia(article, "HERO");
  return {
    title: `${article.title} — VaahanSafe Journal`,
    description: article.deck || article.excerpt,
    alternates: {
      canonical: `https://blog.vaahansafe.com/articles/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.deck || article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      tags: [...article.tags],
      images: media.src ? [{ url: media.src, alt: media.alt }] : undefined,
    },
  };
}
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getLiveArticleBySlug(slug);
  if (!article) {
    let redirectedSlug: string | null | undefined;
    try {
      redirectedSlug = await getJournalRepository().resolveSlugRedirect(slug);
    } catch {
      /* Standard not-found handling when optional slug history is unavailable. */
    }
    if (redirectedSlug && redirectedSlug !== slug)
      permanentRedirect(`/articles/${redirectedSlug}`);
    notFound();
  }
  const relatedArticles = await getLiveRelatedArticles(slug, 3);
  const canonicalUrl = `https://blog.vaahansafe.com/articles/${article.slug}`;
  const outline = article.body
    .map((section, index) => ({
      title: section.heading,
      id: section.id || `section-${index + 1}`,
    }))
    .filter((item): item is { title: string; id: string } =>
      Boolean(item.title),
    );
  return (
    <div className="flex min-h-screen flex-col">
      <ReadingProgressBar />
      <JournalHeader />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <ArticleHeader article={article} />
        <div className="journal-container">
          {outline.length > 0 && (
            <details className="journal-mobile-outline">
              <summary>In this story</summary>
              <nav aria-label="Article contents">
                {outline.map((item) => (
                  <a href={`#${item.id}`} key={item.id}>
                    {item.title}
                  </a>
                ))}
              </nav>
            </details>
          )}
          <div className="journal-article-layout">
            <article
              className="journal-reading space-y-10"
              aria-label={article.title}
            >
              <ArticleBody
                sections={article.body}
                intro={article.intro}
                references={article.references}
                tags={article.tags}
                keyTakeaways={article.keyTakeaways}
                checklist={article.checklist}
                faq={article.faq}
              />
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--journal-line)] pt-6">
                <ArticleShare title={article.title} url={canonicalUrl} />
                <Link href="/" prefetch={false} className="journal-text-link">
                  ← Back to the Journal
                </Link>
              </div>
              <ArticleDocumentRef documentRef={article.officialDocumentRef} />
            </article>
            <aside
              className="journal-article-rail"
              aria-label="About this story"
            >
              <div className="sticky top-28 space-y-8 border-l border-[var(--journal-line)] pl-6">
                {outline.length > 0 && (
                  <nav aria-label="Table of contents">
                    <h2 className="journal-label mb-4">In this story</h2>
                    <ol className="space-y-2">
                      {outline.map((item, index) => (
                        <li key={item.id}>
                          <a
                            className="flex gap-3 py-2 text-[13px] leading-6 journal-muted hover:text-[var(--journal-accent)]"
                            href={`#${item.id}`}
                          >
                            <span className="text-[10px] pt-1">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span>{item.title}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}
                <div className="border-t border-[var(--journal-line)] pt-6">
                  <h2 className="journal-label">Written by</h2>
                  <p className="mt-3 text-sm font-semibold">
                    {article.author.name}
                  </p>
                  <p className="journal-muted mt-2 text-xs leading-6">
                    {article.author.role}
                  </p>
                  <p className="journal-muted mt-3 text-xs">
                    <time dateTime={article.publishedAt}>{article.date}</time> ·{" "}
                    {article.readingTime}
                  </p>
                </div>
                <div className="border-t border-[var(--journal-line)] pt-6">
                  <p className="journal-label mb-3">Pass it on</p>
                  <ArticleShare title={article.title} url={canonicalUrl} />
                </div>
              </div>
            </aside>
          </div>
          <ArticleRelated articles={relatedArticles} />
        </div>
      </main>
      <JournalFooter />
    </div>
  );
}
