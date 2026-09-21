import * as React from "react";
import type { VaahanSafeAppIconProps } from "./brand.types";
import { VaahanSafeMark } from "./VaahanSafeMark";
import { BRAND_COLORS } from "./brand.constants";

export function VaahanSafeAppIcon({
  size = 64,
  variant = "dark",
  className = "",
  rounded = "squircle",
  bordered = true,
  style,
  ...rest
}: VaahanSafeAppIconProps) {
  const hidden = rest["aria-hidden"] === true || rest["aria-hidden"] === "true";
  const radius = { sm: 6, md: 8, lg: 12, full: "50%", squircle: "24%" }[
    rounded
  ];
  return (
    <span
      {...rest}
      className={`vs-app-icon ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background:
          variant === "dark" ? BRAND_COLORS.dark : BRAND_COLORS.canvas,
        border: bordered
          ? `1px solid ${variant === "dark" ? BRAND_COLORS.body : BRAND_COLORS.cream}`
          : undefined,
        ...style,
      }}
      role={hidden ? undefined : "img"}
      aria-label={
        hidden ? undefined : (rest["aria-label"] ?? "VaahanSafe app icon")
      }
    >
      <VaahanSafeMark size={size * 0.82} variant={variant} aria-hidden="true" />
    </span>
  );
}
