"use client";

import { ScanSignal } from "./ScanSignal";
import type { ScanSignalRailData } from "@/lib/scan-history-types";

interface ScanSignalRailProps {
  data: ScanSignalRailData;
}

export function ScanSignalRail({ data }: ScanSignalRailProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-border/70">
        {/* Total Scans */}
        <div className="pt-0">
          <ScanSignal
            label="Total Scans"
            value={data.totalScans}
            subtitle="Verified Lifetime"
            isAccent={data.totalScans > 0}
          />
        </div>

        {/* Last Scan */}
        <div className="pt-0 md:pl-6">
          <ScanSignal
            label="Last Scan"
            value={data.lastScan ? data.lastScan.formatted : "—"}
            subtitle={data.lastScan ? data.lastScan.relativeTime : "No encounters"}
          />
        </div>

        {/* Active QR */}
        <div className="pt-4 md:pt-0 md:pl-6">
          <ScanSignal
            label="Active QR"
            value={data.activeQrCount}
            subtitle={data.activeQrCount === 1 ? "1 Pass Bound" : `${data.activeQrCount} Passes Bound`}
          />
        </div>

        {/* Period */}
        <div className="pt-4 md:pt-0 md:pl-6">
          <ScanSignal
            label="Period Encounters"
            value={data.periodScansCount}
            subtitle={data.periodLabel}
          />
        </div>
      </div>
    </div>
  );
}
