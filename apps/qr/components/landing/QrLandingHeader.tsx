"use client";

import React, { useState } from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { VaahanSafeMark } from "@vaahansafe/ui/brand";
import { ThemeToggle } from "@vaahansafe/ui/theme";
import { Badge, Sheet, SheetTrigger, SheetContent, SheetClose } from "@vaahansafe/ui/components";
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Canonical Brand Mark & Surface Identity */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <VaahanSafeMark size={26} />
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-base font-semibold tracking-tight text-foreground">
              VAAHANSAFE
            </span>
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              / QR
            </span>
          </div>
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

        {/* Mobile Navigation Trigger (shadcn Sheet) */}
        <div className="flex items-center gap-2 md:hidden">
          <a
            href={activateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary/10 text-primary px-2.5 text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <span>Activate</span>
            <VaahanIcon name="arrow-right" size={11} />
          </a>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="size-9 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted/60 transition-colors"
                aria-label="Open navigation menu"
              >
                <VaahanIcon name="menu" size={18} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] max-w-sm p-6 bg-background flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/80">
                  <div className="flex items-center gap-2.5">
                    <VaahanSafeMark size={24} />
                    <div>
                      <span className="font-serif text-sm font-semibold tracking-tight text-foreground block">
                        VAAHANSAFE
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block">
                        Public QR System
                      </span>
                    </div>
                  </div>
                  <ThemeToggle />
                </div>

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

                <div className="pt-2">
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
