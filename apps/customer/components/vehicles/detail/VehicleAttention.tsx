"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { VehicleAttentionItem } from "@/lib/vehicle-types";

interface VehicleAttentionProps {
  attentionItems: VehicleAttentionItem[];
  onOpenQr: () => void;
  onOpenSafety: () => void;
  onOpenContacts: () => void;
  onOpenDetails: () => void;
}

export function VehicleAttention({
  attentionItems,
  onOpenQr,
  onOpenSafety,
  onOpenContacts,
  onOpenDetails,
}: VehicleAttentionProps) {
  if (attentionItems.length === 0) {
    return (
      <div className="rounded-2xl border border-[#5db8a6]/30 bg-[#5db8a6]/5 p-5">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#5db8a6]">
          <span className="h-2 w-2 rounded-full bg-[#5db8a6]" />
          <span>IDENTITY SYSTEM READY</span>
        </div>
        <h4 className="mt-1 font-serif text-lg font-medium text-foreground">
          All safety coordinates operational.
        </h4>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          The physical asset, cryptographic QR lifeline, emergency contacts, and public safety projection rules are verified and active.
        </p>
      </div>
    );
  }

  const handleAction = (target: VehicleAttentionItem["actionTarget"]) => {
    switch (target) {
      case "qr":
        onOpenQr();
        break;
      case "safety":
        onOpenSafety();
        break;
      case "contact":
        onOpenContacts();
        break;
      case "vehicle":
      default:
        onOpenDetails();
        break;
    }
  };

  return (
    <div className="rounded-2xl border border-[#e8a55a]/30 bg-[#e8a55a]/5 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#e8a55a]/20 pb-3">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#e8a55a]">
          <span className="h-2 w-2 rounded-full bg-[#e8a55a]" />
          <span>NEEDS ATTENTION / {String(attentionItems.length).padStart(2, "0")}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          DETERMINISTIC CHECKS
        </span>
      </div>

      <div className="space-y-3">
        {attentionItems.map((item, idx) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className="font-mono text-xs font-bold text-[#cc785c] mt-0.5 shrink-0">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-foreground">
                  {item.title}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {item.description}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAction(item.actionTarget)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start sm:self-center rounded-lg bg-muted px-3.5 py-2 font-mono text-xs font-semibold text-foreground hover:bg-[#cc785c] hover:text-white transition-colors whitespace-nowrap shadow-2xs"
            >
              <span>{item.actionLabel}</span>
              <VaahanIcon name="arrow-right" size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
