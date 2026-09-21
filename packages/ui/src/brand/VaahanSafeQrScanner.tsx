"use client";
import * as React from "react";
import type {
  VaahanSafeQrScannerProps,
  VaahanSafeQrScannerState,
} from "./brand.types";
import { BrandPaths } from "./BrandPaths";
import { ALL_CORNERS_PATH, DEMO_QR_PATH } from "./brand.geometry";
import { BRAND_COLORS } from "./brand.constants";

const messages: Record<VaahanSafeQrScannerState, string> = {
  idle: "Ready to scan QR",
  detecting: "QR detected",
  scanning: "Scanning QR",
  resolving: "Resolving VaahanSafe identity",
  identified: "Vehicle identity recognized",
  error: "Identity unavailable",
};

/** Presentational only: callers supply authoritative state; no camera, fetch or domain decisions. */
export function VaahanSafeQrScanner({
  state = "idle",
  size = 280,
  vehicleLabel,
  errorMessage = "Unable to recognize this identity. Try again.",
  className = "",
  onScanComplete,
  reducedMotion = false,
}: VaahanSafeQrScannerProps) {
  const previous = React.useRef<VaahanSafeQrScannerState | null>(null);
  const callback = React.useRef(onScanComplete);
  React.useEffect(() => {
    callback.current = onScanComplete;
  }, [onScanComplete]);
  React.useEffect(() => {
    if (state === "identified" && previous.current !== "identified")
      callback.current?.();
    previous.current = state;
  }, [state]);
  return (
    <div
      className={`vs-scanner ${className}`}
      data-state={state}
      data-reduced-motion={reducedMotion || undefined}
      style={{ width: size, maxWidth: "100%" }}
      role="region"
      aria-label="VaahanSafe identity scan"
    >
      <div className="vs-scanner-header">
        <span>Vehicle identity</span>
        <span className="vs-demo-label">Synthetic preview</span>
      </div>
      <svg className="vs-scanner-field" viewBox="0 0 32 32" aria-hidden="true">
        <path
          className="vs-scanner-frame"
          d={ALL_CORNERS_PATH}
          fill={BRAND_COLORS.coral}
        />
        <g className="vs-scanner-qr">
          <path
            d={DEMO_QR_PATH}
            fill={BRAND_COLORS.canvas}
            fillRule="evenodd"
          />
        </g>
        <g className="vs-scanner-result">
          <BrandPaths variant="dark" />
        </g>
        {state === "scanning" && (
          <rect
            className="vs-scanner-sweep"
            x="8"
            y="8"
            width="16"
            height="0.4"
            fill={BRAND_COLORS.coral}
          />
        )}
        {state === "error" && (
          <g fill={BRAND_COLORS.emergency}>
            <path d="M15 10h2v8h-2Z M15 20h2v2h-2Z" />
          </g>
        )}
      </svg>
      <div
        className="vs-scanner-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>
          {state === "identified" ? "✓ " : state === "error" ? "! " : ""}
          {messages[state]}
        </span>
        {state === "identified" && vehicleLabel && (
          <span className="vs-scanner-detail">{vehicleLabel}</span>
        )}
        {state === "error" && (
          <span className="vs-scanner-detail">{errorMessage}</span>
        )}
      </div>
    </div>
  );
}
