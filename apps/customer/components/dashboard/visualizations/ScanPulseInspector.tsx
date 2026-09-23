"use client";

import * as React from "react";
import type { DashboardScanPulsePoint } from "@/lib/dashboard-types";

interface ScanPulseInspectorProps {
  point: DashboardScanPulsePoint;
  vehiclePlate: string;
  qrVisibleCode?: string;
  x: number;
  y: number;
}

export function ScanPulseInspector({
  point,
  vehiclePlate,
  qrVisibleCode,
  x,
  y,
}: ScanPulseInspectorProps) {
  // Vertically flip tooltip on desktop if point is in upper half to prevent clipping
  const isUpperHalf = y < 50;

  return (
    <>
      {/* Mobile Telemetry HUD Strip (Top-Docked, Never Obscures Chart) */}
      <div className="sm:hidden pointer-events-none absolute top-1 inset-x-1.5 z-30 flex flex-col gap-1 rounded-xl border border-white/20 bg-[#1A1916]/95 p-2.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 pb-1 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-[#cc785c]">
              {point.dateBucket.includes(":") ? `Today, ${point.dateBucket}` : point.dateBucket}
            </span>
            <span className="text-white/40">&bull;</span>
            <span className="font-bold text-white">
              {point.count} {point.count === 1 ? "scan" : "scans"}
            </span>
            {point.emergencyCount > 0 && (
              <span className="font-bold text-[#c64545] text-[10px]">
                ({point.emergencyCount} alert)
              </span>
            )}
          </div>
          <span className="shrink-0 font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#5db8a6]">
            ✓ VERIFIED
          </span>
        </div>

        <div className="flex items-center justify-between text-[10.5px] font-mono">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="text-white/60">VEHICLE:</span>
            <span className="font-semibold text-white truncate">{vehiclePlate}</span>
          </div>
          {qrVisibleCode && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-white/60">PASS:</span>
              <span className="font-semibold text-[#cc785c]">{qrVisibleCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Floating Inspector Card */}
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
            {point.dateBucket.includes(":") ? `Today, ${point.dateBucket}` : point.dateBucket}
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
    </>
  );
}
