"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

export type NavigationLink = {
  readonly index: string;
  readonly label: string;
  readonly href: string;
  readonly description?: string;
};

interface MobileNavigationProps {
  links: readonly NavigationLink[];
  customerUrl: string;
}

const linkIcons: Record<string, any> = {
  "/product": "qr-code",
  "/how-it-works": "route",
  "/safety": "shield",
  "/pricing": "check",
  "/gallery": "car",
};

export function MobileNavigation({
  links,
  customerUrl,
}: MobileNavigationProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="
            h-10 w-10
            rounded-full
            border border-transparent
            text-muted-foreground
            transition-all duration-200
            hover:border-border hover:bg-muted hover:text-foreground
          "
          aria-label="Open navigation menu"
        >
          <VaahanIcon name="menu" size={20} aria-hidden="true" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="
          flex flex-col justify-between
          w-full sm:max-w-[400px]
          border-l border-border
          bg-background
          p-6 sm:p-7
          text-foreground
          shadow-2xl
          overflow-y-auto
        "
      >
        <div>
          <SheetHeader className="text-left pr-10">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#cc785c] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#cc785c]" />
              </span>
              <SheetTitle className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-foreground">
                VaahanSafe
              </SheetTitle>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[8px] font-medium uppercase tracking-wider text-muted-foreground">
                IDENTITY
              </span>
            </div>
            <SheetDescription className="mt-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
              Vehicle safety identity platform
            </SheetDescription>
          </SheetHeader>

          <div className="my-5 h-px bg-gradient-to-r from-border via-border/70 to-transparent" />

          <nav
            aria-label="Mobile navigation"
            className="flex flex-col gap-1.5"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="
                  group relative flex items-center justify-between
                  rounded-xl border border-transparent p-3
                  transition-all duration-200
                  hover:border-border hover:bg-muted/80 hover:shadow-xs
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#cc785c]/40
                "
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="
                      flex h-9 w-9 shrink-0 items-center justify-center
                      rounded-lg border border-border
                      bg-muted text-muted-foreground
                      transition-all duration-200
                      group-hover:border-[#cc785c]/40 group-hover:bg-[#cc785c]/10 group-hover:text-[#cc785c]
                      dark:group-hover:border-[#cc785c]/40 dark:group-hover:text-[#cc785c]
                    "
                  >
                    <VaahanIcon
                      name={linkIcons[link.href] || "arrow-right"}
                      size={16}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] font-semibold text-muted-foreground transition-colors group-hover:text-[#cc785c]">
                        {link.index}
                      </span>
                      <span className="font-serif text-base font-normal tracking-[-0.01em] text-foreground transition-colors group-hover:text-[#cc785c]">
                        {link.label}
                      </span>
                    </div>

                    {link.description && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {link.description}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="
                    flex h-7 w-7 shrink-0 items-center justify-center
                    rounded-full text-muted-foreground/60
                    transition-all duration-200
                    group-hover:translate-x-1 group-hover:bg-[#cc785c]/10 group-hover:text-[#cc785c]
                  "
                >
                  <VaahanIcon name="chevron-right" size={14} aria-hidden="true" />
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 space-y-4">
          <div className="h-px bg-gradient-to-r from-border via-border/70 to-transparent" />

          {/* Account Console Access */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/60 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-[#cc785c] shadow-xs">
                <VaahanIcon name="shield" size={15} aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Owner Portal
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Already have an account?
                </div>
              </div>
            </div>

            <a
              href={customerUrl}
              className="
                inline-flex items-center gap-1.5
                rounded-lg border border-border bg-card px-3 py-1.5
                text-xs font-medium text-foreground shadow-2xs
                transition-all duration-150
                hover:border-[#cc785c] hover:bg-[#cc785c]/10 hover:text-[#cc785c]
                dark:hover:border-[#cc785c]/50 dark:hover:bg-[#cc785c]/15
              "
            >
              <span>Login</span>
              <VaahanIcon name="arrow-right" size={11} aria-hidden="true" />
            </a>
          </div>

          {/* Primary CTA Button */}
          <a
            href={customerUrl}
            className="
              group flex h-12 w-full
              items-center justify-center gap-2
              rounded-xl
              bg-[#cc785c]
              px-4
              font-mono text-[11px] font-semibold
              uppercase tracking-[0.14em]
              text-white
              shadow-sm
              transition-all duration-200
              hover:bg-[#a9583e] hover:shadow-md
              active:scale-[0.99]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#cc785c]/45
            "
          >
            <span>Get VaahanSafe</span>
            <VaahanIcon
              name="arrow-right"
              size={13}
              className="transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </a>

          {/* Footer Trust Marker */}
          <div className="flex items-center justify-center gap-2 text-center font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-[#5db8a6]" />
            <span>Encrypted Relay • No App Required</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
