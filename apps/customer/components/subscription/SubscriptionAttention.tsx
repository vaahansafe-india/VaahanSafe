"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { SubscriptionAttentionItem } from "@/lib/subscription-types";

interface SubscriptionAttentionProps {
  items: SubscriptionAttentionItem[];
  onAction: (target: SubscriptionAttentionItem["actionTarget"]) => void;
}

export function SubscriptionAttention({ items, onAction }: SubscriptionAttentionProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isAmber = item.severity === "AMBER";
        const isRed = item.severity === "RED";

        return (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border transition-all ${
              isRed
                ? "border-[#c64545]/30 bg-[#c64545]/[0.06]"
                : isAmber
                ? "border-[#e8a55a]/30 bg-[#e8a55a]/[0.06]"
                : "border-[#5db8a6]/30 bg-[#5db8a6]/[0.06]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  isRed
                    ? "bg-[#c64545]/15 text-[#c64545]"
                    : isAmber
                    ? "bg-[#e8a55a]/15 text-[#e8a55a]"
                    : "bg-[#5db8a6]/15 text-[#5db8a6]"
                }`}
              >
                <VaahanIcon name={isRed || isAmber ? "warning" : "info"} size={14} />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Needs Attention / 0{index + 1}
                  </span>
                  <span className="font-medium text-xs text-foreground font-mono font-bold">
                    {item.title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAction(item.actionTarget)}
              className="self-end sm:self-center shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <span>{item.actionLabel}</span>
              <VaahanIcon name="arrow-right" size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
