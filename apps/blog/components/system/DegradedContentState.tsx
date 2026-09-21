import * as React from "react";
import { SystemSignalRail } from "./SystemSignalRail";

interface DegradedContentStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export function DegradedContentState({
  title = "Degraded Asset Delivery",
  message = "Some rich media assets could not be retrieved from object storage. The article text and structured content remain fully intact and verified.",
  className = "",
}: DegradedContentStateProps) {
  return (
    <aside
      role="status"
      aria-label={title}
      className={`rounded-xl border border-[#e6dfd8] bg-[#f5f0e8]/60 p-4 sm:p-5 font-sans text-xs text-[#6c6a64] dark:border-[#2e2b27] dark:bg-[#1f1e1b]/60 dark:text-[#a09d96] ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span>PARTIAL ASSET FALLBACK</span>
          </div>
          <p className="max-w-md font-sans text-xs leading-relaxed text-[#3d3d3a] dark:text-[#c2bfb6]">
            {message}
          </p>
        </div>
        <div className="sm:shrink-0">
          <SystemSignalRail type="DEGRADED" className="py-0" />
        </div>
      </div>
    </aside>
  );
}
