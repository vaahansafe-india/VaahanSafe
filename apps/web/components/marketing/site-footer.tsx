import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { getActivateUrl, getCustomerUrl, getStatusUrl } from "@vaahansafe/config";

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
  badge?: string;
}

interface FooterColumn {
  heading: string;
  links: readonly FooterLink[];
}

const columns: readonly FooterColumn[] = [
  {
    heading: "Platform",
    links: [
      { label: "Product Architecture", href: "/product" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Safety View Demo", href: "/safety" },
      { label: "Pricing & Plans", href: "/pricing" },
      { label: "Placement Gallery", href: "/gallery", badge: "NEW" },
    ],
  },
  {
    heading: "Field & Fulfillment",
    links: [
      { label: "Activate Retail QR", href: getActivateUrl(), isExternal: true, badge: "SECURE" },
      { label: "Emergency Contact Setup", href: "/how-it-works#emergency" },
      { label: "Sticker Replacement", href: "/shipping-replacement" },
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Customer Dashboard", href: getCustomerUrl(), isExternal: true },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Technical Documents", href: "/documents" },
      { label: "Help & Knowledge Base", href: "/help" },
      { label: "Design System & Type", href: "/design-system" },
      { label: "Safety Guides & Blog", href: "/blog" },
      { label: "Contact Operations", href: "/contact" },
    ],
  },
  {
    heading: "Policies & Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Subscription Terms", href: "/subscription-terms" },
      { label: "Cookie Guidelines", href: "/cookie-policy" },
      { label: "Safety Disclaimer", href: "/disclaimer" },
    ],
  },
] as const;

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="vs-footer">
      {/* 01: Top Action & Trust Deck */}
      <div className="vs-footer-hero">
        <div className="vs-container">
          <div className="vs-footer-lead">
            <div className="vs-footer-lead-text">
              <div className="vs-footer-kicker-row">
                <span className="vs-pulse-indicator" />
                <span className="vs-kicker">READY FOR THE ROAD · INDIA</span>
              </div>
              <h2>An uncompromising safety identity<br />for every vehicle.</h2>
              <p>
                A physical QR paired with an owner-controlled safety view. Built for the critical moments when a vehicle needs to speak for itself.
              </p>
            </div>
            <div className="vs-footer-lead-actions">
              <a className="vs-button vs-button-coral vs-footer-primary-cta" href={getCustomerUrl()}>
                <span>Get VaahanSafe</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <a className="vs-button vs-footer-secondary-cta" href={getActivateUrl()}>
                <span>Activate Retail QR</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 02: Main Footer Body */}
      <div className="vs-container">
        <div className="vs-footer-matrix">
          {/* Brand Column */}
          <div className="vs-footer-brand-column">
            <Link className="vs-brand vs-footer-brand" href="/" aria-label="VaahanSafe home">
              <Image src="/brand/vaahansafe-mark-dark.svg" alt="" width={38} height={38} />
              <span>vaahan<span>safe</span><small>VEHICLE SAFETY IDENTITY</small></span>
            </Link>

            <p className="vs-footer-mission">
              Engineered for the reality of Indian roads. Connecting passerby assistance, highway emergency routing, and parking resolution without ever exposing phone numbers or private records.
            </p>

            <div className="vs-footer-external">
              <a href={getActivateUrl()}>Activate retail QR <ArrowUpRight size={14} aria-hidden="true" /></a>
              <a href={getStatusUrl()}>Service Status <ArrowUpRight size={14} aria-hidden="true" /></a>
            </div>
          </div>

          {/* Navigation Columns (Responsive Accordions on Mobile) */}
          <div className="vs-footer-nav-grid" title="Support">
            {columns.map(column => (
              <details className="vs-footer-accordion" key={column.heading} open>
                <summary className="vs-accordion-summary">
                  <span>{column.heading}</span>
                  <ChevronDown size={14} className="vs-accordion-chevron" aria-hidden="true" />
                </summary>
                <div className="vs-footer-link-list">
                  {column.links.map(link => {
                    const isExt = "isExternal" in link && link.isExternal;
                    return isExt ? (
                      <a href={link.href} key={link.label} className="vs-footer-link">
                        <span className="vs-link-text">{link.label}</span>
                        {link.badge && <span className="vs-link-badge">{link.badge}</span>}
                        <ArrowUpRight size={13} className="vs-link-arrow" aria-hidden="true" />
                      </a>
                    ) : (
                      <Link href={link.href} key={link.label} className="vs-footer-link">
                        <span className="vs-link-text">{link.label}</span>
                        {link.badge && <span className="vs-link-badge">{link.badge}</span>}
                        <ArrowUpRight size={13} className="vs-link-arrow" aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* 03: Bottom Bar */}
        <div className="vs-footer-bottom-bar">
          <span>© {currentYear} VaahanSafe</span>
          <span>Designed for Indian roads.</span>
          <Link href="/about">About VaahanSafe</Link>
        </div>
      </div>
    </footer>
  );
}
