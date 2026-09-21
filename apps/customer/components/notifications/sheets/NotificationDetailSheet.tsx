"use client";

import React from "react";
import type { NotificationItem } from "@/lib/notifications-types";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@vaahansafe/ui";

interface NotificationDetailSheetProps {
  notification: NotificationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleRead: (notification: NotificationItem) => void;
  onArchive: (notification: NotificationItem) => void;
}

const CATEGORY_LABEL_MAP: Record<string, string> = {
  SAFETY: "Safety & QR Identity",
  COMMERCE: "Billing & Payments",
  FULFILMENT: "Orders & Shipping",
  SUBSCRIPTION: "Subscription & Plans",
  SECURITY: "Account & Security",
  ACCOUNT: "Identity & Profile",
  SUPPORT: "Support Case",
  SYSTEM: "System Notice",
};

export function NotificationDetailSheet({
  notification,
  open,
  onOpenChange,
  onToggleRead,
  onArchive,
}: NotificationDetailSheetProps) {
  if (!notification) return null;

  const categoryLabel = CATEGORY_LABEL_MAP[notification.category] || notification.category;
  const exactDate = new Date(notification.createdAt).toLocaleString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col justify-between bg-card text-foreground overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          {/* Header with reserved padding for close icon */}
          <SheetHeader className="text-left pr-14 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
                {categoryLabel}
              </span>
              {notification.attentionStatus === "ACTION_REQUIRED" && (
                <span className="rounded-full bg-[#e8a55a]/20 px-2 py-0.5 font-mono text-[9px] font-bold text-[#e8a55a]">
                  Action Required
                </span>
              )}
            </div>

            <SheetTitle className="font-serif text-2xl font-medium tracking-tight text-foreground leading-snug">
              {notification.title}
            </SheetTitle>

            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>{notification.relativeTime}</span>
              <span>&bull;</span>
              <span>{exactDate}</span>
            </div>
          </SheetHeader>

          {/* Activity Rail Relationship Diagram */}
          <div className="rounded-2xl border border-border/80 bg-background/60 p-4 space-y-3.5">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Event Relationship Rail
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Step 1: Event */}
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c]/15 text-[#cc785c] shrink-0 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase block">Event Type</span>
                  <span className="font-medium text-foreground">{notification.eventType}</span>
                </div>
              </div>

              {/* Step 2: Context */}
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted/60 text-muted-foreground shrink-0 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase block">Associated Resource</span>
                  <span className="font-medium text-foreground">{notification.contextLabel}</span>
                  {notification.contextIdentifier && (
                    <span className="text-muted-foreground text-[11px] block mt-0.5">
                      Ref: {notification.contextIdentifier}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 3: Priority */}
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted/60 text-muted-foreground shrink-0 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase block">Classification</span>
                  <span className="font-medium text-foreground">
                    {notification.priority} Priority &bull; {notification.attentionStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Safe Event Body Content */}
          <div className="space-y-2">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Notification Details
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/40 p-4 text-xs sm:text-sm leading-relaxed text-foreground/90">
              {notification.bodySafe}
            </div>
          </div>

          {/* Quick Status Toggles */}
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">Status:</span>
              <span className={`font-mono font-semibold ${notification.isRead ? "text-foreground" : "text-[#cc785c]"}`}>
                {notification.isRead ? "Read" : "Unread"}
              </span>
              {notification.isArchived && (
                <span className="font-mono text-muted-foreground">&bull; Archived</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleRead(notification)}
                className="font-mono text-xs font-semibold text-[#cc785c] hover:underline"
              >
                {notification.isRead ? "Mark as Unread" : "Mark as Read"}
              </button>

              <span className="text-muted-foreground/40">&bull;</span>

              <button
                type="button"
                onClick={() => {
                  onArchive(notification);
                  onOpenChange(false);
                }}
                className="font-mono text-xs text-muted-foreground hover:text-foreground underline"
              >
                {notification.isArchived ? "Unarchive" : "Archive"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border/70 bg-card/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-border bg-background px-4 py-2 font-mono text-xs font-semibold text-foreground transition-colors hover:bg-muted/40"
          >
            Close
          </button>

          {notification.actionHref && (
            <a
              href={notification.actionHref}
              className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-4 py-2 font-mono text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#a9583e] active:scale-98"
            >
              <span>{notification.actionLabel}</span>
              <VaahanIcon name="arrow-right" size={12} />
            </a>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
