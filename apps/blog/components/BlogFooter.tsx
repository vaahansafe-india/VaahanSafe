import * as React from "react";
import { BrandLogo } from "@vaahansafe/ui/brand";
import { VaahanIcon } from "@vaahansafe/icons";
import { getWebUrl, getStatusUrl } from "@vaahansafe/config";

export function BlogFooter() {
  const webUrl = getWebUrl();
  const statusUrl = getStatusUrl();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e6dfd8] bg-[#faf9f5] py-14 dark:border-[#2e2b27] dark:bg-[#181715]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <BrandLogo size="default" />
            <p className="mt-3 max-w-[420px] text-xs leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
              VaahanSafe Field Notes &amp; Journal. Educational guides for vehicle safety, emergency preparedness, and digital vehicle identity management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[10px] uppercase tracking-wider text-[#6c6a64] dark:text-[#a09d96]">
            <a href={webUrl} className="hover:text-[#141413] dark:hover:text-white">
              VaahanSafe Home
            </a>
            <a href={`${webUrl}/help`} className="hover:text-[#141413] dark:hover:text-white">
              Help Center
            </a>
            <a href={`${webUrl}/documents`} className="hover:text-[#141413] dark:hover:text-white">
              Documents
            </a>
            <a href={statusUrl} className="inline-flex items-center gap-1 hover:text-[#cc785c]">
              <span>Service Status</span>
              <VaahanIcon name="external-link" size={9} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-[#e6dfd8] pt-6 font-mono text-[9px] text-[#8e8b82] dark:border-white/[0.06]">
          &copy; {currentYear} VaahanSafe Technologies. All educational material subject to verified automotive safety guidelines.
        </div>
      </div>
    </footer>
  );
}
