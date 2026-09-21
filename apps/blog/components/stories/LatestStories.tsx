import * as React from "react";
import Link from "next/link";
import { BlogPost } from "@vaahansafe/content";
import { VaahanIcon } from "@vaahansafe/icons";

interface LatestStoriesProps {
  articles: readonly BlogPost[];
}

export function LatestStories({ articles }: LatestStoriesProps) {
  if (articles.length === 0) return null;

  return (
    <section id="latest-stories" aria-label="Latest Stories" className="py-12 sm:py-16 border-b border-[#e6dfd8] dark:border-[#2e2b27]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between pb-8">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82]">
            <span>LATEST STORIES</span>
            <span className="h-px w-8 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
          </div>
          <Link
            href="/category/vehicle-safety"
            className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c] hover:underline"
          >
            Explore all topics &rarr;
          </Link>
        </div>

        {/* Asymmetric Editorial Stream */}
        <div className="space-y-12">
          {articles.map((story, index) => {
            const indexStr = String(index + 1).padStart(2, "0");
            const rhythmMod = index % 5;

            // RHYTHM 0: Large text + side accent block
            if (rhythmMod === 0) {
              return (
                <article
                  key={story.slug}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-12 border-b border-[#e6dfd8]/60 dark:border-[#2e2b27]/60"
                >
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82]">
                      <span className="font-semibold text-[#cc785c]">{indexStr}</span>
                      <span>/</span>
                      <span className="text-[#3d3d3a] dark:text-[#a09d96]">{story.category}</span>
                      <span>&bull;</span>
                      <span>{story.readingTime}</span>
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl lg:text-[2.25rem] font-normal leading-snug text-[#141413] dark:text-[#faf9f5]">
                      <Link href={`/articles/${story.slug}`} className="hover:text-[#cc785c] transition-colors">
                        {story.title}
                      </Link>
                    </h3>

                    <p className="text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96] max-w-2xl">
                      {story.deck || story.excerpt}
                    </p>

                    <div className="pt-2">
                      <Link
                        href={`/articles/${story.slug}`}
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#cc785c] hover:text-[#a9583e]"
                      >
                        <span>Read story</span>
                        <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex items-center">
                    <div className="w-full rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/50 p-6 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/40 space-y-2">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
                        VERIFIED STATUTORY BASIS
                      </div>
                      <div className="font-serif text-sm italic text-[#3d3d3a] dark:text-[#a09d96]">
                        {story.references?.[0]?.citation || "Central Motor Vehicle Rules & MoRTH guidelines"}
                      </div>
                      <div className="font-mono text-[8px] text-[#8e8b82]">
                        Source: {story.references?.[0]?.source || "morth.nic.in"}
                      </div>
                    </div>
                  </div>
                </article>
              );
            }

            // RHYTHM 1: Two column split with visual quote card
            if (rhythmMod === 1) {
              return (
                <article
                  key={story.slug}
                  className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 pb-12 border-b border-[#e6dfd8]/60 dark:border-[#2e2b27]/60"
                >
                  <div className="md:col-span-5 order-2 md:order-1 flex items-center">
                    <div className="w-full rounded-2xl border border-[#cc785c]/20 bg-gradient-to-br from-[#cc785c]/10 via-[#f5f0e8] to-[#faf9f5] p-6 sm:p-8 dark:from-[#252320] dark:via-[#1f1e1b] dark:to-[#181715] space-y-3">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c] font-semibold">
                        PROTOCOL PRINCIPLE
                      </div>
                      <p className="font-serif text-lg sm:text-xl italic text-[#141413] dark:text-[#faf9f5]">
                        &ldquo;{story.intro.slice(0, 120)}...&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-7 order-1 md:order-2 space-y-4">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82]">
                      <span className="font-semibold text-[#cc785c]">{indexStr}</span>
                      <span>/</span>
                      <span className="text-[#3d3d3a] dark:text-[#a09d96]">{story.category}</span>
                      <span>&bull;</span>
                      <span>{story.readingTime}</span>
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl font-normal leading-snug text-[#141413] dark:text-[#faf9f5]">
                      <Link href={`/articles/${story.slug}`} className="hover:text-[#cc785c] transition-colors">
                        {story.title}
                      </Link>
                    </h3>

                    <p className="text-sm leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
                      {story.excerpt}
                    </p>

                    <div className="pt-2">
                      <Link
                        href={`/articles/${story.slug}`}
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#cc785c] hover:text-[#a9583e]"
                      >
                        <span>Read story</span>
                        <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            }

            // RHYTHM 2: Text-led deep dive
            if (rhythmMod === 2) {
              return (
                <article
                  key={story.slug}
                  className="max-w-3xl space-y-4 pb-12 border-b border-[#e6dfd8]/60 dark:border-[#2e2b27]/60"
                >
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82]">
                    <span className="font-semibold text-[#cc785c]">{indexStr}</span>
                    <span>/</span>
                    <span className="text-[#3d3d3a] dark:text-[#a09d96]">{story.category}</span>
                    <span>&bull;</span>
                    <span>{story.readingTime}</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-normal leading-snug text-[#141413] dark:text-[#faf9f5]">
                    <Link href={`/articles/${story.slug}`} className="hover:text-[#cc785c] transition-colors">
                      {story.title}
                    </Link>
                  </h3>

                  <p className="text-sm leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
                    {story.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <Link
                      href={`/articles/${story.slug}`}
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#cc785c] hover:text-[#a9583e]"
                    >
                      <span>Read story</span>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                    <span className="font-mono text-[10px] text-[#8e8b82]">
                      By {story.author.name}
                    </span>
                  </div>
                </article>
              );
            }

            // RHYTHM 3: Editorial diagram-led
            if (rhythmMod === 3) {
              return (
                <article
                  key={story.slug}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-12 border-b border-[#e6dfd8]/60 dark:border-[#2e2b27]/60"
                >
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82]">
                      <span className="font-semibold text-[#cc785c]">{indexStr}</span>
                      <span>/</span>
                      <span className="text-[#3d3d3a] dark:text-[#a09d96]">{story.category}</span>
                      <span>&bull;</span>
                      <span>{story.readingTime}</span>
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl font-normal leading-snug text-[#141413] dark:text-[#faf9f5]">
                      <Link href={`/articles/${story.slug}`} className="hover:text-[#cc785c] transition-colors">
                        {story.title}
                      </Link>
                    </h3>

                    <p className="text-sm leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
                      {story.excerpt}
                    </p>

                    <div className="pt-2">
                      <Link
                        href={`/articles/${story.slug}`}
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#cc785c] hover:text-[#a9583e]"
                      >
                        <span>Read story</span>
                        <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex items-center">
                    <div className="w-full rounded-2xl border border-[#e6dfd8] bg-[#181715] text-[#faf9f5] p-5 font-mono text-[10px] space-y-2">
                      <div className="text-[#8e8b82] text-[8px] uppercase tracking-[0.2em]">
                        DATA FLOW TOPOLOGY
                      </div>
                      <div className="space-y-1 text-[#a09d96]">
                        <div className="text-[#faf9f5]">VEHICLE HARDWARE [QR]</div>
                        <div>&darr; 01 Opaque ID Resolution</div>
                        <div className="text-[#5db8a6]">ZERO-EXPOSURE EDGE ROUTER</div>
                        <div>&darr; 02 Masked Virtual Proxy</div>
                        <div className="text-[#e8a55a]">EMERGENCY CONTACT PHONE</div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }

            // RHYTHM 4: Compact story row
            return (
              <article
                key={story.slug}
                className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 py-4 border-b border-[#e6dfd8]/60 dark:border-[#2e2b27]/60"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
                    <span className="font-semibold text-[#cc785c]">{indexStr}</span>
                    <span>/</span>
                    <span>{story.category}</span>
                    <span>&bull;</span>
                    <span>{story.date}</span>
                  </div>
                  <h4 className="font-serif text-xl font-normal text-[#141413] dark:text-[#faf9f5] hover:text-[#cc785c] transition-colors">
                    <Link href={`/articles/${story.slug}`}>{story.title}</Link>
                  </h4>
                </div>

                <Link
                  href={`/articles/${story.slug}`}
                  className="font-mono text-xs uppercase tracking-wider text-[#cc785c] hover:underline whitespace-nowrap"
                >
                  Read &rarr;
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
