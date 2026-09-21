import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedGuides } from "@vaahansafe/content";
import { JournalHeader } from "../../components/journal/JournalHeader";
import { JournalFooter } from "../../components/journal/JournalFooter";
import { VaahanIcon } from "@vaahansafe/icons";
import { getWebUrl } from "@vaahansafe/config";

export const metadata: Metadata = {
  title: "Practical Safety Guides — VaahanSafe Journal",
  description:
    "Step-by-step instructions on optical decal bonding, emergency contact relays, and vehicle identity setup under Indian automotive standards.",
  alternates: {
    canonical: "https://blog.vaahansafe.com/guides",
  },
};

export default function GuidesPage() {
  const guides = getPublishedGuides();
  const webUrl = getWebUrl();

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      <JournalHeader />

      <main id="main-content" className="flex-1 w-full py-10 sm:py-16">
        <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28 space-y-12">
          {/* Header */}
          <div className="space-y-4 max-w-3xl pb-8 border-b border-[#e6dfd8] dark:border-[#2e2b27]">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span>FIELD PROTOCOLS</span>
              <span>&bull;</span>
              <span>{guides.length} PUBLISHED GUIDES</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#141413] dark:text-[#faf9f5]">
              Practical Safety Guides
            </h1>

            <p className="text-base text-[#6c6a64] dark:text-[#a09d96] font-sans leading-relaxed">
              Step-by-step technical instructions for physical placement, emergency contact routing, and privacy configuration. Designed to be clear, actionable, and compliant with Central Motor Vehicle Rules (CMVR).
            </p>
          </div>

          {/* Guides Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {guides.map((guide, idx) => (
              <div
                key={guide.slug}
                className="
                  flex flex-col justify-between rounded-3xl border border-[#e6dfd8]
                  bg-[#f5f0e8]/40 p-7 sm:p-9 space-y-6 transition-all
                  hover:border-[#cc785c]/40 hover:bg-[#f5f0e8]/80 hover:shadow-sm
                  dark:border-[#2e2b27] dark:bg-[#1f1e1b]/40 dark:hover:bg-[#1f1e1b]/80
                "
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#8e8b82]">
                    <span className="rounded bg-[#cc785c]/10 text-[#cc785c] px-2.5 py-0.5 font-semibold">
                      PROTOCOL {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span>{guide.readingTime}</span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#141413] dark:text-[#faf9f5] leading-snug">
                    <Link href={`/articles/${guide.slug}`} className="hover:text-[#cc785c] transition-colors">
                      {guide.title}
                    </Link>
                  </h2>

                  <p className="text-sm text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                    {guide.deck || guide.excerpt}
                  </p>

                  {/* Step List */}
                  {guide.guideSteps && guide.guideSteps.length > 0 && (
                    <div className="pt-4 border-t border-[#e6dfd8] dark:border-[#2e2b27] space-y-2.5">
                      {guide.guideSteps.map((step) => (
                        <div key={step.number} className="flex items-start gap-3 text-xs">
                          <span className="font-mono text-[11px] font-bold text-[#cc785c] shrink-0">
                            {step.number}
                          </span>
                          <div>
                            <div className="font-medium text-[#141413] dark:text-[#faf9f5]">
                              {step.title}
                            </div>
                            <div className="text-[11px] text-[#8e8b82]">
                              {step.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#e6dfd8] dark:border-[#2e2b27] flex items-center justify-between">
                  <Link
                    href={`/articles/${guide.slug}`}
                    className="
                      inline-flex h-9 items-center justify-center gap-2
                      rounded-lg bg-[#cc785c] px-4
                      font-mono text-xs font-semibold uppercase tracking-wider
                      text-white transition-all hover:bg-[#a9583e]
                    "
                  >
                    <span>Open Guide</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>

                  {guide.officialDocumentRef && (
                    <a
                      href={`${webUrl}${guide.officialDocumentRef.href}`}
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]"
                    >
                      <span>Official Spec</span>
                      <VaahanIcon name="external-link" size={10} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* External Documents Bridge */}
          <div className="rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/30 p-6 sm:p-8 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82]">
                COMPREHENSIVE SPECIFICATIONS
              </div>
              <div className="font-serif text-lg text-[#141413] dark:text-[#faf9f5]">
                Looking for legal charters and technical terms?
              </div>
              <p className="text-xs text-[#6c6a64] dark:text-[#a09d96]">
                Consult our official documents library for terms of service, privacy disclosures, and safety disclaimers.
              </p>
            </div>

            <a
              href={`${webUrl}/documents`}
              className="
                inline-flex items-center gap-1.5 shrink-0
                font-mono text-xs font-semibold uppercase tracking-wider
                text-[#cc785c] hover:text-[#a9583e] transition-colors
              "
            >
              <span>VaahanSafe Documents &rarr;</span>
            </a>
          </div>
        </div>
      </main>

      <JournalFooter />
    </div>
  );
}
