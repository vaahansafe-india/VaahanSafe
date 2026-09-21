"use client";

import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@vaahansafe/ui/brand";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import {
  getCustomerUrl,
  getActivateUrl,
  getBlogUrl,
  getStatusUrl,
} from "@vaahansafe/config";

/* ========================================================================== */
/* FOOTER LINK CONFIGURATION                                                  */
/* ========================================================================== */

type FooterLinkItem = {
  readonly label: string;
  readonly href: string;
};

const productLinks: readonly FooterLinkItem[] = [
  { label: "Product & Decal", href: "/product" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Safety & Privacy Model", href: "/safety" },
  { label: "Pricing & Plans", href: "/pricing" },
  { label: "Placement Gallery", href: "/gallery" },
];

const supportLinks: readonly FooterLinkItem[] = [
  { label: "Help Center", href: "/help" },
  { label: "Activation Guide", href: "/help/activation" },
  { label: "Replacement Guide", href: "/help/replacement" },
  { label: "Shipping Policy", href: "/shipping-replacement" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const legalLinks: readonly FooterLinkItem[] = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Safety Disclaimer", href: "/safety-disclaimer" },
  { label: "All Legal Documents", href: "/documents" },
];

/* ========================================================================== */
/* COMPONENT                                                                  */
/* ========================================================================== */

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  const customerUrl = getCustomerUrl();
  const activateUrl = getActivateUrl();
  const blogUrl = getBlogUrl();
  const statusUrl = getStatusUrl();

  return (
    <footer
      className="
        relative isolate overflow-hidden
        border-t border-border
        bg-muted/40
        text-muted-foreground
        dark:bg-card/40
      "
      aria-label="VaahanSafe footer"
    >
      {/* ========================================================== */}
      {/* AMBIENT IDENTITY GEOMETRY                                  */}
      {/* ========================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className="
            absolute -right-[260px] -top-[300px]
            h-[620px] w-[620px]
            rounded-full
            border border-[#cc785c]/[0.055]
          "
        />

        <span
          className="
            absolute -bottom-[260px] -left-[280px]
            h-[560px] w-[560px]
            rounded-full
            border border-border/40
          "
        />

        <span
          className="
            absolute right-[11%] top-[24%]
            hidden h-1.5 w-1.5
            rounded-full bg-[#cc785c]/60
            lg:block
          "
        />

        <span
          className="
            absolute bottom-[19%] left-[8%]
            hidden h-1 w-1
            rounded-full bg-[#5db8a6]/50
            lg:block
          "
        />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* ======================================================== */}
        {/* FOOTER IDENTITY STATEMENT                               */}
        {/* ======================================================== */}

        <div className="grid gap-10 border-b border-border py-14 md:grid-cols-[1fr_auto] md:items-end lg:py-20">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />

              <span className="h-px w-8 bg-[#cc785c]/35" />

              <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-muted-foreground">
                VaahanSafe / Vehicle Identity
              </span>
            </div>

            <p
              className="
                mt-7 max-w-[780px]
                font-serif
                text-[2.5rem] font-normal
                leading-[0.98]
                tracking-[-0.04em]
                text-foreground
                sm:text-5xl
                lg:text-[3.7rem]
              "
            >
              One vehicle.
              <br />

              <span className="text-[#cc785c]">
                One useful identity.
              </span>
            </p>
          </div>

          <div className="hidden pb-1 text-right md:block">
            <span className="font-mono text-[6px] uppercase tracking-[0.17em] text-muted-foreground">
              Physical → Identity → Safety View
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN FOOTER                                             */}
        {/* ======================================================== */}

        <div className="grid gap-14 py-14 md:grid-cols-2 lg:grid-cols-[1.65fr_0.8fr_0.8fr_0.8fr] lg:gap-10 lg:py-16">
          {/* ====================================================== */}
          {/* BRAND                                                 */}
          {/* ====================================================== */}

          <div className="max-w-[390px]">
            <BrandLogo
              size="default"
              showTagline
            />

            <p className="mt-6 max-w-[360px] text-[11px] leading-6 text-muted-foreground">
              A QR-based vehicle safety identity that connects a
              physical vehicle to the safety information and contact
              options its owner chooses to make available.
            </p>

            {/* Identity relationship */}

            <div className="mt-8">
              <span className="font-mono text-[6px] uppercase tracking-[0.17em] text-muted-foreground">
                Identity relationship
              </span>

              <div className="mt-4 flex items-center gap-2">
                <FooterIdentityState
                  number="01"
                  label="Vehicle"
                />

                <FooterConnector />

                <FooterIdentityState
                  number="02"
                  label="QR Identity"
                  active
                />

                <FooterConnector />

                <FooterIdentityState
                  number="03"
                  label="Safety View"
                />
              </div>
            </div>

            {/* Product principles */}

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
              <FooterPrinciple
                icon="shield"
                label="Owner controlled"
              />

              <FooterPrinciple
                icon="lock"
                label="Activation separated"
              />
            </div>
          </div>

          {/* ====================================================== */}
          {/* PRODUCT                                               */}
          {/* ====================================================== */}

          <FooterColumn
            number="01"
            title="Product"
          >
            {productLinks.map((link) => (
              <FooterLink
                key={link.href}
                href={link.href}
              >
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          {/* ====================================================== */}
          {/* SUPPORT                                               */}
          {/* ====================================================== */}

          <FooterColumn
            number="02"
            title="Support"
          >
            {supportLinks.map((link) => (
              <FooterLink
                key={link.href}
                href={link.href}
              >
                {link.label}
              </FooterLink>
            ))}

            <FooterExternalLink href={blogUrl}>
              Safety Guides & Blog
            </FooterExternalLink>

            <FooterExternalLink href={statusUrl}>
              Service Status
            </FooterExternalLink>
          </FooterColumn>

          {/* ====================================================== */}
          {/* LEGAL                                                 */}
          {/* ====================================================== */}

          <FooterColumn
            number="03"
            title="Legal"
          >
            {legalLinks.map((link) => (
              <FooterLink
                key={link.href}
                href={link.href}
              >
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        {/* ======================================================== */}
        {/* PRODUCT ROUTES                                          */}
        {/* ======================================================== */}

        <div className="grid border-y border-border md:grid-cols-2">
          <FooterRoute
            number="01"
            eyebrow="Already using VaahanSafe?"
            title="Open your vehicle identity"
            description="Manage your vehicle, QR and supported safety information."
            href={customerUrl}
            icon="car"
          />

          <FooterRoute
            number="02"
            eyebrow="Bought a retail QR?"
            title="Activate your sticker"
            description="Begin the retail activation journey using your QR and activation information."
            href={activateUrl}
            icon="qr"
            last
          />
        </div>

        {/* ======================================================== */}
        {/* DOMAIN IDENTITY RAIL                                    */}
        {/* ======================================================== */}

        <div className="flex flex-col gap-6 border-b border-border py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />

            <div>
              <span className="block font-mono text-[6px] uppercase tracking-[0.16em] text-muted-foreground/80">
                Vehicle QR
              </span>

              <span className="mt-1 block font-mono text-[8px] tracking-[0.08em] text-foreground">
                qr.vaahansafe.com
              </span>
            </div>
          </div>

          <a
            href={statusUrl}
            className="
              group inline-flex items-center gap-2
              font-mono text-[7px]
              uppercase tracking-[0.15em]
              text-muted-foreground
              transition-colors
              hover:text-foreground
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#cc785c]/30
            "
          >
            <span>View service status</span>

            <VaahanIcon
              name="external-link"
              size={10}
              className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px"
              aria-hidden="true"
            />
          </a>
        </div>

        {/* ======================================================== */}
        {/* LEGAL BAR                                               */}
        {/* ======================================================== */}

        <div className="flex flex-col gap-5 py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-[9px] text-muted-foreground">
            © {currentYear} VaahanSafe Technologies. All rights reserved.
          </p>

          <div
            aria-hidden="true"
            className="flex items-center gap-3"
          >
            <span className="font-mono text-[6px] uppercase tracking-[0.16em] text-muted-foreground/80">
              Vehicle safety identity for India
            </span>

            <span className="h-1 w-1 rounded-full bg-[#cc785c]/60" />

            <span className="font-mono text-[6px] tracking-[0.15em] text-muted-foreground/80">
              VS / IN
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ========================================================================== */
/* FOOTER COLUMN                                                              */
/* ========================================================================== */

function FooterColumn({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <nav aria-label={`${title} footer navigation`}>
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <span className="font-mono text-[6px] tracking-[0.15em] text-muted-foreground/80">
          {number}
        </span>

        <span className="h-1 w-1 rounded-full bg-[#cc785c]" />

        <h2 className="m-0 font-mono text-[7px] font-medium uppercase tracking-[0.18em] text-foreground">
          {title}
        </h2>
      </div>

      <div className="mt-5 flex flex-col items-start gap-3.5">
        {children}
      </div>
    </nav>
  );
}

/* ========================================================================== */
/* INTERNAL LINK                                                              */
/* ========================================================================== */

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        group inline-flex items-center gap-2
        text-[10px] text-muted-foreground
        transition-colors
        hover:text-foreground
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#cc785c]/30
      "
    >
      <span>{children}</span>

      <span
        aria-hidden="true"
        className="
          h-px w-0
          bg-[#cc785c]/60
          transition-all
          group-hover:w-3
        "
      />
    </Link>
  );
}

/* ========================================================================== */
/* EXTERNAL LINK                                                              */
/* ========================================================================== */

function FooterExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="
        group inline-flex items-center gap-1.5
        text-[10px] text-muted-foreground
        transition-colors
        hover:text-foreground
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#cc785c]/30
      "
    >
      <span>{children}</span>

      <VaahanIcon
        name="external-link"
        size={9}
        className="text-muted-foreground transition-colors group-hover:text-[#cc785c]"
        aria-hidden="true"
      />
    </a>
  );
}

/* ========================================================================== */
/* IDENTITY STATE                                                             */
/* ========================================================================== */

function FooterIdentityState({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={`
          h-1.5 w-1.5 shrink-0 rounded-full
          ${active ? "bg-[#cc785c]" : "bg-muted-foreground/30"}
        `}
      />

      <div className="min-w-0">
        <span className="block font-mono text-[5px] tracking-[0.12em] text-muted-foreground/80">
          {number}
        </span>

        <span
          className={`
            block whitespace-nowrap text-[7px]
            ${active ? "text-foreground" : "text-muted-foreground"}
          `}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function FooterConnector() {
  return (
    <span
      aria-hidden="true"
      className="h-px w-5 bg-border"
    />
  );
}

/* ========================================================================== */
/* PRINCIPLE                                                                  */
/* ========================================================================== */

function FooterPrinciple({
  icon,
  label,
}: {
  icon: VaahanIconName;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-[7px] text-muted-foreground">
      <VaahanIcon
        name={icon}
        size={10}
        className="text-[#cc785c]"
        aria-hidden="true"
      />

      <span>{label}</span>
    </span>
  );
}

/* ========================================================================== */
/* ROUTE                                                                      */
/* ========================================================================== */

function FooterRoute({
  number,
  eyebrow,
  title,
  description,
  href,
  icon,
  last = false,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  icon: VaahanIconName;
  last?: boolean;
}) {
  return (
    <a
      href={href}
      className={`
        group relative
        flex min-h-[160px]
        items-center gap-5
        p-6
        transition-colors
        hover:bg-muted/50
        focus-visible:z-10
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-inset
        focus-visible:ring-[#cc785c]/30
        sm:p-8
        ${
          last
            ? ""
            : "border-b border-border md:border-b-0 md:border-r"
        }
      `}
    >
      <span className="absolute right-5 top-4 font-mono text-[6px] tracking-[0.15em] text-muted-foreground/80">
        {number}
      </span>

      <div
        className="
          flex h-11 w-11 shrink-0
          items-center justify-center
          rounded-[10px]
          border border-border
          bg-background/80
          text-[#cc785c]
          transition-colors
          group-hover:border-[#cc785c]/30
          group-hover:bg-[#cc785c]/[0.05]
        "
      >
        <VaahanIcon
          name={icon}
          size={15}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <span className="font-mono text-[6px] uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </span>

        <h3 className="mt-2 font-serif text-xl font-normal tracking-[-0.02em] text-foreground sm:text-2xl">
          {title}
        </h3>

        <p className="mt-2 max-w-[400px] text-[8px] leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <VaahanIcon
        name="arrow-right"
        size={12}
        className="
          shrink-0 text-muted-foreground/80
          transition-all
          group-hover:translate-x-1
          group-hover:text-[#cc785c]
        "
        aria-hidden="true"
      />
    </a>
  );
}
