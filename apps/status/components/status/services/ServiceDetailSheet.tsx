"use client";

import * as React from "react";
import type { PublicStatusServiceDto } from "@vaahansafe/status-core";
import { SERVICE_STATE_CONFIG } from "@vaahansafe/status-core";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui";

interface ServiceDetailSheetProps {
  service: PublicStatusServiceDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceDetailSheet({
  service,
  isOpen,
  onClose,
}: ServiceDetailSheetProps) {
  if (!service) return null;

  const config = SERVICE_STATE_CONFIG[service.state] || SERVICE_STATE_CONFIG.UNKNOWN;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-[#faf9f5] dark:bg-[#181715] border-l border-[#e6dfd8] dark:border-[#2e2b27] p-6 sm:p-8 space-y-6">
        <SheetHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
            <span>JOURNEY STAGE &bull; {service.journeyStage}</span>
          </div>
          <SheetTitle className="font-serif text-2xl sm:text-3xl text-[#141413] dark:text-[#faf9f5]">
            {service.name}
          </SheetTitle>
          <SheetDescription className="font-sans text-xs sm:text-sm text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
            {service.description}
          </SheetDescription>
        </SheetHeader>

        {/* Current State Capsule */}
        <div className="rounded-xl border border-[#e6dfd8] bg-[#f5f0e8]/50 p-4 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/50 space-y-2">
          <div className="font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
            CURRENT OPERATIONAL STATE
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: config.dotColor }}
            />
            <span
              className="font-mono text-xs font-semibold uppercase tracking-wider"
              style={{ color: config.textColor }}
            >
              {config.label}
            </span>
          </div>
          <p className="font-sans text-xs text-[#6c6a64] dark:text-[#a09d96]">
            {config.description}
          </p>
        </div>

        {/* Technical Capability Scope */}
        <div className="space-y-2 border-t border-[#e6dfd8] pt-4 dark:border-[#2e2b27] font-mono text-xs text-[#6c6a64] dark:text-[#a09d96]">
          <div className="text-[9px] uppercase tracking-wider text-[#8e8b82]">
            PUBLIC IDENTIFIER
          </div>
          <div className="text-[#141413] dark:text-[#faf9f5]">
            {service.slug}
          </div>
        </div>

        {/* Reliability Note */}
        <div className="border-t border-[#e6dfd8] pt-4 dark:border-[#2e2b27] space-y-2">
          <div className="font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
            OBSERVABILITY POLICY
          </div>
          <p className="font-sans text-xs leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
            Service status reflects verified customer-facing capability. Automated probes running across Indian edge PoPs feed continuous telemetry into the evaluation engine.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
