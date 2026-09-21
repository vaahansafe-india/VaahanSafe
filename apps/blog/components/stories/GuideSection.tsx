import * as React from "react";
import Link from "next/link";
import { BlogPost } from "@vaahansafe/content";
import { VaahanIcon } from "@vaahansafe/icons";

interface GuideSectionProps {
  guides: readonly BlogPost[];
}

export function GuideSection({ guides }: GuideSectionProps) {
  if (guides.length === 0) return null;

  return (
    <section aria-labelledby="guides-section-heading" className="py-12 sm:py-16 border-b border-[#e6dfd8] dark:border-[#2e2b27]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-8">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span>PRACTICAL SAFETY GUIDES</span>
            </div>
            <h2
              id="guides-section-heading"
              className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#141413] dark:text-[#faf9f5] mt-1"
            >
              Step-by-step readiness for vehicle and road.
            </h2>
          </div>

          <Link
            href="/guides"
            className="font-mono text-xs font-semibold uppercase tracking-wider text-[#cc785c] hover:underline"
          >
            All Practical Guides &rarr;
          </Link>
        </div>

        {/* Specialized Guide Cards with 01/02/03 Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.slice(0, 3).map((guide) => (
            <div
              key={guide.slug}
              className="
                flex flex-col justify-between rounded-2xl border border-[#e6dfd8]
                bg-[#f5f0e8]/40 p-6 sm:p-7 transition-all
                hover:border-[#cc785c]/40 hover:bg-[#f5f0e8]/80 hover:shadow-xs
                dark:border-[#2e2b27] dark:bg-[#1f1e1b]/30 dark:hover:bg-[#1f1e1b]/70
              "
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
                  <span className="rounded bg-[#cc785c]/10 text-[#cc785c] px-2 py-0.5 font-semibold">
                    GUIDE PROTOCOL
                  </span>
                  <span>{guide.readingTime}</span>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#141413] dark:text-[#faf9f5] leading-snug">
                  <Link href={`/articles/${guide.slug}`} className="hover:text-[#cc785c] transition-colors">
                    {guide.title}
                  </Link>
                </h3>

                <p className="text-xs sm:text-[13px] leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
                  {guide.excerpt}
                </p>

                {/* Structured Step Pills */}
                {guide.guideSteps && guide.guideSteps.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#e6dfd8] dark:border-[#2e2b27]">
                    {guide.guideSteps.map((step) => (
                      <div key={step.number} className="flex items-baseline gap-2 text-xs">
                        <span className="font-mono text-[10px] text-[#cc785c] font-bold">
                          {step.number} / {step.label}
                        </span>
                        <span className="text-[#3d3d3a] dark:text-[#a09d96] text-[11px] truncate">
                          {step.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 mt-4 border-t border-[#e6dfd8] dark:border-[#2e2b27] flex items-center justify-between">
                <Link
                  href={`/articles/${guide.slug}`}
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#cc785c] hover:text-[#a9583e]"
                >
                  <span>View Guide</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>

                <VaahanIcon name="document" size={14} className="text-[#8e8b82]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
