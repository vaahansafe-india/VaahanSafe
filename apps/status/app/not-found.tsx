import * as React from "react";
import Link from "next/link";
import { getWebUrl } from "@vaahansafe/config";
import { StatusHeader } from "../components/status/shell/StatusHeader";
import { StatusFooter } from "../components/status/shell/StatusFooter";

export default function StatusNotFound() {
  const webUrl = getWebUrl();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      <StatusHeader />

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl space-y-8">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span>ERROR / 404 &bull; UNKNOWN SIGNAL</span>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-5xl sm:text-6xl text-[#141413]/25 dark:text-[#faf9f5]/25">
              404
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.1] tracking-tight">
              This status page could not be found.
            </h1>
          </div>

          {/* Signal Rail Geometry */}
          <div className="w-full max-w-sm py-2 font-mono text-[10px] uppercase tracking-wider text-[#8e8b82]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">REQUEST</span>
              <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
              <span className="h-px flex-1 bg-[#cc785c]" />
              <span className="h-2 w-2 rounded-full border border-[#cc785c] bg-transparent" />
              <span>SIGNAL</span>
            </div>
          </div>

          <p className="font-sans text-xs sm:text-sm text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
            The status entry, incident permalink, or resource you requested is unavailable or has been relocated.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full bg-[#141413] px-6 font-sans text-xs font-medium text-[#faf9f5] hover:bg-[#3d3d3a] dark:bg-[#faf9f5] dark:text-[#141413] transition-colors"
            >
              Status Home
            </Link>
            <a
              href={webUrl}
              className="inline-flex h-11 items-center px-4 font-mono text-xs uppercase tracking-wider text-[#6c6a64] hover:text-[#cc785c] transition-colors"
            >
              VaahanSafe Home &rarr;
            </a>
          </div>
        </div>
      </main>

      <StatusFooter />
    </div>
  );
}
