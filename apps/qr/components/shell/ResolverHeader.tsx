import React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import { Badge } from "@vaahansafe/ui/components";

export function ResolverHeader() {
  return (
    <header className="w-full flex items-center justify-between gap-3 pb-5 sm:pb-6 border-b border-border/60">
      {/* Official VaahanSafe App Logo */}
      <Link
        href="/"
        className="inline-flex items-center min-w-0 shrink transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg py-1 px-1 -ml-1"
        aria-label="VaahanSafe Home"
      >
        <VaahanSafeLogo size="sm" variant="brand" showTagline={false} />
      </Link>

      {/* Surface Context & Support */}
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant="outline"
          className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground border-border px-2 py-0.5 whitespace-nowrap shrink-0"
        >
          <span className="hidden sm:inline">Public </span>Resolver
        </Badge>
        <a
          href="https://vaahansafe.com/help"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/50 inline-flex items-center justify-center shrink-0"
          aria-label="VaahanSafe Safety & Help Support"
          title="Safety & Help Support"
        >
          <VaahanIcon name="help" size={16} />
        </a>
      </div>
    </header>
  );
}
