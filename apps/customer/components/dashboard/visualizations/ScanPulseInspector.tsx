"use client";

import * as React from "react";
import type { DashboardScanPulsePoint } from "@/lib/dashboard-types";

interface ScanPulseInspectorProps {
  point: DashboardScanPulsePoint;
  vehiclePlate: string;
  qrVisibleCode?: string;
  x: number;
  y: number;
  isHovering?: boolean;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function formatInspectorDate(dateBucket: string): string {
  if (dateBucket.includes(":")) {
    return `Today, ${dateBucket}`;
  }
  const parts = dateBucket.split("-");
  if (parts.length === 3) {
    const day = parts[2];
    const monthIdx = parseInt(parts[1] || "1", 10) - 1;
    const year = parts[0];
    return `${day} ${MONTHS[monthIdx] || parts[1]} ${year}`;
  }
  return dateBucket;
}

export function ScanPulseInspector({
  point,
  vehiclePlate,
  qrVisibleCode,
  x,
  y,
  isHovering = false,
}: ScanPulseInspectorProps) {
  // Vertically flip tooltip on desktop if point is in upper half to prevent clipping
  const isUpperHalf = y < 50;
  const formattedDate = formatInspectorDate(point.dateBucket);

  return (
    <>
      {/* Mobile Telemetry Readout (In-flow strip below SVG, never obscures chart) */}
      <div className="sm:hidden relative mt-2.5 w-full rounded-2xl border border-white/10 bg-[#1F1E1B] p-3 text-xs font-mono shadow-md">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#cc785c] animate-pulse" />
            <span className="font-bold text-[#cc785c] truncate">
              {formattedDate}
            </span>
            <span className="text-white/30">•</span>
            <span className="font-bold text-white shrink-0">
              {point.count} {point.count === 1 ? "scan" : "scans"}
            </span>
            {point.emergencyCount > 0 && (
              <span className="font-bold text-[#c64545] text-[10px] shrink-0">
                ({point.emergencyCount} alert{point.emergencyCount === 1 ? "" : "s"})
              </span>
            )}
          </div>
          <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-wider text-[#5db8a6]">
            ✓ VERIFIED
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[10.5px] text-[#8E8B82]">
          <div className="truncate min-w-0">
            <span className="text-white/40">VEHICLE: </span>
            <span className="font-semibold text-white">{vehiclePlate}</span>
          </div>
          {point.latestCity ? (
            <div className="shrink-0 text-white/80 text-[10px]">
              📍 {point.latestCity}{point.latestState ? `, ${point.latestState}` : ""}
            </div>
          ) : qrVisibleCode ? (
            <div className="flex items-center gap-1 shrink-0 text-[10px]">
              <span className="text-white/40">PASS:</span>
              <span className="font-semibold text-[#cc785c]">{qrVisibleCode}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Desktop Floating Inspector Card (Active on Hover) */}
      {isHovering && (
        <div
          style={{
            left: `${Math.max(18, Math.min(x, 82))}%`,
            top: `${y}%`,
          }}
          className={`hidden sm:block pointer-events-none absolute z-30 -translate-x-1/2 ${
            isUpperHalf ? "mt-3.5 translate-y-0" : "-translate-y-full mb-3.5"
          } w-60 rounded-2xl border border-white/15 bg-[#1F1E1B]/95 p-3.5 text-[#FAF9F5] shadow-2xl backdrop-blur-md will-change-transform`}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#cc785c]">
              SCAN TELEMETRY
            </span>
            <span className="font-mono text-[9.5px] font-semibold text-[#8E8B82]">
              {formattedDate}
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8E8B82] font-mono text-[10px] uppercase">Total Scans:</span>
              <span className="font-mono font-bold text-white">
                {point.count} {point.count === 1 ? "scan" : "scans"}
              </span>
            </div>

            {point.emergencyCount > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-[#c64545] font-mono text-[10px] uppercase">Emergency:</span>
                <span className="font-mono font-bold text-[#c64545]">
                  {point.emergencyCount} alert{point.emergencyCount === 1 ? "" : "s"}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[#8E8B82]">
                <span className="font-mono text-[10px] uppercase">Emergency:</span>
                <span className="font-mono text-[10.5px]">0 alerts</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[#8E8B82] font-mono text-[10px] uppercase">Vehicle:</span>
              <span className="font-mono text-white text-[11px] font-medium">{vehiclePlate}</span>
            </div>

            {qrVisibleCode && (
              <div className="flex items-center justify-between">
                <span className="text-[#8E8B82] font-mono text-[10px] uppercase">Pass ID:</span>
                <span className="font-mono text-[#cc785c] text-[11px] font-semibold">{qrVisibleCode}</span>
              </div>
            )}

            {point.latestCity && (
              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-[#8E8B82]">
                <span>Last Location:</span>
                <span className="text-white font-medium truncate max-w-[130px]">
                  {point.latestCity}{point.latestState ? `, ${point.latestState}` : ""}
                </span>
              </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-1.5 text-[9px] font-mono">
            <span className="text-[#8E8B82]">SAFE CLOUDFLARE D1</span>
            <span className="text-[#5db8a6] font-semibold">VERIFIED</span>
          </div>
        </div>
      )}
    </>
  );
}
