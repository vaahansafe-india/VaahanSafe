"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface AdminRouteProgressContextValue {
  isNavigating: boolean;
  pendingPathname: string | null;
  startNavigation: (href?: string) => void;
  completeNavigation: () => void;
}

const AdminRouteProgressContext = createContext<AdminRouteProgressContextValue>({
  isNavigating: false,
  pendingPathname: null,
  startNavigation: () => {},
  completeNavigation: () => {},
});

export function useAdminRouteProgress() {
  return useContext(AdminRouteProgressContext);
}

/**
 * Stage-driven indeterminate progress controller for route navigation.
 * Progression:
 * 0% -> 25% immediately (80ms)
 * 25% -> 60% gradually (250ms)
 * 60% -> 82% slowly (over 2-3s)
 * On route resolve: 100% quickly (100ms) -> fade out (150ms).
 * Safety timeout: 8s to prevent stuck bars if navigation aborts.
 */
export function AdminRouteProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingPathname, setPendingPathname] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const activeNavigationRef = useRef(false);
  const currentPathRef = useRef(pathname);

  // Keep track of current path to ignore same-path clicks
  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const completeNavigation = useCallback(() => {
    if (!activeNavigationRef.current) return;
    activeNavigationRef.current = false;
    clearAllTimers();

    // Snap to 100% immediately
    setProgress(100);

    // Fade out after completion
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 120);

    // Reset to idle after fade
    const resetTimer = setTimeout(() => {
      setVisible(false);
      setFading(false);
      setProgress(0);
      setIsNavigating(false);
      setPendingPathname(null);
    }, 280);

    timersRef.current.push(fadeTimer, resetTimer);
  }, [clearAllTimers]);

  const startNavigation = useCallback(
    (targetHref?: string) => {
      clearAllTimers();
      activeNavigationRef.current = true;
      setIsNavigating(true);

      if (targetHref) {
        try {
          const url = new URL(targetHref, window.location.origin);
          setPendingPathname(url.pathname);
        } catch {
          setPendingPathname(null);
        }
      }

      setVisible(true);
      setFading(false);
      setProgress(0);

      // Stage 1: Quick burst to 25%
      const stage1 = setTimeout(() => {
        if (!activeNavigationRef.current) return;
        setProgress(25);
      }, 30);

      // Stage 2: Steady advance to 60%
      const stage2 = setTimeout(() => {
        if (!activeNavigationRef.current) return;
        setProgress(60);
      }, 250);

      // Stage 3: Slow crawl to 82%
      const stage3 = setTimeout(() => {
        if (!activeNavigationRef.current) return;
        setProgress(82);
      }, 900);

      // Safety timeout (8s max) to prevent indefinite hanging
      const safetyTimeout = setTimeout(() => {
        if (activeNavigationRef.current) {
          completeNavigation();
        }
      }, 8000);

      timersRef.current.push(stage1, stage2, stage3, safetyTimeout);
    },
    [clearAllTimers, completeNavigation],
  );

  // Complete progress on pathname or searchParams change
  useEffect(() => {
    if (activeNavigationRef.current) {
      completeNavigation();
    }
  }, [pathname, searchParams, completeNavigation]);

  // Global click listener for internal route navigation links
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      // Don't intercept modified clicks (open in new tab, etc.)
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      // Find closest anchor tag
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore hash links, external links, javascript/mailto/tel links, download links
      if (
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.getAttribute("target") === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      try {
        const destination = new URL(href, window.location.origin);
        // Only internal links on same origin
        if (destination.origin !== window.location.origin) return;

        // Skip if exact same path and query
        const currentUrl = new URL(window.location.href);
        if (
          destination.pathname === currentUrl.pathname &&
          destination.search === currentUrl.search
        ) {
          return;
        }

        // Trigger immediate progress
        startNavigation(href);
      } catch {
        // Fallback: ignore unparseable URLs
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      clearAllTimers();
    };
  }, [startNavigation, clearAllTimers]);

  return (
    <AdminRouteProgressContext.Provider
      value={{
        isNavigating,
        pendingPathname,
        startNavigation,
        completeNavigation,
      }}
    >
      {/* 2.5px Route Progress Line fixed at top of admin chrome */}
      {visible && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Loading page"
          className="admin-route-progress-bar"
          style={{
            transform: `scaleX(${progress / 100})`,
            opacity: fading ? 0 : 1,
          }}
        />
      )}
      {children}
    </AdminRouteProgressContext.Provider>
  );
}
