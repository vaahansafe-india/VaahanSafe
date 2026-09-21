import type { VaahanSafeMarkVariant } from "./brand.types";

/** Modern zinc palette with warm coral brand accent. */
export const BRAND_COLORS = {
  canvas: "#ffffff",
  coral: "#cc785c",
  coralActive: "#a9583e",
  ink: "#09090b",
  body: "#27272a",
  muted: "#71717a",
  soft: "#f4f4f5",
  surface: "#ffffff",
  cream: "#e4e4e7",
  dark: "#09090b",
  elevated: "#18181b",
  teal: "#5db8a6",
  amber: "#e8a55a",
  success: "#5db872",
  warning: "#d4a017",
  emergency: "#c64545",
} as const;

export const BRAND_MOTION = {
  instant: 80,
  fast: 140,
  standard: 200,
  expressive: 320,
  slow: 480,
  reveal: 1800,
  wordmark: 320,
  loader: 1600,
  enter: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

export function markColors(variant: VaahanSafeMarkVariant) {
  return {
    symbol:
      variant === "dark"
        ? BRAND_COLORS.canvas
        : variant === "light"
          ? BRAND_COLORS.ink
          : "currentColor",
    frame: variant === "mono" ? "currentColor" : BRAND_COLORS.coral,
  };
}

export const LOGO_SIZES = {
  sm: { mark: 24, text: 24, gap: 8 },
  md: { mark: 32, text: 32, gap: 10 },
  default: { mark: 32, text: 32, gap: 10 },
  lg: { mark: 48, text: 48, gap: 14 },
  xl: { mark: 64, text: 64, gap: 18 },
} as const;
