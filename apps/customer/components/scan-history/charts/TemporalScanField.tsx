"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TemporalScanHour } from "@/lib/scan-history-types";

interface TemporalScanFieldProps {
  data: TemporalScanHour[];
}

function TemporalTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload as TemporalScanHour;
  if (!item) return null;

  const nextHour = (item.hour + 1) % 24;
  const startStr = `${String(item.hour).padStart(2, "0")}:00`;
  const endStr = `${String(nextHour).padStart(2, "0")}:00`;

  return (
    <div className="rounded-xl border border-border bg-card/95 p-3 text-card-foreground shadow-xl text-left space-y-1 min-w-[150px] pointer-events-none backdrop-blur-md">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border/70 pb-1">
        Time Window
      </div>
      <div className="font-mono text-xs font-semibold text-primary">
        {startStr} – {endStr}
      </div>
      <div className="flex items-baseline justify-between pt-1">
        <span className="text-[11px] text-muted-foreground">Scans:</span>
        <span className="font-mono text-sm font-bold text-foreground">{item.scanCount}</span>
      </div>
    </div>
  );
}

export function TemporalScanField({ data }: TemporalScanFieldProps) {
  const totalScans = useMemo(() => {
    return data.reduce((acc, d) => acc + d.scanCount, 0);
  }, [data]);

  const peakHour = useMemo(() => {
    if (totalScans === 0 || !data.length) return null;
    let max = data[0]!;
    for (const d of data) {
      if (d.scanCount > max.scanCount) max = d;
    }
    return max;
  }, [data, totalScans]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            Temporal Distribution
          </div>
          {peakHour && peakHour.scanCount > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground">
              Peak: {String(peakHour.hour).padStart(2, "0")}:00 ({peakHour.scanCount})
            </span>
          )}
        </div>
        <h3 className="font-serif text-lg font-medium text-foreground">
          Time of Day Encounter
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Distribution of passerby QR encounters across the 24-hour day cycle.
        </p>
      </div>

      {totalScans === 0 ? (
        <div className="h-[140px] flex items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-center p-4">
          <p className="text-xs text-muted-foreground font-mono">
            No temporal scan encounters recorded yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="h-[130px] w-full outline-none focus:outline-none focus-visible:outline-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none focus-visible:outline-none">
              <BarChart
                data={data}
                className="outline-none focus:outline-none focus-visible:outline-none select-none"
                margin={{ top: 8, right: 0, left: -28, bottom: 0 }}
                barCategoryGap="12%"
              >
                <XAxis
                  dataKey="hourLabel"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={9}
                  fontFamily="JetBrains Mono, monospace"
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                  interval={3}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={9}
                  fontFamily="JetBrains Mono, monospace"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip content={<TemporalTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                <Bar
                  dataKey="scanCount"
                  fill="#CC785C"
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={600}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/50">
            <span>00:00 (Midnight)</span>
            <span>12:00 (Noon)</span>
            <span>23:00 (Night)</span>
          </div>
        </div>
      )}
    </div>
  );
}
