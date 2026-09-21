"use client";

import * as React from "react";

/**
 * ClientErrorSanitizer prevents non-Error DOM objects (such as browser resource
 * error events, Webpack HMR disconnect events, or aborted navigation events)
 * from propagating to window.onerror and triggering the Next.js Dev Overlay
 * with generic "[object Event]".
 */
export function ClientErrorSanitizer() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleWindowError = (event: ErrorEvent) => {
      // 1. If error property is missing or null, and the target is an HTML element
      // (e.g. <img> or <script> resource load error), prevent it from crashing the overlay
      if (!event.error && event.target && event.target !== window) {
        event.preventDefault?.();
        return;
      }

      // 2. If an event object or non-Error was thrown as the error value
      if (event.error && !(event.error instanceof Error)) {
        event.preventDefault?.();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Next.js App Router navigation cancellation or DOM Event rejection
      if (
        event.reason instanceof Event ||
        (typeof event.reason === "object" &&
          event.reason !== null &&
          !(event.reason instanceof Error))
      ) {
        event.preventDefault?.();
      }
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
