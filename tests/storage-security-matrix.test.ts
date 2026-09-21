import { describe, it, expect } from "vitest";
import {
  UPLOAD_POLICIES,
  getUploadPolicy,
  validateUploadRequest,
} from "../packages/storage/src/policies/upload-policy";
import {
  verifyMagicBytes,
  getExtensionForMimeType,
  FORBIDDEN_USER_MIME_TYPES,
} from "../packages/storage/src/policies/mime-policy";
import { StorageError } from "../packages/storage/src/errors/storage-error";
import type { UploadPurpose } from "../packages/storage/src/types";

describe("Storage Security Matrix & Upload Policies", () => {
  it("enforces that all 12 upload purposes have explicit, locked security policies", () => {
    const expectedPurposes: UploadPurpose[] = [
      "USER_PROFILE_IMAGE",
      "VEHICLE_IMAGE",
      "SUPPORT_ATTACHMENT",
      "BLOG_COVER",
      "BLOG_INLINE_IMAGE",
      "GALLERY_IMAGE",
      "PUBLIC_DOCUMENT",
      "PRIVATE_DOCUMENT",
      "INVOICE",
      "QR_PRINT_EXPORT",
      "QR_MANIFEST",
      "ADMIN_REPORT",
    ];

    expect(Object.keys(UPLOAD_POLICIES)).toHaveLength(12);

    for (const purpose of expectedPurposes) {
      const policy = getUploadPolicy(purpose);
      expect(policy.purpose).toBe(purpose);
      expect(policy.bucket).toMatch(/^(PUBLIC|PRIVATE|EXPORT)$/);
      expect(policy.visibility).toMatch(/^(PUBLIC|PRIVATE|INTERNAL)$/);
      expect(policy.allowedOwnerTypes.length).toBeGreaterThan(0);
      expect(policy.allowedActorRoles.length).toBeGreaterThan(0);
      expect(policy.allowedMimeTypes.length).toBeGreaterThan(0);
      expect(policy.maxSizeBytes).toBeGreaterThan(0);
    }
  });

  it("CRITICAL INVARIANT: Private customer & operational assets NEVER enter PUBLIC_STORAGE", () => {
    const privatePurposes: UploadPurpose[] = [
      "USER_PROFILE_IMAGE",
      "VEHICLE_IMAGE",
      "SUPPORT_ATTACHMENT",
      "PRIVATE_DOCUMENT",
      "INVOICE",
    ];

    for (const p of privatePurposes) {
      const policy = getUploadPolicy(p);
      expect(policy.bucket).toBe("PRIVATE");
      expect(policy.visibility).toBe("PRIVATE");
    }

    const exportPurposes: UploadPurpose[] = [
      "QR_PRINT_EXPORT",
      "QR_MANIFEST",
      "ADMIN_REPORT",
    ];

    for (const p of exportPurposes) {
      const policy = getUploadPolicy(p);
      expect(policy.bucket).toBe("EXPORT");
      expect(policy.visibility).toBe("INTERNAL");
    }
  });

  it("rejects unauthorized actor roles attempting restricted uploads", () => {
    // 1. Customer attempting to upload Blog Cover
    expect(() =>
      validateUploadRequest({
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "BLOG_COVER",
        ownerType: "BLOG_POST",
        ownerId: "post_1",
        filename: "cover.png",
        mimeType: "image/png",
        sizeBytes: 1024,
      })
    ).toThrowError(/UPLOAD_NOT_AUTHORIZED/);

    // 2. Customer attempting QR Print Export
    expect(() =>
      validateUploadRequest({
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "QR_PRINT_EXPORT",
        ownerType: "QR_BATCH",
        ownerId: "batch_1",
        filename: "print.csv",
        mimeType: "text/csv",
        sizeBytes: 1024,
      })
    ).toThrowError(/UPLOAD_NOT_AUTHORIZED/);

    // 3. Content Editor attempting to upload Invoice
    expect(() =>
      validateUploadRequest({
        actor: { id: "usr_editor", role: "CONTENT_EDITOR" },
        purpose: "INVOICE",
        ownerType: "ORDER",
        ownerId: "ord_1",
        filename: "inv.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
      })
    ).toThrowError(/UPLOAD_NOT_AUTHORIZED/);
  });

  it("rejects mismatched owner types for the upload purpose", () => {
    // Attempting to attach USER_PROFILE_IMAGE to a VEHICLE owner
    expect(() =>
      validateUploadRequest({
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "VEHICLE",
        ownerId: "veh_123",
        filename: "profile.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      })
    ).toThrowError(/INVALID_OWNER/);
  });

  it("strictly rejects forbidden executable/script formats (including SVG)", () => {
    for (const badMime of FORBIDDEN_USER_MIME_TYPES) {
      expect(() =>
        validateUploadRequest({
          actor: { id: "usr_cust1", role: "CUSTOMER" },
          purpose: "USER_PROFILE_IMAGE",
          ownerType: "USER",
          ownerId: "usr_cust1",
          filename: "malicious_payload",
          mimeType: badMime,
          sizeBytes: 1024,
        })
      ).toThrowError(/INVALID_FILE_TYPE/);
    }
  });

  it("enforces purpose-specific max file size limits", () => {
    // Profile image limit is 5 MB
    const fiveMb = 5 * 1024 * 1024;

    // 1 byte over limit
    expect(() =>
      validateUploadRequest({
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "USER",
        ownerId: "usr_cust1",
        filename: "large.jpg",
        mimeType: "image/jpeg",
        sizeBytes: fiveMb + 1,
      })
    ).toThrowError(/FILE_TOO_LARGE/);

    // 0 byte file
    expect(() =>
      validateUploadRequest({
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "USER",
        ownerId: "usr_cust1",
        filename: "empty.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 0,
      })
    ).toThrowError(/FILE_TOO_LARGE/);
  });

  it("accurately validates magic bytes file signatures against declared MIME types", () => {
    // 1. Genuine JPEG: FF D8 FF
    const validJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(verifyMagicBytes(validJpeg, "image/jpeg")).toBe(true);

    // 2. Spoofed JPEG (text claiming to be JPEG)
    const fakeJpeg = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
    expect(verifyMagicBytes(fakeJpeg, "image/jpeg")).toBe(false);

    // 3. Genuine PNG: 89 50 4E 47 0D 0A 1A 0A
    const validPng = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
    ]);
    expect(verifyMagicBytes(validPng, "image/png")).toBe(true);

    // 4. Genuine WebP: RIFF ... WEBP
    const validWebp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(verifyMagicBytes(validWebp, "image/webp")).toBe(true);

    // 5. Genuine PDF: %PDF
    const validPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    expect(verifyMagicBytes(validPdf, "application/pdf")).toBe(true);

    // 6. Genuine CSV: UTF-8 text
    const validCsv = new TextEncoder().encode("header1,header2\nval1,val2\n");
    expect(verifyMagicBytes(validCsv, "text/csv")).toBe(true);

    // 7. Binary file with control characters claiming to be CSV
    const binaryCsv = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(verifyMagicBytes(binaryCsv, "text/csv")).toBe(false);
  });
});
