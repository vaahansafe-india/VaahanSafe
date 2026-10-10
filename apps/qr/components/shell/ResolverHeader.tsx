import React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import { getWebUrl } from "@vaahansafe/config";

export function ResolverHeader() {
  return (
    <header className="w-full space-y-4 border-b border-border pb-4 sm:pb-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
      {/* Official VaahanSafe App Logo */}
      <Link
        href="/"
        className="inline-flex items-center min-w-0 shrink transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg py-1 px-1 -ml-1"
        aria-label="VaahanSafe Home"
      >
        <VaahanSafeLogo size="sm" variant="brand" showTagline={false} />
      </Link>

      {/* Surface Context & Support */}
      <div className="flex shrink-0 items-center">
        <a
          href={`${getWebUrl()}/help`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="VaahanSafe Safety & Help Support"
          title="Safety & Help Support"
        >
          <VaahanIcon name="help" size={17} />
          <span>Help</span>
        </a>
      </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 text-primary"><VaahanIcon name="shield" size={15} />Vehicle safety view</span>
        <span>Only owner-approved details</span>
      </div>
    </header>
  );
}
