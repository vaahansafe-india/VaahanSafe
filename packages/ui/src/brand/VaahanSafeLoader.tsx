import * as React from "react";
import type {
  VaahanSafeLoaderProps,
  VaahanSafeMicroLoaderProps,
} from "./brand.types";
import { CORNER_PATHS, QR_COMPACT_PATH } from "./brand.geometry";
import { markColors } from "./brand.constants";

export function VaahanSafeLoader({
  size = 48,
  variant = "brand",
  label = "Loading safety identity",
  className = "",
  reducedMotion = false,
}: VaahanSafeLoaderProps) {
  const colors = markColors(variant);
  return (
    <span
      className={`vs-loader ${className}`}
      role="status"
      aria-label={label || "Loading"}
      data-reduced-motion={reducedMotion || undefined}
    >
      <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
        {CORNER_PATHS.map((d, index) => (
          <path
            key={d}
            className="vs-loader-module"
            d={d}
            fill={colors.frame}
            style={{ "--vs-module": index } as React.CSSProperties}
          />
        ))}
        <path
          className="vs-loader-core"
          d={QR_COMPACT_PATH}
          fill={colors.symbol}
          transform="translate(0 -6)"
        />
      </svg>
      {label && (
        <span className="vs-loader-label" aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}

/** Four filled identity cells; no full mark or spinner at button scale. */
export function VaahanSafeMicroLoader({
  size = 16,
  className = "",
  reducedMotion = false,
}: VaahanSafeMicroLoaderProps) {
  return (
    <span
      className={`vs-micro-loader ${className}`}
      role="status"
      aria-label="Loading"
      data-reduced-motion={reducedMotion || undefined}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        aria-hidden="true"
        fill="currentColor"
      >
        {["M2 2h5v5H2Z", "M9 2h5v5H9Z", "M9 9h5v5H9Z", "M2 9h5v5H2Z"].map(
          (d, index) => (
            <path
              key={d}
              d={d}
              className="vs-loader-module"
              style={{ "--vs-module": index } as React.CSSProperties}
            />
          ),
        )}
      </svg>
    </span>
  );
}
