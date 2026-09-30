"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { getCustomerUrl } from "@vaahansafe/config";
import { useScroll, useMotionValueEvent, motion } from "framer-motion";

const navigation = [
  { label: "Product", href: "/product" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Safety", href: "/safety" },
  { label: "Plans", href: "/pricing" },
  { label: "Resources", href: "/documents" },
] as const;

export function SiteHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  const closeMenu = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useMotionValueEvent(scrollY, "change", current => {
    setScrolled(current > 10);
  });

  return (
    <header className={`vs-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="vs-header-inner">
        <Link className="vs-brand" href="/" aria-label="VaahanSafe home">
          <div className="vs-brand-mark-wrap">
            <Image src="/brand/vaahansafe-mark.svg" alt="" width={34} height={34} priority />
          </div>
          <span>vaahan<span>safe</span><small>VEHICLE SAFETY IDENTITY</small></span>
        </Link>

        <nav 
          className="vs-nav" 
          aria-label="Main navigation"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {navigation.map(item => {
            const isActive = pathname === item.href;
            const isHovered = hoveredHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`vs-nav-item ${isActive ? "is-active" : ""}`}
                onMouseEnter={() => setHoveredHref(item.href)}
              >
                {isHovered && (
                  <motion.span
                    layoutId="header-hover-pill"
                    className="vs-nav-hover-pill"
                    transition={{ type: "spring", stiffness: 450, damping: 32, mass: 0.7 }}
                  />
                )}
                <span className="vs-nav-item-label">{item.label}</span>
                {isActive && <span className="vs-nav-active-dot" />}
              </Link>
            );
          })}
        </nav>

        <div className="vs-header-actions">
          <a className="vs-header-login" href={getCustomerUrl()}>
            <span>Sign in</span>
          </a>
          <a className="vs-button vs-button-dark vs-header-cta" href={getCustomerUrl()}>
            <span>Get VaahanSafe</span>
            <ArrowUpRight size={15} className="vs-cta-arrow" />
          </a>
        </div>

        <details 
          ref={detailsRef}
          className="vs-mobile-menu"
          onToggle={(e) => setMenuOpen(e.currentTarget.open)}
        >
          <summary aria-label={menuOpen ? "Close navigation" : "Open navigation"}>
            <Menu size={23} className="vs-menu-open-icon" />
            <X size={23} className="vs-menu-close-icon" />
          </summary>
          <nav aria-label="Mobile navigation">
            {navigation.map(item => (
              <Link 
                key={item.href} 
                href={item.href}
                className={pathname === item.href ? "is-active" : ""}
                onClick={closeMenu}
              >
                <span>{item.label}</span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
            <a href={getCustomerUrl()} className="vs-mobile-login-link" onClick={closeMenu}>
              <span>Sign in to Dashboard</span>
              <ArrowUpRight size={16} />
            </a>
          </nav>
        </details>
      </div>
    </header>
  );
}
