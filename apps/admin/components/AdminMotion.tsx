"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AdminMotion() {
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Defer AOS initialization until after initial React hydration completes
    // so AOS DOM class mutations (.aos-init, .aos-animate) do not cause hydration mismatches.
    const timer = setTimeout(() => {
      void import("aos").then(({ default: AOS }) => {
        if (!active) return;
        AOS.init({
          duration: 450,
          once: true,
          offset: 16,
          disableMutationObserver: false,
        });
        AOS.refresh();
      });
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
