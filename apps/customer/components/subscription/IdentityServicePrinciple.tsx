"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface IdentityServicePrincipleProps {
  onLearnMore?: () => void;
}

export function IdentityServicePrinciple({ onLearnMore }: IdentityServicePrincipleProps) {
  return (
    <section 
      aria-label="Identity and Service Decoupling Principle"
      className="relative overflow-hidden rounded-2xl border border-[#5db8a6]/30 bg-[#5db8a6]/[0.04] p-4 sm:p-6 transition-all duration-300 hover:border-[#5db8a6]/40"
    >
      {/* Background subtle registration markings */}
      <div className="pointer-events-none absolute right-4 top-4 font-mono text-[9px] uppercase tracking-widest text-[#5db8a6]/30 select-none hidden sm:block">
        SPEC-00 // DECOUPLED ARCHITECTURE
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#5db8a6] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#5db8a6] font-semibold">
              Identity & Service Architecture
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs sm:text-base font-medium text-foreground">
            <span className="font-mono font-bold tracking-tight text-foreground bg-[#5db8a6]/10 px-2 py-0.5 rounded border border-[#5db8a6]/20 text-[11px] sm:text-xs">
              QR IDENTITY
            </span>
            <span className="font-mono font-bold text-[#cc785c]">≠</span>
            <span className="font-mono font-bold tracking-tight text-foreground bg-[#cc785c]/10 px-2 py-0.5 rounded border border-[#cc785c]/20 text-[11px] sm:text-xs">
              SUBSCRIPTION
            </span>
            <span className="text-muted-foreground text-xs sm:text-sm font-normal">
              — Your vehicle identity remains permanently secured.
            </span>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            Your VaahanSafe QR sticker identifies the physical vehicle safety identity and guarantees baseline emergency contact resolution. Commercial plans dictate optional advanced capabilities like real-time scan logging, multi-vehicle coverage, and priority telemetry.
          </p>
        </div>

        {onLearnMore && (
          <button
            onClick={onLearnMore}
            type="button"
            className="w-full sm:w-auto self-start md:self-center shrink-0 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-card text-xs font-mono font-medium text-foreground hover:bg-muted/60 transition-colors active:scale-[0.98]"
          >
            <VaahanIcon name="info" className="h-3.5 w-3.5 text-[#5db8a6]" />
            <span>Architecture Guide</span>
          </button>
        )}
      </div>
    </section>
  );
}
