import * as React from "react";

export function ReplacementHelpHero() {
  return (
    <section
      aria-labelledby="replacement-hero-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        pt-12 pb-16
        sm:pt-16 sm:pb-20
        lg:pt-20 lg:pb-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className="
            absolute -left-[200px] -top-[200px]
            h-[540px] w-[540px]
            rounded-full
            border border-[#09090b]/[0.03]
            dark:border-white/[0.025]
          "
        />
        <span
          className="
            absolute right-[8%] top-[25%]
            hidden h-1.5 w-1.5
            rounded-full bg-[#cc785c]/40
            lg:block
          "
        />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground dark:text-zinc-500">
          <span className="flex items-center gap-1.5 text-[#cc785c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            HELP / QR REPLACEMENT
          </span>
          <span className="h-3 w-px bg-[#e4e4e7] dark:bg-white/[0.1]" />
          <span>TASK-FOCUSED CONTINUITY</span>
        </div>

        <div className="mt-8 max-w-[820px]">
          <h1
            id="replacement-hero-heading"
            className="
              font-serif
              text-[2.75rem]
              font-normal
              leading-[1.02]
              tracking-[-0.04em]
              text-foreground
              sm:text-5xl
              md:text-6xl
              lg:text-[4.4rem]
              dark:text-zinc-50
            "
          >
            Something happened <br className="hidden sm:block" />
            <span className="text-[#cc785c]">to your QR?</span>
          </h1>

          <p className="mt-6 max-w-[660px] text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-8 dark:text-zinc-400">
            Find the appropriate next step if your VaahanSafe QR is damaged, lost or otherwise unusable. Our replacement workflow links a fresh decal to your existing vehicle identity.
          </p>
        </div>
      </div>
    </section>
  );
}
