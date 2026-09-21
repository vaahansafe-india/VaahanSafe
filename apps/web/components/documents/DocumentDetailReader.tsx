"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  OfficialGuide,
  calculateReadingTimeMinutes,
  getGuideBySlug,
} from "../../lib/documents/official-guides";
import { DocumentCoverArtifact } from "./DocumentCoverArtifact";
import { LibraryJourneyRail } from "./LibraryJourneyRail";

interface DocumentDetailReaderProps {
  guide: OfficialGuide;
}

export function DocumentDetailReader({ guide }: DocumentDetailReaderProps) {
  const [activeSectionId, setActiveSectionId] = React.useState<string>(
    guide.sections[0]?.id || ""
  );
  const [mobileTocOpen, setMobileTocOpen] = React.useState(false);

  const readingTime = calculateReadingTimeMinutes(guide);
  const previousGuide = guide.previousSlug ? getGuideBySlug(guide.previousSlug) : undefined;
  const nextGuide = guide.nextSlug ? getGuideBySlug(guide.nextSlug) : undefined;

  // Active section tracking via IntersectionObserver
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0.1 }
    );

    guide.sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [guide]);

  return (
    <div className="bg-background text-foreground dark:bg-zinc-950 dark:text-zinc-50">
      {/* Top Architectural Journey Rail */}
      <LibraryJourneyRail activeSlug={guide.slug} />

      {/* Guide Header Banner */}
      <header className="border-b border-border bg-muted/40 py-12 sm:py-16 dark:border-border dark:bg-zinc-900/40">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
            <Link href="/documents" className="hover:text-[#cc785c] transition-colors">
              Documents
            </Link>
            <span>/</span>
            <span className="text-[#cc785c]">{guide.stepName}</span>
            <span>/</span>
            <span className="truncate">{guide.docId}</span>
          </nav>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-[#cc785c]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
                <span>{guide.docId}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground dark:text-zinc-400">GUIDE {guide.number} OF 07</span>
              </div>

              <h1 className="mt-4 font-serif text-3xl font-normal leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                {guide.title}
              </h1>

              <p className="mt-4 text-base leading-relaxed text-[#3f3f46] sm:text-lg sm:leading-8 dark:text-zinc-400">
                {guide.subtitle}
              </p>

              {/* Specification Purpose Callout */}
              <div className="mt-6 rounded-lg border border-border bg-white p-4 text-xs leading-relaxed text-muted-foreground dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[#cc785c]">
                  DOCUMENT PURPOSE:{" "}
                </span>
                {guide.purpose}
              </div>

              {/* Metadata Pill Bar */}
              <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-[10px] text-muted-foreground dark:text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
                  <span>PUBLISHED: {guide.updatedAt}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">EST.</span>
                  <span>READING TIME: ~{readingTime} MIN</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 text-[#5db8a6]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
                  <span>OFFICIAL REFERENCE SPECIFICATION</span>
                </div>
              </div>
            </div>

            {/* Document Cover Thumbnail */}
            <div className="hidden lg:col-span-4 lg:flex lg:justify-end">
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
        </div>
      </header>

      {/* Main Content Area: Sticky TOC + Readable Prose */}
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Desktop Sticky Table of Contents (3 cols) */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <nav aria-label="Table of contents" className="rounded-lg border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-border pb-3 dark:border-white/[0.08]">
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                    DOCUMENT SECTIONS
                  </span>
                  <span className="font-mono text-[9px] text-[#cc785c]">
                    {guide.sections.length} PARTS
                  </span>
                </div>

                <ul className="mt-4 space-y-2 text-xs">
                  {guide.sections.map((section) => {
                    const isSelected = activeSectionId === section.id;
                    return (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className={`
                            block rounded px-2.5 py-1.5 transition-colors
                            ${
                              isSelected
                                ? "bg-muted font-medium text-[#cc785c] dark:bg-white/[0.06]"
                                : "text-muted-foreground hover:bg-background hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-50"
                            }
                          `}
                        >
                          {section.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Help Center Bridge */}
              <div className="rounded-lg border border-border bg-muted/50 p-5 dark:border-white/[0.08] dark:bg-zinc-900/50">
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
                  <span>NEED TO RESOLVE A PROBLEM?</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground dark:text-zinc-400">
                  Documents help you understand how the system works. If you need immediate troubleshooting or account changes, visit the Help Center.
                </p>
                <Link
                  href="/help"
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#cc785c] hover:underline"
                >
                  <span>Open Help Center</span>
                  <VaahanIcon name="arrow-right" size={11} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Mobile TOC Collapsible Drawer */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              className="
                flex w-full items-center justify-between rounded-lg
                border border-border bg-white p-4
                font-mono text-xs uppercase tracking-wider text-foreground
                dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-50
              "
              aria-expanded={mobileTocOpen}
            >
              <span>Table of Contents ({guide.sections.length} Sections)</span>
              <span>{mobileTocOpen ? "▲" : "▼"}</span>
            </button>

            {mobileTocOpen && (
              <nav aria-label="Mobile table of contents" className="mt-2 rounded-lg border border-border bg-white p-4 dark:border-white/[0.08] dark:bg-zinc-900">
                <ul className="space-y-2 text-xs">
                  {guide.sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        onClick={() => setMobileTocOpen(false)}
                        className="block rounded py-1.5 text-muted-foreground hover:text-[#cc785c] dark:text-zinc-400"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          {/* Main Article Content (8 cols, max-w-[720px]) */}
          <article className="lg:col-span-8 max-w-[720px]">
            {/* Signature Flow Diagram */}
            <div className="mb-12 rounded-lg border border-border bg-white p-6 dark:border-white/[0.08] dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-[#f0eae1] pb-3 font-mono text-[9px] uppercase tracking-wider text-muted-foreground dark:border-white/[0.06]">
                <span className="text-[#cc785c]">SIGNATURE ARCHITECTURE FLOW</span>
                <span>{guide.docId}</span>
              </div>
              <div className="mt-4 flex flex-col items-center justify-center space-y-1.5 font-mono text-xs text-[#252523] dark:text-zinc-100">
                {guide.diagram.map((line, idx) => (
                  <div
                    key={idx}
                    className={`text-center ${
                      line.includes("↓")
                        ? "text-[#cc785c] font-bold"
                        : "rounded bg-muted px-3 py-1 font-medium tracking-wide dark:bg-zinc-900"
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-14">
              {guide.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 space-y-4 border-b border-[#f0eae1] pb-10 dark:border-white/[0.06]"
                >
                  <h2 className="font-serif text-2xl font-normal tracking-tight text-foreground sm:text-3xl dark:text-zinc-50">
                    {section.title}
                  </h2>

                  <div className="space-y-3.5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-200">
                    {section.content.map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Distinction or Warning Callout Box */}
                  {section.callout && (
                    <div
                      className={`
                        mt-6 rounded-lg p-5 border
                        ${
                          section.callout.type === "distinction"
                            ? "border-[#cc785c]/30 bg-muted dark:border-[#cc785c]/40 dark:bg-zinc-900"
                            : section.callout.type === "warning"
                            ? "border-[#e8a55a]/40 bg-[#faf5ed] dark:border-[#e8a55a]/30 dark:bg-[#252119]"
                            : "border-[#5db8a6]/40 bg-[#f0f8f6] dark:border-[#5db8a6]/30 dark:bg-[#162220]"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between font-mono text-[9px] font-semibold uppercase tracking-wider">
                        <span className="text-[#cc785c]">{section.callout.title}</span>
                        {section.callout.left && section.callout.right && (
                          <span className="text-muted-foreground dark:text-zinc-400">
                            {section.callout.left} <strong className="text-[#cc785c]">≠</strong> {section.callout.right}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-xs leading-relaxed sm:text-sm text-[#252523] dark:text-zinc-50 whitespace-pre-line font-medium">
                        {section.callout.text}
                      </p>
                    </div>
                  )}

                  {/* Subsections if any */}
                  {section.subsections && section.subsections.length > 0 && (
                    <div className="mt-6 space-y-6 pt-2">
                      {section.subsections.map((sub, sIdx) => (
                        <div key={sIdx} className="space-y-2 rounded-md bg-background p-4 border border-border dark:bg-zinc-950 dark:border-white/[0.06]">
                          <h3 className="font-serif text-lg font-medium text-foreground dark:text-zinc-50">
                            {sub.title}
                          </h3>
                          <div className="space-y-2 text-xs leading-relaxed text-[#3f3f46] sm:text-sm dark:text-zinc-400">
                            {sub.content.map((sp, spIdx) => (
                              <p key={spIdx}>{sp}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Related Specifications & Cross-Links */}
            <div className="mt-14 rounded-lg border border-border bg-muted/50 p-6 dark:border-white/[0.08] dark:bg-zinc-900">
              <div className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                RELATED SPECIFICATIONS &amp; STATUTORY POLICIES
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {guide.crossLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.href}
                    className="
                      inline-flex items-center gap-1.5 rounded-md border border-border
                      bg-white px-3.5 py-2 font-mono text-[10px] font-medium text-foreground
                      transition-colors hover:border-[#cc785c] hover:text-[#cc785c]
                      dark:border-white/[0.1] dark:bg-zinc-900 dark:text-zinc-50
                    "
                  >
                    <span>{link.title}</span>
                    <VaahanIcon name="arrow-right" size={10} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Sequential Guided Learning Footer: PREVIOUS ← CURRENT ● NEXT → */}
            <nav
              aria-label="Sequential document navigation"
              className="mt-14 border-t border-border pt-8 dark:border-border"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {previousGuide ? (
                  <Link
                    href={`/documents/${previousGuide.slug}`}
                    className="
                      group flex items-center gap-3 rounded-lg border border-border
                      bg-white p-4 transition-all hover:border-[#cc785c] sm:max-w-[280px]
                      dark:border-white/[0.08] dark:bg-zinc-900
                    "
                  >
                    <span className="font-mono text-base text-muted-foreground group-hover:text-[#cc785c]">
                      ←
                    </span>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        PREVIOUS ({previousGuide.number})
                      </div>
                      <div className="font-serif text-sm font-medium text-foreground group-hover:text-[#cc785c] dark:text-zinc-50">
                        {previousGuide.title}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}

                <div className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>GUIDE {guide.number}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
                  <span>OF 07</span>
                </div>

                {nextGuide ? (
                  <Link
                    href={`/documents/${nextGuide.slug}`}
                    className="
                      group flex items-center justify-between gap-3 rounded-lg border border-border
                      bg-white p-4 transition-all hover:border-[#cc785c] sm:max-w-[280px]
                      dark:border-white/[0.08] dark:bg-zinc-900
                    "
                  >
                    <div className="text-right">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        NEXT ({nextGuide.number})
                      </div>
                      <div className="font-serif text-sm font-medium text-foreground group-hover:text-[#cc785c] dark:text-zinc-50">
                        {nextGuide.title}
                      </div>
                    </div>
                    <span className="font-mono text-base text-muted-foreground group-hover:text-[#cc785c]">
                      →
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/documents"
                    className="
                      group flex items-center justify-between gap-3 rounded-lg border border-border
                      bg-white p-4 transition-all hover:border-[#cc785c] sm:max-w-[280px]
                      dark:border-white/[0.08] dark:bg-zinc-900
                    "
                  >
                    <div className="text-right">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        COMPLETE
                      </div>
                      <div className="font-serif text-sm font-medium text-foreground group-hover:text-[#cc785c] dark:text-zinc-50">
                        Back to Library Index
                      </div>
                    </div>
                    <span className="font-mono text-base text-muted-foreground group-hover:text-[#cc785c]">
                      ↺
                    </span>
                  </Link>
                )}
              </div>
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
