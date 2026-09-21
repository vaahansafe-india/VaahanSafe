import * as React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getPublishedArticles,
  getArticleBySlug,
  getRelatedArticles,
} from "@vaahansafe/content";
import { getWebUrl } from "@vaahansafe/config";
import { getJournalRepository } from "@vaahansafe/database";
import { VaahanIcon } from "@vaahansafe/icons";
import { JournalHeader } from "../../../components/journal/JournalHeader";
import { JournalFooter } from "../../../components/journal/JournalFooter";
import { ReadingProgressBar } from "../../../components/journal/ReadingProgressBar";
import { ArticleHeader } from "../../../components/article/ArticleHeader";
import { ArticleBody } from "../../../components/article/ArticleBody";
import { ArticleShare } from "../../../components/article/ArticleShare";
import { ArticleDocumentRef } from "../../../components/article/ArticleDocumentRef";
import { ArticleRelated } from "../../../components/article/ArticleRelated";

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const articles = getPublishedArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Story Not Found — VaahanSafe Journal",
    };
  }

  return {
    title: `${article.title} — VaahanSafe Journal`,
    description: article.deck || article.excerpt,
    alternates: {
      canonical: `https://blog.vaahansafe.com/articles/${article.slug}`,
    },
    openGraph: {
      title: `${article.title} — VaahanSafe Journal`,
      description: article.deck || article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      tags: [...article.tags],
      url: `https://blog.vaahansafe.com/articles/${article.slug}`,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  // 1. Cloudflare D1 301 Redirection: Lookup slug history to preserve incoming links
  try {
    const repo = getJournalRepository();
    const redirectedSlug = await repo.resolveSlugRedirect(slug);
    if (redirectedSlug && redirectedSlug !== slug) {
      redirect(`/articles/${redirectedSlug}`);
    }
  } catch {
    // Continue standard resolution
  }

  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(slug, 2);
  const webUrl = getWebUrl();
  const canonicalUrl = `https://blog.vaahansafe.com/articles/${article.slug}`;

  const tableOfContents = article.body
    .map((s, idx) => ({
      title: s.heading,
      id: s.id || `section-${idx + 1}`,
    }))
    .filter((item): item is { title: string; id: string } => Boolean(item.title));

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      <ReadingProgressBar />
      <JournalHeader />

      <main id="main-content" className="flex-1 w-full">
        {/* 1. Expansive Full-Width Article Masthead */}
        <ArticleHeader article={article} />

        {/* 2. Expansive 12-Column Editorial Grid Spread */}
        <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28 py-10 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16">
            {/* Left / Primary Reading Column (Spans 8 columns on large displays) */}
            <article className="lg:col-span-8 xl:col-span-8 max-w-3xl space-y-12">
              <ArticleBody
                sections={article.body}
                intro={article.intro}
                references={article.references}
                tags={article.tags}
                keyTakeaways={article.keyTakeaways}
                checklist={article.checklist}
                faq={article.faq}
              />

              <div className="pt-6 border-t border-[#e6dfd8] dark:border-[#2e2b27] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <ArticleShare
                  title={article.title}
                  url={canonicalUrl}
                />

                <Link
                  href="/"
                  className="font-mono text-xs text-[#8e8b82] hover:text-[#cc785c] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>&larr;</span>
                  <span>Return to Journal Front Page</span>
                </Link>
              </div>

              <ArticleDocumentRef documentRef={article.officialDocumentRef} />

              <ArticleRelated articles={relatedArticles} />
            </article>

            {/* Right / Sticky Editorial Rail (Desktop: Spans 4 columns) */}
            <aside
              aria-label="Article Sidebar"
              className="hidden lg:block lg:col-span-4 xl:col-span-4"
            >
              <div className="sticky top-28 space-y-7 pl-6 xl:pl-8 border-l border-[#e6dfd8] dark:border-[#2e2b27]">
                {/* Outline / Table of Contents */}
                {tableOfContents.length > 0 && (
                  <nav
                    aria-label="Table of contents"
                    className="space-y-3 rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/40 p-5 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/40"
                  >
                    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c] font-semibold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
                      <span>FIELD NOTE OUTLINE</span>
                    </div>
                    <ul className="space-y-2.5 text-xs font-sans">
                      {tableOfContents.map((item, idx) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className="flex items-start gap-2.5 text-[#6c6a64] hover:text-[#141413] dark:text-[#a09d96] dark:hover:text-[#faf9f5] transition-colors leading-snug group"
                          >
                            <span className="font-mono text-[10px] text-[#8e8b82] group-hover:text-[#cc785c] mt-0.5 shrink-0">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span>{item.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}

                {/* Author Card */}
                <div className="space-y-3 rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/50 p-5 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/50">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c] font-semibold">
                    AUTHOR &amp; PERSPECTIVE
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#cc785c]/15 text-[#cc785c] font-mono text-xs font-bold">
                      {article.author.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-[#141413] dark:text-[#faf9f5]">
                        {article.author.name}
                      </div>
                      <div className="text-xs text-[#8e8b82]">{article.author.role}</div>
                    </div>
                  </div>
                  <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed pt-1">
                    Specialized legal counsel in Indian vehicle safety regulations, Central Motor Vehicles Rules (CMVR), and digital privacy compliance.
                  </p>
                </div>

                {/* Quick Share Card */}
                <div className="space-y-3 rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/30 p-5 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/30">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82]">
                    SHARE THIS FIELD NOTE
                  </div>
                  <ArticleShare
                    title={article.title}
                    url={canonicalUrl}
                  />
                </div>

                {/* Sourced Regulatory References Quick View */}
                {article.references && article.references.length > 0 && (
                  <div className="space-y-3 rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/30 p-5 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/30">
                    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82] flex items-center gap-1.5">
                      <VaahanIcon name="document" size={12} />
                      <span>CITED STATUTES ({article.references.length})</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#6c6a64] dark:text-[#a09d96]">
                      {article.references.map((ref, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="font-mono text-[10px] text-[#cc785c]">[{idx + 1}]</span>
                          <span className="leading-snug">{ref.citation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Official Platform Navigation */}
                <div className="space-y-2 pt-2 text-xs font-sans">
                  <a
                    href={webUrl}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[#6c6a64] hover:bg-[#f5f0e8] hover:text-[#141413] dark:text-[#a09d96] dark:hover:bg-[#1f1e1b] dark:hover:text-[#faf9f5] transition-colors"
                  >
                    <span>Explore VaahanSafe Platform</span>
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                  <a
                    href={`${webUrl}/how-it-works`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[#6c6a64] hover:bg-[#f5f0e8] hover:text-[#141413] dark:text-[#a09d96] dark:hover:bg-[#1f1e1b] dark:hover:text-[#faf9f5] transition-colors"
                  >
                    <span>How QR Identity Works</span>
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <JournalFooter />
    </div>
  );
}
