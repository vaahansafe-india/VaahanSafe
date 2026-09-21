import * as React from "react";

export function JournalHero() {
  return (
    <section
      aria-labelledby="journal-hero-heading"
      className="border-b border-[#e6dfd8] pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 dark:border-[#2e2b27]"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* Eyebrow / Identity Mark */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] dark:text-[#77736d]">
          <span className="flex items-center gap-1.5 font-semibold text-[#cc785c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            VAAHANSAFE / JOURNAL
          </span>
          <span className="h-3 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]" />
          <span>FIELD NOTES</span>
        </div>

        {/* Large Editorial Headline */}
        <div className="mt-8 max-w-[900px] space-y-6">
          <h1
            id="journal-hero-heading"
            className="
              font-serif
              text-[2.5rem] sm:text-[3.25rem] lg:text-[4.25rem]
              font-normal
              leading-[1.04]
              tracking-[-0.03em]
              text-[#141413]
              dark:text-[#faf9f5]
            "
          >
            Ideas for safer <br className="hidden sm:inline" />
            <span className="text-[#141413] dark:text-[#faf9f5]">vehicle connections.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="max-w-2xl font-sans text-base leading-relaxed text-[#6c6a64] sm:text-lg dark:text-[#a09d96]">
            Guides for the road, the vehicle and the identity. Guides and perspectives on vehicle safety, QR identity, privacy and responsible connection.
          </p>
        </div>
      </div>
    </section>
  );
}
