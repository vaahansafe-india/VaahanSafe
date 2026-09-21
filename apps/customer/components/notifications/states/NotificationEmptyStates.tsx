"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function NotificationEmptyState({ isFreshAccount = false }: { isFreshAccount?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-border/80 bg-card/60 shadow-2xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground">
        <VaahanIcon name="check" size={22} className="text-[#5db8a6]" />
      </div>

      <h3 className="mt-4 font-serif text-xl font-medium text-foreground">
        {isFreshAccount ? "Your Activity Starts Here" : "Inbox Clear"}
      </h3>

      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
        {isFreshAccount
          ? "Notifications about your QR identities, vehicles, orders and safety dispatches will appear here."
          : "You're up to date with your VaahanSafe activity across your vehicles, orders, and security alerts."}
      </p>
    </div>
  );
}

export function NotificationUnreadEmpty({ onViewInbox }: { onViewInbox: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-border/80 bg-card/60 shadow-2xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground">
        <VaahanIcon name="eye" size={20} className="text-[#cc785c]" />
      </div>

      <h3 className="mt-4 font-serif text-xl font-medium text-foreground">
        No Unread Notifications
      </h3>

      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        You&apos;ve caught up with all active alerts and updates.
      </p>

      <button
        type="button"
        onClick={onViewInbox}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-xs font-semibold text-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c]"
      >
        <span>View Full Inbox</span>
      </button>
    </div>
  );
}

export function NotificationFilteredEmpty({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-border/80 bg-card/60 shadow-2xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground">
        <VaahanIcon name="search" size={20} />
      </div>

      <h3 className="mt-4 font-serif text-xl font-medium text-foreground">
        No Notifications Match Filters
      </h3>

      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Try adjusting your search keyword or clearing the active category, vehicle, and status filters.
      </p>

      <button
        type="button"
        onClick={onClearFilters}
        className="mt-4 font-mono text-xs font-semibold text-[#cc785c] hover:underline"
      >
        Clear All Filters &rarr;
      </button>
    </div>
  );
}
