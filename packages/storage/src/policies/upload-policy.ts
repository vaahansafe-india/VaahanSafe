/**
 * Central Storage Policy Registry for VaahanSafe
 *
 * INVARIANT: Every upload purpose has an explicit server-side policy.
 * Client-controlled inputs CANNOT choose or override bucket, visibility, or limits.
 */

import type {
  UploadPurpose,
  BucketClass,
  StorageVisibility,
  OwnerType,
  AuthorizeUploadInput,
} from "../types";
import { StorageError } from "../errors/storage-error";
import { getExtensionForMimeType, FORBIDDEN_USER_MIME_TYPES } from "./mime-policy";

export interface UploadPolicyDefinition {
  purpose: UploadPurpose;
  bucket: BucketClass;
  visibility: StorageVisibility;
  allowedOwnerTypes: readonly OwnerType[];
  allowedActorRoles: readonly string[];
  allowedMimeTypes: readonly string[];
  maxSizeBytes: number;
  retentionClass: string;
  isMagicBytesRequired: boolean;
}

export const UPLOAD_POLICIES: Record<UploadPurpose, UploadPolicyDefinition> = {
  USER_PROFILE_IMAGE: {
    purpose: "USER_PROFILE_IMAGE",
    bucket: "PRIVATE",
    visibility: "PRIVATE",
    allowedOwnerTypes: ["USER"],
    allowedActorRoles: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    retentionClass: "CUSTOMER_PRIVATE",
    isMagicBytesRequired: true,
  },
  VEHICLE_IMAGE: {
    purpose: "VEHICLE_IMAGE",
    bucket: "PRIVATE",
    visibility: "PRIVATE",
    allowedOwnerTypes: ["VEHICLE"],
    allowedActorRoles: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    retentionClass: "CUSTOMER_PRIVATE",
    isMagicBytesRequired: true,
  },
  SUPPORT_ATTACHMENT: {
    purpose: "SUPPORT_ATTACHMENT",
    bucket: "PRIVATE",
    visibility: "PRIVATE",
    allowedOwnerTypes: ["SUPPORT_TICKET"],
    allowedActorRoles: ["CUSTOMER", "SUPPORT_AGENT", "ADMIN", "SUPER_ADMIN"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024, // 15 MB
    retentionClass: "SUPPORT",
    isMagicBytesRequired: true,
  },
  BLOG_COVER: {
    purpose: "BLOG_COVER",
    bucket: "PUBLIC",
    visibility: "PUBLIC",
    allowedOwnerTypes: ["BLOG_POST"],
    allowedActorRoles: ["CONTENT_EDITOR", "ADMIN", "SUPER_ADMIN"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
    retentionClass: "PUBLIC_CONTENT",
    isMagicBytesRequired: true,
  },
  BLOG_INLINE_IMAGE: {
    purpose: "BLOG_INLINE_IMAGE",
    bucket: "PUBLIC",
    visibility: "PUBLIC",
    allowedOwnerTypes: ["BLOG_POST"],
    allowedActorRoles: ["CONTENT_EDITOR", "ADMIN", "SUPER_ADMIN"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
    retentionClass: "PUBLIC_CONTENT",
    isMagicBytesRequired: true,
  },
  GALLERY_IMAGE: {
    purpose: "GALLERY_IMAGE",
    bucket: "PUBLIC",
    visibility: "PUBLIC",
    allowedOwnerTypes: ["GALLERY_ITEM"],
    allowedActorRoles: ["CONTENT_EDITOR", "ADMIN", "SUPER_ADMIN"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    retentionClass: "PUBLIC_CONTENT",
    isMagicBytesRequired: true,
  },
  PUBLIC_DOCUMENT: {
    purpose: "PUBLIC_DOCUMENT",
    bucket: "PUBLIC",
    visibility: "PUBLIC",
    allowedOwnerTypes: ["DOCUMENT"],
    allowedActorRoles: ["COMPLIANCE_OFFICER", "ADMIN", "SUPER_ADMIN"],
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 25 * 1024 * 1024, // 25 MB
    retentionClass: "PUBLIC_CONTENT",
    isMagicBytesRequired: true,
  },
  PRIVATE_DOCUMENT: {
    purpose: "PRIVATE_DOCUMENT",
    bucket: "PRIVATE",
    visibility: "PRIVATE",
    allowedOwnerTypes: ["DOCUMENT"],
    allowedActorRoles: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 25 * 1024 * 1024, // 25 MB
    retentionClass: "CUSTOMER_PRIVATE",
    isMagicBytesRequired: true,
  },
  INVOICE: {
    purpose: "INVOICE",
    bucket: "PRIVATE",
    visibility: "PRIVATE",
    allowedOwnerTypes: ["ORDER"],
    allowedActorRoles: ["FINANCIAL_AUDITOR", "SUPER_ADMIN", "SYSTEM"],
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    retentionClass: "FINANCIAL",
    isMagicBytesRequired: true,
  },
  QR_PRINT_EXPORT: {
    purpose: "QR_PRINT_EXPORT",
    bucket: "EXPORT",
    visibility: "INTERNAL",
    allowedOwnerTypes: ["QR_BATCH"],
    allowedActorRoles: ["OPS_MANAGER", "SUPER_ADMIN", "SYSTEM"],
    allowedMimeTypes: ["text/csv"],
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    retentionClass: "QR_MANUFACTURING", // TBD
    isMagicBytesRequired: true,
  },
  QR_MANIFEST: {
    purpose: "QR_MANIFEST",
    bucket: "EXPORT",
    visibility: "INTERNAL",
    allowedOwnerTypes: ["QR_BATCH"],
    allowedActorRoles: ["OPS_MANAGER", "SUPER_ADMIN", "SYSTEM"],
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 25 * 1024 * 1024, // 25 MB
    retentionClass: "QR_MANUFACTURING",
    isMagicBytesRequired: true,
  },
  ADMIN_REPORT: {
    purpose: "ADMIN_REPORT",
    bucket: "EXPORT",
    visibility: "INTERNAL",
    allowedOwnerTypes: ["REPORT"],
    allowedActorRoles: ["ANALYTICS_VIEWER", "SUPER_ADMIN", "SYSTEM"],
    allowedMimeTypes: ["text/csv", "application/pdf"],
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    retentionClass: "AUDIT_ARTIFACT",
    isMagicBytesRequired: true,
  },
};

/**
 * Returns the policy definition for a given purpose.
 */
export function getUploadPolicy(purpose: UploadPurpose): UploadPolicyDefinition {
  const policy = UPLOAD_POLICIES[purpose];
  if (!policy) {
    throw new StorageError("UPLOAD_NOT_AUTHORIZED", `Unknown upload purpose: ${purpose}`);
  }
  return policy;
}

/**
 * Validates an upload authorization request against the central policy registry.
 */
export function validateUploadRequest(input: AuthorizeUploadInput): {
  policy: UploadPolicyDefinition;
  normalizedExt: string;
} {
  const policy = getUploadPolicy(input.purpose);

  // 1. Role validation
  if (!policy.allowedActorRoles.includes(input.actor.role)) {
    throw new StorageError(
      "UPLOAD_NOT_AUTHORIZED",
      `Actor role "${input.actor.role}" is not authorized for purpose "${input.purpose}".`
    );
  }

  // 2. Owner Type validation
  if (!policy.allowedOwnerTypes.includes(input.ownerType)) {
    throw new StorageError(
      "INVALID_OWNER",
      `Owner type "${input.ownerType}" is not permitted for purpose "${input.purpose}". Permitted: ${policy.allowedOwnerTypes.join(", ")}`
    );
  }

  // 3. MIME validation (disallow forbidden executable/script formats)
  const normalizedMime = input.mimeType.toLowerCase().trim();
  if (FORBIDDEN_USER_MIME_TYPES.has(normalizedMime)) {
    throw new StorageError(
      "INVALID_FILE_TYPE",
      `MIME type "${input.mimeType}" is forbidden due to security restrictions.`
    );
  }

  if (!policy.allowedMimeTypes.includes(normalizedMime)) {
    throw new StorageError(
      "INVALID_FILE_TYPE",
      `MIME type "${input.mimeType}" is not permitted for purpose "${input.purpose}". Permitted: ${policy.allowedMimeTypes.join(", ")}`
    );
  }

  // 4. File Size validation
  if (input.sizeBytes <= 0) {
    throw new StorageError("FILE_TOO_LARGE", "File size must be greater than zero bytes.");
  }

  if (input.sizeBytes > policy.maxSizeBytes) {
    throw new StorageError(
      "FILE_TOO_LARGE",
      `File size ${input.sizeBytes} bytes exceeds maximum allowed limit of ${policy.maxSizeBytes} bytes for purpose "${input.purpose}".`
    );
  }

  const normalizedExt = getExtensionForMimeType(normalizedMime);

  return { policy, normalizedExt };
}
