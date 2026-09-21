/** Canonical filled geometry. All coordinates use the 32 × 32 master grid. */
export const BRAND_VIEWBOX = "0 0 32 32";

// Rounded, inward-facing terminals connect the frame visually to the shoulders.
export const CORNER_TOP_LEFT =
  "M4 12V7a3 3 0 0 1 3-3h5v2.5H7.5a1 1 0 0 0-1 1V10L4 12Z";
export const CORNER_TOP_RIGHT =
  "M20 4h5a3 3 0 0 1 3 3v5L25.5 10V7.5a1 1 0 0 0-1-1H20V4Z";
export const CORNER_BOTTOM_LEFT =
  "M4 20l2.5 2v2.5a1 1 0 0 0 1 1H11V28H7a3 3 0 0 1-3-3v-5Z";
export const CORNER_BOTTOM_RIGHT =
  "M25.5 22l2.5-2v5a3 3 0 0 1-3 3h-4v-2.5h3.5a1 1 0 0 0 1-1V22Z";
export const CORNER_PATHS = [
  CORNER_TOP_LEFT,
  CORNER_TOP_RIGHT,
  CORNER_BOTTOM_LEFT,
  CORNER_BOTTOM_RIGHT,
] as const;
export const ALL_CORNERS_PATH = CORNER_PATHS.join(" ");

// One vehicle mass; the windshield, lamps and identity channel are real cutouts.
// The central dip in the windshield quietly suggests a V.
export const VEHICLE_BODY_PATH =
  "M11 8.5h10a3 3 0 0 1 2.5 1.4L26 15v6.5a1.5 1.5 0 0 1-1.5 1.5H21v-2h-1v-4h-8v4h-1v2H7.5A1.5 1.5 0 0 1 6 21.5V15l2.5-5.1A3 3 0 0 1 11 8.5Z " +
  "M11 11h10l2 4h-5l-2 1-2-1H9l2-4Z " +
  "M7.5 16.5l3.5 1v2H8l-.5-3Z M24.5 16.5l-.5 3h-3v-2l3.5-1Z";

// Three abstract finder modules and two data cells. Never a functional QR code.
export const QR_FINDERS_PATH =
  "M12 18h3v3h-3Z M13 19v1h1v-1Z " +
  "M17 18h3v3h-3Z M18 19v1h1v-1Z " +
  "M12 23h3v3h-3Z M13 24v1h1v-1Z";
export const QR_DATA_PATH = "M16 22h2v2h-2Z M18 24h2v2h-2Z";
export const QR_COMPACT_PATH =
  "M12 18h3v3h-3Z M17 18h3v3h-3Z M12 23h3v3h-3Z M17 23h3v3h-3Z";
export const FAVICON_COMPOSITE_PATH = `${ALL_CORNERS_PATH} ${VEHICLE_BODY_PATH} ${QR_COMPACT_PATH}`;

// Synthetic scanning target: deliberately incomplete; no encoded payload.
export const DEMO_QR_PATH =
  "M9 9h5v5H9Z M10.5 10.5v2h2v-2Z M18 9h5v5h-5Z M19.5 10.5v2h2v-2Z " +
  "M9 18h5v5H9Z M10.5 19.5v2h2v-2Z M16 10h1v3h-1Z M9 16h3v1H9Z " +
  "M15 15h3v2h-3Z M20 16h3v2h-3Z M16 19h2v4h-2Z M19 20h2v1h-2Z M21 22h2v1h-2Z";
