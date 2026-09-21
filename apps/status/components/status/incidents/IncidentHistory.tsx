import * as React from "react";
import Link from "next/link";
import type { PublicIncidentDto } from "@vaahansafe/status-core";

interface IncidentHistoryProps {
  incidents: PublicIncidentDto[];
}

export function IncidentHistory({ incidents }: IncidentHistoryProps) {
  const currentMonth = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <section aria-labelledby="incident-history-heading" className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6dfd8] pb-4 dark:border-[#2e2b27]">
        <h2
          id="incident-history-heading"
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8e8b82] dark:text-[#77736d] font-semibold"
        >
          INCIDENTS / RECORDED HISTORY
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
          PAST 90 DAYS
        </span>
      </div>

      <div className="space-y-4">
        <div suppressHydrationWarning className="font-mono text-[11px] uppercase tracking-wider text-[#141413] dark:text-[#faf9f5] font-semibold">
          {currentMonth.toUpperCase()}
        </div>

        {incidents.length === 0 ? (
          <div className="rounded-xl border border-[#e6dfd8] bg-[#f5f0e8]/30 p-6 font-sans text-xs text-[#6c6a64] dark:border-[#2e2b27] dark:bg-[#1f1e1b]/30 dark:text-[#a09d96]">
            No incidents recorded for this period. All public systems operated within nominal limits.
          </div>
        ) : (
          <div className="divide-y divide-[#e6dfd8] dark:divide-[#2e2b27]">
            {incidents.map((inc) => (
              <article key={inc.publicId} className="py-4 space-y-1.5 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    href={`/incidents/${inc.slug}`}
                    className="font-serif text-base sm:text-lg text-[#141413] hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c] transition-colors"
                  >
                    {inc.title}
                  </Link>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#5db872] font-semibold shrink-0">
                    {inc.state}
                  </span>
                </div>
                <p className="font-sans text-xs text-[#6c6a64] dark:text-[#a09d96] line-clamp-2">
                  {inc.summary}
                </p>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
                  <span>{inc.startedAtFormatted}</span>
                  {inc.durationMinutes && (
                    <>
                      <span>&bull;</span>
                      <span>DURATION: {inc.durationMinutes} MIN</span>
                    </>
                  )}
                  <span>&bull;</span>
                  <span>AFFECTED: {inc.affectedServiceSlugs.join(", ")}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
