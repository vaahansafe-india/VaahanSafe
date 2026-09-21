import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  JOURNAL_CATEGORIES,
  getCategoryBySlug,
  getArticlesByCategory,
} from "@vaahansafe/content";
import { JournalHeader } from "../../../components/journal/JournalHeader";
import { JournalFooter } from "../../../components/journal/JournalFooter";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return JOURNAL_CATEGORIES.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category Not Found — VaahanSafe Journal" };
  }

  return {
    title: `${category.name} — VaahanSafe Journal`,
    description: category.description,
    alternates: {
      canonical: `https://blog.vaahansafe.com/category/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} — VaahanSafe Journal`,
      description: category.description,
      type: "website",
      url: `https://blog.vaahansafe.com/category/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const articles = getArticlesByCategory(slug);
  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      <JournalHeader />

      <main id="main-content" className="flex-1 w-full py-10 sm:py-16">
        <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28 space-y-12">
          {/* Category Header */}
          <div className="space-y-4 max-w-3xl pb-8 border-b border-[#e6dfd8] dark:border-[#2e2b27]">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c]">
              <span className="font-bold">{category.indexNumber}</span>
              <span>/</span>
              <span>CATEGORY ARCHIVE</span>
              <span>&bull;</span>
              <span>
                {articles.length} {articles.length === 1 ? "STORY" : "STORIES"}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#141413] dark:text-[#faf9f5]">
              {category.headline}
            </h1>

            <p className="text-base text-[#6c6a64] dark:text-[#a09d96] font-sans leading-relaxed">
              {category.description}
            </p>
          </div>

          {/* Empty Category Check */}
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e6dfd8] dark:border-[#2e2b27] p-12 text-center space-y-3">
              <div className="text-sm font-medium text-[#141413] dark:text-[#faf9f5]">
                No stories published in {category.name} yet
              </div>
              <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] max-w-md mx-auto font-sans">
                Articles and guides for this category are currently in preparation. Explore other sections of the Journal below.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="font-mono text-xs uppercase tracking-wider text-[#cc785c] hover:underline"
                >
                  &larr; Return to Journal Front Page
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Category Featured Article */}
              {featuredArticle && (
                <section
                  aria-label="Category Featured Story"
                  className="rounded-3xl border border-[#e6dfd8] bg-[#f5f0e8]/50 p-7 sm:p-10 lg:p-12 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/50"
                >
                  <div className="max-w-3xl space-y-4">
                    <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
                      <span className="text-[#cc785c] font-semibold">
                        FEATURED IN {category.name.toUpperCase()}
                      </span>
                      <span>&bull;</span>
                      <span>{featuredArticle.readingTime}</span>
                    </div>

                    <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#141413] dark:text-[#faf9f5]">
                      <Link
                        href={`/articles/${featuredArticle.slug}`}
                        className="hover:text-[#cc785c] transition-colors"
                      >
                        {featuredArticle.title}
                      </Link>
                    </h2>

                    <p className="text-sm sm:text-base text-[#6c6a64] dark:text-[#a09d96] leading-relaxed font-sans">
                      {featuredArticle.deck || featuredArticle.excerpt}
                    </p>

                    <div className="pt-2">
                      <Link
                        href={`/articles/${featuredArticle.slug}`}
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#cc785c] hover:text-[#a9583e]"
                      >
                        <span>Read full essay</span>
                        <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </section>
              )}

              {/* Chronological Archive Stream */}
              {remainingArticles.length > 0 && (
                <section aria-label="Category Chronological Archive" className="space-y-6 pt-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82]">
                    ALL {category.name.toUpperCase()} STORIES ({remainingArticles.length})
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {remainingArticles.map((story) => (
                      <article
                        key={story.slug}
                        className="
                          flex flex-col justify-between rounded-2xl border border-[#e6dfd8]
                          bg-[#f5f0e8]/30 p-6 transition-all hover:border-[#cc785c]/40 hover:bg-[#f5f0e8]/70 hover:shadow-xs
                          dark:border-[#2e2b27] dark:bg-[#1f1e1b]/30 dark:hover:bg-[#1f1e1b]/70
                        "
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
                            <span>{story.date}</span>
                            <span>{story.readingTime}</span>
                          </div>

                          <h3 className="font-serif text-xl font-normal text-[#141413] dark:text-[#faf9f5] leading-snug hover:text-[#cc785c] transition-colors">
                            <Link href={`/articles/${story.slug}`}>{story.title}</Link>
                          </h3>

                          <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] line-clamp-3">
                            {story.excerpt}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[#e6dfd8]/60 dark:border-[#2e2b27]/60">
                          <Link
                            href={`/articles/${story.slug}`}
                            className="font-mono text-xs uppercase tracking-wider text-[#cc785c] hover:underline"
                          >
                            Read story &rarr;
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Navigation link to other categories */}
          <div className="pt-8 border-t border-[#e6dfd8] dark:border-[#2e2b27] flex items-center justify-between font-mono text-xs">
            <Link
              href="/"
              className="text-[#8e8b82] hover:text-[#cc785c] transition-colors"
            >
              &larr; Back to Journal
            </Link>

            <Link
              href="/guides"
              className="text-[#cc785c] hover:underline"
            >
              Browse Safety Guides &rarr;
            </Link>
          </div>
        </div>
      </main>

      <JournalFooter />
    </div>
  );
}
