"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ComposedChart,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { AnalyticsData, Series, VehicleUsage } from "./types";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
export const dateLabel = (v: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  }).format(new Date(v));
export const timeLabel = (v: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(v));
export const bytesLabel = (bytes: number) =>
  bytes === 0
    ? "0 B"
    : Math.abs(bytes) < 1024
      ? `${bytes} B`
      : Math.abs(bytes) < 1048576
        ? `${(bytes / 1024).toFixed(1)} KB`
        : Math.abs(bytes) < 1073741824
          ? `${(bytes / 1048576).toFixed(1)} MB`
          : `${(bytes / 1073741824).toFixed(2)} GB`;
function useTooltipTrigger() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const sync = () => setTouch(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return touch ? ("click" as const) : ("hover" as const);
}
export function AnalyticsTooltip({
  active,
  label,
  payload,
  bytes = false,
  total = false,
}: {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{
    name?: string;
    value?: string | number | ReadonlyArray<string | number>;
    color?: string;
  }>;
  bytes?: boolean;
  total?: boolean;
}) {
  if (!active || !payload?.length) return null;
  let heading = String(label ?? "");
  if (/^\d{4}-\d{2}-\d{2}T/.test(heading)) heading = timeLabel(heading);
  return (
    <div className="analytics-tooltip">
      <p className="mb-2 font-medium">{heading}</p>
      <dl>
        {total && (
          <div className="flex justify-between gap-6 border-b border-border pb-2 mb-2">
            <dt>Total</dt>
            <dd className="font-mono font-semibold">
              {bytes
                ? bytesLabel(
                    payload.reduce(
                      (sum, row) => sum + Number(row.value || 0),
                      0,
                    ),
                  )
                : payload
                    .reduce((sum, row) => sum + Number(row.value || 0), 0)
                    .toLocaleString("en-IN")}
            </dd>
          </div>
        )}
        {payload
          .filter((p) => p.value !== undefined && p.value !== null)
          .map((p, i) => (
            <div className="flex justify-between gap-6 py-1" key={i}>
              <dt>{p.name}</dt>
              <dd className="font-mono">
                {bytes ? bytesLabel(Number(p.value)) : String(p.value)}
              </dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
export function Trend({
  series,
  compare = false,
  successful = false,
  label = "Scans",
  network = false,
}: {
  series: Series[];
  compare?: boolean;
  successful?: boolean;
  label?: string;
  network?: boolean;
}) {
  const trigger = useTooltipTrigger();
  const [metric, setMetric] = useState("all"),
    [view, setView] = useState(network ? "bars" : "area");
  const active = successful && metric === "active";
  const title = network ? "Recorded resolutions" : label;
  const total = series.reduce((sum, row) => sum + row.value, 0);
  const activeTotal = series.reduce(
    (sum, row) => sum + (row.successful ?? 0),
    0,
  );
  const metrics = [
    { id: "all", label: title, value: total },
    ...(successful
      ? [{ id: "active", label: "Active safety views", value: activeTotal }]
      : []),
  ];
  const plotted = useMemo(
    () =>
      series.map((row) => ({
        ...row,
        current: active ? (row.successful ?? 0) : row.value,
      })),
    [series, active],
  );
  const currentLabel = active ? "Active safety views" : title;
  return (
    <div>
      <div
        className="analytics-chart-metrics"
        role="group"
        aria-label="Choose a chart metric"
      >
        {metrics.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={metric === item.id}
            onClick={() => setMetric(item.id)}
            className="analytics-chart-metric"
          >
            <span>{item.label}</span>
            <strong>{item.value.toLocaleString("en-IN")}</strong>
            <small>Selected period</small>
          </button>
        ))}
        {compare && (
          <div className="analytics-chart-metric analytics-static-metric">
            <span>Previous period</span>
            <strong>
              {series
                .reduce((sum, row) => sum + (row.previous ?? 0), 0)
                .toLocaleString("en-IN")}
            </strong>
            <small>{title}</small>
          </div>
        )}
      </div>
      <div className="analytics-plot-toolbar">
        <span>{currentLabel} over time · IST</span>
        <div
          className="analytics-segmented"
          role="group"
          aria-label="Chart style"
        >
          <button
            type="button"
            aria-pressed={view === "area"}
            onClick={() => setView("area")}
          >
            Area
          </button>
          <button
            type="button"
            aria-pressed={view === "bars"}
            onClick={() => setView("bars")}
          >
            Bars
          </button>
        </div>
      </div>
      <div className="analytics-rechart analytics-trend">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={plotted}
            margin={{ top: 16, right: 12, left: -12, bottom: 4 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={dateLabel}
              minTickGap={48}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              trigger={trigger}
              cursor={{
                stroke: "hsl(var(--muted-foreground))",
                strokeDasharray: "3 3",
              }}
              content={<AnalyticsTooltip />}
            />
            {view === "bars" ? (
              <Bar
                dataKey="current"
                name={currentLabel}
                fill={active ? "#62785c" : "#b15f43"}
                maxBarSize={28}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
            ) : (
              <Area
                type="linear"
                dataKey="current"
                name={currentLabel}
                stroke={active ? "#62785c" : "#b15f43"}
                fill={active ? "#62785c" : "#cc785c"}
                fillOpacity={0.07}
                strokeWidth={1.7}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                isAnimationActive={false}
              />
            )}
            {compare && !active && (
              <Line
                type="linear"
                dataKey="previous"
                name="Previous period"
                stroke="#8c8980"
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="analytics-legend">
        <span>
          <i style={{ background: active ? "#62785c" : "#b15f43" }} />
          {currentLabel}
        </span>
        {compare && !active && (
          <span>
            <i className="analytics-previous-mark" />
            Previous period
          </span>
        )}
      </p>
    </div>
  );
}
function VehicleTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}) {
  const vehicle = payload?.[0]?.payload as VehicleUsage | undefined;
  if (!active || !vehicle) return null;
  return (
    <div className="analytics-tooltip">
      <p className="font-medium">{vehicle.label}</p>
      <p className="mb-3 text-xs text-muted-foreground">{vehicle.name}</p>
      <dl className="space-y-2">
        <div className="flex justify-between gap-6">
          <dt>Scans in selected period</dt>
          <dd className="font-mono">{vehicle.scans}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt>Current documents</dt>
          <dd className="font-mono">{vehicle.documents}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt>QR identity</dt>
          <dd>{vehicle.qr || "Not connected"}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt>Last scan</dt>
          <dd>
            {vehicle.lastScan ? timeLabel(vehicle.lastScan) : "Not recorded"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
export function VehicleScanChart({
  vehicles,
  onSelect,
}: {
  vehicles: VehicleUsage[];
  onSelect: (id: string) => void;
}) {
  const trigger = useTooltipTrigger();
  const ranked = useMemo(
    () =>
      [...vehicles]
        .sort((a, b) => b.scans - a.scans || a.label.localeCompare(b.label))
        .slice(0, 15),
    [vehicles],
  );
  return (
    <div>
      <div
        className="analytics-rechart"
        style={{
          height: Math.max(180, ranked.length * 38 + 65),
          paddingBottom: 0,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ranked}
            layout="vertical"
            margin={{ top: 16, right: 36, bottom: 28, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Recorded scans",
                position: "bottom",
                offset: 10,
                fontSize: 11,
              }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={95}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              trigger={trigger}
              cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.6 }}
              content={<VehicleTooltip />}
            />
            <Bar
              dataKey="scans"
              name="Scans"
              fill="#cc785c"
              maxBarSize={24}
              radius={[0, 3, 3, 0]}
              isAnimationActive={false}
              onClick={(entry) => {
                if (entry.id) onSelect(entry.id);
              }}
            >
              <LabelList
                dataKey="scans"
                position="right"
                fontSize={12}
                fill="hsl(var(--foreground))"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="analytics-legend">
        Scans during the selected period · Select a bar to filter by vehicle
      </p>
    </div>
  );
}
export function Comparison({
  data,
  bytes = false,
  onSelect,
  label = "Scans",
}: {
  data: Array<{ id: string | null; label: string; value: number }>;
  bytes?: boolean;
  onSelect?: (id: string) => void;
  label?: string;
}) {
  const trigger = useTooltipTrigger();
  return (
    <div
      className="analytics-rechart"
      style={{
        height: Math.max(150, Math.min(600, data.length * 36 + 50)),
        paddingBottom: 0,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.slice(0, 15)}
          layout="vertical"
          margin={{ left: 0, right: 20, top: 5, bottom: 8 }}
          accessibilityLayer
        >
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            allowDecimals={false}
            tickFormatter={bytes ? bytesLabel : undefined}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={95}
            tickFormatter={(value: string) =>
              value.length > 16 ? value.slice(0, 15) + "…" : value
            }
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            trigger={trigger}
            cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.5 }}
            content={<AnalyticsTooltip bytes={bytes} />}
          />
          <Bar
            dataKey="value"
            name={bytes ? "Stored originals" : label}
            fill="#cc785c"
            maxBarSize={20}
            radius={[0, 2, 2, 0]}
            isAnimationActive={false}
            onClick={(entry) => {
              if (entry.id && onSelect) onSelect(entry.id);
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const storageColors = [
  "#b15f43",
  "#62785c",
  "#bd985c",
  "#87867c",
  "#6c8795",
  "#99777e",
];
export function StorageDonut({
  rows,
  total,
}: {
  rows: AnalyticsData["documents"]["composition"];
  total: number;
}) {
  const trigger = useTooltipTrigger();
  const types = rows.filter(
    (row) => row.label === "PDF" || row.label === "Images",
  );
  return (
    <div>
      <div className="storage-donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer>
            <Pie
              data={types}
              dataKey="bytes"
              nameKey="label"
              innerRadius="60%"
              outerRadius="84%"
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {types.map((row, index) => (
                <Cell
                  key={row.label}
                  fill={storageColors[index % storageColors.length]}
                />
              ))}
            </Pie>
            <Tooltip trigger={trigger} content={<AnalyticsTooltip bytes />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="storage-donut-label">
          <strong>{bytesLabel(total)}</strong>
          <span>Total originals</span>
        </div>
      </div>
      <div className="analytics-breakdown">
        {types.map((row, index) => (
          <div className="analytics-breakdown-row" key={row.label}>
            <span>
              <i
                style={{
                  background: storageColors[index % storageColors.length],
                }}
              />
              {row.label}
            </span>
            <strong>{bytesLabel(row.bytes)}</strong>
            <small>
              {total ? ((row.bytes / total) * 100).toFixed(1) : "0"}%
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StorageGrowth({
  rows,
  startedAt,
}: {
  rows: AnalyticsData["storage-history"]["growth"];
  startedAt: string | null;
}) {
  const trigger = useTooltipTrigger();
  const [view, setView] = useState("category");
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setView("total");
  }, []);
  const categories = useMemo(
    () =>
      Array.from(
        new Set(rows.flatMap((row) => Object.keys(row.values || {}))),
      ).sort(),
    [rows],
  );
  const plotted = useMemo(
    () =>
      rows.map((row) => ({
        timestamp: row.timestamp,
        total: row.values
          ? Object.values(row.values).reduce((sum, value) => sum + value, 0)
          : null,
        ...Object.fromEntries(
          categories.map((category) => [
            category,
            row.values === null ? null : (row.values[category] ?? 0),
          ]),
        ),
      })),
    [rows, categories],
  );
  return (
    <div>
      <div className="storage-growth-controls">
        <span className="text-xs text-muted-foreground">
          Measured original storage
        </span>
        <Select value={view} onValueChange={setView}>
          <SelectTrigger
            aria-label="Storage growth series"
            className="h-9 w-36"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">By category</SelectItem>
            <SelectItem value="total">Total</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="analytics-rechart storage-growth-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={plotted}
            accessibilityLayer
            margin={{ top: 12, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={dateLabel}
              minTickGap={44}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={bytesLabel}
              width={64}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              trigger={trigger}
              content={<AnalyticsTooltip bytes total={view === "category"} />}
            />
            {view === "total" ? (
              <Area
                dataKey="total"
                name="Total originals"
                type="stepAfter"
                stroke="#b15f43"
                fill="#cc785c"
                fillOpacity={0.4}
                dot={{ r: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ) : (
              categories.map((category, index) => (
                <Area
                  key={category}
                  dataKey={category}
                  name={category.toLowerCase().replaceAll("_", " ")}
                  stackId="storage"
                  type="stepAfter"
                  stroke={storageColors[index % storageColors.length]}
                  fill={storageColors[index % storageColors.length]}
                  fillOpacity={0.75}
                  strokeWidth={1.2}
                  dot={{ r: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="analytics-chart-note">
        {startedAt
          ? `Real storage tracking began ${timeLabel(startedAt)}. Earlier dates are unavailable.`
          : "Storage history has not been recorded yet."}{" "}
        Changes follow finalized vault records.
      </p>
    </div>
  );
}

export function StorageAccess({
  series,
}: {
  series: AnalyticsData["storage-access"]["series"];
}) {
  const trigger = useTooltipTrigger();
  return (
    <div className="analytics-rechart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={series}
          accessibilityLayer
          margin={{ top: 12, left: -20, right: 8, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={dateLabel}
            minTickGap={40}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip trigger={trigger} content={<AnalyticsTooltip />} />
          <Bar
            dataKey="previews"
            name="Previews & shared opens"
            fill="#cc785c"
            maxBarSize={20}
            isAnimationActive={false}
          />
          <Line
            dataKey="downloads"
            name="Downloads"
            stroke="#62785c"
            dot={false}
            strokeWidth={1.6}
            isAnimationActive={false}
          />
          <Line
            dataKey="shares"
            name="Share links created"
            stroke="#bd985c"
            dot={false}
            strokeWidth={1.6}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="analytics-legend">
        <span>Previews & shared opens</span>
        <span>Downloads</span>
        <span>Share links created</span>
      </p>
    </div>
  );
}

export function ExpiryStatus({
  rows,
}: {
  rows: Array<{ label: string; value: number }>;
}) {
  const trigger = useTooltipTrigger();
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const colors = ["#62785c", "#bd985c", "#b15f43"];
  return (
    <div>
      <div className="analytics-breakdown">
        {rows.map((row, index) => (
          <div className="analytics-breakdown-row" key={row.label}>
            <span>
              <i style={{ background: colors[index] }} />
              {row.label}
            </span>
            <strong>{row.value}</strong>
            <small>
              {total ? ((row.value / total) * 100).toFixed(0) : "0"}%
            </small>
          </div>
        ))}
      </div>
      <div className="analytics-storage-chart mt-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[
              Object.fromEntries(
                rows.map((row, i) => [`status${i}`, row.value]),
              ),
            ]}
            layout="vertical"
            accessibilityLayer
            margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <XAxis type="number" domain={[0, Math.max(1, total)]} hide />
            <YAxis type="category" hide />
            <Tooltip
              trigger={trigger}
              cursor={false}
              content={<AnalyticsTooltip />}
            />
            {rows.map((row, i) => (
              <Bar
                key={row.label}
                dataKey={`status${i}`}
                name={row.label}
                stackId="status"
                fill={colors[i]}
                maxBarSize={20}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="analytics-chart-note">
        {total} current documents · Current includes documents without a
        recorded expiry.
      </p>
    </div>
  );
}
export function StorageUsage({
  rows,
  total,
  reservedBytes,
  quotaBytes,
}: {
  rows: AnalyticsData["documents"]["composition"];
  total: number;
  reservedBytes: number;
  quotaBytes: number;
}) {
  const [dimension, setDimension] = useState("type");
  const trigger = useTooltipTrigger();
  // The API returns two independent breakdowns; never stack both together.
  const shown = rows.filter((row) =>
    dimension === "type"
      ? row.label === "PDF" || row.label === "Images"
      : row.label !== "PDF" && row.label !== "Images",
  );
  const segments = shown.map((row, index) => ({
    ...row,
    key: `segment${index}`,
    color: storageColors[index % storageColors.length],
  }));
  const composition = Object.fromEntries(
    segments.map((row) => [row.key, row.bytes]),
  );
  const percent = quotaBytes > 0 ? (reservedBytes / quotaBytes) * 100 : null;
  return (
    <div>
      <div className="analytics-storage-total">
        <span>Finalized originals</span>
        <strong>{bytesLabel(total)}</strong>
        <small>Current snapshot · includes retained versions</small>
      </div>
      <div className="analytics-plot-toolbar">
        <div
          className="analytics-segmented"
          role="group"
          aria-label="Storage breakdown"
        >
          <button
            type="button"
            aria-pressed={dimension === "type"}
            onClick={() => setDimension("type")}
          >
            File type
          </button>
          <button
            type="button"
            aria-pressed={dimension === "category"}
            onClick={() => setDimension("category")}
          >
            Category
          </button>
        </div>
      </div>
      <div className="analytics-storage-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[{ name: "Stored originals", ...composition }]}
            layout="vertical"
            accessibilityLayer
            margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <XAxis type="number" hide domain={[0, Math.max(1, total)]} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              trigger={trigger}
              cursor={false}
              content={<AnalyticsTooltip bytes />}
            />
            {segments.map((row) => (
              <Bar
                key={row.key}
                dataKey={row.key}
                name={row.label}
                stackId="originals"
                fill={row.color}
                maxBarSize={24}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {!total && (
        <p className="analytics-chart-note">
          No finalized originals yet. Add documents to your Document Vault to
          see storage usage.
        </p>
      )}
      <div className="analytics-breakdown">
        {segments.map((row) => (
          <div className="analytics-breakdown-row" key={row.key}>
            <span>
              <i style={{ background: row.color }} />
              {row.label}
              <small>{row.count} versions</small>
            </span>
            <strong>{bytesLabel(row.bytes)}</strong>
            <small>
              {total ? ((row.bytes / total) * 100).toFixed(1) : "0"}%
            </small>
          </div>
        ))}
      </div>
      <div className="analytics-quota">
        <div>
          <span>Account storage reservation</span>
          <strong>
            {bytesLabel(reservedBytes)} /{" "}
            {Number.isFinite(quotaBytes) && quotaBytes > 0
              ? bytesLabel(quotaBytes)
              : "Capacity unavailable"}
          </strong>
        </div>
        {percent !== null && (
          <>
            <progress
              aria-label="Account storage quota used"
              value={Math.min(100, percent)}
              max={100}
            />
            <small>
              {percent.toFixed(1)}% reserved · Includes thumbnails and pending
              cleanup
            </small>
          </>
        )}
      </div>
    </div>
  );
}
