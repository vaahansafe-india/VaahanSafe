import type { Metadata } from "next";
import { getWebUrl } from "@vaahansafe/config";
import { getLiveGuides } from "../../lib/journal";
import { JournalHeader } from "../../components/journal/JournalHeader";
import { JournalFooter } from "../../components/journal/JournalFooter";
import { StoryCard } from "../../components/journal/StoryCard";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Practical Safety Guides — VaahanSafe Journal",
  description:
    "Clear, practical guides to vehicle identity, QR placement, and emergency contact setup.",
  alternates: { canonical: "https://blog.vaahansafe.com/guides" },
};
export default async function GuidesPage() {
  const guides = await getLiveGuides();
  return (
    <div className="flex min-h-screen flex-col">
      <JournalHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="journal-container flex-1 py-12 sm:py-16"
      >
        <header className="mb-10 max-w-3xl">
          <p className="journal-label">
            The practical collection · {guides.length} guides
          </p>
          <h1 className="journal-title mt-4">
            A clearer way
            <br />
            <em>to get started.</em>
          </h1>
          <p className="journal-muted mt-5 max-w-xl text-base leading-8">
            From placing your QR to setting up emergency contacts, take it one
            step at a time with these practical guides.
          </p>
        </header>
        {guides.length ? (
          <div className="journal-grid">
            {guides.map((guide) => (
              <StoryCard key={guide.slug} article={guide} headingLevel={2} />
            ))}
          </div>
        ) : (
          <p className="journal-muted py-12">
            Guides are being prepared. Please check back soon.
          </p>
        )}
        <aside className="journal-section mt-12 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="journal-label">Looking for the details?</p>
            <h2 className="journal-section-title mt-3">
              Read the official documents.
            </h2>
            <p className="journal-muted mt-3 text-sm leading-7">
              Terms, privacy information, and product safety disclosures in one
              place.
            </p>
          </div>
          <a href={`${getWebUrl()}/documents`} className="journal-button">
            Documents library <span aria-hidden="true">↗</span>
          </a>
        </aside>
      </main>
      <JournalFooter />
    </div>
  );
}
