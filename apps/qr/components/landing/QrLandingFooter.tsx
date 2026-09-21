import React from "react";
import Link from "next/link";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import { getActivateUrl, getStatusUrl, getWebUrl } from "@vaahansafe/config";

export function QrLandingFooter() {
  const webUrl = getWebUrl();
  const activateUrl = getActivateUrl();
  const statusUrl = getStatusUrl();

  return (
    <footer className="w-full bg-[#181715] text-[#FAF9F5] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#FAF9F5]/10">
          <Link
            href="/"
            className="inline-flex items-center transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg"
            aria-label="VaahanSafe Home"
          >
            <VaahanSafeLogo size="sm" variant="brand" theme="dark" showTagline={false} />
          </Link>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs font-mono text-[#FAF9F5]/70">
            <a
              href={webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FAF9F5] transition-colors"
            >
              VaahanSafe Platform
            </a>
            <a
              href={activateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FAF9F5] transition-colors"
            >
              Retail Activation
            </a>
            <a
              href={`${webUrl}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FAF9F5] transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href={statusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FAF9F5] transition-colors"
            >
              System Status
            </a>
            <a
              href={`${webUrl}/help`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FAF9F5] transition-colors"
            >
              Support & Help
            </a>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-xl bg-[#FAF9F5]/5 border border-[#FAF9F5]/10 text-xs text-[#FAF9F5]/60 leading-relaxed font-sans max-w-3xl">
          <span className="font-semibold text-[#FAF9F5]/90 block mb-1">
            Emergency Service Notice
          </span>
          VaahanSafe provides an emergency vehicle safety identification and citizen contact relay.
          It does not replace official emergency response, police, or hospital dispatch (112 / 108).
        </div>

        {/* Bottom Copyright & Notice */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-mono text-[#FAF9F5]/50">
          <span>&copy; {new Date().getFullYear()} VaahanSafe India. Built for Indian roads.</span>
          <span className="text-[#CC785C]">Automotive Safety Identity Architecture</span>
        </div>
      </div>
    </footer>
  );
}
