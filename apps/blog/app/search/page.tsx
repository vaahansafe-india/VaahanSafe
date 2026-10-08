import * as React from "react";
import type { Metadata } from "next";
import { JournalHeader } from "../../components/journal/JournalHeader";
import { JournalFooter } from "../../components/journal/JournalFooter";
import { SearchClient } from "../../components/search/SearchClient";
import { getLivePublishedArticles, getLiveCategories } from "../../lib/journal";

export const revalidate = 60; // Refresh search index every 60s
export const metadata: Metadata = {
  title: "Search the Journal — VaahanSafe",
  description:
    "Search authoritative articles and safety guides on roadside assistance, vehicle identity, DPDP privacy, and decal placement.",
  alternates: {
    canonical: "https://blog.vaahansafe.com/search",
  },
};

export default async function SearchPage() {
  const [articles, categories] = await Promise.all([
    getLivePublishedArticles(),
    getLiveCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <JournalHeader />

      <main id="main-content" tabIndex={-1} className="flex-1 py-10 sm:py-16">
        <div className="journal-container space-y-10">
          <div className="space-y-3 max-w-2xl">
            <div className="journal-label">Find your next read</div>
            <h1 className="journal-title">Search the Journal</h1>
            <p className="journal-muted text-base leading-8">
              A question about your vehicle, identity, or privacy? Start with a
              topic or a few words.
            </p>
          </div>

          <React.Suspense
            fallback={
              <div className="py-12 font-mono text-xs text-[#8e8b82]">
                Loading search index...
              </div>
            }
          >
            <SearchClient initialArticles={articles} categories={categories} />
          </React.Suspense>
        </div>
      </main>

      <JournalFooter />
    </div>
  );
}
