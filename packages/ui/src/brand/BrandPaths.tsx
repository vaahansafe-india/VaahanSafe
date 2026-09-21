import * as React from "react";
import {
  ALL_CORNERS_PATH,
  VEHICLE_BODY_PATH,
  QR_FINDERS_PATH,
  QR_DATA_PATH,
  QR_COMPACT_PATH,
} from "./brand.geometry";
import { markColors } from "./brand.constants";
import type { VaahanSafeMarkVariant } from "./brand.types";

/** Shared by static/animated marks, icons and exported assets. Four filled paths. */
export function BrandPaths({
  variant,
  compact = false,
}: {
  variant: VaahanSafeMarkVariant;
  compact?: boolean;
}) {
  const colors = markColors(variant);
  return (
    <>
      <path data-brand-part="frame" d={ALL_CORNERS_PATH} fill={colors.frame} />
      <path
        data-brand-part="vehicle"
        d={VEHICLE_BODY_PATH}
        fill={colors.symbol}
        fillRule="evenodd"
      />
      <path
        data-brand-part="identity"
        d={compact ? QR_COMPACT_PATH : QR_FINDERS_PATH}
        fill={colors.symbol}
        fillRule="evenodd"
      />
      {!compact && (
        <path data-brand-part="data" d={QR_DATA_PATH} fill={colors.symbol} />
      )}
    </>
  );
}
