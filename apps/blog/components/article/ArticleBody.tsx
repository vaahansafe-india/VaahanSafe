import * as React from "react";
import {
  ArticleSection,
  StatutoryCitation,
  ArticleFaq,
} from "@vaahansafe/content";
import { ArticleCallout } from "./ArticleCallout";
import { VaahanIcon } from "@vaahansafe/icons";

interface ArticleBodyProps {
  sections: readonly ArticleSection[];
  intro: string;
  references?: readonly StatutoryCitation[];
  tags: readonly string[];
  keyTakeaways?: readonly string[];
  checklist?: {
    title: string;
    items: readonly string[];
  };
  faq?: readonly ArticleFaq[];
}

export function ArticleBody({
  sections,
  intro,
  references,
  tags,
  keyTakeaways,
  checklist,
  faq,
}: ArticleBodyProps) {
  return (
    <div className="space-y-10 font-sans">
      {/* 1. Lead Intro Blockquote */}
      <blockquote className="relative rounded-2xl border-l-4 border-[#cc785c] bg-[#f5f0e8]/60 p-6 sm:p-8 text-lg sm:text-xl font-serif italic text-[#141413] dark:bg-[#1f1e1b]/60 dark:text-[#faf9f5] leading-relaxed shadow-xs">
        <span className="text-[#cc785c] text-3xl sm:text-4xl font-serif leading-none mr-1">“</span>
        {intro}
        <span className="text-[#cc785c] text-3xl sm:text-4xl font-serif leading-none ml-1">”</span>
      </blockquote>

      {/* 2. Key Takeaways & Actionable Protocol Box */}
      {keyTakeaways && keyTakeaways.length > 0 && (
        <aside
          aria-label="Key Takeaways"
          className="rounded-2xl border border-[#cc785c]/30 bg-[#cc785c]/5 p-6 sm:p-7 space-y-4 dark:border-[#cc785c]/25 dark:bg-[#cc785c]/10"
        >
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] font-bold text-[#cc785c]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c] text-white text-[10px]">
              ✓
            </span>
            <span>EXECUTIVE SUMMARY &bull; KEY ACTIONABLE TAKEAWAYS</span>
          </div>
          <ul className="space-y-2.5 text-sm sm:text-[15px] leading-relaxed text-[#252523] dark:text-[#e6e4df]">
            {keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="font-mono text-xs font-semibold text-[#cc785c] mt-0.5 shrink-0">
                  [{String(idx + 1).padStart(2, "0")}]
                </span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* 3. Deep Article Sections */}
      <div className="space-y-12 text-[17px] sm:text-[18px] leading-[1.8] text-[#252523] dark:text-[#e6e4df]">
        {sections.map((section, idx) => {
          const sectionId = section.id || `section-${idx + 1}`;

          return (
            <section
              key={idx}
              id={sectionId}
              className="space-y-5 scroll-mt-28"
            >
              {section.heading && (
                <div className="pt-6 pb-2 border-b border-[#e6dfd8] dark:border-[#2e2b27]">
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#141413] dark:text-[#faf9f5]">
                    {section.heading}
                  </h2>
                </div>
              )}

              {/* Paragraphs */}
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-[#3d3d3a] dark:text-[#a09d96]">
                  {p}
                </p>
              ))}

              {/* Actionable Bullets */}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="space-y-2.5 my-5 pl-2 text-base leading-relaxed text-[#3d3d3a] dark:text-[#a09d96]">
                  {section.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c] mt-2.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Numbered Step Breakdown */}
              {section.steps && section.steps.length > 0 && (
                <div className="my-7 space-y-4">
                  {section.steps.map((st, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex flex-col sm:flex-row sm:items-start gap-4 rounded-xl border border-[#e6dfd8] bg-[#f5f0e8]/40 p-4 sm:p-5 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/40"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#cc785c]/15 font-mono text-sm font-bold text-[#cc785c]">
                        {st.number}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-sans font-semibold text-base text-[#141413] dark:text-[#faf9f5]">
                            {st.title}
                          </h4>
                          {st.badge && (
                            <span className="rounded bg-[#cc785c]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                              {st.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                          {st.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subsections */}
              {section.subsections && section.subsections.length > 0 && (
                <div className="my-6 space-y-6">
                  {section.subsections.map((sub, subIdx) => (
                    <div
                      key={subIdx}
                      className="rounded-xl border border-[#e6dfd8]/70 bg-[#faf9f5]/50 p-5 dark:border-[#2e2b27] dark:bg-[#181715]/50 space-y-3"
                    >
                      <h3 className="font-serif text-xl font-medium text-[#141413] dark:text-[#faf9f5]">
                        {sub.title}
                      </h3>
                      {sub.paragraphs.map((subP, subPIdx) => (
                        <p key={subPIdx} className="text-sm sm:text-base text-[#3d3d3a] dark:text-[#a09d96]">
                          {subP}
                        </p>
                      ))}
                      {sub.bullets && sub.bullets.length > 0 && (
                        <ul className="space-y-1.5 pl-2 text-sm text-[#6c6a64] dark:text-[#a09d96]">
                          {sub.bullets.map((sb, sbIdx) => (
                            <li key={sbIdx} className="flex items-start gap-2.5">
                              <span className="text-[#cc785c] font-bold">&bull;</span>
                              <span>{sb}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Structured Comparison or Protocol Table */}
              {section.table && (
                <div className="my-7 overflow-x-auto rounded-xl border border-[#e6dfd8] dark:border-[#2e2b27]">
                  {section.table.caption && (
                    <div className="border-b border-[#e6dfd8] bg-[#f5f0e8]/80 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-[#6c6a64] dark:border-[#2e2b27] dark:bg-[#1f1e1b] dark:text-[#a09d96]">
                      {section.table.caption}
                    </div>
                  )}
                  <table className="w-full text-left font-sans text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#e6dfd8] bg-[#f5f0e8]/50 font-medium text-[#141413] dark:border-[#2e2b27] dark:bg-[#1f1e1b]/50 dark:text-[#faf9f5]">
                        {section.table.headers.map((h, hIdx) => (
                          <th key={hIdx} className="px-4 py-3 font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6dfd8]/60 dark:divide-[#2e2b27]/60">
                      {section.table.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="hover:bg-[#f5f0e8]/30 dark:hover:bg-[#1f1e1b]/30 transition-colors"
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`px-4 py-3 text-[#3d3d3a] dark:text-[#c4c0b8] ${
                                cIdx === 0 ? "font-medium text-[#141413] dark:text-[#faf9f5]" : ""
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Callouts */}
              {section.callout && <ArticleCallout callout={section.callout} />}

              {/* Quotes */}
              {section.quote && (
                <blockquote className="my-6 pl-5 border-l-2 border-[#cc785c] font-serif text-xl italic text-[#141413] dark:text-[#faf9f5]">
                  <p>“{section.quote.text}”</p>
                  {section.quote.attribution && (
                    <cite className="block font-mono text-xs text-[#8e8b82] not-italic mt-2">
                      &mdash; {section.quote.attribution}
                    </cite>
                  )}
                </blockquote>
              )}
            </section>
          );
        })}
      </div>

      {/* 4. Practical Checklist Card (if provided) */}
      {checklist && (
        <section
          aria-label={checklist.title}
          className="rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/50 p-6 sm:p-7 space-y-4 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/50 my-10"
        >
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] font-bold text-[#cc785c]">
            <VaahanIcon name="shield" size={15} />
            <span>{checklist.title.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs sm:text-[13px] leading-relaxed">
            {checklist.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg border border-[#e6dfd8]/60 bg-[#faf9f5]/80 p-3 dark:border-[#2e2b27] dark:bg-[#181715]/80"
              >
                <span className="text-[#5db8a6] font-bold mt-0.5">✓</span>
                <span className="text-[#3d3d3a] dark:text-[#c4c0b8]">{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Edge-Case FAQs (if provided) */}
      {faq && faq.length > 0 && (
        <section
          aria-label="Frequently Asked Questions"
          className="rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/30 p-6 sm:p-7 space-y-5 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/30 my-10"
        >
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] font-bold text-[#8e8b82] dark:text-[#77736d]">
            <VaahanIcon name="info" size={14} />
            <span>OPERATIONAL EDGE CASES &bull; FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <div className="space-y-3.5 divide-y divide-[#e6dfd8]/60 dark:divide-[#2e2b27]/60">
            {faq.map((item, idx) => (
              <div key={idx} className={idx > 0 ? "pt-3.5 space-y-1.5" : "space-y-1.5"}>
                <h4 className="font-serif text-base sm:text-lg font-medium text-[#141413] dark:text-[#faf9f5]">
                  {item.question}
                </h4>
                <p className="text-xs sm:text-sm text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Statutory References & Legal Citations */}
      {references && references.length > 0 && (
        <section
          aria-label="Statutory References"
          className="rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/50 p-6 sm:p-7 space-y-4 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/50 my-10"
        >
          <div className="flex items-center justify-between border-b border-[#e6dfd8]/60 pb-3 dark:border-[#2e2b27]/60">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c] font-semibold">
              <VaahanIcon name="document" size={14} />
              <span>STATUTORY REFERENCES &bull; VERIFIED LEGAL SOURCES ({references.length})</span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
              GOVT &amp; STANDARDS ARCHIVE
            </span>
          </div>
          <ul className="space-y-3 text-xs text-[#6c6a64] dark:text-[#a09d96] divide-y divide-[#e6dfd8]/60 dark:divide-[#2e2b27]/60">
            {references.map((ref, idx) => (
              <li
                key={idx}
                className="pt-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5"
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-sm text-[#252523] dark:text-[#faf9f5]">
                    {ref.citation}
                  </span>
                  {ref.relevance && (
                    <p className="text-[11px] text-[#8e8b82] dark:text-[#77736d]">
                      {ref.relevance}
                    </p>
                  )}
                </div>
                <span className="font-mono text-[10px] text-[#cc785c] shrink-0 font-medium">
                  Source: {ref.source}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 7. Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-[#e6dfd8] bg-[#f5f0e8]/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#6c6a64] dark:border-[#2e2b27] dark:bg-[#1f1e1b] dark:text-[#a09d96]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
