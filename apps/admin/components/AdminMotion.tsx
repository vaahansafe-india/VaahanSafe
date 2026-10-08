"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function AdminMotion() {
  const pathname = usePathname();
  useEffect(() => {
    let active = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void import("aos").then(({ default: AOS }) => {
      if (!active) return;
      AOS.init({
        duration: 450,
        once: true,
        offset: 16,
        startEvent: "DOMContentLoaded",
      });
      AOS.refreshHard();
    });
    return () => {
      active = false;
    };
  }, [pathname]);
  return null;
}
