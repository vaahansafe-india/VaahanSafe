import type { Metadata } from "next";
import Link from "next/link";
import {
  getJournalLandingData,
  resolveArticleMedia,
} from "@vaahansafe/content";
import { getJournalRepository } from "@vaahansafe/database";
import { getWebUrl } from "@vaahansafe/config";
import {
  getLivePublishedArticles,
  getLiveCategories,
  getLiveGuides,
} from "../lib/journal";
import { JournalHeader } from "../components/journal/JournalHeader";
import { JournalFooter } from "../components/journal/JournalFooter";
import { EditorialMedia } from "../components/journal/media/EditorialMedia";
import { StoryCard } from "../components/journal/StoryCard";

export const revalidate = 60; // Refresh every 60s for live CMS updates
export const metadata: Metadata = {
  title: "VaahanSafe Journal — Vehicle Safety, Identity & Privacy",
  description:
    "Practical guides and thoughtful reading on vehicle safety, QR identity, and privacy. A little knowledge for a safer journey.",
  alternates: { canonical: "https://blog.vaahansafe.com" },
};

export default async function JournalHomePage() {
  const [articles, categories, allGuides] = await Promise.all([
    getLivePublishedArticles(),
    getLiveCategories(),
    getLiveGuides(),
  ]);
  const guides = allGuides.slice(0, 3);
  let placements: Record<string, { slug: string }> | undefined;
  try {
    placements = await getJournalRepository().getHomepagePlacements();
  } catch {
    // Authored published content remains available when optional CMS placements cannot be read.
  }
  const featured = articles.length
    ? getJournalLandingData(placements).featuredStory
    : undefined;
  const media = featured ? resolveArticleMedia(featured, "HERO") : undefined;
  const latest = articles.filter((article) => article.slug !== featured?.slug);
  return (
    <div className="flex min-h-screen flex-col">
      <JournalHeader />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <div className="journal-container">
          <section className="journal-cover" aria-labelledby="journal-title">
            <div>
              <p className="journal-label">Field notes for everyday journeys</p>
              <h1 className="journal-title mt-5" id="journal-title">
                For the road.
                <br />
                For the people
                <br />
                <em className="text-[var(--journal-accent)]">along the way.</em>
              </h1>
              <p className="journal-muted mt-6 max-w-md text-base leading-8">
                Thoughtful stories and practical guides on vehicle safety,
                identity, and privacy. Clear ideas you can take on your next
                journey.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="#latest"
                  className="journal-button journal-button-primary"
                >
                  Explore the stories <span aria-hidden="true">↓</span>
                </Link>
                <Link
                  href="/guides"
                  prefetch={false}
                  className="journal-button"
                >
                  Practical guides <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
            {featured && media && (
              <article className="journal-cover-image">
                <Link
                  href={`/articles/${featured.slug}`}
                  prefetch={false}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="block"
                >
                  <EditorialMedia
                    src={media.src}
                    alt={media.alt}
                    aspectRatio="16/10"
                    priority
                    category={featured.category}
                    focalPoint={media.focalPoint}
                    sizes="(min-width: 1280px) 690px, (min-width: 768px) 55vw, 92vw"
                    caption="The featured read"
                  />
                </Link>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="journal-label">{featured.category}</span>
                  <span className="journal-muted text-xs">
                    {featured.readingTime}
                  </span>
                </div>
                <h2 className="mt-3">
                  <Link
                    href={`/articles/${featured.slug}`}
                    prefetch={false}
                    className="hover:text-[var(--journal-accent)]"
                  >
                    {featured.title}
                  </Link>
                </h2>
                <Link
                  href={`/articles/${featured.slug}`}
                  prefetch={false}
                  className="journal-text-link mt-2"
                >
                  Read the featured story <span aria-hidden="true">→</span>
                </Link>
              </article>
            )}
          </section>
          <nav
            className="journal-topics border-y border-[var(--journal-line)]"
            aria-label="Browse by topic"
          >
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                prefetch={false}
                className="journal-topic"
              >
                {category.name}
                <span className="journal-muted text-xs">{category.count}</span>
              </Link>
            ))}
          </nav>
          <section
            id="latest"
            className="py-12 sm:py-16 scroll-mt-24"
            aria-labelledby="latest-title"
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="journal-label">The reading list</p>
                <h2 id="latest-title" className="journal-section-title mt-2">
                  Fresh perspectives.
                </h2>
              </div>
              <Link
                href="/search"
                prefetch={false}
                className="journal-text-link"
              >
                Browse all stories <span aria-hidden="true">→</span>
              </Link>
            </div>
            {latest.length ? (
              <div className="journal-grid">
                {latest.map((article) => (
                  <StoryCard key={article.slug} article={article} />
                ))}
              </div>
            ) : (
              <p className="journal-muted py-8">
                New stories are being prepared. Explore the featured read or
                come back soon.
              </p>
            )}
          </section>
          {guides.length > 0 && (
            <section className="journal-section" aria-labelledby="guides-title">
              <div className="grid gap-8 md:grid-cols-[.65fr_1fr] md:gap-16">
                <div>
                  <p className="journal-label">Keep it practical</p>
                  <h2 id="guides-title" className="journal-section-title mt-3">
                    Good to know.
                    <br />
                    <em>Easy to follow.</em>
                  </h2>
                  <p className="journal-muted mt-4 max-w-sm text-sm leading-7">
                    Useful guides to setting up your vehicle identity and
                    understanding the contact options available to you.
                  </p>
                  <Link
                    href="/guides"
                    prefetch={false}
                    className="journal-text-link mt-3"
                  >
                    All practical guides <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div>
                  {guides.map((guide, index) => (
                    <Link
                      key={guide.slug}
                      href={`/articles/${guide.slug}`}
                      prefetch={false}
                      className="journal-guide-row"
                    >
                      <span className="journal-label">0{index + 1}</span>
                      <div>
                        <h3>{guide.title}</h3>
                        <p className="journal-muted mt-2 text-xs">
                          {guide.readingTime} · {guide.category}
                        </p>
                      </div>
                      <span
                        className="journal-muted text-xl"
                        aria-hidden="true"
                      >
                        ↗
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
          <section className="journal-section flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="journal-label">From reading to the road</p>
              <h2 className="journal-section-title mt-3">
                Meet your vehicle’s safety identity.
              </h2>
              <p className="journal-muted mt-3 max-w-2xl text-sm leading-7">
                Discover how VaahanSafe connects a vehicle to the information
                its owner chooses to share.
              </p>
            </div>
            <a href={`${getWebUrl()}/how-it-works`} className="journal-button">
              How VaahanSafe works <span aria-hidden="true">↗</span>
            </a>
          </section>
        </div>
      </main>
      <JournalFooter />
    </div>
  );
}
