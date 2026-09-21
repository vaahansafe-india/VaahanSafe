import * as React from "react";
import Link from "next/link";
import { getWebUrl } from "@vaahansafe/config";
import { StatusThemeSegmented } from "./StatusThemeSegmented";

export function StatusFooter() {
  const webUrl =
    typeof getWebUrl === "function"
      ? getWebUrl()
      : process.env.NEXT_PUBLIC_WEB_URL || "https://vaahansafe.com";

  return (
    <footer className="w-full border-t border-[#e6dfd8] bg-[#f5f0e8]/50 py-12 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/50 transition-colors">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8e8b82] dark:text-[#77736d]">
              VAAHANSAFE OPERATIONAL TRANSPARENCY
            </div>
            <p className="font-sans text-xs leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
              This surface reports the availability of public customer-facing capabilities across India.
              Incidents are published independently from internal telemetry by the on-call engineering team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-[11px] uppercase tracking-wider text-[#6c6a64] dark:text-[#a09d96]">
            <Link href="/methodology" className="hover:text-[#cc785c] transition-colors">
              Methodology
            </Link>
            <span>&bull;</span>
            <Link href="/history" className="hover:text-[#cc785c] transition-colors">
              Reliability History
            </Link>
            <span>&bull;</span>
            <Link href="/api/status" className="hover:text-[#cc785c] transition-colors">
              Status API JSON
            </Link>
            <span>&bull;</span>
            <a
              href={`${webUrl}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#cc785c] transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#e6dfd8] pt-6 dark:border-[#2e2b27]">
          <div className="space-y-1 font-mono text-[9px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d]">
            <div>&copy; {new Date().getFullYear()} VAAHANSAFE TECHNOLOGIES PRIVATE LIMITED. ALL RIGHTS RESERVED.</div>
            <div>INDEPENDENT REPORTING RUNTIME &bull; IST TIMEZONE ENFORCED</div>
          </div>

          <div>
            <StatusThemeSegmented />
          </div>
        </div>
      </div>
    </footer>
  );
}
