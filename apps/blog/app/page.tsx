import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getJournalLandingData,
  getPublishedArticles,
} from "@vaahansafe/content";
import { getWebUrl } from "@vaahansafe/config";
import { getJournalRepository } from "@vaahansafe/database";
import { JournalHeader } from "../components/journal/JournalHeader";
import { JournalHero } from "../components/journal/hero/JournalHero";
import { JournalSignalGrid } from "../components/journal/signal/JournalSignalGrid";
import { StoryField } from "../components/journal/stories/StoryField";
import { IdentityChapter } from "../components/journal/chapters/IdentityChapter";
import { GuideRegistry } from "../components/journal/guides/GuideRegistry";
import { CategoryChapter } from "../components/journal/chapters/CategoryChapter";
import { LatestJournalIndex } from "../components/journal/index/LatestJournalIndex";
import { VaahanSafeConnection } from "../components/journal/about/VaahanSafeConnection";
import { JournalFooter } from "../components/journal/JournalFooter";

export const metadata: Metadata = {
  title: "VaahanSafe Journal — Ideas & Knowledge for Safer Vehicle Connections",
  description:
    "Guides for the road, the vehicle and the identity. FIELD NOTES on vehicle safety, QR identity, privacy, and emergency response.",
  alternates: {
    canonical: "https://blog.vaahansafe.com",
  },
  openGraph: {
    title: "VaahanSafe Journal",
    description:
      "Guides for the road, the vehicle and the identity. FIELD NOTES on vehicle safety, QR identity, and privacy.",
    type: "website",
    url: "https://blog.vaahansafe.com",
  },
};

export default async function JournalHomePage() {
  // Query Cloudflare D1 for active homepage placements (Future Admin CMS controlled)
  let d1Placements: Record<string, { slug: string }> | undefined = undefined;
  try {
    const repo = getJournalRepository();
    const activePlacements = await repo.getHomepagePlacements();
    if (Object.keys(activePlacements).length > 0) {
      d1Placements = activePlacements;
    }
  } catch {
    // In local dev without remote Cloudflare token or test environments, fallback safely
  }

  const publishedArticles = getPublishedArticles();
  const landingData = getJournalLandingData(d1Placements);
  const webUrl = getWebUrl();

  // Section 73: Clean Empty Journal State
  if (publishedArticles.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-[#faf9f5] text-[#141413] antialiased dark:bg-[#181715] dark:text-[#faf9f5]">
        <JournalHeader />
        <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-xl space-y-6 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
              VAAHANSAFE / JOURNAL &bull; FIELD NOTES
            </div>
            <h1 className="font-serif text-3xl font-normal leading-tight text-[#141413] sm:text-5xl dark:text-[#faf9f5]">
              Stories about vehicles, <br />
              identity and the road.
            </h1>
            <div className="space-y-2 font-sans text-sm text-[#6c6a64] sm:text-base dark:text-[#a09d96]">
              <p className="font-serif italic text-xl text-[#141413] dark:text-[#faf9f5]">
                The Journal is being prepared.
              </p>
              <p>
                Guides for the road, the vehicle and the identity. Practical perspectives on vehicle safety, privacy and QR identity will appear here.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-mono text-xs uppercase tracking-wider">
              <a
                href={webUrl}
                className="inline-flex items-center gap-1.5 text-[#141413] hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c]"
              >
                <span>Explore VaahanSafe</span>
                <span>&rarr;</span>
              </a>
              <span className="text-[#e6dfd8] dark:text-[#2e2b27]">&bull;</span>
              <a
                href={`${webUrl}/how-it-works`}
                className="inline-flex items-center gap-1.5 text-[#141413] hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c]"
              >
                <span>Read Product Guide</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        </main>
        <JournalFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      {/* 1. Full-Width Masthead Header */}
      <JournalHeader />

      <main id="main-content" className="flex-1 w-full">
        {/* 2. Full-Width Typographic Hero + R2 Media + Integrated Featured Story */}
        <JournalHero article={landingData.featuredStory} />

        {/* 3. Signal / Category Grid (Full-Width Horizontal Registry) */}
        <JournalSignalGrid categories={landingData.signalCategories} />

        {/* 4. Asymmetric Story Field (Lead Story, Vertical Story, Text Story) */}
        <StoryField
          leadStory={landingData.leadStory}
          verticalStory={landingData.verticalStory}
          textStory={landingData.textStory}
        />

        {/* 5. Full-Viewport Dark Identity Chapter (#181715 + Identity Grammar Diagram) */}
        <IdentityChapter article={landingData.darkChapterStory} />

        {/* 6. Practical Guide Registry (Full-Width Rows, Zero Cards) */}
        <GuideRegistry guides={landingData.practicalGuides} />

        {/* 7. Category Chapter (Spotlight on Privacy Boundaries & 3-Tier Model) */}
        <CategoryChapter
          article={landingData.spotlightStory}
          storyCount={
            landingData.signalCategories.find(
              (c) => c.slug === landingData.spotlightStory.categorySlug
            )?.count
          }
        />

        {/* 8. Latest Journal Index (Dense Full-Width Typographic Registry) */}
        <LatestJournalIndex articles={landingData.indexStories} />

        {/* 9. Quiet Restrained VaahanSafe Product Connection */}
        <VaahanSafeConnection />
      </main>

      {/* 10. Full-Width Dark Editorial Footer */}
      <JournalFooter />
    </div>
  );
}
