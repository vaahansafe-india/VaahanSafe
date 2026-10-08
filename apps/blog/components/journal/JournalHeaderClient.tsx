"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@vaahansafe/ui/brand";
import { ThemeToggle } from "@vaahansafe/ui/theme/theme-toggle";
import { VaahanIcon } from "@vaahansafe/icons";

const sections = [
  { label: "Latest stories", href: "/#latest" },
  { label: "Vehicle safety", href: "/category/vehicle-safety" },
  { label: "QR & identity", href: "/category/qr-identity" },
  { label: "Privacy", href: "/category/privacy" },
  { label: "Guides", href: "/guides" },
];

export function JournalHeaderClient({ webUrl }: { webUrl: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        router.push("/search");
      }
      if (event.key === "Escape" && menuRef.current?.open) {
        menuRef.current.open = false;
        menuRef.current.querySelector("summary")?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        menuRef.current.open = false;
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [router]);
  return (
    <header className="journal-header">
      <div className="journal-container journal-header-row">
        <div className="journal-brand">
          <a href={webUrl} aria-label="VaahanSafe website">
            <BrandLogo size="sm" />
          </a>
          <span
            className="journal-brand-divider h-5 border-l border-[var(--journal-line)]"
            aria-hidden="true"
          />
          <Link
            href="/"
            prefetch={false}
            className="journal-masthead flex min-h-11 flex-col justify-center"
          >
            <span className="font-serif text-2xl font-semibold leading-none tracking-tight">
              The Journal<span className="text-[var(--journal-accent)]">.</span>
            </span>
            <span className="mt-1 text-[9px] uppercase tracking-[.16em] journal-muted">
              By VaahanSafe
            </span>
          </Link>
        </div>
        <nav className="journal-desktop-nav" aria-label="Journal sections">
          {sections.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="journal-header-actions">
          <Link
            href="/search"
            prefetch={false}
            className="journal-icon-button"
            aria-label="Search the Journal (Control or Command K)"
          >
            <VaahanIcon name="search" size={19} aria-hidden="true" />
          </Link>
          <ThemeToggle />
          <details className="journal-menu" ref={menuRef}>
            <summary
              className="journal-icon-button"
              aria-label="Journal navigation"
            >
              <VaahanIcon name="menu" size={21} aria-hidden="true" />
            </summary>
            <nav
              className="journal-menu-panel"
              aria-label="Mobile journal sections"
            >
              <p className="journal-label mb-2">Explore the Journal</p>
              {sections.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={() => {
                    if (menuRef.current) menuRef.current.open = false;
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <a href={webUrl}>
                Explore VaahanSafe{" "}
                <span className="ml-auto" aria-hidden="true">
                  ↗
                </span>
              </a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
