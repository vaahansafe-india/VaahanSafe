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
  // Clamp tooltip inside container
  const style: React.CSSProperties = {
    left: `${Math.max(10, Math.min(x, 80))}%`,
    top: `${Math.max(10, Math.min(y, 60))}%`,
  };

  return (
    <div
      style={style}
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full mb-3 w-56 rounded-xl border border-white/15 bg-[#252320] p-3 text-[#FAF9F5] shadow-2xl backdrop-blur-md transition-all duration-75"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#cc785c]">
          SCAN TELEMETRY
        </span>
        <span className="font-mono text-[9px] text-[#8E8B82]">
          {point.dateBucket}
        </span>
      </div>

      <div className="mt-2 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[#8E8B82] font-mono text-[10px] uppercase">Scans:</span>
          <span className="font-mono font-bold text-white">{point.count} incident{point.count === 1 ? "" : "s"}</span>
        </div>

        {point.emergencyCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[#c64545] font-mono text-[10px] uppercase">Emergency:</span>
            <span className="font-mono font-bold text-[#c64545]">{point.emergencyCount}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[#8E8B82] font-mono text-[10px] uppercase">Vehicle:</span>
          <span className="font-mono text-white text-[11px]">{vehiclePlate}</span>
        </div>

        {qrVisibleCode && (
          <div className="flex items-center justify-between">
            <span className="text-[#8E8B82] font-mono text-[10px] uppercase">QR:</span>
            <span className="font-mono text-[#cc785c] text-[11px]">{qrVisibleCode}</span>
          </div>
        )}

        {point.latestCity && (
          <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[10px] text-[#8E8B82]">
            <span>Location:</span>
            <span className="text-white truncate max-w-[120px]">
              {point.latestCity}{point.latestState ? `, ${point.latestState}` : ""}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-1 text-[9px] font-mono text-[#8E8B82]">
        <span>SAFE PUBLIC TELEMETRY</span>
        <span className="text-[#5db8a6]">VERIFIED</span>
      </div>
    </div>
  );
}
