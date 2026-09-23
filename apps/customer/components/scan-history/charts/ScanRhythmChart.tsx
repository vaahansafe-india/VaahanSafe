"use client";

import { useId, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ScanChartTooltip } from "./ScanChartTooltip";
import { ScanChartSummary } from "./ScanChartSummary";
import { ScanChartEmptyState } from "./ScanChartEmptyState";
import { ScanChartLegend } from "./ScanChartLegend";
import type { ScanRhythmPoint, ScanPeriodFilter } from "@/lib/scan-history-types";

interface ScanRhythmChartProps {
  data: ScanRhythmPoint[];
  period: ScanPeriodFilter;
  onPeriodChange: (period: ScanPeriodFilter) => void;
  onSelectPoint?: (point: ScanRhythmPoint) => void;
}

export function ScanRhythmChart({
  data,
  period,
  onPeriodChange,
  onSelectPoint,
}: ScanRhythmChartProps) {
  const gradientId = useId();

  const totalScansInSeries = useMemo(() => {
    return data.reduce((acc, p) => acc + p.scanCount, 0);
  }, [data]);

  const isEmpty = data.length === 0 || totalScansInSeries === 0;

  // Custom tick mark node for points with scans
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload || payload.scanCount === 0) return null;

    const isEmergency = payload.emergencyCount > 0;
    return (
      <circle
        key={`dot-${payload.timestamp}`}
        cx={cx}
        cy={cy}
        r={3.5}
        fill={isEmergency ? "#C64545" : "#CC785C"}
        stroke="hsl(var(--card))"
        strokeWidth={2}
        className="transition-transform duration-200 hover:scale-150 cursor-pointer"
        onClick={() => onSelectPoint?.(payload)}
      />
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
      {/* Accessible screen-reader text summary */}
      <ScanChartSummary data={data} period={period} />

      {/* Header & Period Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div className="space-y-0.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            Scan Rhythm
          </div>
          <h3 className="font-serif text-lg font-medium text-foreground">
            Encounter Pulse
          </h3>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center rounded-lg border border-border bg-background p-1 text-[11px] font-mono self-start sm:self-auto">
          {(["24H", "7D", "30D", "90D"] as const).map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPeriodChange(p)}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={isActive}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {isEmpty ? (
        <ScanChartEmptyState
          title="No Scan Rhythm Detected"
          description={`Your QR sticker recorded zero scans during the selected ${period} timeframe. Scan events will create an encounter rhythm here.`}
        />
      ) : (
        <div className="space-y-3">
          <div className="h-[220px] sm:h-[260px] w-full outline-none focus:outline-none focus-visible:outline-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none focus-visible:outline-none">
              <AreaChart
                data={data}
                className="outline-none focus:outline-none focus-visible:outline-none select-none"
                margin={{ top: 12, right: 8, left: -22, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    onSelectPoint?.(e.activePayload[0].payload);
                  }
                }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CC785C" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#CC785C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="2 2"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.7}
                />

                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={16}
                />

                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={30}
                />

                <Tooltip
                  content={<ScanChartTooltip />}
                  cursor={{ stroke: "#CC785C", strokeWidth: 1, strokeDasharray: "2 2" }}
                />

                <Area
                  type="monotone"
                  dataKey="scanCount"
                  stroke="#CC785C"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                  dot={renderDot}
                  activeDot={{
                    r: 5,
                    fill: "#CC785C",
                    stroke: "hsl(var(--card))",
                    strokeWidth: 2,
                  }}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] font-mono text-muted-foreground">
            <span>
              Total Scans: <strong className="text-foreground font-semibold">{totalScansInSeries}</strong>
            </span>
            <ScanChartLegend />
          </div>
        </div>
      )}
    </div>
  );
}
