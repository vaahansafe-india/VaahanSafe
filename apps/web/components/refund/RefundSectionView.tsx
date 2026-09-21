import * as React from "react";
import { RefundSection } from "../../app/refund-policy/refund-policy-content";

interface RefundSectionViewProps {
  section: RefundSection;
}

export function RefundSectionView({ section }: RefundSectionViewProps) {
  return (
    <article
      id={section.id}
      aria-labelledby={`${section.id}-heading`}
      className="scroll-mt-28 border-b border-border py-14 first:pt-0 last:border-b-0 sm:py-16 dark:border-white/[0.08]"
    >
      {/* Section Index & Rail */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-[#cc785c]">
          {section.index} / {section.shortTitle}
        </span>
        <span className="h-px w-8 bg-[#cc785c]/40" />
      </div>

      {/* Main Section Heading */}
      <h2
        id={`${section.id}-heading`}
        className="mt-4 font-serif text-2xl font-normal tracking-[-0.03em] text-foreground sm:text-3xl lg:text-[2.25rem] dark:text-zinc-50"
      >
        {section.heading}
      </h2>

      {/* Summary Lead */}
      {section.summary && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7 dark:text-zinc-400">
          {section.summary}
        </p>
      )}

      {/* Subsections */}
      <div className="mt-8 space-y-8">
        {section.subsections.map((sub) => (
          <div key={sub.id} className="border-t border-border/70 pt-6 dark:border-white/[0.06]">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#252523] dark:text-zinc-100">
              {sub.title}
            </h3>

            <div className="mt-3 space-y-3 text-xs leading-[1.8] text-[#3f3f46] sm:text-[14px] sm:leading-[1.85] dark:text-zinc-400">
              {sub.paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {sub.bulletPoints && sub.bulletPoints.length > 0 && (
              <ul className="mt-4 space-y-2 border-l border-[#cc785c]/30 pl-4 text-xs leading-relaxed text-[#3f3f46] sm:text-[13px] dark:text-zinc-200">
                {sub.bulletPoints.map((point, idx) => (
                  <li key={idx} className="relative">
                    <span className="font-normal">{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {sub.legalReviewNote && (
              <div className="mt-4 inline-flex items-center gap-2 rounded bg-muted px-3 py-1.5 font-mono text-[8px] tracking-[0.08em] text-muted-foreground dark:bg-white/[0.04] dark:text-zinc-500">
                <span className="h-1 w-1 rounded-full bg-[#e8a55a]" />
                <span>{sub.legalReviewNote}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
