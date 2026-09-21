import * as React from "react";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";

interface BrandLogoProps {
  size?: "sm" | "default" | "lg";
  showTagline?: boolean;
  className?: string;
  href?: string;
  theme?: "dark" | "light";
}

export function BrandLogo({
  size = "default",
  showTagline = false,
  className = "",
  href = "/",
  theme,
}: BrandLogoProps) {
  return (
    <VaahanSafeLogo
      size={size}
      showTagline={showTagline}
      className={className}
      href={href || undefined}
      theme={theme}
    />
  );
}
