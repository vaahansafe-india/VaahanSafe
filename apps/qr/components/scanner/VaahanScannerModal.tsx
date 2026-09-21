"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { VaahanSafeMark } from "@vaahansafe/ui/brand";
import { useCameraScanner } from "./useCameraScanner";
import { CameraViewfinder } from "./CameraViewfinder";
import { ScannerStateOverlay } from "./ScannerStateOverlay";
import { ManualIdFallback } from "./ManualIdFallback";

interface VaahanScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VaahanScannerModal({ isOpen, onClose }: VaahanScannerModalProps) {
  const router = useRouter();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    state,
    errorMessage,
    videoRef,
    facingMode,
    isTorchAvailable,
    isTorchOn,
    hasMultipleCameras,
    toggleTorch,
    switchCamera,
    scanFile,
    retryScan,
  } = useCameraScanner({
    active: isOpen && !showManualEntry,
    onSuccess: (publicId) => {
      onClose();
      router.push(`/${publicId}`);
    },
  });

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      scanFile(file);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="VaahanSafe QR Camera Scanner"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between sm:p-4 overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Centered Desktop Wrapper / Edge-to-Edge Mobile */}
      <div className="relative w-full h-full sm:max-w-xl sm:max-h-[720px] sm:my-auto sm:mx-auto sm:rounded-3xl sm:border sm:border-white/15 bg-[#141413] flex flex-col overflow-hidden shadow-2xl">
        {/* 1. Scanner Top Navigation Bar */}
        <header className="relative z-30 flex items-center justify-between px-4 py-3 bg-[#181715]/80 backdrop-blur-md border-b border-white/10 text-white select-none">
          <div className="flex items-center gap-2">
            <VaahanSafeMark size={22} variant="brand" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-sm font-semibold tracking-tight text-white">
                VAAHANSAFE
              </span>
              <span className="font-mono text-[10px] text-white/60 uppercase tracking-widest">
                / SCAN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Flashlight / Torch Toggle */}
            {isTorchAvailable && (
              <button
                type="button"
                onClick={toggleTorch}
                aria-label={isTorchOn ? "Turn flashlight off" : "Turn flashlight on"}
                className={`size-9 rounded-xl flex items-center justify-center border transition-colors ${
                  isTorchOn
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                    : "bg-white/10 text-white/80 border-white/15 hover:bg-white/20"
                }`}
              >
                <VaahanIcon name="alert" size={16} />
              </button>
            )}

            {/* Camera Switcher */}
            {hasMultipleCameras && (
              <button
                type="button"
                onClick={switchCamera}
                aria-label="Switch camera"
                className="size-9 rounded-xl bg-white/10 text-white/80 border border-white/15 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <VaahanIcon name="loading" size={16} />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close scanner"
              className="size-9 rounded-xl bg-white/10 text-white/80 border border-white/15 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <VaahanIcon name="error" size={16} />
            </button>
          </div>
        </header>

        {/* 2. Main Viewfinder / Manual Entry Area */}
        <div className="relative flex-1 w-full bg-black overflow-hidden flex flex-col justify-center">
          {showManualEntry ? (
            <div className="p-6 my-auto">
              <ManualIdFallback
                onClose={() => {
                  setShowManualEntry(false);
                  onClose();
                }}
              />
            </div>
          ) : (
            <>
              <CameraViewfinder
                videoRef={videoRef}
                state={state}
                facingMode={facingMode}
              />
              <ScannerStateOverlay
                state={state}
                errorMessage={errorMessage}
                onRetry={retryScan}
                onOpenManualEntry={() => setShowManualEntry(true)}
              />
            </>
          )}
        </div>

        {/* 3. Bottom Action Bar */}
        <footer className="relative z-30 p-4 bg-[#181715]/90 backdrop-blur-md border-t border-white/10 text-white space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs font-mono">
            {/* Toggle Manual Entry */}
            <button
              type="button"
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="text-white/80 hover:text-white underline underline-offset-4 decoration-white/30 transition-colors"
            >
              {showManualEntry ? "← Return to Camera" : "Enter QR ID manually"}
            </button>

            {/* Scan from Local Image File */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-white/80 hover:text-white underline underline-offset-4 decoration-white/30 transition-colors"
            >
              Scan from photo
            </button>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/50">
            <span>CAMERA / LOCAL SCAN</span>
            <span>QR decoding runs on device</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
