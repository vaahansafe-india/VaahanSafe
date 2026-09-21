"use client";

import React, { useEffect, useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full my-3 p-2.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2 transition-all"
    >
      <div className="flex items-center gap-2">
        <VaahanIcon name="offline" size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
          Device Offline
        </span>
        <span className="text-muted-foreground text-[11px] hidden sm:inline">
          &mdash; Displaying rendered profile. Network actions may be limited.
        </span>
      </div>
      <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
        CACHED VIEW
      </span>
    </div>
  );
}
