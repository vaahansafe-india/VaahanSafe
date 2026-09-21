"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";
import { getStatusUrl } from "@vaahansafe/config";

export interface ResolverErrorStateProps {
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function ResolverErrorState({
  onRetry,
  title = "Service Temporarily Unavailable",
  description = "We couldn't load this VaahanSafe identity right now. Please try again in a moment.",
}: ResolverErrorStateProps) {
  const statusUrl = getStatusUrl();

  function handleRetry() {
    if (onRetry) {
      onRetry();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  return (
    <div className="w-full p-6 rounded-2xl border border-border/80 bg-card text-center space-y-5 shadow-xs animate-in fade-in duration-300">
      <div className="mx-auto size-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center">
        <VaahanIcon name="alert" size={24} />
      </div>

      <div className="space-y-1.5">
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider text-amber-700 dark:text-amber-400 border-amber-600/30 bg-amber-500/5 uppercase px-2.5 py-0.5"
        >
          Temporary Interruption
        </Badge>
        <h1 className="text-xl font-serif font-medium text-foreground tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
        <button
          type="button"
          onClick={handleRetry}
          className="min-h-[44px] px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-xs w-full"
        >
          <span>Try Again</span>
        </button>
        <a
          href={statusUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-border w-full sm:w-auto shrink-0"
        >
          <span>System Status</span>
        </a>
      </div>
    </div>
  );
}
