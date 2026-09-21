"use client";

import * as React from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";

export type NodeStatus = "ACTIVE" | "READY" | "ATTENTION" | "NOT_CONFIGURED" | "NOT_AVAILABLE";

interface ServiceNodeProps {
  label: string;
  subLabel: string;
  status: NodeStatus;
  icon: VaahanIconName;
  isActiveNode?: boolean;
  onClick: () => void;
}

export function ServiceNode({
  label,
  subLabel,
  status,
  icon,
  isActiveNode,
  onClick,
}: ServiceNodeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "ACTIVE":
        return {
          dot: "bg-[#5db8a6]",
          ring: "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6]",
          badge: "text-[#5db8a6] bg-[#5db8a6]/10",
        };
      case "READY":
        return {
          dot: "bg-[#cc785c]",
          ring: "border-[#cc785c]/40 bg-[#cc785c]/10 text-[#cc785c]",
          badge: "text-[#cc785c] bg-[#cc785c]/10",
        };
      case "ATTENTION":
        return {
          dot: "bg-[#e8a55a]",
          ring: "border-[#e8a55a]/40 bg-[#e8a55a]/10 text-[#e8a55a]",
          badge: "text-[#e8a55a] bg-[#e8a55a]/10",
        };
      case "NOT_CONFIGURED":
      case "NOT_AVAILABLE":
      default:
        return {
          dot: "bg-muted-foreground",
          ring: "border-border bg-muted/40 text-muted-foreground",
          badge: "text-muted-foreground bg-muted",
        };
    }
  };

  const colors = getStatusColor();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-200 hover:border-[#cc785c]/40 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30 ${
        isActiveNode ? "border-[#cc785c]/40 bg-card shadow-xs" : "border-border/60 bg-card/60"
      }`}
    >
      {/* Icon Ring with Status Indicator Dot */}
      <div className="relative mb-2">
        <div
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border transition-transform group-hover:scale-105 ${colors.ring}`}
        >
          <VaahanIcon name={icon} size={18} />
        </div>
        <span
          className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-background ${colors.dot} ${
            status === "ACTIVE" ? "animate-pulse" : ""
          }`}
        />
      </div>

      <span className="font-mono text-[11px] sm:text-xs font-bold tracking-wider text-foreground">
        {label}
      </span>
      <span className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1 max-w-[120px]">
        {subLabel}
      </span>
      <span
        className={`mt-1.5 px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider font-semibold ${colors.badge}`}
      >
        {status.replace(/_/g, " ")}
      </span>
    </button>
  );
}
