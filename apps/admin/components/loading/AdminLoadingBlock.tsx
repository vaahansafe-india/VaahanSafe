import React from "react";

export interface AdminLoadingBlockProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Low-noise geometric placeholder block with subtle opacity pulsing.
 * Conforms to VaahanSafe's warm paper aesthetic.
 * Automatically disabled under prefers-reduced-motion.
 */
export function AdminLoadingBlock({
  width = "100%",
  height = "16px",
  borderRadius = "4px",
  className = "",
  style,
}: AdminLoadingBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`admin-loading-block ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}
