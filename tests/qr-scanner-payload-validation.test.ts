import { describe, it, expect } from "vitest";
import { parseVaahanSafeQrPayload } from "../packages/qr/src/resolver/validate-payload";

describe("Zero-Trust QR Payload Parser & Host Allowlist Validator", () => {
  // --------------------------------------------------------------------------
  // 1. Valid Canonical VaahanSafe URLs
  // --------------------------------------------------------------------------
  describe("Valid Canonical VaahanSafe URLs", () => {
    it("accepts canonical production URL with raw public ID", () => {
      const result = parseVaahanSafeQrPayload("https://qr.vaahansafe.com/7F3K9021");
      expect(result.valid).toBe(true);
      expect(result.publicId).toBe("7F3K9021");
    });

    it("accepts canonical production URL with VS- prefixed public ID", () => {
      const result = parseVaahanSafeQrPayload("https://qr.vaahansafe.com/VS-7F3K-9021");
      expect(result.valid).toBe(true);
      expect(result.publicId).toBe("7F3K-9021");
    });

    it("accepts trailing slash on canonical URL", () => {
      const result = parseVaahanSafeQrPayload("https://qr.vaahansafe.com/EEDFZWCW/");
      expect(result.valid).toBe(true);
      expect(result.publicId).toBe("EEDFZWCW");
    });

    it("accepts local development URLs on localhost and 127.0.0.1", () => {
      const devLocalhost = parseVaahanSafeQrPayload("http://localhost:3003/7F3K9021");
      expect(devLocalhost.valid).toBe(true);
      expect(devLocalhost.publicId).toBe("7F3K9021");

      const devIp = parseVaahanSafeQrPayload("http://127.0.0.1:3003/VS-7F3K-9021");
      expect(devIp.valid).toBe(true);
      expect(devIp.publicId).toBe("7F3K-9021");
    });

    it("accepts direct raw public ID strings", () => {
      const raw1 = parseVaahanSafeQrPayload("7F3K9021");
      expect(raw1.valid).toBe(true);
      expect(raw1.publicId).toBe("7F3K9021");

      const raw2 = parseVaahanSafeQrPayload("VS-7F3K-9021");
      expect(raw2.valid).toBe(true);
      expect(raw2.publicId).toBe("7F3K-9021");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Strict Host Allowlist & Lookalike Rejection (Rule 15, 16, 71)
  // --------------------------------------------------------------------------
  describe("Host Allowlisting & Lookalike Rejection", () => {
    it("rejects lookalike host suffix (attacker domain)", () => {
      const result = parseVaahanSafeQrPayload("https://qr.vaahansafe.com.attacker.com/7F3K9021");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("NOT_VAAHANSAFE_HOST");
    });

    it("rejects hyphenated lookalike host", () => {
      const result = parseVaahanSafeQrPayload("https://qr-vaahansafe.com/7F3K9021");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("NOT_VAAHANSAFE_HOST");
    });

    it("rejects unapproved subdomain on vaahansafe.com", () => {
      const result = parseVaahanSafeQrPayload("https://attacker.vaahansafe.com/7F3K9021");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("NOT_VAAHANSAFE_HOST");
    });

    it("rejects completely external phishing URLs", () => {
      const result = parseVaahanSafeQrPayload("https://phishing-site.example/login");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("NOT_VAAHANSAFE_HOST");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Protocol Security & Malicious Scheme Rejection (Rule 70)
  // --------------------------------------------------------------------------
  describe("Protocol Security", () => {
    it("rejects javascript: URLs", () => {
      const result = parseVaahanSafeQrPayload("javascript:alert(document.cookie)");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("MALFORMED_PUBLIC_ID");
    });

    it("rejects data: URLs", () => {
      const result = parseVaahanSafeQrPayload("data:text/html,<script>alert(1)</script>");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("INVALID_PROTOCOL");
    });

    it("rejects plain http in production domain", () => {
      const result = parseVaahanSafeQrPayload("http://qr.vaahansafe.com/7F3K9021");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("INVALID_PROTOCOL");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Path Validation & Malformed Payloads
  // --------------------------------------------------------------------------
  describe("Path Validation & Malformed Payloads", () => {
    it("rejects multi-segment paths (path traversal attempt)", () => {
      const result = parseVaahanSafeQrPayload("https://qr.vaahansafe.com/7F3K9021/extra/segment");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("INVALID_PATH");
    });

    it("rejects empty payload", () => {
      const result = parseVaahanSafeQrPayload("");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("EMPTY_PAYLOAD");
    });

    it("rejects whitespace only", () => {
      const result = parseVaahanSafeQrPayload("   ");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("EMPTY_PAYLOAD");
    });

    it("rejects root domain without public ID", () => {
      const result = parseVaahanSafeQrPayload("https://qr.vaahansafe.com/");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("INVALID_PATH");
    });

    it("rejects invalid characters in public ID", () => {
      const result = parseVaahanSafeQrPayload("https://qr.vaahansafe.com/7F3K*9021$!");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("MALFORMED_PUBLIC_ID");
    });
  });
});
