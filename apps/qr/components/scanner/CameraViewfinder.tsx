"use client";

import React from "react";
import type { ScannerState, CameraFacingMode } from "./types";

interface CameraViewfinderProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  state: ScannerState;
  facingMode: CameraFacingMode;
}

export function CameraViewfinder({
  videoRef,
  state,
  facingMode,
}: CameraViewfinderProps) {
  const isUserFacing = facingMode === "user";
  const isValid = state === "RESOLVING";
  const isInvalid = state === "INVALID_QR";
  const isScanning = state === "SCANNING";

  return (
    <div className="relative w-full h-full min-h-[320px] bg-black overflow-hidden flex items-center justify-center select-none">
      {/* 1. Raw Camera Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${
          isUserFacing ? "-scale-x-100" : ""
        }`}
      />

      {/* 2. Translucent Ambient Mask (Darkens outer boundary) */}
      <div className="absolute inset-0 bg-black/45 pointer-events-none" />

      {/* 3. Central Viewfinder Target Area */}
      <div
        className={`relative z-10 w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-3xl transition-all duration-300 ${
          isValid
            ? "ring-4 ring-emerald-500/80 bg-emerald-500/10"
            : isInvalid
            ? "ring-4 ring-amber-500/80 bg-amber-500/10"
            : "ring-1 ring-white/20"
        }`}
      >
        {/* Four Restrained Corner Registration Marks */}
        <span
          className={`absolute -top-1 -left-1 size-7 border-t-4 border-l-4 rounded-tl-xl transition-colors ${
            isValid
              ? "border-emerald-400"
              : isInvalid
              ? "border-amber-400"
              : "border-[#CC785C]"
          }`}
        />
        <span
          className={`absolute -top-1 -right-1 size-7 border-t-4 border-r-4 rounded-tr-xl transition-colors ${
            isValid
              ? "border-emerald-400"
              : isInvalid
              ? "border-amber-400"
              : "border-[#CC785C]"
          }`}
        />
        <span
          className={`absolute -bottom-1 -left-1 size-7 border-b-4 border-l-4 rounded-bl-xl transition-colors ${
            isValid
              ? "border-emerald-400"
              : isInvalid
              ? "border-amber-400"
              : "border-[#CC785C]"
          }`}
        />
        <span
          className={`absolute -bottom-1 -right-1 size-7 border-b-4 border-r-4 rounded-br-xl transition-colors ${
            isValid
              ? "border-emerald-400"
              : isInvalid
              ? "border-amber-400"
              : "border-[#CC785C]"
          }`}
        />

        {/* Subtle Scanning Beam (Disabled on prefers-reduced-motion) */}
        {isScanning && (
          <>
            <style>{`
              @keyframes vsBeamScan {
                0%, 100% { transform: translateY(0); opacity: 0.3; }
                50% { transform: translateY(220px); opacity: 0.95; }
              }
            `}</style>
            <div
              className="absolute inset-x-3 top-2 h-0.5 bg-gradient-to-r from-transparent via-[#CC785C] to-transparent shadow-[0_0_8px_#CC785C] motion-reduce:hidden"
              style={{ animation: "vsBeamScan 2.4s ease-in-out infinite" }}
            />
          </>
        )}

        {/* Center Target Indicator (Subtle watermarked QR hint) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white">
            VaahanSafe QR
          </span>
        </div>
      </div>
    </div>
  );
}
