"use client";

import React from "react";
import type { NotificationCenterCounts, NotificationViewType } from "@/lib/notifications-types";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";

interface NotificationViewRailProps {
  currentView: NotificationViewType;
  counts: NotificationCenterCounts;
  onSelectView: (view: NotificationViewType) => void;
  className?: string;
}

interface ViewItemConfig {
  id: NotificationViewType;
  label: string;
  icon: VaahanIconName;
  count: number;
  badgeVariant?: "coral" | "amber" | "default";
}

export function NotificationViewRail({
  currentView,
  counts,
  onSelectView,
  className = "",
}: NotificationViewRailProps) {
  const primaryViews: ViewItemConfig[] = [
    {
      id: "inbox",
      label: "Inbox",
      icon: "notification",
      count: counts.inbox,
    },
    {
      id: "unread",
      label: "Unread",
      icon: "eye",
      count: counts.unread,
      badgeVariant: "coral",
    },
    {
      id: "attention",
      label: "Needs Action",
      icon: "warning",
      count: counts.attention,
      badgeVariant: "amber",
    },
    {
      id: "archived",
      label: "Archived",
      icon: "document",
      count: counts.archived,
    },
  ];

  const domainViews: ViewItemConfig[] = [
    {
      id: "qr",
      label: "QR Activity",
      icon: "qr",
      count: counts.categories.qr,
    },
    {
      id: "vehicles",
      label: "Vehicles",
      icon: "car",
      count: counts.categories.vehicles,
    },
    {
      id: "orders",
      label: "Orders & Shipping",
      icon: "package",
      count: counts.categories.orders,
    },
    {
      id: "payments",
      label: "Payments",
      icon: "payment",
      count: counts.categories.payments,
    },
    {
      id: "subscription",
      label: "Subscription",
      icon: "receipt",
      count: counts.categories.subscription,
    },
    {
      id: "security",
      label: "Account & Security",
      icon: "shield",
      count: counts.categories.security,
    },
  ];

  const renderItem = (item: ViewItemConfig) => {
    const isActive = currentView === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectView(item.id)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
          isActive
            ? "bg-[#cc785c]/10 text-[#cc785c] font-semibold"
            : "text-foreground/80 hover:bg-muted/40 hover:text-foreground"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <VaahanIcon
            name={item.icon}
            size={14}
            className={isActive ? "text-[#cc785c]" : "text-muted-foreground"}
          />
          <span className="truncate">{item.label}</span>
        </div>

        {item.count > 0 && (
          <span
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
              item.badgeVariant === "coral"
                ? "bg-[#cc785c] text-white"
                : item.badgeVariant === "amber"
                ? "bg-[#e8a55a] text-black"
                : isActive
                ? "bg-[#cc785c]/20 text-[#cc785c]"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {item.count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Primary Inbox Views */}
      <div>
        <div className="px-3 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Triage Views
        </div>
        <div className="space-y-0.5">{primaryViews.map(renderItem)}</div>
      </div>

      {/* Domain Specific Views */}
      <div>
        <div className="px-3 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Activity Domains
        </div>
        <div className="space-y-0.5">{domainViews.map(renderItem)}</div>
      </div>
    </div>
  );
}
