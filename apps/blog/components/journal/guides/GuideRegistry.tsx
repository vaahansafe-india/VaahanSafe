import * as React from "react";
import Link from "next/link";
import type { BlogPost } from "@vaahansafe/content";

interface GuideRegistryProps {
  guides?: readonly BlogPost[];
}

export function GuideRegistry({ guides = [] }: GuideRegistryProps) {
  const guideRows = [
    {
      index: "01",
      category: "QR PLACEMENT",
      title: "Where should a VaahanSafe QR be placed?",
      slug:
        guides.find((g) => g.slug === "optical-contrast-automotive-glazing")?.slug ||
        "optical-contrast-automotive-glazing",
      summary:
        "Optimal windshield glass coordinates, ceramic frit avoidance, and CMVR Rule 100 sightline compliance.",
      readTime: "04 MIN",
    },
    {
      index: "02",
      category: "SAFETY CONTACTS",
      title: "Choosing the people connected to your safety identity.",
      slug:
        guides.find((g) => g.slug === "emergency-contact-relays")?.slug ||
        "emergency-contact-relays",
      summary:
        "Designating verified priority contacts, WhatsApp alerts, and sequential masked call relays.",
      readTime: "04 MIN",
    },
    {
      index: "03",
      category: "PRIVACY BOUNDARY",
      title: "Understanding the public safety projection.",
      slug:
        guides.find((g) => g.slug === "separating-contacts-from-address")?.slug ||
        "separating-contacts-from-address",
      summary:
        "The three-tier boundary model isolating private residential data from roadside camera scans.",
      readTime: "03 MIN",
    },
  ];

  return (
    <section
      aria-labelledby="guide-registry-heading"
      className="w-full border-b border-[#e6dfd8] py-16 sm:py-24 lg:py-28 dark:border-[#2e2b27]"
    >
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28">
        {/* Header Block */}
        <div className="mb-12 max-w-3xl space-y-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] dark:text-[#77736d]">
            PRACTICAL / GUIDE LEDGER
          </div>

          <h2
            id="guide-registry-heading"
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.05] tracking-[-0.03em] text-[#141413] dark:text-[#faf9f5]"
          >
            Useful things should <br className="hidden sm:inline" />
            be easy to understand.
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#6c6a64] dark:text-[#a09d96]">
            Clear, authoritative protocols for optical placement, emergency contact designation, and data minimization.
          </p>
        </div>

        {/* Full-Width Typographic Registry Rows */}
        <div className="divide-y divide-[#e6dfd8] border-t border-b border-[#e6dfd8] dark:divide-[#2e2b27] dark:border-[#2e2b27]">
          {guideRows.map((row) => (
            <Link
              key={row.index}
              href={`/articles/${row.slug}`}
              className="
                group flex flex-col md:flex-row md:items-center justify-between
                gap-4 md:gap-10 py-7 sm:py-8
                transition-colors duration-200 hover:bg-[#f5f0e8]/50 dark:hover:bg-[#1f1e1b]/50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              {/* Left: Index + Category + Title */}
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-8 lg:gap-12 flex-1 min-w-0">
                <div className="flex items-center gap-4 shrink-0 font-mono text-xs text-[#8e8b82] dark:text-[#77736d]">
                  <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">
                    {row.index}
                  </span>
                  <span className="text-[#cc785c] font-medium tracking-wider">
                    {row.category}
                  </span>
                </div>

                <div className="space-y-1 flex-1">
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#141413] transition-colors group-hover:text-[#cc785c] dark:text-[#faf9f5] dark:group-hover:text-[#cc785c]">
                    {row.title}
                  </h3>
                  <p className="font-sans text-xs text-[#6c6a64] dark:text-[#a09d96] max-w-2xl line-clamp-2">
                    {row.summary}
                  </p>
                </div>
              </div>

              {/* Right: Read Action + Duration */}
              <div className="shrink-0 flex items-center gap-4 pt-2 md:pt-0 font-mono text-xs uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
                <span className="hidden sm:inline">{row.readTime}</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-[#141413] group-hover:text-[#cc785c] transition-colors dark:text-[#faf9f5] dark:group-hover:text-[#cc785c]">
                  <span>READ GUIDE</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                    ↗
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
