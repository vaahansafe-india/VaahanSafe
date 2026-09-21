"use client";

import * as React from "react";
import { useNetworkStatus } from "./NetworkStatusProvider";

export function NetworkStatusIndicator({ className = "" }: { className?: string }) {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-[#e6dfd8] bg-[#faf9f5]/95 px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-[#6c6a64] shadow-md backdrop-blur-sm dark:border-[#2e2b27] dark:bg-[#181715]/95 dark:text-[#a09d96] animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#8e8b82] opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8e8b82]" />
      </span>
      <span>OFFLINE &bull; LOCAL VIEW</span>
    </aside>
  );
}
