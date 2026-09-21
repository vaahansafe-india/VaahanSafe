"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface NotificationCenterHeaderProps {
  onOpenSettings: () => void;
  unreadCount: number;
}

export function NotificationCenterHeader({
  onOpenSettings,
  unreadCount,
}: NotificationCenterHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 sm:gap-4 w-full min-w-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
            Activity Center
          </span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#cc785c]/15 px-2 py-0.5 font-mono text-[9px] font-bold text-[#cc785c]">
              {unreadCount} Unread
            </span>
          )}
        </div>
        <h1 className="mt-1 font-serif text-2xl sm:text-4xl font-medium tracking-tight text-foreground leading-tight">
          Notifications
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-xl">
          Important activity across your vehicles, QR identities, orders and VaahanSafe account.
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c] active:scale-98 shrink-0"
        title="Notification Delivery Settings"
        aria-label="Notification Delivery Settings"
      >
        <VaahanIcon name="settings" size={16} />
      </button>
    </div>
  );
}
