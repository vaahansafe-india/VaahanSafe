import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function DocumentsHero() {
  return (
    <section
      aria-labelledby="documents-hero-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        pt-12 pb-14
        sm:pt-16 sm:pb-16
        lg:pt-20 lg:pb-20
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
            absolute -right-[180px] -top-[180px]
            h-[520px] w-[520px]
            rounded-full
            border border-[#09090b]/[0.03]
            dark:border-white/[0.025]
          "
        />
        <span
          className="
            absolute left-[6%] top-[30%]
            hidden h-1.5 w-1.5
            rounded-full bg-[#cc785c]/40
            lg:block
          "
        />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* Eyebrow & Small Metadata */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground dark:text-zinc-500">
          <span className="flex items-center gap-1.5 text-[#cc785c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            VAAHANSAFE / DOCUMENTS
          </span>
          <span className="h-3 w-px bg-[#e4e4e7] dark:bg-white/[0.1]" />
          <span>REFERENCE LIBRARY / 15.4</span>
        </div>

        {/* Main Headline */}
        <div className="mt-8 max-w-[820px]">
          <h1
            id="documents-hero-heading"
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
            Everything you need <br />
            to <span className="text-[#cc785c]">understand VaahanSafe.</span>
          </h1>

          <p className="mt-6 max-w-[680px] text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-8 dark:text-zinc-400">
            Official product guides for getting started, activating and placing your QR, managing safety information, understanding privacy, and working with your VaahanSafe services.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#guide-index"
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md bg-[#cc785c] px-6
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-white transition-colors
                hover:bg-[#a9583e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              <span>Browse guides</span>
              <span aria-hidden="true">↓</span>
            </a>

            <Link
              href="/help"
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md border border-border bg-white px-5
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-foreground transition-colors
                hover:border-[#cc785c]/40 hover:bg-muted/50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
                dark:border-white/[0.12] dark:bg-zinc-900 dark:text-zinc-50
              "
            >
              <span>Help Center</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
