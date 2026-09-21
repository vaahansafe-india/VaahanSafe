"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { cn } from "@vaahansafe/ui/lib/utils";
import type { QrSignalRailStates, QrReadinessNodeState } from "@/lib/qr-types";

interface QrSignalRailProps {
  states: QrSignalRailStates;
  onNodeClick?: (nodeKey: keyof QrSignalRailStates) => void;
  className?: string;
}

interface NodeConfig {
  key: keyof QrSignalRailStates;
  label: string;
  sublabel: string;
  icon: string;
}

const NODES: NodeConfig[] = [
  { key: "vehicleNode", label: "VEHICLE", sublabel: "Registered", icon: "car" },
  { key: "identityNode", label: "IDENTITY", sublabel: "Protected", icon: "shield" },
  { key: "qrNode", label: "QR HARDWARE", sublabel: "Active Link", icon: "qr" },
  { key: "contactNode", label: "CONTACTS", sublabel: "Golden Hour", icon: "phone" },
  { key: "safetyNode", label: "SAFETY VIEW", sublabel: "Public View", icon: "eye" },
];

function getNodeClasses(state: QrReadinessNodeState) {
  switch (state) {
    case "active":
      return {
        dot: "bg-emerald-500 ring-4 ring-emerald-500/20 text-white",
        line: "bg-emerald-500",
        badge: "text-emerald-600 dark:text-emerald-400 font-semibold",
        container: "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10",
      };
    case "attention":
      return {
        dot: "bg-[#e8a55a] ring-4 ring-[#e8a55a]/20 text-neutral-900",
        line: "bg-[#e8a55a]",
        badge: "text-amber-600 dark:text-amber-400 font-semibold",
        container: "border-[#e8a55a]/30 bg-[#e8a55a]/5 dark:bg-[#e8a55a]/10",
      };
    case "not_configured":
    default:
      return {
        dot: "bg-neutral-300 dark:bg-neutral-700 ring-4 ring-neutral-300/20 dark:ring-neutral-700/20 text-neutral-400",
        line: "bg-neutral-200 dark:bg-neutral-800",
        badge: "text-muted-foreground",
        container: "border-border bg-card/70 dark:bg-card/40",
      };
  }
}

export function QrSignalRail({
  states,
  onNodeClick,
  className,
}: QrSignalRailProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/80 dark:bg-card/40 p-4 sm:p-5 backdrop-blur-xs transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-[#cc785c]/10 text-[#cc785c]">
            <VaahanIcon name="activity" size={14} aria-hidden="true" />
          </div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            IDENTITY SIGNAL LIFELINE
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          Real-time D1 Readiness
        </span>
      </div>

      {/* Responsive Horizontal / Wrapped Node Track */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-2">
        {NODES.map((node, index) => {
          const state = states[node.key];
          const style = getNodeClasses(state);
          const isInteractive = Boolean(onNodeClick);

          return (
            <div
              key={node.key}
              onClick={() => onNodeClick?.(node.key)}
              role={isInteractive ? "button" : undefined}
              tabIndex={isInteractive ? 0 : undefined}
              className={cn(
                "group relative flex flex-col justify-between rounded-xl border p-3 transition-all",
                style.container,
                isInteractive && "cursor-pointer hover:border-[#cc785c]/40 hover:shadow-xs"
              )}
            >
              {/* Header with Dot & Step Index */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold tracking-wider text-muted-foreground">
                  0{index + 1}
                </span>
                <span
                  className={cn(
                    "flex size-3.5 items-center justify-center rounded-full text-[8px] font-bold transition-all",
                    style.dot
                  )}
                  aria-hidden="true"
                >
                  {state === "active" ? "✓" : state === "attention" ? "!" : "•"}
                </span>
              </div>

              {/* Node Details */}
              <div className="mt-2.5">
                <div className="font-mono text-[10.5px] font-bold tracking-wider text-foreground">
                  {node.label}
                </div>
                <div className={cn("mt-0.5 text-[10px]", style.badge)}>
                  {state === "active"
                    ? "Active"
                    : state === "attention"
                    ? "Needs Attention"
                    : "Not Configured"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
