import * as React from "react";

export type VaahanSafeMarkSize =
  16 | 20 | 24 | 32 | 40 | 48 | 64 | 80 | 96 | 128;

export type VaahanSafeMarkVariant = "brand" | "dark" | "light" | "mono";

export type VaahanSafeLogoOrientation = "horizontal" | "stacked";

export type VaahanSafeQrScannerState =
  "idle" | "detecting" | "scanning" | "resolving" | "identified" | "error";

export interface VaahanSafeMarkProps extends React.SVGAttributes<SVGSVGElement> {
  size?: VaahanSafeMarkSize | number;
  variant?: VaahanSafeMarkVariant;
  className?: string;
  title?: string;
  isFavicon?: boolean;
}

export interface VaahanSafeAppIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number;
  variant?: "dark" | "light";
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full" | "squircle";
  bordered?: boolean;
}

export interface VaahanSafeLogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "default" | "lg" | "xl";
  theme?: "dark" | "light";
  orientation?: VaahanSafeLogoOrientation;
  variant?: VaahanSafeMarkVariant;
  showTagline?: boolean;
  className?: string;
  href?: string;
}

export interface AnimatedVaahanSafeMarkProps extends VaahanSafeMarkProps {
  size?: VaahanSafeMarkSize | number;
  variant?: VaahanSafeMarkVariant;
  className?: string;
  autoPlay?: boolean;
  durationMs?: number;
  onComplete?: () => void;
  reducedMotion?: boolean;
}

export interface AnimatedVaahanSafeLogoProps extends VaahanSafeLogoProps {
  autoPlay?: boolean;
  onComplete?: () => void;
  className?: string;
  reducedMotion?: boolean;
}

export interface VaahanSafeQrScannerProps {
  state?: VaahanSafeQrScannerState;
  size?: number;
  vehicleLabel?: string;
  errorMessage?: string;
  className?: string;
  onScanComplete?: () => void;
  reducedMotion?: boolean;
}

export interface VaahanSafeLoaderProps {
  size?: number;
  variant?: VaahanSafeMarkVariant;
  label?: string;
  className?: string;
  reducedMotion?: boolean;
}

export interface VaahanSafeMicroLoaderProps {
  size?: number;
  className?: string;
  reducedMotion?: boolean;
}

export interface VaahanSafeIdentityPulseProps {
  size?: number;
  status?: "active" | "resolving" | "idle";
  className?: string;
  reducedMotion?: boolean;
}
