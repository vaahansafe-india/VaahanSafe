"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui";
import type { ServiceCapabilityItem } from "@/lib/subscription-types";

interface ServiceCapabilityRowProps {
  capability: ServiceCapabilityItem;
  onInspect: () => void;
}

export function ServiceCapabilityRow({ capability, onInspect }: ServiceCapabilityRowProps) {
  const isEnabled = capability.status === "ENABLED";
  const isBaseline = capability.status === "BASELINE";

  return (
    <div
      onClick={onInspect}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border border-border/80 bg-background hover:bg-muted/40 hover:border-border transition-all cursor-pointer active:scale-[0.99]"
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            isEnabled
              ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6]"
              : isBaseline
              ? "border-[#cc785c]/40 bg-[#cc785c]/10 text-[#cc785c]"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          <VaahanIcon name={capability.iconName} size={16} />
        </div>

        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-mono text-xs font-bold text-foreground group-hover:text-[#cc785c] transition-colors">
              {capability.name}
            </span>
            {capability.boundVehiclePlate && (
              <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {capability.boundVehiclePlate}
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
            {capability.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
        <Badge
          variant="outline"
          className={`font-mono text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 transition-colors ${
            isEnabled
              ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] group-hover:border-[#5db8a6]/60 group-hover:bg-[#5db8a6]/15 hover:bg-[#5db8a6]/15 hover:text-[#5db8a6]"
              : isBaseline
              ? "border-[#cc785c]/40 bg-[#cc785c]/10 text-[#cc785c] group-hover:border-[#cc785c]/60 group-hover:bg-[#cc785c]/15 hover:bg-[#cc785c]/15 hover:text-[#cc785c]"
              : "border-border bg-muted text-muted-foreground hover:bg-muted"
          }`}
        >
          <span
            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
              isEnabled ? "bg-[#5db8a6]" : isBaseline ? "bg-[#cc785c]" : "bg-muted-foreground"
            }`}
          />
          {capability.statusLabel}
        </Badge>

        <span className="text-muted-foreground text-xs font-mono group-hover:text-foreground transition-colors inline-flex items-center gap-1">
          <span>Details</span>
          <VaahanIcon name="chevron-right" size={11} />
        </span>
      </div>
    </div>
  );
}
