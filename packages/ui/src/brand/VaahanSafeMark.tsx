import * as React from "react";
import type { VaahanSafeMarkProps } from "./brand.types";
import { BrandPaths } from "./BrandPaths";

export function VaahanSafeMark({
  size = 32,
  variant = "brand",
  className = "",
  title = "VaahanSafe",
  isFavicon = false,
  ...rest
}: VaahanSafeMarkProps) {
  const hidden = rest["aria-hidden"] === true || rest["aria-hidden"] === "true";
  const label = hidden ? undefined : (rest["aria-label"] ?? title);
  return (
    <svg
      {...rest}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`vs-mark ${className}`}
      role={hidden ? undefined : "img"}
      aria-label={label}
    >
      {!hidden && title && <title>{title}</title>}
      <BrandPaths variant={variant} compact={isFavicon || size <= 24} />
    </svg>
  );
}
