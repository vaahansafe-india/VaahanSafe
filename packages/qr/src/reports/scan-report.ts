import type { DatabaseClient } from "@vaahansafe/database";
import type { ObjectStore } from "@vaahansafe/storage";
import { verifyMagicBytes } from "@vaahansafe/storage";
import { isFreshScanLocation } from "./location";

export const SCAN_REPORT_MAX_PHOTOS = 3;
export const SCAN_REPORT_MAX_BYTES = 3 * 1024 * 1024;
export const SCAN_REPORT_REASONS = [
  "PARKING",
  "EMERGENCY",
  "LIGHTS_ON",
  "DAMAGE",
  "OTHER",
] as const;
export type ScanReportReason = (typeof SCAN_REPORT_REASONS)[number];
export interface SharedScanLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}
export interface ScanReportPhoto {
  data: Uint8Array;
  mimeType: string;
}
export interface ScanReportInput {
  publicId: string;
  requestId: string;
  reason: ScanReportReason;
  note: string;
  consent: boolean;
  viewerConsent?: boolean;
  location?: SharedScanLocation;
  photos: ScanReportPhoto[];
}
export class ScanReportError extends Error {
  constructor(
    public code:
      | "INVALID_REPORT"
      | "LOCATION_REQUIRED"
      | "REPORT_UNAVAILABLE"
      | "REPORT_COOLDOWN"
      | "REPORT_FAILED"
      | "REPORT_RETRY",
  ) {
    super(code);
  }
}
export function validateScanReport(input: ScanReportInput, now = Date.now()) {
  if (
    input.consent !== true ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      input.requestId,
    ) ||
    !SCAN_REPORT_REASONS.includes(input.reason) ||
    typeof input.note !== "string" ||
    input.note.length > 300 ||
    input.photos.length > SCAN_REPORT_MAX_PHOTOS
  )
    throw new ScanReportError("INVALID_REPORT");
  if (!input.location) throw new ScanReportError("LOCATION_REQUIRED");
  if (!isFreshScanLocation(input.location, now))
    throw new ScanReportError("INVALID_REPORT");
  let total = 0;
  for (const photo of input.photos) {
    total += photo.data.byteLength;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(photo.mimeType) ||
      !photo.data.byteLength ||
      photo.data.byteLength > 1024 * 1024 ||
      !verifyMagicBytes(photo.data, photo.mimeType)
    ) {
      throw new ScanReportError("INVALID_REPORT");
    }
  }
  if (total > SCAN_REPORT_MAX_BYTES)
    throw new ScanReportError("INVALID_REPORT");
}
export function sharedLocationText(location?: SharedScanLocation) {
  return location
    ? `Finder-shared GPS (accuracy ±${Math.ceil(location.accuracy)} m): https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
    : "Location was not shared";
}

/** Service-only RPCs lock the QR and atomically save the report, scan and outbox. */
export async function submitScanReport(
  input: ScanReportInput,
  deps: { db: DatabaseClient; store: ObjectStore; ipHash: string },
) {
  validateScanReport(input);
  async function receipt(id: string) {
    const saved = await deps.db.queryFirst<{
      result: { emergencyContactsQueued: boolean };
    }>("SELECT public.qr_scan_report_receipt(?, ?::uuid) AS result", [
      id,
      input.requestId,
    ]);
    if (!saved?.result) throw new ScanReportError("REPORT_FAILED");
    return { id, recorded: true, notificationQueued: true, ...saved.result };
  }
  const reservation = await deps.db.queryFirst<{
    result: { id?: string; status?: string; error?: string };
  }>("SELECT public.begin_qr_scan_report(?, ?::uuid, ?, ?) AS result", [
    input.publicId,
    input.requestId,
    deps.ipHash,
    input.reason,
  ]);
  const result = reservation?.result;
  if (result?.error === "COOLDOWN")
    throw new ScanReportError("REPORT_COOLDOWN");
  if (!result?.id) throw new ScanReportError("REPORT_UNAVAILABLE");
  if (result.status === "READY") return receipt(result.id);
  if (result.status === "FAILED") throw new ScanReportError("REPORT_RETRY");
  if (result.status !== "NEW") throw new ScanReportError("REPORT_COOLDOWN");
  const id = result.id;
  const photos: { key: string; mimeType: string; size: number }[] = [];
  try {
    for (const [index, photo] of input.photos.entries()) {
      const extension =
        photo.mimeType === "image/jpeg"
          ? "jpg"
          : photo.mimeType === "image/png"
            ? "png"
            : "webp";
      const key = `scan-reports/${id}/${index}.${extension}`;
      // Include attempted objects in cleanup even if provider response is interrupted.
      photos.push({
        key,
        mimeType: photo.mimeType,
        size: photo.data.byteLength,
      });
      await deps.store.put(key, photo.data, { contentType: photo.mimeType });
    }
    const completed = await deps.db.queryFirst<{ result: boolean }>(
      "SELECT public.complete_qr_scan_report(?, ?::jsonb, ?::jsonb, ?, ?, ?) AS result",
      [
        id,
        JSON.stringify(input.location || null),
        JSON.stringify(photos),
        input.reason,
        input.note.trim(),
        input.viewerConsent === true,
      ],
    );
    if (!completed?.result) throw new ScanReportError("REPORT_UNAVAILABLE");
    return await receipt(id);
  } catch (error) {
    // A transport failure can hide a committed transaction. Never delete committed photos.
    const saved = await deps.db
      .queryFirst<{ status: string }>(
        "SELECT status FROM qr_scan_reports WHERE id = ?",
        [id],
      )
      .catch(() => null);
    if (saved?.status === "READY") return receipt(id);
    if (saved) {
      // Cancel under the report row lock before removing bytes. Completion may
      // still be running after its HTTP response timed out; its committed READY
      // row must win over cleanup.
      const failed = await deps.db
        .execute(
          "UPDATE qr_scan_reports SET status = 'FAILED' WHERE id = ? AND status = 'UPLOADING'",
          [id],
        )
        .catch(() => undefined);
      if (failed?.success && failed.rowsAffected === 1) {
        await Promise.allSettled(
          photos.map((photo) => deps.store.delete(photo.key)),
        );
        throw new ScanReportError("REPORT_RETRY");
      }
      const final = await deps.db
        .queryFirst<{ status: string }>(
          "SELECT status FROM qr_scan_reports WHERE id = ?",
          [id],
        )
        .catch(() => null);
      if (final?.status === "READY") return receipt(id);
      if (final?.status === "FAILED") throw new ScanReportError("REPORT_RETRY");
    }
    throw error instanceof ScanReportError
      ? error
      : new ScanReportError("REPORT_FAILED");
  }
}
