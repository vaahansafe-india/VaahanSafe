import type { StickerTemplate } from "../inventory.types";
// New specification configured by the user on 9 October 2026. No historical
// sticker or print job is claimed to have used this geometry.
export const VEHICLE_STICKER_V1: StickerTemplate = {
  version: "VS-VEHICLE-80X60-V1",
  widthMm: 80,
  heightMm: 60,
  bleedMm: 2,
  safeMm: 4,
  qr: { x: 6, y: 16, size: 36 },
  scratch: { x: 45, y: 36, width: 29, height: 13 },
  layout: "SINGLE",
};
export function validateStickerTemplate(t: StickerTemplate) {
  if (t.version !== VEHICLE_STICKER_V1.version || t.layout !== "SINGLE")
    throw new Error("Unsupported production sticker specification");
  const numeric = [
    t.widthMm,
    t.heightMm,
    t.bleedMm,
    t.safeMm,
    t.qr.x,
    t.qr.y,
    t.qr.size,
    t.scratch.x,
    t.scratch.y,
    t.scratch.width,
    t.scratch.height,
  ];
  if (
    numeric.some((v) => !Number.isFinite(v) || v < 0) ||
    t.widthMm < 30 ||
    t.heightMm < 30 ||
    t.qr.size < 20 ||
    t.scratch.width < 20 ||
    t.scratch.height < 8
  )
    throw new Error("Invalid physical sticker dimensions");
  const fits = (x: number, y: number, w: number, h: number) =>
    x >= t.safeMm &&
    y >= t.safeMm &&
    x + w <= t.widthMm - t.safeMm &&
    y + h <= t.heightMm - t.safeMm;
  if (
    !fits(t.qr.x, t.qr.y, t.qr.size, t.qr.size) ||
    !fits(t.scratch.x, t.scratch.y, t.scratch.width, t.scratch.height)
  )
    throw new Error("Sticker content extends beyond its safe area");
  if (
    t.qr.x < t.scratch.x + t.scratch.width &&
    t.qr.x + t.qr.size > t.scratch.x &&
    t.qr.y < t.scratch.y + t.scratch.height &&
    t.qr.y + t.qr.size > t.scratch.y
  )
    throw new Error("QR and scratch zones overlap");
  const canonical = VEHICLE_STICKER_V1;
  if (
    t.widthMm !== canonical.widthMm ||
    t.heightMm !== canonical.heightMm ||
    t.safeMm !== canonical.safeMm ||
    t.bleedMm !== canonical.bleedMm ||
    Object.keys(canonical.qr).some(
      (k) =>
        t.qr[k as keyof typeof t.qr] !==
        canonical.qr[k as keyof typeof canonical.qr],
    ) ||
    Object.keys(canonical.scratch).some(
      (k) =>
        t.scratch[k as keyof typeof t.scratch] !==
        canonical.scratch[k as keyof typeof canonical.scratch],
    )
  )
    throw new Error(
      "A different sticker geometry requires a new versioned renderer",
    );
  return t;
}
