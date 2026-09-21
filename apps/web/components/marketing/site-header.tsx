import * as React from "react";
import Link from "next/link";

import { VaahanIcon } from "@vaahansafe/icons";
import { ThemeToggle } from "@vaahansafe/ui/theme";
import { getCustomerUrl } from "@vaahansafe/config";

import { BrandLogo } from "./brand-logo";
import { MobileNavigation, type NavigationLink } from "./mobile-navigation";

const links: readonly NavigationLink[] = [
  {
    index: "01",
    label: "Product",
    href: "/#what-is-vaahansafe",
    description: "Understand the vehicle identity",
  },
  {
    index: "02",
    label: "How it works",
    href: "/how-it-works",
    description: "Place → Scan → Connect",
  },
  {
    index: "03",
    label: "Safety & Privacy",
    href: "/safety",
    description: "Control what becomes visible",
  },
  {
    index: "04",
    label: "Plans",
    href: "/pricing",
    description: "Services around your identity",
  },
  {
    index: "05",
    label: "QR Placement",
    href: "/gallery",
    description: "Visual placement guide",
  },
  {
    index: "06",
    label: "Blog",
    href: "/blog",
    description: "Safety guides & field notes",
  },
] as const;

/**
 * Public VaahanSafe navigation.
 *
 * Server rendered by default.
 * Only ThemeToggle and MobileNavigation require client hydration.
 */
export function SiteHeader() {
  const customerUrl = getCustomerUrl();

  return (
    <header
      className="
        sticky top-0 z-50
        w-full
        border-b border-border
        bg-background/95
        text-foreground
        supports-[backdrop-filter]:bg-background/90
        backdrop-blur-md
      "
    >
      <div
        className="
          mx-auto flex h-16
          max-w-[1240px]
          items-center
          px-5 sm:px-8 lg:px-10
        "
      >
        {/* ======================================================== */}
        {/* BRAND                                                   */}
        {/* ======================================================== */}

        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            aria-label="VaahanSafe home"
            className="
              rounded-sm
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#cc785c]/40
              focus-visible:ring-offset-4
              focus-visible:ring-offset-background
            "
          >
            <BrandLogo size="default" href="" />
          </Link>

          {/* Identity registration marker */}

          <div
            aria-hidden="true"
            className="
              ml-5 hidden
              items-center gap-2
              xl:flex
            "
          >
            <span className="h-px w-5 bg-border" />

            <span className="h-1 w-1 rounded-full bg-[#cc785c]" />

            <span
              className="
                font-mono text-[7px]
                tracking-[0.2em]
                text-muted-foreground
              "
            >
              IDENTITY // 001
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DESKTOP NAVIGATION                                      */}
        {/* ======================================================== */}

        <nav
          aria-label="Primary site navigation"
          className="
            ml-auto hidden
            h-16
            items-center
            lg:flex
          "
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="
                group relative
                flex h-full
                items-center
                px-3.5
                text-[11px] font-medium
                text-muted-foreground
                transition-colors
                hover:text-foreground
                focus-visible:z-10
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-inset
                focus-visible:ring-[#cc785c]/30
                xl:px-4
              "
            >
              <span
                aria-hidden="true"
                className="
                  mr-1.5 hidden
                  font-mono text-[5px]
                  tracking-[0.12em]
                  text-muted-foreground/60
                  transition-colors
                  group-hover:text-[#cc785c]
                  xl:inline
                "
              >
                {link.index}
              </span>

              <span>{link.label}</span>

              <span
                aria-hidden="true"
                className="
                  absolute bottom-0
                  left-1/2
                  h-px w-0
                  -translate-x-1/2
                  bg-[#cc785c]
                  transition-[width]
                  duration-200
                  group-hover:w-5
                "
              />
            </Link>
          ))}
        </nav>

        {/* ======================================================== */}
        {/* DESKTOP ACTIONS                                         */}
        {/* ======================================================== */}

        <div
          className="
            ml-5 hidden
            items-center
            border-l border-border
            pl-5
            lg:flex
          "
        >
          <ThemeToggle />

          <a
            href={customerUrl}
            className="
              ml-3 inline-flex
              h-10 items-center
              px-3
              text-[10px] font-medium
              text-muted-foreground
              transition-colors
              hover:text-foreground
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#cc785c]/30
            "
          >
            Login
          </a>

          <a
            href={customerUrl}
            className="
              group ml-2
              inline-flex h-10
              items-center justify-center
              gap-2
              rounded-[7px]
              bg-[#cc785c]
              px-4
              text-[10px] font-medium
              text-white
              transition-colors
              hover:bg-[#a9583e]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#cc785c]/45
              focus-visible:ring-offset-2
              focus-visible:ring-offset-background
            "
          >
            <span>Get VaahanSafe</span>

            <VaahanIcon
              name="arrow-right"
              size={12}
              className="
                transition-transform
                duration-200
                group-hover:translate-x-0.5
              "
              aria-hidden="true"
            />
          </a>
        </div>

        {/* ======================================================== */}
        {/* MOBILE ACTIONS                                          */}
        {/* ======================================================== */}

        <div className="ml-auto flex items-center gap-1.5 lg:hidden">
          <ThemeToggle />

          <MobileNavigation
            links={links}
            customerUrl={customerUrl}
          />
        </div>
      </div>

      {/* ========================================================== */}
      {/* IDENTITY EDGE                                             */}
      {/* ========================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-x-0 bottom-[-1px]
          flex justify-center
        "
      >
        <span className="h-px w-10 bg-[#cc785c]/45" />
      </div>
    </header>
  );
}
