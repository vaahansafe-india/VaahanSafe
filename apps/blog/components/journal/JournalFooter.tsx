import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@vaahansafe/ui/brand";
import { VaahanIcon } from "@vaahansafe/icons";
import { getWebUrl, getStatusUrl } from "@vaahansafe/config";
import { JOURNAL_CATEGORIES } from "@vaahansafe/content";
import { IdentitySignal } from "./signal/IdentitySignal";

export function JournalFooter() {
  const webUrl = getWebUrl();
  const statusUrl = getStatusUrl();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#2e2b27] bg-[#181715] text-[#faf9f5] pt-16 pb-12">
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28">
        {/* Top Editorial Statement */}
        <div className="pb-12 border-b border-[#2e2b27] space-y-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="default" />
            <span className="h-3 w-px bg-[#2e2b27]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
              JOURNAL
            </span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#faf9f5]">
            Vehicles move. <br className="hidden sm:inline" />
            Identity travels with them.
          </h3>

          <p className="font-sans text-xs sm:text-sm text-[#a09d96] max-w-xl">
            Practical guides, engineering perspectives, and regulatory analyses on vehicle safety, optical QR identity, and zero-exposure bystander connection.
          </p>
        </div>

        {/* 4 Column Link Matrix */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 pt-12">
          {/* Column 1: Journal Topics (4 cols) */}
          <div className="space-y-3 lg:col-span-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82]">
              JOURNAL TOPICS
            </div>
            <ul className="space-y-2 text-xs font-mono">
              {JOURNAL_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-[#a09d96] hover:text-[#cc785c] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/guides"
                  className="text-[#a09d96] hover:text-[#cc785c] transition-colors"
                >
                  Practical Guides
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: VaahanSafe Ecosystem (3 cols) */}
          <div className="space-y-3 lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82]">
              VAAHANSAFE
            </div>
            <ul className="space-y-2 text-xs font-sans text-[#a09d96]">
              <li>
                <a href={`${webUrl}/#what-is-vaahansafe`} className="hover:text-[#faf9f5] transition-colors">
                  Product Overview
                </a>
              </li>
              <li>
                <a href={`${webUrl}/how-it-works`} className="hover:text-[#faf9f5] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href={`${webUrl}/safety`} className="hover:text-[#faf9f5] transition-colors">
                  Safety &amp; Privacy Model
                </a>
              </li>
              <li>
                <a href={`${webUrl}/pricing`} className="hover:text-[#faf9f5] transition-colors">
                  Kits &amp; Plans
                </a>
              </li>
              <li>
                <a href={`${webUrl}/documents`} className="hover:text-[#faf9f5] transition-colors">
                  Official Documents
                </a>
              </li>
              <li>
                <a href={`${webUrl}/help`} className="hover:text-[#faf9f5] transition-colors">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: System (2 cols) */}
          <div className="space-y-3 lg:col-span-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82]">
              SYSTEM
            </div>
            <ul className="space-y-2 text-xs font-sans text-[#a09d96]">
              <li>
                <a
                  href={statusUrl}
                  className="inline-flex items-center gap-1.5 text-[#5db8a6] hover:underline"
                >
                  <span>Service Status</span>
                  <VaahanIcon name="external-link" size={10} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Trust (3 cols) */}
          <div className="space-y-3 lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82]">
              LEGAL &amp; TRUST
            </div>
            <ul className="space-y-2 text-xs font-sans text-[#a09d96]">
              <li>
                <a href={`${webUrl}/privacy`} className="hover:text-[#faf9f5] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href={`${webUrl}/terms`} className="hover:text-[#faf9f5] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href={`${webUrl}/safety-disclaimer`} className="hover:text-[#faf9f5] transition-colors">
                  Safety Disclaimer
                </a>
              </li>
              <li>
                <Link href="/rss.xml" className="text-[#cc785c] hover:underline font-mono text-[11px]">
                  RSS Feed (XML)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Full-Width Footer Registration Line */}
        <div className="mt-14 border-t border-[#2e2b27] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <IdentitySignal theme="dark" />

          <div className="font-mono text-[9px] text-[#8e8b82]">
            &copy; {currentYear} VaahanSafe Technologies. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
