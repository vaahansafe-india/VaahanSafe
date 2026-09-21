"use client";

import type { ScanRhythmPoint } from "@/lib/scan-history-types";

interface ScanChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScanRhythmPoint }>;
}

export function ScanChartTooltip({ active, payload }: ScanChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-border bg-card/95 p-3.5 text-card-foreground shadow-xl text-left space-y-2 min-w-[200px] pointer-events-none backdrop-blur-md">
      {/* Date / Time Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-1.5 text-[10px] font-mono uppercase text-muted-foreground">
        <span>{data.fullDate}</span>
        <span className="font-semibold text-primary">{data.label}</span>
      </div>

      {/* Main Scan Count Metric */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
          {data.scanCount}
          <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">
            {data.scanCount === 1 ? "scan" : "scans"}
          </span>
        </div>
        {data.emergencyCount > 0 && (
          <span className="text-[10px] font-mono font-semibold text-destructive px-1.5 py-0.5 rounded-md bg-destructive/10">
            {data.emergencyCount} emergency
          </span>
        )}
      </div>

      {/* Metadata Detail */}
      <div className="space-y-1 pt-1 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>QR Identities:</span>
          <span className="font-semibold text-foreground">{data.uniqueQrCount}</span>
        </div>
        {data.mostRecentTime && (
          <div className="flex items-center justify-between">
            <span>Latest:</span>
            <span className="text-foreground">{data.mostRecentTime}</span>
          </div>
        )}
      </div>
    </div>
  );
}
