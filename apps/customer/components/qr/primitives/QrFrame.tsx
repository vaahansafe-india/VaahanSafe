"use client";

import * as React from "react";
import { cn } from "@vaahansafe/ui/lib/utils";
import { generateScannableQrMatrix } from "@vaahansafe/qr-core/client";

interface QrFrameProps {
  publicId?: string;
  visibleCode?: string;
  status?: string;
  size?: number;
  className?: string;
  showTicks?: boolean;
  hideFooter?: boolean;
}

export function QrFrame({
  publicId = "7F3K9021",
  visibleCode,
  status = "ACTIVATED",
  size = 180,
  className,
  showTicks = true,
  hideFooter = false,
}: QrFrameProps) {
  const displayCode = visibleCode || `VS-${publicId}`;

  // Deterministically encode official scannable ISO/IEC 18004 QR code matrix
  const { size: matrixSize, pathData, url } = React.useMemo(() => {
    return generateScannableQrMatrix(publicId, {
      errorCorrectionLevel: "M",
      margin: 2,
    });
  }, [publicId]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl bg-white p-3 sm:p-4 shadow-sm border border-border/80 dark:border-border/60 max-w-full",
        className
      )}
      style={{
        width: hideFooter ? (className?.includes("p-0") ? size : size + 16) : size + 32,
        minHeight: hideFooter ? (className?.includes("p-0") ? size : size + 16) : size + 48,
        maxWidth: "100%",
      }}
    >
      {/* Corner Ticks */}
      {showTicks && (
        <>
          <div className="absolute top-1.5 left-1.5 size-2 border-t-2 border-l-2 border-neutral-400" />
          <div className="absolute top-1.5 right-1.5 size-2 border-t-2 border-r-2 border-neutral-400" />
          <div className="absolute bottom-1.5 left-1.5 size-2 border-b-2 border-l-2 border-neutral-400" />
          <div className="absolute bottom-1.5 right-1.5 size-2 border-b-2 border-r-2 border-neutral-400" />
        </>
      )}

      {/* Standards-Compliant Scannable SVG QR Matrix */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${matrixSize} ${matrixSize}`}
        className="shape-rendering-crispEdges select-none max-w-full h-auto"
        aria-label={`Official Scannable QR Code for VaahanSafe Identity ${displayCode} (${url})`}
        role="img"
      >
        <rect width={matrixSize} height={matrixSize} fill="#ffffff" />
        <path d={pathData} fill="#121316" />
      </svg>

      {/* Public Identity Monospace Footer */}
      {!hideFooter && (
        <div className="mt-2 flex w-full items-center justify-between px-1">
          <span className="font-mono text-[10px] font-bold tracking-wider text-neutral-900">
            {displayCode}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-wider",
              status === "ACTIVATED"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {status === "ACTIVATED" ? "ACTIVE" : status}
          </span>
        </div>
      )}
    </div>
  );
}
