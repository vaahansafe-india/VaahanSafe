/**
 * Authoritative Storage Types & Domain Entities for VaahanSafe
 *
 * INVARIANT: D1 stores relational metadata and ownership truth; R2 stores binary bytes.
 */

export type BucketClass = "PUBLIC" | "PRIVATE" | "EXPORT";

export type StorageVisibility = "PUBLIC" | "PRIVATE" | "INTERNAL" | "CONTROLLED";

export type AssetStatus = "UPLOADING" | "READY" | "QUARANTINED" | "DELETED";

export type OwnerType =
  | "USER"
  | "VEHICLE"
  | "SUPPORT_TICKET"
  | "BLOG_POST"
  | "GALLERY_ITEM"
  | "DOCUMENT"
  | "ORDER"
  | "QR_BATCH"
  | "REPORT"
  | "SYSTEM";

export type UploadPurpose =
  | "USER_PROFILE_IMAGE"
  | "VEHICLE_IMAGE"
  | "SUPPORT_ATTACHMENT"
  | "BLOG_COVER"
  | "BLOG_INLINE_IMAGE"
  | "GALLERY_IMAGE"
  | "PUBLIC_DOCUMENT"
  | "PRIVATE_DOCUMENT"
  | "INVOICE"
  | "QR_PRINT_EXPORT"
  | "QR_MANIFEST"
  | "ADMIN_REPORT";

export interface MediaAsset {
  id: string;
  bucket: BucketClass;
  objectKey: string;
  ownerType: OwnerType;
  ownerId: string;
  visibility: StorageVisibility;
  mimeType: string;
  sizeBytes: number;
  sha256?: string | null;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  status: AssetStatus;
  originalFilename?: string | null;
  storageEtag?: string | null;
  variantOfAssetId?: string | null;
  readyAt?: string | null;
  quarantinedAt?: string | null;
  deletedAt?: string | null;
  metadataJson?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageActor {
  id: string;
  role: string;
}

export interface AuthorizeUploadInput {
  actor: StorageActor;
  purpose: UploadPurpose;
  ownerType: OwnerType;
  ownerId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256?: string;
  altText?: string;
  entityOwnershipCheck?: (
    ownerType: OwnerType,
    ownerId: string,
    actorId: string,
    actorRole: string
  ) => Promise<boolean> | boolean;
}

export interface AuthorizedUploadSession {
  assetId: string;
  bucket: BucketClass;
  objectKey: string;
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
  expiresAt: string;
}

export interface CompleteUploadInput {
  assetId: string;
  actor: StorageActor;
  actualSizeBytes?: number;
  sha256?: string;
  magicBytes?: Uint8Array;
  width?: number;
  height?: number;
  etag?: string;
}
