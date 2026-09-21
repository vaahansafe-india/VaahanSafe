"use client";

import React from "react";
import type { NotificationItem } from "@/lib/notifications-types";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@vaahansafe/ui";

interface NotificationEventProps {
  notification: NotificationItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetails: (notification: NotificationItem) => void;
  onToggleRead: (notification: NotificationItem) => void;
  onArchive: (notification: NotificationItem) => void;
  isLastInGroup?: boolean;
}

const CATEGORY_ICON_MAP: Record<string, VaahanIconName> = {
  SAFETY: "qr",
  COMMERCE: "payment",
  FULFILMENT: "package",
  SUBSCRIPTION: "receipt",
  SECURITY: "shield",
  ACCOUNT: "user",
  SUPPORT: "help",
  SYSTEM: "info",
};

const CONTEXT_ICON_MAP: Record<string, VaahanIconName> = {
  VEHICLE: "car",
  QR: "qr",
  ORDER: "package",
  PAYMENT: "credit-card",
  SUBSCRIPTION: "receipt",
  SECURITY: "shield",
  ACCOUNT: "user",
  SUPPORT: "help",
};

export function NotificationEvent({
  notification,
  isSelected,
  onToggleSelect,
  onOpenDetails,
  onToggleRead,
  onArchive,
  isLastInGroup = false,
}: NotificationEventProps) {
  const iconName = CATEGORY_ICON_MAP[notification.category] || "notification";
  const contextIcon = CONTEXT_ICON_MAP[notification.contextType] || "car";

  const handleRowClick = (e: React.MouseEvent) => {
    // If clicking directly on a button, link or checkbox, let that handle it
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest('[role="menuitem"]')
    ) {
      return;
    }
    onOpenDetails(notification);
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group relative flex items-center justify-between gap-2.5 sm:gap-4 py-3 sm:py-3.5 px-2.5 sm:px-4 transition-colors cursor-pointer rounded-2xl ${
        notification.isRead
          ? "hover:bg-muted/30"
          : "bg-[#cc785c]/[0.03] hover:bg-[#cc785c]/[0.07]"
      } ${isSelected ? "ring-1 ring-[#cc785c] bg-[#cc785c]/[0.08]" : ""}`}
    >
      {/* Left: Checkbox, Activity Rail Node, Icon, Content */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        {/* Selection Checkbox */}
        <div className="shrink-0 flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(notification.id);
            }}
            className="h-4 w-4 rounded border-input text-[#cc785c] focus:ring-1 focus:ring-[#cc785c] accent-[#cc785c] cursor-pointer"
            aria-label={`Select notification: ${notification.title}`}
          />
        </div>

        {/* Activity Rail Event Node */}
        <div className="relative shrink-0 flex items-center justify-center w-3">
          <span
            className={`h-2 w-2 rounded-full transition-colors ${
              notification.isRead
                ? "bg-muted-foreground/40"
                : "bg-[#cc785c] ring-2 ring-[#cc785c]/20"
            }`}
            aria-hidden="true"
          />
        </div>

        {/* Type Icon Container (36px) */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            notification.attentionStatus === "ACTION_REQUIRED"
              ? "border-[#e8a55a]/40 bg-[#e8a55a]/10 text-[#e8a55a]"
              : notification.category === "SECURITY"
              ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6]"
              : !notification.isRead
              ? "border-[#cc785c]/30 bg-[#cc785c]/10 text-[#cc785c]"
              : "border-border/80 bg-muted/30 text-muted-foreground"
          }`}
        >
          <VaahanIcon name={iconName} size={16} />
        </div>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1">
          {/* Row 1: Title + Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h4
              className={`truncate text-xs sm:text-sm text-foreground transition-colors group-hover:text-[#cc785c] ${
                notification.isRead ? "font-normal" : "font-semibold"
              }`}
            >
              {notification.title}
            </h4>

            {notification.attentionStatus === "ACTION_REQUIRED" && (
              <span className="shrink-0 rounded-full bg-[#e8a55a]/20 px-1.5 py-0.5 font-mono text-[8px] sm:text-[9px] font-bold text-[#e8a55a]">
                ACTION REQUIRED
              </span>
            )}

            {!notification.isRead && notification.attentionStatus !== "ACTION_REQUIRED" && (
              <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-[#cc785c]" aria-label="Unread" />
            )}
          </div>

          {/* Row 2: Context Pill + Safe Snippet + Time */}
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            {/* Context Pill */}
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground/80 shrink-0 max-w-[120px] sm:max-w-[160px]">
              <VaahanIcon name={contextIcon} size={10} className="text-muted-foreground shrink-0" />
              <span className="truncate">{notification.contextLabel}</span>
            </span>

            <span className="text-muted-foreground/40 hidden xs:inline shrink-0">&bull;</span>

            <span className="truncate hidden sm:inline text-muted-foreground min-w-0 flex-1">
              {notification.bodySafe}
            </span>

            <span className="text-muted-foreground/40 hidden sm:inline shrink-0">&bull;</span>

            <span className="font-mono text-[10px] sm:text-xs text-muted-foreground shrink-0">
              {notification.relativeTime}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Primary Action & Menu Actions (Single-row layout) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {notification.actionHref && (
          <a
            href={notification.actionHref}
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-border bg-background px-2.5 py-1.5 font-mono text-xs font-semibold text-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c]"
          >
            <span>{notification.actionLabel}</span>
          </a>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground shrink-0"
              aria-label="More notification actions"
            >
              <VaahanIcon name="more" size={14} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5">
            <DropdownMenuItem
              onClick={() => onOpenDetails(notification)}
              className="gap-2 text-xs font-medium cursor-pointer"
            >
              <VaahanIcon name="eye" size={14} />
              <span>View Details</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onToggleRead(notification)}
              className="gap-2 text-xs font-medium cursor-pointer"
            >
              <VaahanIcon name={notification.isRead ? "eye-off" : "check"} size={14} />
              <span>{notification.isRead ? "Mark as Unread" : "Mark as Read"}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onArchive(notification)}
              className="gap-2 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <VaahanIcon name="document" size={14} />
              <span>{notification.isArchived ? "Move to Inbox" : "Archive"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
