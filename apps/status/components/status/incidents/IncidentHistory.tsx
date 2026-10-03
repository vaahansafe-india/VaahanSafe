import * as React from "react";
import Link from "next/link";
import type { PublicIncidentDto } from "@vaahansafe/status-core";

interface IncidentHistoryProps {
  incidents: PublicIncidentDto[];
  sourceAvailable?: boolean;
}

export function IncidentHistory({ incidents, sourceAvailable = true }: IncidentHistoryProps) {
  return (
    <section aria-labelledby="incident-history-heading" className="w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#d8d0c5] pb-4 dark:border-[#37342e]">
        <h2
          id="incident-history-heading"
          className="font-serif text-2xl text-[#252320] dark:text-[#f6f1e9]"
        >
          Published reports
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a8073] dark:text-[#aaa297]">
          Newest first
        </span>
      </div>

      <div>
        {!sourceAvailable ? (
          <div className="rounded-sm border border-[#d8d0c5] bg-[#fffefa] p-6 sm:p-9 dark:border-[#37342e] dark:bg-[#211f1b]">
            <p className="font-serif text-xl text-[#252320] sm:text-2xl dark:text-[#f6f1e9]">The incident archive is temporarily unavailable.</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#696157] dark:text-[#b2aba0]">We couldn’t load published reports right now. Please try again.</p>
            <a href="/history" className="mt-5 inline-flex min-h-11 items-center rounded-sm px-2 text-sm font-semibold text-[#3f7462] underline underline-offset-4 hover:text-[#a9583e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9583e] dark:text-[#9bd8aa]">Refresh archive</a>
          </div>
        ) : incidents.length === 0 ? (
          <div className="rounded-sm border border-[#d8d0c5] bg-[#fffefa] p-6 sm:p-9 dark:border-[#37342e] dark:bg-[#211f1b]">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a9583e]">Archive / no entries shown</span>
            <p className="mt-3 font-serif text-xl text-[#252320] sm:text-2xl dark:text-[#f6f1e9]">No published resolutions to display.</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#756e63] dark:text-[#b2aba0]">The archive contains published incident resolutions when available. Daily service check history is shown on the current status page.</p>
            <Link href="/" className="mt-5 inline-flex min-h-11 items-center font-mono text-[10px] uppercase tracking-[0.1em] text-[#3f7462] underline underline-offset-4 hover:text-[#a9583e] dark:text-[#9bd8aa]">View current service checks ↗</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-[#d8d0c5] bg-[#fffefa] divide-y divide-[#e8e2d7] dark:border-[#37342e] dark:bg-[#211f1b] dark:divide-[#37342e]">
            {incidents.map((inc) => (
              <article key={inc.publicId} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link
                    href={`/incidents/${inc.slug}`}
                    className="font-serif text-xl text-[#252320] transition-colors hover:text-[#a9583e] sm:text-2xl dark:text-[#f6f1e9]"
                  >
                    {inc.title}
                  </Link>
                  <span className="shrink-0 rounded-sm border border-[#bdd9c7] bg-[#edf5ee] px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#3f7462] dark:border-[#385242] dark:bg-[#25352a] dark:text-[#9bd8aa]">
                    {inc.state}
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#756e63] dark:text-[#b2aba0]">
                  {inc.summary}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#e8e2d7] pt-4 font-mono text-[10px] uppercase tracking-[0.07em] text-[#8a8073] dark:border-[#37342e] dark:text-[#aaa297]">
                  <span>{inc.startedAtFormatted}</span>
                  {inc.durationMinutes !== null && inc.durationMinutes !== undefined && (
                    <>
                      <span>&bull;</span>
                      <span>DURATION: {inc.durationMinutes} MIN</span>
                    </>
                  )}
                  {inc.affectedServiceSlugs.length > 0 && <><span>&bull;</span><span>AFFECTED: {inc.affectedServiceSlugs.join(", ")}</span></>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
