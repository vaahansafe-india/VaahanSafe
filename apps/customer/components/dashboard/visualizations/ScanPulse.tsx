"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { ScanPulseInspector } from "./ScanPulseInspector";
import type { DashboardScanSummary } from "@/lib/dashboard-types";

interface ScanPulseProps {
  summary: DashboardScanSummary;
  vehiclePlate: string;
  qrVisibleCode?: string;
  onRangeChange?: () => void;
}

export function ScanPulse({
  summary,
  vehiclePlate,
  qrVisibleCode,
  onRangeChange,
}: ScanPulseProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [showTable, setShowTable] = React.useState(false);

  const points = summary.points;
  const hasData = points.length > 0 && summary.totalScans > 0;

  // Compute SVG geometry strictly based on real points
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const maxVal = Math.max(summary.peakCount, 4);

  const coordinates = React.useMemo(() => {
    if (!hasData) return [];
    const step = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth / 2;

    return points.map((p, idx) => {
      const x = points.length === 1 ? chartWidth / 2 + paddingX : paddingX + idx * step;
      const y = paddingY + chartHeight - (p.count / maxVal) * chartHeight;
      return { x, y, point: p, index: idx };
    });
  }, [points, chartWidth, chartHeight, maxVal, hasData]);

  // Construct SVG Path
  const pathD = React.useMemo(() => {
    if (coordinates.length === 0) return "";
    if (coordinates.length === 1) {
      const c = coordinates[0]!;
      return `M ${paddingX} ${c.y} L ${svgWidth - paddingX} ${c.y}`;
    }
    return coordinates.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      // Smooth curve between real points
      const prev = coordinates[idx - 1]!;
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }, "");
  }, [coordinates, paddingX, svgWidth]);

  const activeCoord = hoveredIndex !== null ? coordinates[hoveredIndex] : null;

  return (
    <div className="relative flex flex-col justify-between rounded-3xl border border-[#252320] bg-[#181715] p-6 text-[#FAF9F5] shadow-xl sm:p-7">
      {/* Header & Metric Signals */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#cc785c]" />
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

      {/* Main Chart Body or Truthful Empty State */}
      <div className="relative mt-6 min-h-[220px] w-full">
        {!hasData ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
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
                className="mt-3 font-mono text-xs text-[#cc785c] hover:underline"
              >
                Change range preset →
              </button>
            )}
          </div>
        ) : (
          <div className="relative w-full overflow-hidden">
            {/* SVG Visual Instrument */}
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none"
              aria-hidden="true"
            >
              {/* Subtle Horizontal Temporal Rails */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={svgWidth - paddingX}
                y2={paddingY}
                stroke="#252320"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingX}
                y1={paddingY + chartHeight / 2}
                x2={svgWidth - paddingX}
                y2={paddingY + chartHeight / 2}
                stroke="#252320"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingX}
                y1={paddingY + chartHeight}
                x2={svgWidth - paddingX}
                y2={paddingY + chartHeight}
                stroke="#3D3D3A"
                strokeWidth="1"
              />

              {/* Area fill */}
              {coordinates.length > 1 && (
                <path
                  d={`${pathD} L ${coordinates[coordinates.length - 1]?.x} ${paddingY + chartHeight} L ${coordinates[0]?.x} ${paddingY + chartHeight} Z`}
                  fill="url(#scanPulseGradient)"
                  opacity="0.25"
                />
              )}

              {/* Stroke line */}
              <path
                d={pathD}
                fill="none"
                stroke="#cc785c"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Crosshair guide when hovering */}
              {activeCoord && (
                <>
                  <line
                    x1={activeCoord.x}
                    y1={paddingY}
                    x2={activeCoord.x}
                    y2={paddingY + chartHeight}
                    stroke="#5db8a6"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="6"
                    fill="#cc785c"
                    stroke="#FAF9F5"
                    strokeWidth="2"
                  />
                </>
              )}

              {/* Discrete Signal Points */}
              {coordinates.map((coord) => (
                <circle
                  key={coord.index}
                  cx={coord.x}
                  cy={coord.y}
                  r="4"
                  fill={coord.point.emergencyCount > 0 ? "#c64545" : "#cc785c"}
                  stroke="#181715"
                  strokeWidth="2"
                  className="cursor-pointer transition-transform hover:scale-150"
                  onMouseEnter={() => setHoveredIndex(coord.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}

              <defs>
                <linearGradient id="scanPulseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cc785c" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#cc785c" stopOpacity="0" />
                </linearGradient>
              </defs>
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
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <div className="font-mono text-[10px] text-[#8E8B82]">
          {hasData
            ? `${summary.totalScans} scan${summary.totalScans === 1 ? "" : "s"} across ${points.length} bucket${points.length === 1 ? "" : "s"}`
            : "No telemetry records in filter window"}
        </div>

        {hasData && (
          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            className="font-mono text-[10px] text-[#5db8a6] hover:underline"
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
                <th className="pb-1">Date</th>
                <th className="pb-1">Scans</th>
                <th className="pb-1">Emergency</th>
                <th className="pb-1">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {points.map((pt) => (
                <tr key={pt.dateBucket}>
                  <td className="py-1 text-white">{pt.dateBucket}</td>
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
