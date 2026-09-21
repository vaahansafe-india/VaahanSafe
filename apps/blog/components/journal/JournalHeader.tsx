"use client";

import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@vaahansafe/ui/brand";
import { ThemeToggle } from "@vaahansafe/ui/theme";
import { VaahanIcon } from "@vaahansafe/icons";
import { getWebUrl } from "@vaahansafe/config";
import { BlogPost, CategoryWithCount } from "@vaahansafe/content";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@vaahansafe/ui/components";
import { JournalSearchDialog } from "./JournalSearchDialog";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Latest", href: "/#latest" },
  { label: "Vehicle Safety", href: "/category/vehicle-safety" },
  { label: "QR & Identity", href: "/category/qr-identity" },
  { label: "Privacy", href: "/category/privacy" },
  { label: "Safety Guides", href: "/guides" },
  { label: "Product", href: "/category/product" },
] as const;

interface JournalHeaderProps {
  articles?: readonly BlogPost[];
  categories?: readonly CategoryWithCount[];
}

export function JournalHeader({ articles = [], categories = [] }: JournalHeaderProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const webUrl = getWebUrl();

  return (
    <>
      <header className="sticky top-0 z-40 h-[68px] sm:h-[72px] w-full border-b border-[#e6dfd8] bg-[#faf9f5]/95 backdrop-blur-sm dark:border-[#2e2b27] dark:bg-[#181715]/95">
        <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28">
          {/* 1. Brand & Publication Masthead (Left) */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-3.5">
            <a
              href={webUrl}
              className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]"
              aria-label="VaahanSafe Home"
            >
              <BrandLogo size="default" />
            </a>

            <span
              aria-hidden="true"
              className="h-4 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]"
            />

            <Link
              href="/"
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c] rounded"
            >
              <span className="font-mono text-[11px] sm:text-xs font-semibold tracking-[0.2em] text-[#141413] dark:text-[#faf9f5]">
                JOURNAL
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full border border-[#e6dfd8] bg-[#f5f0e8]/50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#8e8b82] dark:border-[#2e2b27] dark:bg-[#1f1e1b]/50 dark:text-[#77736d]">
                2026
              </span>
            </Link>
          </div>

          {/* 2. Large Desktop Navigation (Visible on 2xl: >= 1536px where space is abundant) */}
          <nav
            aria-label="Journal categories"
            className="hidden 2xl:flex items-center gap-8 font-sans"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13.5px] font-medium text-[#6c6a64] transition-colors hover:text-[#141413] dark:text-[#a09d96] dark:hover:text-[#faf9f5]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 3. Center Editorial Search Pill (Laptops & Desktops: 1024px to 1535px) */}
          <div className="hidden lg:flex 2xl:hidden flex-1 max-w-sm mx-6 justify-center">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group flex w-full items-center justify-between gap-3 rounded-full border border-[#e6dfd8] bg-[#f5f0e8]/60 px-4 py-1.5 text-xs text-[#6c6a64] shadow-xs transition-all hover:border-[#cc785c] hover:bg-[#f5f0e8] hover:text-[#141413] dark:border-[#2e2b27] dark:bg-[#1f1e1b]/60 dark:text-[#a09d96] dark:hover:border-[#cc785c] dark:hover:bg-[#1f1e1b] dark:hover:text-[#faf9f5]"
              aria-label="Search articles and safety guides"
            >
              <span className="flex items-center gap-2 truncate">
                <VaahanIcon name="search" size={14} aria-hidden="true" className="shrink-0 text-[#8e8b82] group-hover:text-[#cc785c] transition-colors" />
                <span className="truncate">Search articles &amp; guides...</span>
              </span>
              <kbd className="shrink-0 rounded border border-[#e6dfd8] bg-[#faf9f5] px-1.5 py-0.5 font-mono text-[10px] text-[#8e8b82] dark:border-[#2e2b27] dark:bg-[#181715]">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* 4. Desktop Right Actions (2xl: >= 1536px) */}
          <div className="hidden 2xl:flex shrink-0 items-center gap-5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-[#6c6a64] hover:text-[#141413] hover:bg-[#f5f0e8] dark:text-[#a09d96] dark:hover:text-[#faf9f5] dark:hover:bg-[#1f1e1b] transition-colors"
              aria-label="Search articles"
            >
              <VaahanIcon name="search" size={15} aria-hidden="true" />
              <span>Search</span>
              <kbd className="rounded border border-[#e6dfd8] dark:border-[#2e2b27] px-1.5 py-0.5 font-mono text-[10px] text-[#8e8b82]">
                ⌘K
              </kbd>
            </button>

            <a
              href={webUrl}
              className="group inline-flex items-center gap-1 text-[13px] font-medium text-[#141413] hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c] transition-colors"
            >
              <span>VaahanSafe.com</span>
              <span aria-hidden="true" className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                ↗
              </span>
            </a>

            <span
              aria-hidden="true"
              className="h-4 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]"
            />

            <ThemeToggle />
          </div>

          {/* 5. Laptop & Tablet Actions with Sections Drawer Trigger (768px to 1535px) */}
          <div className="hidden md:flex 2xl:hidden shrink-0 items-center gap-3">
            {/* Mobile/tablet search icon button on md: screens (< 1024px) */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg text-[#6c6a64] hover:bg-[#f5f0e8] hover:text-[#141413] dark:text-[#a09d96] dark:hover:bg-[#1f1e1b] dark:hover:text-[#faf9f5] transition-colors"
              aria-label="Open search dialog"
            >
              <VaahanIcon name="search" size={16} aria-hidden="true" />
            </button>

            <a
              href={webUrl}
              className="group inline-flex items-center gap-1 text-xs font-medium text-[#141413] hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c] transition-colors"
            >
              <span>VaahanSafe.com</span>
              <span aria-hidden="true" className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                ↗
              </span>
            </a>

            <span
              aria-hidden="true"
              className="h-4 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]"
            />

            <ThemeToggle />

            {/* Sections Drawer Button */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6dfd8] bg-[#f5f0e8]/40 px-2.5 py-1.5 text-xs font-medium text-[#141413] hover:border-[#cc785c] hover:bg-[#f5f0e8] dark:border-[#2e2b27] dark:bg-[#1f1e1b]/40 dark:text-[#faf9f5] dark:hover:bg-[#1f1e1b] transition-colors"
                  aria-label="Open sections menu"
                >
                  <VaahanIcon name="menu" size={15} aria-hidden="true" />
                  <span>Sections</span>
                </button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[320px] sm:w-[380px] bg-[#faf9f5] dark:bg-[#181715] p-6 border-l border-[#e6dfd8] dark:border-[#2e2b27] flex flex-col justify-between"
              >
                <div>
                  <SheetHeader className="text-left pb-4 border-b border-[#e6dfd8] dark:border-[#2e2b27]">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
                      <SheetTitle className="text-xs font-mono font-medium tracking-wider">
                        VAAHANSAFE / JOURNAL
                      </SheetTitle>
                      <SheetDescription className="sr-only">
                        Editorial sections and directory navigation
                      </SheetDescription>
                    </div>
                  </SheetHeader>

                  {/* Search Shortcut in Drawer */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className="flex w-full items-center justify-between rounded-xl border border-[#e6dfd8] bg-[#f5f0e8]/70 px-3.5 py-2.5 text-xs text-[#6c6a64] hover:border-[#cc785c] hover:text-[#141413] dark:border-[#2e2b27] dark:bg-[#1f1e1b] dark:text-[#a09d96] dark:hover:text-[#faf9f5] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <VaahanIcon name="search" size={14} aria-hidden="true" />
                        <span>Search stories &amp; guides...</span>
                      </span>
                      <kbd className="rounded border border-[#e6dfd8] px-1 py-0.5 font-mono text-[10px] text-[#8e8b82] dark:border-[#2e2b27]">
                        ⌘K
                      </kbd>
                    </button>
                  </div>

                  {/* Navigation Links with Numbered Indices and Touch Targets */}
                  <nav className="flex flex-col gap-1 py-5 font-sans">
                    <div className="pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82] dark:text-[#77736d]">
                      SECTIONS &amp; DIRECTORY
                    </div>
                    {NAV_ITEMS.map((item, idx) => {
                      const num = String(idx + 1).padStart(2, "0");
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className="group flex min-h-[44px] items-center justify-between px-3 py-2 rounded-lg text-[#3d3d3a] hover:bg-[#f5f0e8] hover:text-[#141413] dark:text-[#a09d96] dark:hover:bg-[#1f1e1b] dark:hover:text-[#faf9f5] transition-colors"
                          >
                            <span className="flex items-center gap-3">
                              <span className="font-mono text-[10px] text-[#8e8b82] group-hover:text-[#cc785c] transition-colors">
                                {num}
                              </span>
                              <span className="text-sm font-medium">{item.label}</span>
                            </span>
                            <span className="font-mono text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[#cc785c]">
                              &rarr;
                            </span>
                          </Link>
                        </SheetClose>
                      );
                    })}

                    <div className="my-3 border-t border-[#e6dfd8] dark:border-[#2e2b27]" />

                    <a
                      href={webUrl}
                      className="flex min-h-[44px] items-center justify-between px-3 py-2 rounded-lg font-medium text-sm text-[#141413] hover:bg-[#f5f0e8] hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:bg-[#1f1e1b] transition-colors"
                    >
                      <span>VaahanSafe.com</span>
                      <span aria-hidden="true">&rarr;</span>
                    </a>

                    <a
                      href={`${webUrl}/how-it-works`}
                      className="flex min-h-[44px] items-center justify-between px-3 py-2 rounded-lg text-sm text-[#6c6a64] hover:bg-[#f5f0e8] hover:text-[#141413] dark:text-[#a09d96] dark:hover:bg-[#1f1e1b] dark:hover:text-[#faf9f5] transition-colors"
                    >
                      <span>How It Works</span>
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  </nav>
                </div>

                {/* Footer in Drawer */}
                <div className="pt-4 border-t border-[#e6dfd8] dark:border-[#2e2b27] space-y-1 font-mono text-[9px] text-[#8e8b82] uppercase tracking-wider">
                  <div>VEHICLE SAFETY &bull; IDENTITY &bull; PRIVACY</div>
                  <div className="text-[8px] text-[#a09d96]">Authoritative Public Editorial Platform</div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* 6. Mobile Controls (< 768px): Touch-Friendly Search, ThemeToggle, and Hamburger */}
          <div className="flex md:hidden shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#6c6a64] hover:bg-[#f5f0e8] hover:text-[#141413] dark:text-[#a09d96] dark:hover:bg-[#1f1e1b] dark:hover:text-[#faf9f5] transition-colors"
              aria-label="Open search dialog"
            >
              <VaahanIcon name="search" size={18} aria-hidden="true" />
            </button>

            <ThemeToggle />

            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#141413] hover:bg-[#f5f0e8] dark:text-[#faf9f5] dark:hover:bg-[#1f1e1b] transition-colors"
                  aria-label="Open navigation menu"
                >
                  <VaahanIcon name="menu" size={20} aria-hidden="true" />
                </button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[300px] sm:w-[340px] bg-[#faf9f5] dark:bg-[#181715] p-6 border-l border-[#e6dfd8] dark:border-[#2e2b27] flex flex-col justify-between"
              >
                <div>
                  <SheetHeader className="text-left pb-4 border-b border-[#e6dfd8] dark:border-[#2e2b27]">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
                      <SheetTitle className="text-xs font-mono font-medium tracking-wider">
                        VAAHANSAFE / JOURNAL
                      </SheetTitle>
                      <SheetDescription className="sr-only">
                        Mobile editorial sections and directory navigation
                      </SheetDescription>
                    </div>
                  </SheetHeader>

                  {/* Search Shortcut in Mobile Drawer */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className="flex w-full items-center gap-2.5 rounded-xl border border-[#e6dfd8] bg-[#f5f0e8]/70 px-3.5 py-2.5 text-xs text-[#6c6a64] hover:border-[#cc785c] hover:text-[#141413] dark:border-[#2e2b27] dark:bg-[#1f1e1b] dark:text-[#a09d96] dark:hover:text-[#faf9f5] transition-colors"
                    >
                      <VaahanIcon name="search" size={15} aria-hidden="true" />
                      <span>Search articles...</span>
                    </button>
                  </div>

                  {/* Navigation Links with 44px min touch height */}
                  <nav className="flex flex-col gap-1 py-5 font-sans">
                    <div className="pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82] dark:text-[#77736d]">
                      SECTIONS
                    </div>
                    {NAV_ITEMS.map((item, idx) => {
                      const num = String(idx + 1).padStart(2, "0");
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className="group flex min-h-[44px] items-center justify-between px-3.5 py-2.5 rounded-lg text-[#3d3d3a] hover:bg-[#f5f0e8] hover:text-[#141413] dark:text-[#a09d96] dark:hover:bg-[#1f1e1b] dark:hover:text-[#faf9f5] transition-colors"
                          >
                            <span className="flex items-center gap-3">
                              <span className="font-mono text-[10px] text-[#8e8b82] group-hover:text-[#cc785c] transition-colors">
                                {num}
                              </span>
                              <span className="text-sm font-medium">{item.label}</span>
                            </span>
                            <span className="font-mono text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[#cc785c]">
                              &rarr;
                            </span>
                          </Link>
                        </SheetClose>
                      );
                    })}

                    <div className="my-2 border-t border-[#e6dfd8] dark:border-[#2e2b27]" />

                    <a
                      href={webUrl}
                      className="flex min-h-[44px] items-center justify-between px-3.5 py-2.5 rounded-lg font-medium text-[#141413] hover:bg-[#f5f0e8] hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:bg-[#1f1e1b] transition-colors"
                    >
                      <span>VaahanSafe.com</span>
                      <span aria-hidden="true">↗</span>
                    </a>

                    <a
                      href={`${webUrl}/how-it-works`}
                      className="flex min-h-[44px] items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-[#6c6a64] hover:bg-[#f5f0e8] hover:text-[#141413] dark:text-[#a09d96] dark:hover:bg-[#1f1e1b] dark:hover:text-[#faf9f5] transition-colors"
                    >
                      <span>How It Works</span>
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  </nav>
                </div>

                {/* Footer in Drawer */}
                <div className="pt-4 border-t border-[#e6dfd8] dark:border-[#2e2b27] font-mono text-[9px] text-[#8e8b82] uppercase tracking-wider">
                  VEHICLE SAFETY &bull; IDENTITY &bull; PRIVACY
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Desktop & Mobile Search Dialog */}
      <JournalSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        articles={articles}
        categories={categories}
      />
    </>
  );
}
