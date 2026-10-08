"use client";

import { useEffect } from "react";

/**
 * SmoothScrollHandler ensures that clicking any section anchor link
 * (#how-it-works, #privacy, #faq, etc.) transitions with buttery-smooth
 * native easing, respects scroll-padding-top, updates browser history cleanly,
 * and honors accessibility (prefers-reduced-motion).
 */
export function SmoothScrollHandler() {
  useEffect(() => {
    function handleAnchorClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;

      const targetId = href.slice(1);
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      e.preventDefault();

      // Close open details mobile menus if present
      const openDetails = document.querySelectorAll("details[open]");
      openDetails.forEach((d) => {
        d.removeAttribute("open");
      });

      targetElement.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      window.history.pushState(null, "", href);
    }

    document.addEventListener("click", handleAnchorClick, { passive: false });
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  return null;
}
