import * as React from "react";
import type { Metadata } from "next";
import { getPublishedArticles, getJournalCategories } from "@vaahansafe/content";
import { JournalHeader } from "../../components/journal/JournalHeader";
import { JournalFooter } from "../../components/journal/JournalFooter";
import { SearchClient } from "../../components/search/SearchClient";

export const metadata: Metadata = {
  title: "Search the Journal — VaahanSafe",
  description:
    "Search authoritative articles and safety guides on roadside assistance, vehicle identity, DPDP privacy, and decal placement.",
  alternates: {
    canonical: "https://blog.vaahansafe.com/search",
  },
};

export default function SearchPage() {
  const articles = getPublishedArticles();
  const categories = getJournalCategories();

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      <JournalHeader />

      <main id="main-content" className="flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10 space-y-10">
          <div className="space-y-3 max-w-2xl">
            <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
              EXPLORE KNOWLEDGE
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#141413] dark:text-[#faf9f5]">
              Search the Journal
            </h1>
            <p className="text-sm sm:text-base text-[#6c6a64] dark:text-[#a09d96] font-sans">
              Discover articles on highway first response, optical automotive glazing, and zero-exposure vehicle identity architecture.
            </p>
          </div>

          <React.Suspense
            fallback={
              <div className="py-12 font-mono text-xs text-[#8e8b82]">
                Loading search index...
              </div>
            }
          >
            <SearchClient
              initialArticles={articles}
              categories={categories}
            />
          </React.Suspense>
        </div>
      </main>

      <JournalFooter />
    </div>
  );
}
