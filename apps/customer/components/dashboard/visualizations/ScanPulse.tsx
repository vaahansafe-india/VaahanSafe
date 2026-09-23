"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { ScanPulseInspector } from "./ScanPulseInspector";
import type { DashboardScanSummary, DashboardScanPulsePoint } from "@/lib/dashboard-types";

interface ScanPulseProps {
  summary: DashboardScanSummary;
  vehiclePlate: string;
  qrVisibleCode?: string;
  range?: "today" | "7d" | "30d" | "all";
  onRangeChange?: () => void;
}

export function ScanPulse({
  summary,
  vehiclePlate,
  qrVisibleCode,
  range = "30d",
  onRangeChange,
}: ScanPulseProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [showTable, setShowTable] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  const points = summary.points;
  const hasData = points.length > 0 && summary.totalScans > 0;

  // Compute SVG geometry with ample vertical headroom and date label space
  const svgWidth = 800;
  const svgHeight = 230;
  const paddingX = 54;
  const paddingTop = 32;
  const chartHeight = 140;
  const baselineY = paddingTop + chartHeight;
  const chartWidth = svgWidth - paddingX * 2;

  // Headroom: Ensure peak never touches the ceiling
  const peak = summary.peakCount > 0 ? summary.peakCount : 4;
  const maxVal = Math.max(Math.ceil(peak * 1.35), 5);

  // Dynamic temporal timeline mapping based on active range preset
  const displayPoints = React.useMemo<DashboardScanPulsePoint[]>(() => {
    if (!hasData) return [];

    const pad = (n: number) => String(n).padStart(2, "0");

    // Case 1: Today -> 24 hourly buckets across today (00:00 to 23:00)
    if (range === "today") {
      const list: DashboardScanPulsePoint[] = [];
      const bucketLookup = new Map<string, DashboardScanPulsePoint>();
      for (const p of points) {
        const hourKey = p.dateBucket.includes(":")
          ? p.dateBucket.slice(0, 5)
          : `${pad(new Date(p.timestamp).getUTCHours())}:00`;
        bucketLookup.set(hourKey, p);
      }

      const todayBase = points[0]?.timestamp.slice(0, 10) || new Date().toISOString().slice(0, 10);
      for (let h = 0; h < 24; h++) {
        const hh = `${pad(h)}:00`;
        const existing = bucketLookup.get(hh);
        if (existing) {
          list.push(existing);
        } else {
          list.push({
            dateBucket: hh,
            timestamp: `${todayBase}T${pad(h)}:00:00Z`,
            count: 0,
            emergencyCount: 0,
          });
        }
      }
      return list;
    }

    // Case 2: 7 Days -> 7 calendar days (T-6 to T)
    if (range === "7d") {
      const list: DashboardScanPulsePoint[] = [];
      const bucketLookup = new Map<string, DashboardScanPulsePoint>();
      for (const p of points) {
        bucketLookup.set(p.dateBucket.slice(0, 10), p);
      }

      const anchorDate = points[points.length - 1]?.dateBucket
        ? new Date(points[points.length - 1]!.dateBucket + "T00:00:00Z")
        : new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), anchorDate.getUTCDate() - i));
        const key = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
        const existing = bucketLookup.get(key);
        if (existing) {
          list.push(existing);
        } else {
          list.push({
            dateBucket: key,
            timestamp: `${key}T00:00:00Z`,
            count: 0,
            emergencyCount: 0,
          });
        }
      }
      return list;
    }

    // Case 3: 30 Days -> 30 calendar days (T-29 to T)
    if (range === "30d") {
      const list: DashboardScanPulsePoint[] = [];
      const bucketLookup = new Map<string, DashboardScanPulsePoint>();
      for (const p of points) {
        bucketLookup.set(p.dateBucket.slice(0, 10), p);
      }

      const anchorDate = points[points.length - 1]?.dateBucket
        ? new Date(points[points.length - 1]!.dateBucket + "T00:00:00Z")
        : new Date();

      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), anchorDate.getUTCDate() - i));
        const key = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
        const existing = bucketLookup.get(key);
        if (existing) {
          list.push(existing);
        } else {
          list.push({
            dateBucket: key,
            timestamp: `${key}T00:00:00Z`,
            count: 0,
            emergencyCount: 0,
          });
        }
      }
      return list;
    }

    // Case 4: "all" (All Time)
    if (points.length === 1) {
      const single = points[0]!;
      const dateParts = single.dateBucket.split("-").map(Number);
      const targetYear = dateParts[0] || new Date().getUTCFullYear();
      const targetMonth = (dateParts[1] || 1) - 1;
      const targetDay = dateParts[2] || 1;
      const targetDate = new Date(Date.UTC(targetYear, targetMonth, targetDay));

      const list: DashboardScanPulsePoint[] = [];
      for (let i = 6; i >= 1; i--) {
        const d = new Date(targetDate.getTime() - i * 24 * 60 * 60 * 1000);
        const yyyy = d.getUTCFullYear();
        const mm = pad(d.getUTCMonth() + 1);
        const dd = pad(d.getUTCDate());
        list.push({
          dateBucket: `${yyyy}-${mm}-${dd}`,
          timestamp: `${yyyy}-${mm}-${dd}T00:00:00Z`,
          count: 0,
          emergencyCount: 0,
        });
      }
      list.push(single);
      return list;
    }

    return points;
  }, [points, hasData, range]);

  // Tick spacing helper to prevent label crowding across large date domains
  const shouldShowTick = React.useCallback((index: number, total: number) => {
    if (total <= 8) return true;
    if (total <= 16) return index % 2 === 0 || index === total - 1;
    if (total <= 25) return index % 4 === 0 || index === total - 1;
    if (total <= 31) return index % 5 === 0 || index === total - 1;
    const step = Math.ceil(total / 6);
    return index % step === 0 || index === total - 1;
  }, []);

  // Compute coordinates
  const coordinates = React.useMemo(() => {
    if (displayPoints.length === 0) return [];
    const step = displayPoints.length > 1 ? chartWidth / (displayPoints.length - 1) : chartWidth / 2;

    return displayPoints.map((p, idx) => {
      const x = displayPoints.length === 1 ? chartWidth / 2 + paddingX : paddingX + idx * step;
      const y = baselineY - (p.count / maxVal) * chartHeight;
      return { x, y, point: p, index: idx };
    });
  }, [displayPoints, chartWidth, chartHeight, baselineY, maxVal, paddingX]);

  // Construct Smooth Cubic Bezier Line Path
  const pathD = React.useMemo(() => {
    if (coordinates.length === 0) return "";
    if (coordinates.length === 1) {
      const c = coordinates[0]!;
      return `M ${paddingX} ${c.y} L ${svgWidth - paddingX} ${c.y}`;
    }
    return coordinates.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      const prev = coordinates[idx - 1]!;
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }, "");
  }, [coordinates, paddingX, svgWidth]);

  // Gradient Area Fill Path
  const areaD = React.useMemo(() => {
    if (coordinates.length === 0 || !pathD) return "";
    const first = coordinates[0]!;
    const last = coordinates[coordinates.length - 1]!;
    return `${pathD} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [pathD, coordinates, baselineY]);

  // High-performance, jitter-free cursor tracking
  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      const svg = svgRef.current;
      if (!svg || coordinates.length === 0) return;
      const rect = svg.getBoundingClientRect();
      const mouseSvgX = ((e.clientX - rect.left) / rect.width) * svgWidth;

      let closestIdx = 0;
      let minDistance = Infinity;
      for (let i = 0; i < coordinates.length; i++) {
        const dist = Math.abs(coordinates[i]!.x - mouseSvgX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }
      setHoveredIndex(closestIdx);
    },
    [coordinates, svgWidth]
  );

  // Mobile Touch Scrubbing
  const handleTouch = React.useCallback(
    (e: React.TouchEvent<SVGElement>) => {
      const svg = svgRef.current;
      if (!svg || coordinates.length === 0 || !e.touches[0]) return;
      const rect = svg.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      const touchSvgX = ((clientX - rect.left) / rect.width) * svgWidth;

      let closestIdx = 0;
      let minDistance = Infinity;
      for (let i = 0; i < coordinates.length; i++) {
        const dist = Math.abs(coordinates[i]!.x - touchSvgX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }
      setHoveredIndex(closestIdx);
    },
    [coordinates, svgWidth]
  );

  const handleMouseLeave = React.useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const activeCoord = hoveredIndex !== null ? coordinates[hoveredIndex] : null;

  return (
    <div className="relative flex flex-col justify-between rounded-3xl border border-[#252320] bg-[#181715] p-4 sm:p-6 lg:p-7 text-[#FAF9F5] shadow-xl w-full max-w-full overflow-hidden">
      {/* Header & Metric Signals */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#cc785c] animate-pulse" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#8E8B82]">
              TEMPORAL SCAN PULSE
            </h2>
          </div>
          <p className="text-xs text-[#8E8B82]">
            Time-series telemetry of public safety resolutions and emergency triggers.
          </p>
        </div>

        {/* Signals */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-[#8E8B82]">
              TOTAL IN RANGE
            </div>
            <div className="font-mono text-xl font-extrabold text-white">
              {summary.totalScans}
            </div>
          </div>

          <div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-[#8E8B82]">
              PEAK DENSITY
            </div>
            <div className="font-mono text-xl font-extrabold text-[#5db8a6]">
              {summary.peakCount}
            </div>
          </div>

          {summary.emergencyScans > 0 && (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#c64545]">
                EMERGENCY
              </div>
              <div className="font-mono text-xl font-extrabold text-[#c64545]">
                {summary.emergencyScans}
              </div>
            </div>
          )}

          <div className="hidden sm:block">
            <div className="font-mono text-[9px] uppercase tracking-wider text-[#8E8B82]">
              LATEST SCAN
            </div>
            <div className="font-mono text-xs font-medium text-white">
              {summary.lastScanAt ? summary.lastScanAt.slice(0, 10) : "None recorded"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="relative mt-6 min-h-[230px] w-full">
        {!hasData ? (
          <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 sm:p-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#8E8B82]">
              <VaahanIcon name="activity" size={20} />
            </div>
            <h3 className="mt-3 font-mono text-xs font-semibold tracking-wider text-white uppercase">
              NO SCAN ACTIVITY
            </h3>
            <p className="mt-1 max-w-sm text-xs text-[#8E8B82]">
              No scan events were recorded for this vehicle in the selected period.
            </p>
            {onRangeChange && (
              <button
                type="button"
                onClick={onRangeChange}
                className="mt-3 font-mono text-xs text-[#cc785c] hover:underline cursor-pointer"
              >
                Change range preset →
              </button>
            )}
          </div>
        ) : (
          <div className="relative w-full overflow-hidden">
            {/* SVG Visual Instrument */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none block max-w-full"
              aria-hidden="true"
            >
              <defs>
                {/* Radiant Gradient Fill */}
                <linearGradient id="scanPulseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cc785c" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#cc785c" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#cc785c" stopOpacity="0.0" />
                </linearGradient>

                {/* Subtle Glow Filter */}
                <filter id="pulseGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Rails */}
              <line
                x1={paddingX}
                y1={paddingTop}
                x2={svgWidth - paddingX}
                y2={paddingTop}
                stroke="#252320"
                strokeWidth="1"
                strokeDasharray="3 3"
                className="pointer-events-none"
              />
              <line
                x1={paddingX}
                y1={paddingTop + chartHeight / 2}
                x2={svgWidth - paddingX}
                y2={paddingTop + chartHeight / 2}
                stroke="#252320"
                strokeWidth="1"
                strokeDasharray="3 3"
                className="pointer-events-none"
              />
              <line
                x1={paddingX}
                y1={baselineY}
                x2={svgWidth - paddingX}
                y2={baselineY}
                stroke="#3D3D3A"
                strokeWidth="1"
                className="pointer-events-none"
              />

              {/* Y-Axis Value Reference Markers */}
              <text
                x={paddingX - 12}
                y={paddingTop + 4}
                textAnchor="end"
                fontSize="12"
                className="font-mono fill-[#7E7B74] pointer-events-none select-none font-medium"
              >
                {maxVal}
              </text>
              <text
                x={paddingX - 12}
                y={paddingTop + chartHeight / 2 + 3}
                textAnchor="end"
                fontSize="12"
                className="font-mono fill-[#7E7B74] pointer-events-none select-none font-medium"
              >
                {Math.round(maxVal / 2)}
              </text>
              <text
                x={paddingX - 12}
                y={baselineY + 3}
                textAnchor="end"
                fontSize="12"
                className="font-mono fill-[#7E7B74] pointer-events-none select-none font-medium"
              >
                0
              </text>

              {/* Area Fill */}
              {areaD && (
                <path
                  d={areaD}
                  fill="url(#scanPulseGradient)"
                  className="pointer-events-none transition-all duration-300"
                />
              )}

              {/* Smooth Spline Stroke Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#cc785c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none"
                />
              )}

              {/* X-Axis Date Tick Labels */}
              {coordinates.map((c) => {
                if (!shouldShowTick(c.index, coordinates.length)) return null;
                const parts = c.point.dateBucket.split("-");
                const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : c.point.dateBucket;
                return (
                  <text
                    key={`tick-${c.index}`}
                    x={c.x}
                    y={baselineY + 20}
                    textAnchor="middle"
                    fontSize="12"
                    className="font-mono fill-[#8E8B82] pointer-events-none select-none font-medium"
                  >
                    {label}
                  </text>
                );
              })}

              {/* Discrete Signal Markers on Curve */}
              {coordinates.map((coord) => {
                const isZero = coord.point.count === 0;
                const isEmergency = coord.point.emergencyCount > 0;
                const isHovered = hoveredIndex === coord.index;

                if (isZero) {
                  return (
                    <circle
                      key={coord.index}
                      cx={coord.x}
                      cy={coord.y}
                      r="2"
                      fill="#3D3D3A"
                      className="pointer-events-none"
                    />
                  );
                }

                return (
                  <g key={coord.index} className="pointer-events-none">
                    {/* Ambient halo for active peaks */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r="8"
                      fill={isEmergency ? "#c64545" : "#cc785c"}
                      opacity="0.25"
                    />
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isHovered ? "5" : "4"}
                      fill={isEmergency ? "#c64545" : "#cc785c"}
                      stroke="#181715"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}

              {/* Active Hover Crosshair & Focus Marker */}
              {activeCoord && (
                <g className="pointer-events-none">
                  {/* Vertical Crosshair Guide */}
                  <line
                    x1={activeCoord.x}
                    y1={paddingTop}
                    x2={activeCoord.x}
                    y2={baselineY}
                    stroke="#5db8a6"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />
                  {/* Outer Pulsing Aura */}
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="10"
                    fill="none"
                    stroke="#cc785c"
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                  {/* Core Highlight Dot */}
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="5.5"
                    fill="#cc785c"
                    stroke="#FAF9F5"
                    strokeWidth="2.5"
                  />
                </g>
              )}

              {/* Transparent Interactive Touch & Mouse Tracking Overlay */}
              <rect
                x={0}
                y={0}
                width={svgWidth}
                height={svgHeight}
                fill="transparent"
                className="cursor-crosshair touch-none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouch}
                onTouchMove={handleTouch}
                onTouchEnd={handleMouseLeave}
              />
            </svg>

            {/* Hover Data Inspector Card */}
            {activeCoord && (
              <ScanPulseInspector
                point={activeCoord.point}
                vehiclePlate={vehiclePlate}
                qrVisibleCode={qrVisibleCode}
                x={(activeCoord.x / svgWidth) * 100}
                y={(activeCoord.y / svgHeight) * 100}
              />
            )}
          </div>
        )}
      </div>

      {/* Accessible Table Alternative & Screen Reader Summary */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-t border-white/10 pt-3">
        <div className="font-mono text-[10px] text-[#8E8B82]">
          {(() => {
            if (!hasData) return "No telemetry records in filter window";
            const scanWord = summary.totalScans === 1 ? "scan" : "scans";
            const activeCount = points.filter((p) => p.count > 0).length;
            if (range === "today") {
              return `${summary.totalScans} ${scanWord} recorded today across ${activeCount} active hour${activeCount === 1 ? "" : "s"}`;
            }
            if (range === "7d") {
              return `${summary.totalScans} ${scanWord} across ${activeCount} active date${activeCount === 1 ? "" : "s"} in 7-day window`;
            }
            if (range === "30d") {
              return `${summary.totalScans} ${scanWord} across ${activeCount} active date${activeCount === 1 ? "" : "s"} in 30-day window`;
            }
            return `${summary.totalScans} total lifetime ${scanWord} across ${activeCount} active date${activeCount === 1 ? "" : "s"}`;
          })()}
        </div>

        {hasData && (
          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            className="font-mono text-[10px] text-[#5db8a6] hover:underline cursor-pointer"
          >
            {showTable ? "Hide Data Table" : "View Accessible Table"}
          </button>
        )}
      </div>

      {showTable && hasData && (
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-[#1F1E1B] p-3 text-xs">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-[#8E8B82]">
                <th className="pb-1">{range === "today" ? "Time" : "Date"}</th>
                <th className="pb-1">Scans</th>
                <th className="pb-1">Emergency</th>
                <th className="pb-1">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {points.map((pt) => (
                <tr key={pt.dateBucket}>
                  <td className="py-1 text-white">
                    {pt.dateBucket.includes(":") ? `Today, ${pt.dateBucket}` : pt.dateBucket}
                  </td>
                  <td className="py-1 text-[#cc785c]">{pt.count}</td>
                  <td className="py-1">{pt.emergencyCount}</td>
                  <td className="py-1 text-[#8E8B82]">
                    {pt.latestCity ? `${pt.latestCity}, ${pt.latestState || ""}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
