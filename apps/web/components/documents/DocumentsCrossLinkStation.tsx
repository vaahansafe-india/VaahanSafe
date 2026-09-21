import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { getBlogUrl, getStatusUrl } from "@vaahansafe/config";

export function DocumentsCrossLinkStation() {
  const blogUrl = getBlogUrl();
  const statusUrl = getStatusUrl();

  return (
    <section
      aria-labelledby="documents-crosslink-heading"
      className="
        border-t border-[#27272a]
        bg-[#09090b]
        py-16 sm:py-20
        text-[#fafafa]
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[620px]">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span>Ecosystem Connectivity</span>
            </div>

            <h2
              id="documents-crosslink-heading"
              className="mt-3 font-serif text-3xl font-normal tracking-[-0.03em] sm:text-4xl"
            >
              Need operational action or live health?
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
              While Documents provides canonical reference text, the Help Center offers interactive problem-solving walkthroughs, and Service Status reports live edge resolver conditions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Link
              href="/help"
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md bg-[#cc785c] px-6
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-white transition-colors
                hover:bg-[#a9583e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              <span>Help Center</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </Link>

            <a
              href={blogUrl}
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md border border-white/[0.2] bg-white/[0.04] px-5
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-[#fafafa] transition-colors
                hover:bg-white/[0.08] hover:border-white/[0.3]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              <span>Field Notes &amp; Guides</span>
              <VaahanIcon name="external-link" size={11} aria-hidden="true" />
            </a>

            <a
              href={statusUrl}
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md border border-white/[0.2] bg-white/[0.04] px-5
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-[#fafafa] transition-colors
                hover:bg-white/[0.08] hover:border-white/[0.3]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              <span>Service Status</span>
              <VaahanIcon name="external-link" size={11} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
