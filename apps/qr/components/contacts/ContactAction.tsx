"use client";

import React, { useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export interface ContactActionProps {
  phone: string;
  isPrimary?: boolean;
  label?: string;
}

export function ContactAction({
  phone,
  isPrimary = false,
  label = "Call Contact",
}: ContactActionProps) {
  const [copied, setCopied] = useState(false);
  const cleanPhone = phone.trim();

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(cleanPhone);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignore clipboard denial
    }
  }

  if (isPrimary) {
    return (
      <div className="flex items-center gap-2 w-full pt-1">
        <a
          href={`tel:${cleanPhone}`}
          className="flex-1 min-h-[48px] px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-xs"
          aria-label={`Call emergency contact at ${cleanPhone}`}
        >
          <VaahanIcon name="phone" size={18} />
          <span>{label}</span>
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="min-h-[48px] px-3.5 rounded-xl border border-border bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors text-xs"
          title="Copy phone number"
          aria-label="Copy phone number to clipboard"
        >
          {copied ? (
            <VaahanIcon name="check" size={16} className="text-emerald-600" />
          ) : (
            <VaahanIcon name="copy" size={16} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="size-9 rounded-lg border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors text-xs"
        title="Copy number"
        aria-label="Copy contact phone number"
      >
        {copied ? (
          <VaahanIcon name="check" size={14} className="text-emerald-600" />
        ) : (
          <VaahanIcon name="copy" size={14} />
        )}
      </button>
      <a
        href={`tel:${cleanPhone}`}
        className="min-h-[38px] px-3.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        aria-label={`Call contact at ${cleanPhone}`}
      >
        <VaahanIcon name="phone" size={14} />
        <span>Call</span>
      </a>
    </div>
  );
}
