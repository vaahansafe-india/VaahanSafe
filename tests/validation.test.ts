import { describe, it, expect } from "vitest";
import {
  phoneSchema,
  vehicleRegistrationSchema,
  qrPublicIdSchema,
  scratchCodeSchema,
} from "@vaahansafe/validation";

describe("Validation Package (@vaahansafe/validation)", () => {
  describe("phoneSchema", () => {
    it("should accept valid 10-digit Indian mobile numbers", () => {
      expect(phoneSchema.parse("9876543210")).toBe("9876543210");
      expect(phoneSchema.parse("+91 9876543210")).toBe("9876543210");
      expect(phoneSchema.parse("09876543210")).toBe("9876543210");
    });

    it("should reject invalid mobile numbers", () => {
      expect(() => phoneSchema.parse("12345")).toThrow();
      expect(() => phoneSchema.parse("5876543210")).toThrow(); // Starts with 5
    });
  });

  describe("vehicleRegistrationSchema", () => {
    it("should parse and normalize valid Indian vehicle plates", () => {
      expect(vehicleRegistrationSchema.parse("mh 12 ab 1234")).toBe("MH12AB1234");
      expect(vehicleRegistrationSchema.parse("DL01CA5678")).toBe("DL01CA5678");
    });

    it("should reject malformed plate numbers", () => {
      expect(() => vehicleRegistrationSchema.parse("INVALID_PLATE_123456")).toThrow();
    });
  });

  describe("qrPublicIdSchema", () => {
    it("should accept safe URL slugs for stickers", () => {
      expect(qrPublicIdSchema.parse("vhn_mh12_9821")).toBe("vhn_mh12_9821");
    });

    it("should reject too short or invalid character slugs", () => {
      expect(() => qrPublicIdSchema.parse("ab")).toThrow();
      expect(() => qrPublicIdSchema.parse("slug with spaces!")).toThrow();
    });
  });

  describe("scratchCodeSchema", () => {
    it("should accept alphanumeric scratch codes", () => {
      expect(scratchCodeSchema.parse("AF7890")).toBe("AF7890");
    });
  });
});
