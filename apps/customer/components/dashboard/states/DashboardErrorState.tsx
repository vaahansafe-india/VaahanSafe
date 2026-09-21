"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface DashboardErrorStateProps {
  onRetry?: () => void;
}

export function DashboardErrorState({ onRetry }: DashboardErrorStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8a55a]/10 text-[#e8a55a]">
        <VaahanIcon name="alert" size={28} />
      </div>

      <div className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        SERVICE STATUS NOTICE
      </div>

      <h2 className="mt-2 font-serif text-2xl font-medium text-foreground sm:text-3xl">
        We couldn&apos;t load your vehicle command surface right now.
      </h2>

      <p className="mt-2 max-w-md text-xs sm:text-sm text-muted-foreground">
        A temporary operational delay occurred while verifying your vehicle identity records. Your safety stickers remain active and responsive.
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-5 py-2.5 font-mono text-xs font-semibold text-white transition-all hover:bg-[#a9583e]"
        >
          <VaahanIcon name="refresh" size={14} />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}
