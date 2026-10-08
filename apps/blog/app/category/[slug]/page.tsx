import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  JOURNAL_CATEGORIES,
  getCategoryBySlug,
  resolveArticleMedia,
} from "@vaahansafe/content";
import {
  getLiveArticlesByCategory,
} from "../../../lib/journal";
import { JournalHeader } from "../../../components/journal/JournalHeader";
import { JournalFooter } from "../../../components/journal/JournalFooter";
import { StoryCard } from "../../../components/journal/StoryCard";
import { EditorialMedia } from "../../../components/journal/media/EditorialMedia";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}
export const revalidate = 60;
export function generateStaticParams() {
  return JOURNAL_CATEGORIES.map((category) => ({ slug: category.slug }));
}
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = getCategoryBySlug((await params).slug);
  if (!category) return { title: "Category Not Found — VaahanSafe Journal" };
  return {
    title: `${category.name} — VaahanSafe Journal`,
    description: category.description,
    alternates: {
      canonical: `https://blog.vaahansafe.com/category/${category.slug}`,
    },
  };
}
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();
  const articles = await getLiveArticlesByCategory(slug);
  const featured = articles[0];
  const media = featured ? resolveArticleMedia(featured, "HERO") : undefined;
  return (
    <div className="flex min-h-screen flex-col">
      <JournalHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="journal-container flex-1 py-12 sm:py-16"
      >
        <header className="max-w-3xl">
          <Link href="/" prefetch={false} className="journal-text-link mb-5">
            ← Back to the Journal
          </Link>
          <p className="journal-label">
            {category.name} · {articles.length}{" "}
            {articles.length === 1 ? "story" : "stories"}
          </p>
          <h1 className="journal-title mt-4">{category.headline}</h1>
          <p className="journal-muted mt-5 text-base leading-8">
            {category.description}
          </p>
        </header>
        <nav
          aria-label="Other journal topics"
          className="journal-topics mt-8 border-y border-[var(--journal-line)]"
        >
          {JOURNAL_CATEGORIES.map((topic) => (
            <Link
              key={topic.slug}
              href={`/category/${topic.slug}`}
              className="journal-topic"
              prefetch={false}
              aria-current={topic.slug === slug ? "page" : undefined}
            >
              {topic.name}
            </Link>
          ))}
        </nav>
        {featured && media ? (
          <>
            <section
              className="journal-cover"
              aria-label="Featured story in this topic"
            >
              <div>
                <p className="journal-label">
                  Start here · {featured.readingTime}
                </p>
                <h2 className="mt-4">
                  <Link href={`/articles/${featured.slug}`} prefetch={false}>
                    {featured.title}
                  </Link>
                </h2>
                <p className="journal-muted mt-4 text-sm leading-7">
                  {featured.deck || featured.excerpt}
                </p>
                <Link
                  href={`/articles/${featured.slug}`}
                  prefetch={false}
                  className="journal-text-link mt-3"
                >
                  Read story <span aria-hidden="true">→</span>
                </Link>
              </div>
              <EditorialMedia
                src={media.src}
                alt={media.alt}
                aspectRatio="3/2"
                priority
                category={featured.category}
                focalPoint={media.focalPoint}
                sizes="(min-width: 1280px) 690px, (min-width: 768px) 55vw, 92vw"
              />
            </section>
            {articles.length > 1 && (
              <section className="journal-section">
                <h2 className="journal-section-title mb-8">
                  More in {category.name.toLowerCase()}.
                </h2>
                <div className="journal-grid">
                  {articles.slice(1).map((article) => (
                    <StoryCard key={article.slug} article={article} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="my-12 rounded-sm border border-[var(--journal-line)] p-8 sm:p-12">
            <h2 className="journal-section-title">
              More stories are on the way.
            </h2>
            <p className="journal-muted mt-4 text-sm leading-7">
              This collection is being prepared. Browse another topic or explore
              the latest stories.
            </p>
            <Link href="/#latest" className="journal-text-link mt-3">
              Explore the latest <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </main>
      <JournalFooter />
    </div>
  );
}
