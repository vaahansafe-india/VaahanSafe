"use client";

import { useMemo } from "react";
import type { ScanRhythmPoint, ScanPeriodFilter } from "@/lib/scan-history-types";

interface ScanChartSummaryProps {
  data: ScanRhythmPoint[];
  period: ScanPeriodFilter;
  className?: string;
}

export function ScanChartSummary({ data, period, className }: ScanChartSummaryProps) {
  const summaryText = useMemo(() => {
    if (!data || data.length === 0) {
      return "No scan activity recorded for this period.";
    }

    const totalScans = data.reduce((acc, p) => acc + p.scanCount, 0);
    if (totalScans === 0) {
      return `Zero scan events recorded during the selected ${period} timeframe.`;
    }

    let peakPoint = data[0]!;
    for (const p of data) {
      if (p.scanCount > peakPoint.scanCount) {
        peakPoint = p;
      }
    }

    const peakLabel = peakPoint.fullDate || peakPoint.label;
    const periodDescriptor =
      period === "24H"
        ? "past 24 hours"
        : period === "7D"
        ? "last 7 days"
        : period === "30D"
        ? "last 30 days"
        : period === "90D"
        ? "last 90 days"
        : "recorded history";

    return `${totalScans} ${
      totalScans === 1 ? "scan event" : "scan events"
    } occurred during the ${periodDescriptor}. Highest activity recorded ${peakPoint.scanCount} scans on ${peakLabel}.`;
  }, [data, period]);

  return (
    <div className={`sr-only ${className || ""}`} aria-live="polite">
      <p>{summaryText}</p>
    </div>
  );
}
