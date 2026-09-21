import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export interface PhysicalQrArtifactProps {
  demoId?: string;
  className?: string;
}

export function PhysicalQrArtifact({
  demoId = "VS-7F3K-9021",
  className = "",
}: PhysicalQrArtifactProps) {
  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* 1. Milestone Top: PHYSICAL VEHICLE */}
      <div className="flex flex-col items-center space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Physical Vehicle
        </span>
        <span className="size-2 rounded-full bg-foreground/60" />
        <div className="w-px h-6 bg-border" />
      </div>

      {/* 2. Physical Sticker Artifact Container */}
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] rounded-2xl border-2 border-[#E6DFD8] bg-[#FAF9F5] p-5 sm:p-6 shadow-sm">
        {/* Subtle Registration Marks (Corner Crosshairs) */}
        <span className="absolute -top-1.5 -left-1.5 size-3 border-t-2 border-l-2 border-[#CC785C]/60" />
        <span className="absolute -top-1.5 -right-1.5 size-3 border-t-2 border-r-2 border-[#CC785C]/60" />
        <span className="absolute -bottom-1.5 -left-1.5 size-3 border-b-2 border-l-2 border-[#CC785C]/60" />
        <span className="absolute -bottom-1.5 -right-1.5 size-3 border-b-2 border-r-2 border-[#CC785C]/60" />

        {/* Sticker Header: VaahanSafe Mark + Public Tag */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD8]">
          <div className="flex items-center gap-1.5">
            <VaahanIcon name="shield" size={14} className="text-[#CC785C]" />
            <span className="font-serif text-xs font-bold tracking-tight text-[#141413]">
              VAAHANSAFE
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#6C6A64]">
            Vehicle Safety Pass
          </span>
        </div>

        {/* Realistic Non-Functional QR Matrix Graphic */}
        <div className="my-4 flex flex-col items-center">
          <div className="p-3 bg-white rounded-xl border border-[#E6DFD8] shadow-inner">
            <svg
              width="140"
              height="140"
              viewBox="0 0 140 140"
              className="text-[#141413]"
              role="img"
              aria-label="VaahanSafe Demo QR Matrix Graphic (Non-Functional)"
            >
              {/* Corner Position Detection Squares (Top-Left, Top-Right, Bottom-Left) */}
              <rect x="10" y="10" width="34" height="34" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="20" y="20" width="14" height="14" rx="2" fill="currentColor" />

              <rect x="96" y="10" width="34" height="34" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="106" y="20" width="14" height="14" rx="2" fill="currentColor" />

              <rect x="10" y="96" width="34" height="34" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="20" y="106" width="14" height="14" rx="2" fill="currentColor" />

              {/* Precise Demo Matrix Pattern */}
              <g fill="currentColor">
                <rect x="52" y="12" width="6" height="6" />
                <rect x="64" y="12" width="6" height="6" />
                <rect x="76" y="12" width="6" height="6" />
                <rect x="52" y="24" width="6" height="6" />
                <rect x="70" y="24" width="6" height="6" />
                <rect x="82" y="24" width="6" height="6" />
                <rect x="58" y="36" width="6" height="6" />
                <rect x="76" y="36" width="6" height="6" />

                {/* Center shield emblem anchor */}
                <rect x="58" y="58" width="24" height="24" rx="3" fill="#CC785C" />
                <rect x="66" y="66" width="8" height="8" rx="1" fill="#FAF9F5" />

                <rect x="14" y="54" width="6" height="6" />
                <rect x="26" y="54" width="6" height="6" />
                <rect x="38" y="54" width="6" height="6" />
                <rect x="92" y="54" width="6" height="6" />
                <rect x="104" y="54" width="6" height="6" />
                <rect x="116" y="54" width="6" height="6" />

                <rect x="14" y="66" width="6" height="6" />
                <rect x="32" y="66" width="6" height="6" />
                <rect x="44" y="66" width="6" height="6" />
                <rect x="98" y="66" width="6" height="6" />
                <rect x="110" y="66" width="6" height="6" />

                <rect x="20" y="78" width="6" height="6" />
                <rect x="38" y="78" width="6" height="6" />
                <rect x="50" y="78" width="6" height="6" />
                <rect x="92" y="78" width="6" height="6" />
                <rect x="116" y="78" width="6" height="6" />

                <rect x="52" y="92" width="6" height="6" />
                <rect x="70" y="92" width="6" height="6" />
                <rect x="82" y="92" width="6" height="6" />
                <rect x="58" y="104" width="6" height="6" />
                <rect x="76" y="104" width="6" height="6" />
                <rect x="94" y="104" width="6" height="6" />
                <rect x="64" y="116" width="6" height="6" />
                <rect x="82" y="116" width="6" height="6" />
                <rect x="106" y="116" width="6" height="6" />
                <rect x="118" y="116" width="6" height="6" />
              </g>
            </svg>
          </div>
        </div>

        {/* Sticker Footer: Monospace Public ID + Demo Notice */}
        <div className="text-center space-y-1">
          <span className="font-mono text-xs font-bold tracking-widest text-[#141413] block">
            {demoId}
          </span>
          <div className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#CC785C]" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#6C6A64]">
              DEMO / NON-FUNCTIONAL
            </span>
          </div>
        </div>
      </div>

      {/* 3. Milestone Bottom: SCAN -> PUBLIC SAFETY VIEW */}
      <div className="flex flex-col items-center space-y-1 mt-1">
        <div className="w-px h-6 bg-border" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#CC785C] font-semibold">
          Camera Scan
        </span>
        <div className="w-px h-6 bg-border" />
        <span className="size-2 rounded-full bg-[#CC785C] ring-4 ring-[#CC785C]/20" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-foreground font-semibold">
          Public Safety View
        </span>
      </div>
    </div>
  );
}
