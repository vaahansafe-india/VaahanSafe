"use client";

import React, { useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components/badge";

export interface QrIdentityBadgeProps {
  publicId: string;
  visibleCode?: string;
  statusLabel?: string;
  compact?: boolean;
}

export function QrIdentityBadge({
  publicId,
  visibleCode,
  statusLabel = "ACTIVE",
  compact = false,
}: QrIdentityBadgeProps) {
  const [copied, setCopied] = useState(false);
  const displayId =
    visibleCode || (publicId.startsWith("VS-") ? publicId : `VS-${publicId}`);

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(displayId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignore clipboard write denial
    }
  }

  return (
    <div
      className={`flex w-full flex-wrap items-center justify-between gap-3 ${compact ? "" : "rounded-xl border border-border bg-card p-4 sm:p-5"}`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
          VaahanSafe ID
        </span>
        <span className="block break-all font-mono text-base font-semibold tracking-wide text-foreground sm:text-lg">
          {displayId}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!compact && (
          <Badge
            variant="outline"
            className="font-mono text-[10px] tracking-wider text-emerald-700 dark:text-emerald-400 border-emerald-600/30 bg-emerald-500/5 px-2 py-0.5"
          >
            {statusLabel}
          </Badge>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          title="Copy VaahanSafe ID"
          aria-label="Copy VaahanSafe ID to clipboard"
        >
          {copied ? (
            <VaahanIcon name="check" size={14} className="text-emerald-600" />
          ) : (
            <VaahanIcon name="copy" size={14} />
          )}
        </button>
        <span role="status" className="sr-only">
          {copied ? "VaahanSafe ID copied" : ""}
        </span>
      </div>
    </div>
  );
}
