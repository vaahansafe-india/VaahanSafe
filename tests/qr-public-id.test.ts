import { describe, it, expect } from "vitest";
import {
  normalizeQrPublicId,
  validateQrPublicId,
  isValidQrPublicId,
  assertValidQrPublicId,
} from "@vaahansafe/qr-core";

describe("QR Public Identifier Normalization & Validation (@vaahansafe/qr-core)", () => {
  describe("normalizeQrPublicId", () => {
    it("should convert lowercase input to uppercase", () => {
      expect(normalizeQrPublicId("7f3k9021")).toBe("7F3K9021");
      expect(normalizeQrPublicId("vs-7f3k-9021")).toBe("VS-7F3K-9021");
    });

    it("should trim surrounding whitespace and slashes", () => {
      expect(normalizeQrPublicId("   7F3K9021   ")).toBe("7F3K9021");
      expect(normalizeQrPublicId("/7F3K9021/")).toBe("7F3K9021");
      expect(normalizeQrPublicId("///VS-7F3K-9021///")).toBe("VS-7F3K-9021");
    });

    it("should collapse multiple consecutive hyphens or underscores", () => {
      expect(normalizeQrPublicId("VS--7F3K---9021")).toBe("VS-7F3K-9021");
      expect(normalizeQrPublicId("VS__7F3K__9021")).toBe("VS-7F3K-9021");
    });

    it("should strip leading or trailing hyphens after normalization", () => {
      expect(normalizeQrPublicId("-7F3K9021-")).toBe("7F3K9021");
      expect(normalizeQrPublicId("___7F3K9021___")).toBe("7F3K9021");
    });

    it("should handle null or undefined safely without throwing", () => {
      expect(normalizeQrPublicId(null)).toBe("");
      expect(normalizeQrPublicId(undefined)).toBe("");
      expect(normalizeQrPublicId(12345)).toBe("");
    });
  });

  describe("validateQrPublicId", () => {
    it("should accept valid public ID shapes", () => {
      const result1 = validateQrPublicId("7F3K9021");
      expect(result1.isValid).toBe(true);
      expect(result1.normalizedId).toBe("7F3K9021");

      const result2 = validateQrPublicId("VS-7F3K-9021");
      expect(result2.isValid).toBe(true);
      expect(result2.normalizedId).toBe("VS-7F3K-9021");

      const result3 = validateQrPublicId("vhn_mh12_9821");
      expect(result3.isValid).toBe(true);
      expect(result3.normalizedId).toBe("VHN_MH12_9821");
    });

    it("should reject empty inputs", () => {
      const result = validateQrPublicId("");
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe("EMPTY_ID");
    });

    it("should reject IDs that are too short (< 4 chars)", () => {
      const result = validateQrPublicId("A1");
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe("TOO_SHORT");
    });

    it("should reject IDs exceeding maximum length (> 32 chars)", () => {
      const longId = "A".repeat(35);
      const result = validateQrPublicId(longId);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe("TOO_LONG");
    });

    it("should reject dangerous injection characters (SQL / XSS / path traversal)", () => {
      expect(validateQrPublicId("7F3K'; DROP TABLE users;--").isValid).toBe(false);
      expect(validateQrPublicId("<script>alert(1)</script>").isValid).toBe(false);
      expect(validateQrPublicId("../../../etc/passwd").isValid).toBe(false);
      expect(validateQrPublicId("7F3K9021' OR 1=1--").isValid).toBe(false);
      expect(validateQrPublicId("7F3K9021{id}").isValid).toBe(false);
    });

    it("should reject invalid characters (spaces, special symbols)", () => {
      const result = validateQrPublicId("7F3K#9021");
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe("INVALID_CHARACTERS");
    });
  });

  describe("isValidQrPublicId & assertValidQrPublicId", () => {
    it("isValidQrPublicId returns boolean type guard correctly", () => {
      expect(isValidQrPublicId("7F3K9021")).toBe(true);
      expect(isValidQrPublicId("invalid space id")).toBe(false);
      expect(isValidQrPublicId(null)).toBe(false);
    });

    it("assertValidQrPublicId returns normalized string on success and throws on error", () => {
      expect(assertValidQrPublicId("  vs-7f3k-9021  ")).toBe("VS-7F3K-9021");
      expect(() => assertValidQrPublicId("bad")).toThrow();
    });
  });
});
