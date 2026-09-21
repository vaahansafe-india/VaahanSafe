"use client";

import * as React from "react";
import type { PublicStatusServiceDto } from "@vaahansafe/status-core";
import { JOURNEY_STAGES } from "@vaahansafe/status-core";
import { SERVICE_STATE_CONFIG } from "@vaahansafe/status-core";

interface SystemPulseProps {
  services: PublicStatusServiceDto[];
  onSelectService?: (slug: string) => void;
  selectedSlug?: string | null;
}

export function SystemPulse({
  services,
  onSelectService,
  selectedSlug,
}: SystemPulseProps) {
  // Map services by journey stage for fast lookup
  const serviceByStage = React.useMemo(() => {
    const map = new Map<string, PublicStatusServiceDto>();
    for (const s of services) {
      map.set(s.journeyStage, s);
    }
    return map;
  }, [services]);

  return (
    <section
      aria-label="System Pulse Customer Journey Topology"
      className="w-full rounded-2xl border border-[#e6dfd8] bg-[#f5f0e8]/40 p-4 sm:p-6 lg:p-8 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/40 transition-colors"
    >
      {/* Topology Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-[#e6dfd8] pb-4 sm:pb-5 dark:border-[#2e2b27]">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#cc785c] font-semibold">
            SYSTEM PULSE &bull; THE CUSTOMER SERVICE JOURNEY
          </div>
          <div className="font-sans text-xs text-[#6c6a64] dark:text-[#a09d96]">
            Every public capability is mapped across the actual vehicle owner and bystander interaction sequence.
          </div>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-wider text-[#8e8b82] dark:text-[#77736d] shrink-0">
          6 OPERATIONAL STAGES
        </div>
      </div>

      {/* 1. Desktop Horizontal Pulse (Hidden on mobile) */}
      <div className="hidden lg:block pt-8 pb-4">
        <div className="grid grid-cols-6 gap-2 text-center">
          {JOURNEY_STAGES.map((j, idx) => {
            const service = serviceByStage.get(j.stage);
            const state = service?.state || "OPERATIONAL";
            const config = SERVICE_STATE_CONFIG[state] || SERVICE_STATE_CONFIG.UNKNOWN;
            const isOutage = state === "MAJOR OUTAGE" || state === "PARTIAL OUTAGE";
            const isDegraded = state === "DEGRADED";
            const isSelected = selectedSlug === service?.slug;

            return (
              <div
                key={j.stage}
                onClick={() => service && onSelectService?.(service.slug)}
                className={`group relative flex flex-col items-center cursor-pointer p-3 rounded-xl transition-all ${
                  isSelected
                    ? "bg-[#faf9f5] shadow-sm ring-1 ring-[#cc785c] dark:bg-[#181715]"
                    : "hover:bg-[#faf9f5]/70 dark:hover:bg-[#181715]/70"
                }`}
              >
                {/* Stage Title */}
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#141413] dark:text-[#faf9f5]">
                  {j.stage}
                </span>

                {/* Pulse Rail Node & Connecting Lines */}
                <div className="relative my-4 flex w-full items-center justify-center">
                  {/* Left Rail Segment */}
                  {idx > 0 && (
                    <span
                      className={`absolute left-0 right-1/2 h-px ${
                        isOutage
                          ? "border-b border-dashed border-[#c64545]"
                          : isDegraded
                          ? "bg-[#d4a017]"
                          : "bg-[#5db872]"
                      }`}
                    />
                  )}

                  {/* Right Rail Segment */}
                  {idx < JOURNEY_STAGES.length - 1 && (
                    <span
                      className={`absolute left-1/2 right-0 h-px ${
                        isOutage
                          ? "border-b border-dashed border-[#c64545]"
                          : "bg-[#5db872]"
                      }`}
                    />
                  )}

                  {/* Status Node Circle */}
                  <span
                    className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border bg-[#faf9f5] dark:bg-[#181715] transition-transform group-hover:scale-110 ${
                      isOutage
                        ? "border-[#c64545] text-[#c64545]"
                        : isDegraded
                        ? "border-[#d4a017] text-[#d4a017]"
                        : "border-[#5db872] text-[#5db872]"
                    }`}
                  >
                    {isOutage ? (
                      <span className="text-[10px] font-bold leading-none">&times;</span>
                    ) : isDegraded ? (
                      <span className="h-2 w-2 rounded-full bg-[#d4a017]" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[#5db872]" />
                    )}
                  </span>
                </div>

                {/* Service Name & Label */}
                <div className="space-y-1">
                  <div className="font-serif text-sm text-[#141413] dark:text-[#faf9f5] group-hover:text-[#cc785c] transition-colors">
                    {j.label}
                  </div>
                  <div
                    className="flex items-center justify-center gap-1 font-mono text-[9px] uppercase tracking-wider font-semibold"
                    style={{ color: config.textColor }}
                  >
                    <span>{config.label}</span>
                    {service?.latencyMs && (
                      <span className="font-normal text-[#8e8b82] dark:text-[#77736d]">
                        &bull; {service.latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Mobile / Tablet Vertical Pulse (Shown below lg) */}
      <div className="block lg:hidden pt-6 space-y-2">
        {JOURNEY_STAGES.map((j, idx) => {
          const service = serviceByStage.get(j.stage);
          const state = service?.state || "OPERATIONAL";
          const config = SERVICE_STATE_CONFIG[state] || SERVICE_STATE_CONFIG.UNKNOWN;
          const isOutage = state === "MAJOR OUTAGE" || state === "PARTIAL OUTAGE";
          const isDegraded = state === "DEGRADED";
          const isLast = idx === JOURNEY_STAGES.length - 1;

          return (
            <div
              key={j.stage}
              onClick={() => service && onSelectService?.(service.slug)}
              className="flex items-start gap-4 p-2 rounded-xl active:bg-[#faf9f5] dark:active:bg-[#181715] transition-colors cursor-pointer"
            >
              {/* Vertical Spine with Node */}
              <div className="relative flex flex-col items-center pt-1">
                <span
                  className={`relative z-10 flex h-4 w-4 items-center justify-center rounded-full border bg-[#faf9f5] dark:bg-[#181715] ${
                    isOutage
                      ? "border-[#c64545] text-[#c64545]"
                      : isDegraded
                      ? "border-[#d4a017] text-[#d4a017]"
                      : "border-[#5db872] text-[#5db872]"
                  }`}
                >
                  {isOutage ? (
                    <span className="text-[8px] font-bold">&times;</span>
                  ) : (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: config.dotColor }}
                    />
                  )}
                </span>
                {!isLast && (
                  <span
                    className={`h-12 w-px my-1 ${
                      isOutage
                        ? "border-l border-dashed border-[#c64545]"
                        : "bg-[#e6dfd8] dark:bg-[#2e2b27]"
                    }`}
                  />
                )}
              </div>

              {/* Stage Content */}
              <div className="flex-1 space-y-0.5 pb-2 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8e8b82] truncate">
                    {j.stage} &bull; {j.label}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {service?.latencyMs && (
                      <span className="font-mono text-[9px] text-[#8e8b82] dark:text-[#77736d]">
                        {service.latencyMs}ms
                      </span>
                    )}
                    <span
                      className="font-mono text-[9px] uppercase tracking-wider font-semibold"
                      style={{ color: config.textColor }}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>
                <div className="font-serif text-sm text-[#141413] dark:text-[#faf9f5]">
                  {service?.name || j.defaultServiceName}
                </div>
                <p className="font-sans text-xs text-[#6c6a64] dark:text-[#a09d96]">
                  {j.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
