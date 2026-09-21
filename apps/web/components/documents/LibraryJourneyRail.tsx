import * as React from "react";
import Link from "next/link";
import { OFFICIAL_GUIDES } from "../../lib/documents/official-guides";

interface LibraryJourneyRailProps {
  activeSlug?: string;
}

export function LibraryJourneyRail({ activeSlug }: LibraryJourneyRailProps) {
  return (
    <nav
      aria-label="Document library journey"
      className="
        border-b border-border
        bg-muted/60
        py-4 sm:py-5
        dark:border-border
        dark:bg-zinc-950/90
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <div className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground xl:flex dark:text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span>LEARNING PATH</span>
          </div>

          {/* Rail Items: Horizontal Scroll on Mobile/Tablet, Seamless Rail on Desktop */}
          <ol className="no-scrollbar flex w-full items-center justify-between gap-2 overflow-x-auto py-1 sm:gap-3 lg:gap-4 xl:w-auto">
            {OFFICIAL_GUIDES.map((guide, idx) => {
              const isActive = activeSlug === guide.slug;
              const isLast = idx === OFFICIAL_GUIDES.length - 1;

              return (
                <li key={guide.id} className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
                  <Link
                    href={`/documents/${guide.slug}`}
                    className={`
                      group flex items-center gap-1.5 rounded px-2 py-1 transition-all
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
                      ${
                        isActive
                          ? "bg-white text-[#cc785c] shadow-xs font-semibold dark:bg-zinc-900"
                          : "text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-50"
                      }
                    `}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="font-mono text-[9px] text-muted-foreground group-hover:text-[#cc785c]">
                      {guide.number}
                    </span>
                    <span className="font-mono text-[10px] tracking-wider uppercase">
                      {guide.stepName}
                    </span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" aria-hidden="true" />
                    )}
                  </Link>

                  {!isLast && (
                    <span
                      className="font-mono text-[10px] text-muted-foreground/50 select-none dark:text-white/20"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </nav>
  );
}
