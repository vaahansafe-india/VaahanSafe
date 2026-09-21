import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@vaahansafe/ui/brand";
import { VaahanIcon } from "@vaahansafe/icons";
import { getWebUrl, getStatusUrl } from "@vaahansafe/config";

export function BlogHeader() {
  const webUrl = getWebUrl();
  const statusUrl = getStatusUrl();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e6dfd8] bg-[#faf9f5]/90 backdrop-blur-md dark:border-[#2e2b27] dark:bg-[#181715]/90">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-4">
          <a href={webUrl} aria-label="VaahanSafe Home">
            <BrandLogo size="default" />
          </a>
          <span className="hidden h-4 w-px bg-[#e6dfd8] sm:block dark:bg-white/[0.1]" />
          <Link
            href="/"
            className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-[#8e8b82] hover:text-[#141413] sm:block dark:text-[#a09d96] dark:hover:text-[#faf9f5]"
          >
            FIELD NOTES
          </Link>
        </div>

        <nav aria-label="Editorial navigation" className="flex items-center gap-6 text-xs">
          <a
            href={`${webUrl}/how-it-works`}
            className="hidden font-mono text-[11px] uppercase tracking-wider text-[#6c6a64] transition-colors hover:text-[#141413] md:block dark:text-[#a09d96] dark:hover:text-[#faf9f5]"
          >
            Product
          </a>
          <a
            href={`${webUrl}/help`}
            className="font-mono text-[11px] uppercase tracking-wider text-[#6c6a64] transition-colors hover:text-[#141413] dark:text-[#a09d96] dark:hover:text-[#faf9f5]"
          >
            Help
          </a>
          <a
            href={statusUrl}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#6c6a64] transition-colors hover:text-[#cc785c] dark:text-[#a09d96]"
          >
            <span>Status</span>
            <VaahanIcon name="external-link" size={10} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
