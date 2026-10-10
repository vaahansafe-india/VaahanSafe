"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from "recharts";
import type { AnalyticsData, ScanBucket } from "./types";
import { AnalyticsTooltip, dateLabel } from "./Charts";
import { scanColors } from "./scan-model";
function useTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const m = matchMedia("(pointer: coarse)");
    const sync = () => setTouch(m.matches);
    sync();
    m.addEventListener("change", sync);
    return () => m.removeEventListener("change", sync);
  }, []);
  return touch ? ("click" as const) : ("hover" as const);
}
export function ScanTimeline({ series }: { series: ScanBucket[] }) {
  const trigger = useTouch();
  return (
    <>
      <div className="scan-timeline-chart">
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart
            data={series}
            margin={{ top: 10, right: 12, left: -22, bottom: 2 }}
            accessibilityLayer
          >
            <CartesianGrid
              vertical
              stroke="hsl(var(--border))"
              strokeOpacity={0.45}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={dateLabel}
              minTickGap={28}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip trigger={trigger} content={<AnalyticsTooltip total />} />
            {["successful", "partial", "unsuccessful"].map((key, i) => (
              <Area
                key={key}
                dataKey={key}
                name={
                  ["Active safety view", "Activation required", "Not resolved"][
                    i
                  ]
                }
                stackId="scans"
                type="linear"
                stroke={scanColors[i]}
                fill={scanColors[i]}
                fillOpacity={0.5}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="scan-legend">
        {["Active safety view", "Activation required", "Not resolved"].map(
          (label, i) => (
            <span key={label}>
              <i style={{ background: scanColors[i] }} />
              {label}
            </span>
          ),
        )}
      </div>
    </>
  );
}
export function ScanSparkline({
  series,
  field,
  color,
}: {
  series: ScanBucket[];
  field: "total" | "successful" | "unsuccessful" | "partial";
  color: string;
}) {
  const data = series.map((r) => ({
    value:
      field === "total"
        ? r.successful + r.partial + r.unsuccessful
        : field === "unsuccessful"
          ? r.partial + r.unsuccessful
          : field === "partial"
            ? r.partial
            : r.successful,
  }));
  return (
    <div aria-hidden="true" className="scan-sparkline">
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={data}>
          <Area
            dataKey="value"
            type="linear"
            stroke={color}
            fill={color}
            fillOpacity={0.12}
            strokeWidth={1.4}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function TopScanQrs({
  data,
  select,
}: {
  data: AnalyticsData["scan-top"];
  select: (id: string) => void;
}) {
  const trigger = useTouch();
  const rows = data.qrs.slice(0, 8).map((r) => ({
    ...r,
    short: r.label.length > 16 ? r.label.slice(0, 15) + "…" : r.label,
    share: `${data.total ? Math.round((r.count / data.total) * 100) : 0}%`,
  }));
  return (
    <>
      <ResponsiveContainer
        width="100%"
        height={Math.max(180, rows.length * 38)}
      >
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ left: 0, right: 46, top: 2, bottom: 0 }}
          accessibilityLayer
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="short"
            width={112}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "currentColor" }}
          />
          <Tooltip
            trigger={trigger}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <div className="analytics-tooltip">
                  <strong>{payload[0].payload.label}</strong>
                  <p>{payload[0].payload.vehicleLabel}</p>
                  <p>
                    {payload[0].payload.count} scans ·{" "}
                    {payload[0].payload.share}
                  </p>
                </div>
              ) : null
            }
          />
          <Bar
            dataKey="count"
            barSize={22}
            radius={[0, 2, 2, 0]}
            isAnimationActive={false}
            onClick={(row) => {
              if (row.id) select(String(row.id));
            }}
          >
            {rows.map((r, i) => (
              <Cell key={r.id} fill={scanColors[i % 4]} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              fontSize={11}
              fill="currentColor"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="scan-qr-links">
        {rows.map((r) => (
          <button
            key={r.id}
            onClick={() => select(r.id)}
            aria-label={`Filter ${r.label}, ${r.count} scans, ${r.share} of selected scans`}
          >
            {r.label}
            <span>{r.share}</span>
          </button>
        ))}
      </div>
    </>
  );
}
