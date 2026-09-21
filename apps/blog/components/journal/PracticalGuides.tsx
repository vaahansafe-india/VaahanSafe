import * as React from "react";
import Link from "next/link";
import type { BlogPost } from "@vaahansafe/content";

interface PracticalGuidesProps {
  guides?: readonly BlogPost[];
}

export function PracticalGuides({ guides = [] }: PracticalGuidesProps) {
  // Curated list of 3 practical guides adhering to section 15
  const guideList = [
    {
      number: "01",
      category: "QR PLACEMENT",
      title: "Where should a vehicle safety QR be placed?",
      slug: guides.find((g) => g.slug === "optical-contrast-automotive-glazing")?.slug || "optical-contrast-automotive-glazing",
      description:
        "Optimal glass coordinates, ceramic frit avoidance, and CMVR Rule 100 sightline compliance.",
    },
    {
      number: "02",
      category: "SAFETY CONTACTS",
      title: "Choosing useful emergency contacts.",
      slug: guides.find((g) => g.slug === "emergency-contact-relays")?.slug || "emergency-contact-relays",
      description:
        "Designating verified priority contacts, WhatsApp alerts, and sequential masked call relays.",
    },
    {
      number: "03",
      category: "PRIVACY",
      title: "Understanding your public safety view.",
      slug: guides.find((g) => g.slug === "separating-contacts-from-address")?.slug || "separating-contacts-from-address",
      description:
        "The three-tier boundary model isolating private residential data from roadside camera scans.",
    },
  ];

  return (
    <section
      aria-labelledby="practical-guides-heading"
      className="border-b border-[#e6dfd8] py-12 sm:py-16 lg:py-20 dark:border-[#2e2b27]"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div
          id="practical-guides-heading"
          className="mb-8 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] sm:mb-12 dark:text-[#77736d]"
        >
          PRACTICAL GUIDES
        </div>

        {/* Clean Numbered Editorial Columns (No Floating Cards) */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12 lg:gap-16">
          {guideList.map((item, idx) => (
            <div
              key={item.number}
              className={`
                group flex flex-col justify-between space-y-4 pb-8 md:pb-0
                ${idx < guideList.length - 1 ? "border-b border-[#e6dfd8] md:border-b-0 dark:border-[#2e2b27]" : ""}
              `}
            >
              <div className="space-y-3">
                {/* Index Number: 01, 02, 03 */}
                <div className="font-mono text-xs text-[#8e8b82] dark:text-[#77736d]">
                  {item.number}
                </div>

                {/* Guide Category */}
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
                  {item.category}
                </div>

                {/* Title */}
                <h3 className="font-serif text-xl font-normal leading-[1.2] tracking-[-0.02em] text-[#141413] transition-colors duration-200 group-hover:text-[#cc785c] sm:text-2xl dark:text-[#faf9f5] dark:group-hover:text-[#cc785c]">
                  <Link href={`/articles/${item.slug}`}>
                    {item.title}
                  </Link>
                </h3>

                {/* Description */}
                <p className="font-sans text-xs leading-relaxed text-[#6c6a64] sm:text-sm dark:text-[#a09d96]">
                  {item.description}
                </p>
              </div>

              {/* Read Link */}
              <div className="pt-2">
                <Link
                  href={`/articles/${item.slug}`}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#141413] transition-colors duration-200 group-hover:text-[#cc785c] dark:text-[#faf9f5] dark:group-hover:text-[#cc785c]"
                >
                  <span>Read guide</span>
                  <span
                    className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
