import { describe, it, expect } from "vitest";
import {
  buildObjectKey,
  sanitizePathSegment,
  sanitizeDisplayFilename,
  generateAssetId,
} from "../packages/storage/src/keys/object-key";
import { StorageError } from "../packages/storage/src/errors/storage-error";

describe("Server-Side Object Key Generator & Path Traversal Resistance", () => {
  it("generates deterministic keys matching architectural specifications without bucket prefix duplication", () => {
    const assetId = "asset_test12345678";

    // 1. User Profile Image
    const userKey = buildObjectKey({
      purpose: "USER_PROFILE_IMAGE",
      ownerId: "usr_9988",
      assetId,
      extension: "webp",
    });
    expect(userKey).toBe("users/usr_9988/profile/asset_test12345678.webp");
    expect(userKey.startsWith("private/")).toBe(false);

    // 2. Vehicle Image
    const vehicleKey = buildObjectKey({
      purpose: "VEHICLE_IMAGE",
      ownerId: "veh_4433",
      assetId,
      extension: "jpg",
    });
    expect(vehicleKey).toBe("vehicles/veh_4433/asset_test12345678.jpg");
    expect(vehicleKey.startsWith("private/")).toBe(false);

    // 3. Support Attachment
    const supportKey = buildObjectKey({
      purpose: "SUPPORT_ATTACHMENT",
      ownerId: "sup_1122",
      assetId,
      extension: "pdf",
    });
    expect(supportKey).toBe("support/sup_1122/asset_test12345678.pdf");

    // 4. Blog Cover
    const blogKey = buildObjectKey({
      purpose: "BLOG_COVER",
      ownerId: "post_7788",
      assetId,
      extension: "webp",
    });
    expect(blogKey).toBe("blog/post_7788/asset_test12345678.webp");
    expect(blogKey.startsWith("public/")).toBe(false);

    // 5. Gallery Image
    const galleryKey = buildObjectKey({
      purpose: "GALLERY_IMAGE",
      ownerId: "gal_3344",
      assetId,
      extension: "png",
    });
    expect(galleryKey).toBe("gallery/gal_3344/asset_test12345678.png");

    // 6. Public Document with versioning
    const docKey = buildObjectKey({
      purpose: "PUBLIC_DOCUMENT",
      ownerId: "doc_terms",
      version: "2026-v2",
      assetId,
      extension: "pdf",
    });
    expect(docKey).toBe("documents/doc_terms/2026-v2/asset_test12345678.pdf");

    // 7. Invoice
    const invoiceKey = buildObjectKey({
      purpose: "INVOICE",
      ownerId: "ord_5566",
      assetId,
      extension: "pdf",
    });
    expect(invoiceKey).toBe("invoices/ord_5566/asset_test12345678.pdf");

    // 8. QR Print Export
    const qrPrintKey = buildObjectKey({
      purpose: "QR_PRINT_EXPORT",
      ownerId: "batch_lot_01",
      assetId,
      extension: "csv",
    });
    expect(qrPrintKey).toBe("qr-batches/batch_lot_01/print/asset_test12345678.csv");
    expect(qrPrintKey.startsWith("exports/")).toBe(false);

    // 9. QR Manifest
    const qrManifestKey = buildObjectKey({
      purpose: "QR_MANIFEST",
      ownerId: "batch_lot_01",
      assetId,
      extension: "pdf",
    });
    expect(qrManifestKey).toBe("qr-batches/batch_lot_01/manifest/asset_test12345678.pdf");

    // 10. Admin Report
    const reportKey = buildObjectKey({
      purpose: "ADMIN_REPORT",
      ownerId: "quarterly_summary",
      assetId,
      extension: "csv",
    });
    expect(reportKey).toBe("reports/quarterly_summary/asset_test12345678.csv");
  });

  it("strictly neutralizes path traversal in client-provided filenames", () => {
    // Malicious traversal attempts in filename
    const dangerousNames = [
      "../../secret.pdf",
      "../../../etc/passwd",
      "..\\..\\Windows\\System32\\cmd.exe",
      "/var/data/customer/id_card.png",
      "C:\\Users\\Admin\\Desktop\\bank_statement.pdf",
      "photo.jpg\0.exe",
    ];

    for (const rawName of dangerousNames) {
      const sanitized = sanitizeDisplayFilename(rawName);

      // Sanitized display name must not contain directory traversal or absolute paths
      expect(sanitized.includes("/")).toBe(false);
      expect(sanitized.includes("\\")).toBe(false);
      expect(sanitized.includes("..")).toBe(false);
      expect(sanitized.includes("\0")).toBe(false);

      // Server key generation NEVER concatenates the filename into the object path
      const key = buildObjectKey({
        purpose: "USER_PROFILE_IMAGE",
        ownerId: "usr_safe",
        assetId: "asset_safe123",
        extension: "jpg",
      });

      expect(key).toBe("users/usr_safe/profile/asset_safe123.jpg");
      expect(key.includes(sanitized)).toBe(false);
      expect(key.includes("..")).toBe(false);
    }
  });

  it("throws PATH_TRAVERSAL_DETECTED when malicious input is passed into segment IDs", () => {
    const maliciousSegments = [
      "../../traversal",
      "usr/with/slash",
      "usr\\with\\backslash",
      "..",
      ".hidden",
      "usr null\0byte",
      "usr with spaces",
      "usr;rm -rf",
    ];

    for (const badSegment of maliciousSegments) {
      expect(() => sanitizePathSegment(badSegment, "ownerId")).toThrow(StorageError);
      expect(() =>
        buildObjectKey({
          purpose: "VEHICLE_IMAGE",
          ownerId: badSegment,
          assetId: "asset_test",
          extension: "png",
        })
      ).toThrowError(/PATH_TRAVERSAL_DETECTED/);
    }
  });

  it("generates opaque asset IDs without containing PII", () => {
    const assetId = generateAssetId();
    expect(assetId.startsWith("asset_")).toBe(true);
    expect(assetId.length).toBeGreaterThanOrEqual(20);

    // Assert key contains NO PII (no phone, no email, no vehicle number)
    const key = buildObjectKey({
      purpose: "VEHICLE_IMAGE",
      ownerId: "veh_9988",
      assetId,
      extension: "webp",
    });

    const forbiddenPiiPatterns = [
      /\b\d{10}\b/, // 10-digit phone
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
      /[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}/, // Indian Vehicle Registration (e.g. MH12AB1234)
    ];

    for (const pattern of forbiddenPiiPatterns) {
      expect(pattern.test(key)).toBe(false);
    }
  });
});
