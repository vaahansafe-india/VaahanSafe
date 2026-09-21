"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface ContactsErrorStateProps {
  onRetry?: () => void;
  className?: string;
}

export function ContactsErrorState({ onRetry, className = "" }: ContactsErrorStateProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-2xs ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c64545]/10 text-[#c64545]">
        <VaahanIcon name="alert" size={22} />
      </div>

      <div className="mt-4 max-w-sm">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c64545]">
          Network Connection Error
        </div>
        <h3 className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground">
          We couldn&apos;t load your safety contacts.
        </h3>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Your contact configuration could not be retrieved at this moment. Please check your network connection and try again.
        </p>
      </div>

      <button
        type="button"
        onClick={handleRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-4 py-2 font-mono text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#a9583e]"
      >
        <VaahanIcon name="refresh" size={13} />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}
