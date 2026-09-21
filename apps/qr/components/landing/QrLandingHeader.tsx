"use client";

import React, { useState } from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import { ThemeToggle } from "@vaahansafe/ui/theme";
import { Sheet, SheetTrigger, SheetContent } from "@vaahansafe/ui/components";
import { getActivateUrl, getWebUrl } from "@vaahansafe/config";

export function QrLandingHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const activateUrl = getActivateUrl();
  const webUrl = getWebUrl();

  const navLinks = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Privacy", href: "#privacy" },
    { label: "QR Lifecycle", href: "#lifecycle" },
    { label: "Principles", href: "#principles" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: Canonical Official Brand Logo */}
        <Link
          href="/"
          className="inline-flex items-center min-w-0 shrink transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg py-1 px-1 -ml-1"
          aria-label="VaahanSafe Home"
        >
          <VaahanSafeLogo size="sm" variant="brand" showTagline={false} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-6 text-xs font-medium text-muted-foreground">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="h-4 w-px bg-border/60" />

          {/* Theme Switcher */}
          <ThemeToggle />

          <a
            href={activateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
          >
            <span>Activate QR</span>
            <VaahanIcon name="arrow-right" size={13} />
          </a>
        </nav>

        {/* Mobile Navigation Trigger */}
        <div className="flex items-center gap-2 md:hidden shrink-0">
          <a
            href={activateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary/10 text-primary px-2.5 text-xs font-semibold hover:bg-primary/20 transition-colors whitespace-nowrap"
          >
            <span>Activate</span>
            <VaahanIcon name="arrow-right" size={11} />
          </a>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="size-9 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted/60 transition-colors shrink-0"
                aria-label="Open navigation menu"
              >
                <VaahanIcon name="menu" size={18} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm p-6 bg-background flex flex-col justify-between">
              <div className="space-y-6">
                {/* Official Brand Logo inside Mobile Drawer - pr-12 reserves clear space for top-right close icon */}
                <div className="flex items-center pb-4 pr-12 border-b border-border/80 min-h-[44px]">
                  <VaahanSafeLogo size="sm" variant="brand" showTagline={false} />
                </div>

                {/* Navigation Links */}
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block px-2 pb-1">
                    Navigation
                  </span>
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <span>{link.label}</span>
                      <VaahanIcon name="chevron-right" size={14} className="text-muted-foreground" />
                    </a>
                  ))}
                </div>

                {/* Dedicated Appearance / Theme Switcher Card (eliminates collision with sheet close button) */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-background border border-border/80 flex items-center justify-center text-muted-foreground">
                      <VaahanIcon name="sun" size={14} />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-foreground block">Appearance</span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Theme Mode</span>
                    </div>
                  </div>
                  <ThemeToggle />
                </div>

                {/* CTA Action */}
                <div className="pt-1">
                  <a
                    href={activateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <span>Activate a QR Sticker</span>
                    <VaahanIcon name="arrow-right" size={14} />
                  </a>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-6 border-t border-border/60 space-y-2 text-xs text-muted-foreground font-mono">
                <a
                  href={webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-foreground transition-colors"
                >
                  VaahanSafe Home &rarr;
                </a>
                <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                  VaahanSafe is an identity relay. Does not replace 112/108 emergency response.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
