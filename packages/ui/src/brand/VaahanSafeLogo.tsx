import * as React from "react";
import type { VaahanSafeLogoProps } from "./brand.types";
import { VaahanSafeMark } from "./VaahanSafeMark";
import { BRAND_COLORS, LOGO_SIZES, markColors } from "./brand.constants";

/** HTML wordmark uses approved Cormorant Garamond; application UI stays sans-serif. */
export function BrandWordmark({
  variant,
  textSize,
  showTagline,
}: {
  variant: NonNullable<VaahanSafeLogoProps["variant"]>;
  textSize: number;
  showTagline?: boolean;
}) {
  const colors = markColors(variant);
  return (
    <span className="vs-wordmark-wrap">
      <span
        className="vs-wordmark"
        style={{ fontSize: textSize, color: colors.symbol }}
      >
        Vaahan<span style={{ color: colors.frame }}>Safe</span>
      </span>
      {showTagline && (
        <span className="vs-tagline">Vehicle safety identity</span>
      )}
    </span>
  );
}

export function VaahanSafeLogo({
  size = "md",
  orientation = "horizontal",
  variant = "brand",
  theme,
  showTagline = false,
  className = "",
  href,
  style,
  ...rest
}: VaahanSafeLogoProps) {
  const resolvedVariant = theme ?? variant;
  const config = LOGO_SIZES[size];
  const hidden = rest["aria-hidden"] === true || rest["aria-hidden"] === "true";
  const content = (
    <span
      {...rest}
      className={`vs-logo ${orientation === "stacked" ? "vs-logo-stacked" : ""} ${className}`}
      style={{
        gap: config.gap,
        color:
          resolvedVariant === "light"
            ? BRAND_COLORS.ink
            : resolvedVariant === "dark"
              ? BRAND_COLORS.canvas
              : undefined,
        ...style,
      }}
      role={hidden ? undefined : "img"}
      aria-label={hidden ? undefined : (rest["aria-label"] ?? "VaahanSafe")}
    >
      <VaahanSafeMark
        size={config.mark}
        variant={resolvedVariant}
        aria-hidden="true"
      />
      <BrandWordmark
        variant={resolvedVariant}
        textSize={config.text}
        showTagline={showTagline}
      />
    </span>
  );
  return href ? (
    <a href={href} className="vs-logo-link" aria-label="VaahanSafe home">
      {content}
    </a>
  ) : (
    content
  );
}
