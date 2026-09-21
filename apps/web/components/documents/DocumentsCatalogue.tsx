import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { OFFICIAL_GUIDES } from "../../lib/documents/official-guides";
import { DocumentCoverArtifact } from "./DocumentCoverArtifact";
import { DocumentSearch } from "./DocumentSearch";

export function DocumentsCatalogue() {
  return (
    <section
      id="guide-index"
      aria-labelledby="catalogue-heading"
      className="
        border-b border-border
        bg-background
        py-16 sm:py-20 lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* Section Header with Search Bar */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span>OFFICIAL REFERENCE CATALOGUE</span>
            </div>

            <h2
              id="catalogue-heading"
              className="
                mt-3 font-serif text-3xl font-normal tracking-[-0.03em]
                text-foreground sm:text-4xl lg:text-5xl
                dark:text-zinc-50
              "
            >
              The seven product guides.
            </h2>
            <p className="mt-3 max-w-[620px] text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
              Structured editorial guides detailing how VaahanSafe vehicle identities are created, activated, positioned, protected, and managed.
            </p>
          </div>

          {/* Integrated Real Search */}
          <div className="shrink-0">
            <DocumentSearch />
          </div>
        </div>

        {/* Editorial Catalogue Rows */}
        <div className="mt-14 divide-y divide-border border-t border-b border-border dark:divide-[#27272a] dark:border-border">
          {OFFICIAL_GUIDES.map((guide) => (
            <article
              key={guide.id}
              aria-labelledby={`guide-${guide.id}-title`}
              className="
                group relative py-12 transition-colors
                hover:bg-muted/30 sm:py-14 lg:py-16
                dark:hover:bg-white/[0.015]
              "
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                {/* Left: Metadata, Title & Synopsis */}
                <div className="lg:col-span-7">
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground dark:text-zinc-500">
                    <span className="font-semibold text-[#cc785c]">{guide.number} / {guide.stepName}</span>
                    <span>•</span>
                    <span>{guide.docId}</span>
                  </div>

                  <h3
                    id={`guide-${guide.id}-title`}
                    className="
                      mt-3 font-serif text-2xl font-normal tracking-tight
                      text-foreground group-hover:text-[#cc785c] transition-colors
                      sm:text-3xl lg:text-4xl
                      dark:text-zinc-50 dark:group-hover:text-[#cc785c]
                    "
                  >
                    <Link
                      href={`/documents/${guide.slug}`}
                      className="focus-visible:outline-none focus-visible:underline"
                    >
                      {guide.title}
                    </Link>
                  </h3>

                  <p className="mt-3 max-w-[580px] text-sm leading-relaxed text-[#3f3f46] sm:text-base dark:text-zinc-400">
                    {guide.subtitle}
                  </p>

                  {/* "What it covers" Editorial List */}
                  <div className="mt-6 rounded-md bg-muted/60 p-4 dark:bg-zinc-900/40">
                    <div className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                      What it covers:
                    </div>
                    <ul className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-xs text-[#3f3f46] dark:text-zinc-200">
                      {guide.whatItCovers.slice(0, 6).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#cc785c] font-bold">↳</span>
                          <span className="line-clamp-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action CTA */}
                  <div className="mt-8 flex items-center gap-4">
                    <Link
                      href={`/documents/${guide.slug}`}
                      className="
                        inline-flex h-10 items-center justify-center gap-2
                        rounded-md bg-[#09090b] px-5
                        font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                        text-white transition-all
                        group-hover:bg-[#cc785c]
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
                        dark:bg-white dark:text-foreground dark:group-hover:bg-[#cc785c] dark:group-hover:text-white
                      "
                    >
                      <span>VIEW GUIDE</span>
                      <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
                    </Link>

                    <span className="font-mono text-[10px] text-muted-foreground">
                      Web Guide • Ref {guide.updatedAt}
                    </span>
                  </div>
                </div>

                {/* Right: Technical Document Artifact Cover */}
                <div className="hidden lg:col-span-5 lg:flex lg:justify-end">
                  <DocumentCoverArtifact
                    docId={guide.docId}
                    number={guide.number}
                    stepName={guide.stepName}
                    title={guide.title}
                    diagram={guide.diagram}
                    compact={true}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
