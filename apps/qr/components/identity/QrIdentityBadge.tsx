"use client";

import React, { useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export interface QrIdentityBadgeProps {
  publicId: string;
  visibleCode?: string;
  statusLabel?: string;
}

export function QrIdentityBadge({
  publicId,
  visibleCode,
  statusLabel = "ACTIVE",
}: QrIdentityBadgeProps) {
  const [copied, setCopied] = useState(false);
  const displayId = visibleCode || (publicId.startsWith("VS-") ? publicId : `VS-${publicId}`);

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
    <div className="w-full flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/80 shadow-xs">
      <div className="space-y-0.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
          VaahanSafe Identity
        </span>
        <span className="font-mono text-base font-bold text-foreground tracking-wider block">
          {displayId}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider text-emerald-700 dark:text-emerald-400 border-emerald-600/30 bg-emerald-500/5 px-2 py-0.5"
        >
          {statusLabel}
        </Badge>
        <button
          type="button"
          onClick={handleCopy}
          className="size-8 rounded-lg border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors text-xs"
          title="Copy VaahanSafe ID"
          aria-label="Copy VaahanSafe ID to clipboard"
        >
          {copied ? (
            <VaahanIcon name="check" size={14} className="text-emerald-600" />
          ) : (
            <VaahanIcon name="copy" size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
