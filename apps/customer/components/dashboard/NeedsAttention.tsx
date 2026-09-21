"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardAttentionItem } from "@/lib/dashboard-types";

interface NeedsAttentionProps {
  items: DashboardAttentionItem[];
  onAction: (target: DashboardAttentionItem["actionTarget"]) => void;
}

export function NeedsAttention({ items, onAction }: NeedsAttentionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Items Requiring Attention"
      className="rounded-2xl border border-[#e8a55a]/30 bg-[#e8a55a]/5 p-4 sm:p-5 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-[#e8a55a]/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e8a55a]/20 text-[#e8a55a]">
            <VaahanIcon name="warning" size={14} />
          </span>
          <h2 className="font-mono text-xs font-bold tracking-wider text-foreground uppercase">
            NEEDS ATTENTION ({items.length})
          </h2>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground uppercase">
          DOMAIN AUDIT
        </span>
      </div>

      <div className="mt-3 divide-y divide-[#e8a55a]/15">
        {items.map((item) => {
          const isRed = item.severity === "RED";
          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    isRed ? "bg-[#c64545]" : "bg-[#e8a55a]"
                  }`}
                />
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    {item.title}
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 sm:pl-4">
                <button
                  type="button"
                  onClick={() => onAction(item.actionTarget)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                    isRed
                      ? "border-[#c64545]/40 bg-[#c64545]/10 text-[#c64545] hover:bg-[#c64545]/20"
                      : "border-[#e8a55a]/40 bg-[#e8a55a]/10 text-[#e8a55a] hover:bg-[#e8a55a]/20"
                  }`}
                >
                  <span>{item.actionLabel}</span>
                  <VaahanIcon name="arrow-right" size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
