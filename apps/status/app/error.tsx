"use client";

import * as React from "react";
import Link from "next/link";
import { getWebUrl } from "@vaahansafe/config";
import { StatusHeader } from "../components/status/shell/StatusHeader";
import { StatusFooter } from "../components/status/shell/StatusFooter";

interface StatusErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StatusError({ error, reset }: StatusErrorProps) {
  const webUrl = getWebUrl();

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[Status Page Operational Error]", error?.digest || error?.message);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      <StatusHeader isDegradedOrOutage />

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl space-y-8">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#c64545] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c64545]" />
            <span>SYSTEM / 500 &bull; STATUS UNAVAILABLE</span>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-5xl sm:text-6xl text-[#141413]/25 dark:text-[#faf9f5]/25">
              500
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.1] tracking-tight">
              Current status information could not be loaded.
            </h1>
          </div>

          {/* Explicit Invariant Note: Distinguish status surface failure from platform health */}
          <div className="rounded-xl border border-[#c64545]/20 bg-[#fdf8f8] p-4 text-xs font-sans text-[#3d3d3a] dark:bg-[#201616] dark:text-[#d4d1c9] leading-relaxed">
            <strong>Important distinction:</strong> This notice indicates a temporary rendering interruption on the status reporting surface itself. It does not imply that core VaahanSafe vehicle QR access or customer systems are unavailable.
          </div>

          <p className="font-sans text-xs sm:text-sm text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
            The status telemetry engine encountered an error fetching active metrics. You may retry reloading the operational feed.
            {error?.digest && (
              <span className="block pt-1 font-mono text-[10px] text-[#8e8b82]">
                REF: {error.digest}
              </span>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex h-11 items-center rounded-full bg-[#141413] px-6 font-sans text-xs font-medium text-[#faf9f5] hover:bg-[#3d3d3a] dark:bg-[#faf9f5] dark:text-[#141413] transition-colors"
            >
              Try Again
            </button>
            <a
              href={webUrl}
              className="inline-flex h-11 items-center px-4 font-mono text-xs uppercase tracking-wider text-[#6c6a64] hover:text-[#cc785c] transition-colors"
            >
              VaahanSafe Home &rarr;
            </a>
          </div>
        </div>
      </main>

      <StatusFooter />
    </div>
  );
}
