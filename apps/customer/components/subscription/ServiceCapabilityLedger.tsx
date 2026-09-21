"use client";

import * as React from "react";
import { ServiceCapabilityRow } from "./ServiceCapabilityRow";
import { VaahanIcon } from "@vaahansafe/icons";
import type { ServiceCapabilityItem } from "@/lib/subscription-types";

interface ServiceCapabilityLedgerProps {
  capabilities: ServiceCapabilityItem[];
  onInspectCapability: (capability: ServiceCapabilityItem) => void;
}

export function ServiceCapabilityLedger({
  capabilities,
  onInspectCapability,
}: ServiceCapabilityLedgerProps) {
  return (
    <section 
      aria-label="Enabled Services Ledger" 
      className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
              Live Entitlement Surface
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="font-mono text-xs text-muted-foreground">
              {capabilities.filter((c) => c.status === "ENABLED").length} Active
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-foreground">
            What&apos;s Enabled
          </h3>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#5db8a6]" />
            Active
          </span>
          <span className="inline-flex items-center gap-1.5 ml-2">
            <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
            Baseline
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {capabilities.map((cap) => (
          <ServiceCapabilityRow
            key={cap.id}
            capability={cap}
            onInspect={() => onInspectCapability(cap)}
          />
        ))}
      </div>
    </section>
  );
}
