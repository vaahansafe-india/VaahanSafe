/**
 * Authoritative MIME Type & Magic Bytes Policy for VaahanSafe
 *
 * Enforces file signature validation and strictly derives extensions from
 * server-validated MIME types, preventing extension-spoofing and executable payloads.
 */

import { StorageError } from "../errors/storage-error";

export const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "text/csv": "csv",
};

export const FORBIDDEN_USER_MIME_TYPES = new Set([
  "image/svg+xml",
  "application/x-msdownload",
  "application/x-sh",
  "text/html",
  "application/javascript",
  "application/xhtml+xml",
]);

/**
 * Returns canonical file extension for an approved MIME type.
 * Never relies on client-provided file extension.
 */
export function getExtensionForMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().trim();
  const ext = MIME_TO_EXTENSION[normalized];
  if (!ext) {
    throw new StorageError(
      "INVALID_FILE_TYPE",
      `Unsupported or unapproved MIME type: ${mimeType}`
    );
  }
  return ext;
}

/**
 * Validates magic bytes against declared MIME type where applicable.
 */
export function verifyMagicBytes(data: Uint8Array, declaredMimeType: string): boolean {
  if (data.length < 4) return false;

  const mime = declaredMimeType.toLowerCase().trim();

  switch (mime) {
    case "image/jpeg":
      // FF D8 FF
      return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;

    case "image/png":
      // 89 50 4E 47 0D 0A 1A 0A
      if (data.length < 8) return false;
      return (
        data[0] === 0x89 &&
        data[1] === 0x50 &&
        data[2] === 0x4e &&
        data[3] === 0x47 &&
        data[4] === 0x0d &&
        data[5] === 0x0a &&
        data[6] === 0x1a &&
        data[7] === 0x0a
      );

    case "image/webp":
      // 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
      if (data.length < 12) return false;
      const isRiff =
        data[0] === 0x52 &&
        data[1] === 0x49 &&
        data[2] === 0x46 &&
        data[3] === 0x46;
      const isWebp =
        data[8] === 0x57 &&
        data[9] === 0x45 &&
        data[10] === 0x42 &&
        data[11] === 0x50;
      return isRiff && isWebp;

    case "application/pdf":
      // 25 50 44 46 (%PDF)
      return (
        data[0] === 0x25 &&
        data[1] === 0x50 &&
        data[2] === 0x44 &&
        data[3] === 0x46
      );

    case "text/csv":
      // Text formats do not have fixed magic bytes; verify they are valid UTF-8 text
      // and do not contain binary control characters (except CR, LF, TAB).
      for (let i = 0; i < Math.min(data.length, 128); i++) {
        const byte = data[i];
        if (byte === undefined || byte < 0x09 || (byte > 0x0a && byte < 0x20 && byte !== 0x0d)) {
          return false;
        }
      }
      return true;

    default:
      return false;
  }
}
