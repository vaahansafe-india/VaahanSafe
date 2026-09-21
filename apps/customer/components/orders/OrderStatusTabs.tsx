"use client";

import { cn } from "@vaahansafe/ui/lib/utils";
import type { OrdersCategoryCounts } from "@/lib/orders-types";

interface OrderStatusTabsProps {
  activeStatus: string;
  onStatusChange: (status: string) => void;
  counts: OrdersCategoryCounts;
  className?: string;
}

const TABS: Array<{ id: string; label: string; countKey: keyof OrdersCategoryCounts }> = [
  { id: "all", label: "All", countKey: "all" },
  { id: "processing", label: "Processing", countKey: "processing" },
  { id: "shipped", label: "Shipped", countKey: "shipped" },
  { id: "delivered", label: "Delivered", countKey: "delivered" },
  { id: "cancelled", label: "Cancelled", countKey: "cancelled" },
];

export function OrderStatusTabs({
  activeStatus,
  onStatusChange,
  counts,
  className,
}: OrderStatusTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 sm:gap-1.5 overflow-x-auto border-b border-border/80 pb-px scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0",
        className
      )}
      role="tablist"
      aria-label="Order status filter"
    >
      {TABS.map((tab) => {
        const count = counts[tab.countKey];
        const isActive = activeStatus.toLowerCase() === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onStatusChange(tab.id)}
            className={cn(
              "group inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-mono text-xs font-medium whitespace-nowrap transition-all duration-150 focus-visible:outline-hidden",
              isActive
                ? "border-[#cc785c] text-[#cc785c] font-semibold"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-semibold transition-colors",
                isActive
                  ? "bg-[#cc785c]/15 text-[#cc785c]"
                  : "bg-muted text-muted-foreground group-hover:text-foreground"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
