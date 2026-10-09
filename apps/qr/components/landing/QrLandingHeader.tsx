"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import { QrThemeToggle } from "./QrThemeToggle";
const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Sticker anatomy", href: "#anatomy" },
  { label: "Your privacy", href: "#privacy" },
  { label: "Roadside utility", href: "#situations" },
  { label: "Principles", href: "#principles" },
  { label: "Questions", href: "#faq" },
];
export function QrLandingHeader({
  activateUrl,
  webUrl,
}: {
  activateUrl: string;
  webUrl: string;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node))
        menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <header className="qr-header">
      <div className="qr-container qr-header-row">
        <div className="qr-header-brand">
          <Link href="/" aria-label="VaahanSafe QR home">
            <VaahanSafeLogo size="sm" variant="brand" showTagline={false} />
          </Link>
          <span className="qr-header-context">
            Vehicle safety
            <br />
            identity
          </span>
        </div>
        <nav className="qr-header-nav" aria-label="Main navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="qr-header-actions">
          <QrThemeToggle />
          <a
            className="qr-button qr-button-primary qr-header-cta"
            href={activateUrl}
          >
            Activate your QR <span aria-hidden="true">↗</span>
          </a>
          <details ref={menu} className="qr-menu">
            <summary
              className="qr-icon-button"
              aria-label="Navigation menu"
            >
              <span aria-hidden="true">☰</span>
            </summary>
            <nav
              className="qr-menu-panel"
              aria-label="Mobile navigation"
              onClick={() => {
                if (menu.current) menu.current.open = false;
              }}
            >
              {links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
              <a href={activateUrl}>Activate your QR ↗</a>
              <a href={webUrl}>VaahanSafe platform ↗</a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
