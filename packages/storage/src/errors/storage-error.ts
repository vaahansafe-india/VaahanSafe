/**
 * Normalized Storage Domain Errors for VaahanSafe
 *
 * Prevents raw provider / S3 / R2 error leaking to callers while maintaining
 * actionable, typed error categorizations.
 */

export type StorageErrorCode =
  | "ASSET_NOT_FOUND"
  | "UPLOAD_NOT_AUTHORIZED"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "UPLOAD_INCOMPLETE"
  | "CHECKSUM_MISMATCH"
  | "ASSET_NOT_READY"
  | "ASSET_QUARANTINED"
  | "PRIVATE_ACCESS_DENIED"
  | "STORAGE_UNAVAILABLE"
  | "INVALID_OWNER"
  | "PATH_TRAVERSAL_DETECTED";

export class StorageError extends Error {
  constructor(
    public readonly code: StorageErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(`[StorageError: ${code}] ${message}`);
    this.name = "StorageError";
  }
}
