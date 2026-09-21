import * as React from "react";
import type { VaahanSafeIdentityPulseProps } from "./brand.types";
import { BRAND_COLORS } from "./brand.constants";

/** Four identity cells converge gently. No concentric/radar waves. */
export function VaahanSafeIdentityPulse({
  size = 12,
  status = "active",
  className = "",
  reducedMotion = false,
}: VaahanSafeIdentityPulseProps) {
  const color =
    status === "active"
      ? BRAND_COLORS.success
      : status === "resolving"
        ? BRAND_COLORS.coral
        : BRAND_COLORS.muted;
  return (
    <span
      className={`vs-identity-pulse ${className}`}
      role="status"
      aria-label={`Identity ${status}`}
      data-state={status}
      data-reduced-motion={reducedMotion || undefined}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        aria-hidden="true"
        fill={color}
      >
        <g className="vs-pulse-cells">
          <path d="M3 3h4v4H3Z M9 3h4v4H9Z M3 9h4v4H3Z M9 9h4v4H9Z" />
        </g>
      </svg>
    </span>
  );
}
