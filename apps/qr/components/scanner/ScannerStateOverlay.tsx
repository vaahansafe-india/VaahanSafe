"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { ScannerState } from "./types";

interface ScannerStateOverlayProps {
  state: ScannerState;
  errorMessage: string | null;
  onRetry: () => void;
  onOpenManualEntry: () => void;
}

export function ScannerStateOverlay({
  state,
  errorMessage,
  onRetry,
  onOpenManualEntry,
}: ScannerStateOverlayProps) {
  return (
    <div
      aria-live="polite"
      className="absolute inset-x-0 bottom-4 z-20 px-4 flex flex-col items-center pointer-events-none"
    >
      {/* 1. Normal Active Scanning Pill */}
      {state === "SCANNING" && (
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-mono tracking-wider shadow-lg">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>CAMERA ACTIVE &bull; LOOKING FOR QR</span>
        </div>
      )}

      {/* 2. Requesting Permission */}
      {state === "REQUESTING_PERMISSION" && (
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-mono shadow-lg">
          <span className="size-2 rounded-full bg-amber-400 animate-ping" />
          <span>REQUESTING CAMERA PERMISSION&hellip;</span>
        </div>
      )}

      {/* 3. Valid QR Found (Brief smooth transition) */}
      {state === "RESOLVING" && (
        <div className="flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 text-emerald-100 shadow-xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2">
            <VaahanIcon name="check" size={16} className="text-emerald-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-300">
              VaahanSafe QR Found
            </span>
          </div>
          <span className="text-[11px] text-emerald-200/80 font-sans">
            Opening safety identity&hellip;
          </span>
        </div>
      )}

      {/* 4. Invalid QR Encountered */}
      {state === "INVALID_QR" && (
        <div className="pointer-events-auto flex flex-col items-center text-center p-4 rounded-2xl bg-[#181715]/95 backdrop-blur-md border border-amber-500/40 text-white max-w-xs shadow-2xl space-y-2 animate-in fade-in duration-200">
          <div className="size-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <VaahanIcon name="warning" size={16} />
          </div>
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              QR Not Recognized
            </span>
            <p className="text-xs text-[#FAF9F5]/80 font-sans leading-tight">
              This doesn&apos;t appear to be a VaahanSafe vehicle QR.
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 h-8 px-4 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-500/40 transition-colors cursor-pointer"
          >
            Scan Again
          </button>
        </div>
      )}

      {/* 5. Camera Permission Denied */}
      {state === "PERMISSION_DENIED" && (
        <div className="pointer-events-auto flex flex-col items-center text-center p-5 rounded-2xl bg-[#181715]/95 backdrop-blur-md border border-border text-white max-w-sm shadow-2xl space-y-3 animate-in fade-in">
          <div className="size-10 rounded-xl bg-[#CC785C]/20 text-[#CC785C] flex items-center justify-center border border-[#CC785C]/30">
            <VaahanIcon name="shield" size={18} />
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#FAF9F5] block">
              Camera Access Required
            </span>
            <p className="text-xs text-[#FAF9F5]/70 font-sans leading-relaxed">
              VaahanSafe needs camera access only while you scan a vehicle sticker.
              If blocked, enable camera permissions in your browser settings.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1 w-full">
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 h-9 rounded-lg bg-[#CC785C] hover:bg-[#A9583E] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onOpenManualEntry}
              className="flex-1 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border border-white/20"
            >
              Enter QR ID
            </button>
          </div>
        </div>
      )}

      {/* 6. No Camera or Unsupported */}
      {(state === "NO_CAMERA" || state === "UNSUPPORTED" || state === "ERROR") && (
        <div className="pointer-events-auto flex flex-col items-center text-center p-5 rounded-2xl bg-[#181715]/95 backdrop-blur-md border border-destructive/40 text-white max-w-sm shadow-2xl space-y-3 animate-in fade-in">
          <div className="size-10 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center border border-destructive/30">
            <VaahanIcon name="alert" size={18} />
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-destructive block">
              Camera Unavailable
            </span>
            <p className="text-xs text-[#FAF9F5]/70 font-sans leading-relaxed">
              {errorMessage || "No video camera device was found on this system."}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenManualEntry}
            className="w-full h-9 rounded-lg bg-[#CC785C] hover:bg-[#A9583E] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Enter QR ID Instead
          </button>
        </div>
      )}
    </div>
  );
}
