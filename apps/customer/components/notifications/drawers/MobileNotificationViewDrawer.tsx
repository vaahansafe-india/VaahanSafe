"use client";

import React from "react";
import type { NotificationCenterCounts, NotificationViewType } from "@/lib/notifications-types";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@vaahansafe/ui";
import { NotificationViewRail } from "../views/NotificationViewRail";

interface MobileNotificationViewDrawerProps {
  currentView: NotificationViewType;
  counts: NotificationCenterCounts;
  onSelectView: (view: NotificationViewType) => void;
}

const VIEW_LABEL_MAP: Record<NotificationViewType, string> = {
  inbox: "Inbox",
  unread: "Unread",
  attention: "Needs Action",
  archived: "Archived",
  qr: "QR Activity",
  vehicles: "Vehicles",
  orders: "Orders & Shipping",
  payments: "Payments",
  subscription: "Subscription",
  security: "Account & Security",
};

export function MobileNotificationViewDrawer({
  currentView,
  counts,
  onSelectView,
}: MobileNotificationViewDrawerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (view: NotificationViewType) => {
    onSelectView(view);
    setOpen(false);
  };

  const activeLabel = VIEW_LABEL_MAP[currentView] || "Inbox";

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 font-mono text-xs font-semibold text-foreground transition-colors hover:border-[#cc785c] active:scale-98"
          aria-label="Select notification view"
        >
          <VaahanIcon name="menu" size={13} className="text-[#cc785c]" />
          <span>{activeLabel}</span>
          <VaahanIcon name="chevron-down" size={11} className="opacity-60" />
        </button>
      </DrawerTrigger>

      <DrawerContent className="p-4 max-h-[85vh] overflow-y-auto">
        <DrawerHeader className="px-1 pb-3 text-left">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            Activity Navigation
          </span>
          <DrawerTitle className="font-serif text-xl font-medium text-foreground">
            Notification Views
          </DrawerTitle>
        </DrawerHeader>

        <div className="py-2">
          <NotificationViewRail
            currentView={currentView}
            counts={counts}
            onSelectView={handleSelect}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
