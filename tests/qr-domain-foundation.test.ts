import { describe, it, expect } from "vitest";
import {
  generateQrPublicId,
  normalizeQrPublicId,
  validateQrPublicId,
  isValidQrPublicId,
  assertValidQrPublicId,
  formatVisibleCode,
  parseVisibleCode,
  getQrUrl,
  isPermanentQrUrl,
  PERMANENT_QR_DOMAIN,
  PERMANENT_QR_BASE_URL,
  canTransitionQrStatus,
  assertCanTransitionQrStatus,
  mapInternalToPublicResolverState,
  getPublicResolverMeta,
  QrNotFoundError,
  InvalidQrTransitionError,
  QR_PUBLIC_ID_ALPHABET,
} from "@vaahansafe/qr-core";

describe("Phase 08 Stage B: QR Domain Foundation", () => {
  describe("01. Public ID Generation, Validation & Normalization", () => {
    it("generates cryptographically random, non-sequential public IDs from unambiguous alphabet", () => {
      const id1 = generateQrPublicId();
      const id2 = generateQrPublicId();

      expect(id1.length).toBe(8);
      expect(id2.length).toBe(8);
      expect(id1).not.toBe(id2);

      // Check all characters belong to the unambiguous alphabet (no 0, O, 1, I, L)
      for (const char of id1) {
        expect(QR_PUBLIC_ID_ALPHABET.includes(char)).toBe(true);
        expect(["0", "O", "1", "I", "L"].includes(char)).toBe(false);
      }

      // Validates successfully
      expect(isValidQrPublicId(id1)).toBe(true);
      expect(assertValidQrPublicId(id1)).toBe(id1);
    });

    it("generates distinct IDs across a sample with zero sequential patterns", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateQrPublicId());
      }
      expect(ids.size).toBe(100);
    });

    it("normalizes and sanitizes candidate public identifiers", () => {
      expect(normalizeQrPublicId("  7f3k9021  ")).toBe("7F3K9021");
      expect(normalizeQrPublicId("///7F3K9021///")).toBe("7F3K9021");
      expect(normalizeQrPublicId("--7F3K--9021--")).toBe("7F3K-9021");
      expect(normalizeQrPublicId("vs__7f3k__9021")).toBe("VS-7F3K-9021");
    });

    it("strictly rejects suspicious injection and traversal patterns", () => {
      expect(validateQrPublicId("7F3K'; DROP TABLE users;--").isValid).toBe(false);
      expect(validateQrPublicId("../../../etc/passwd").isValid).toBe(false);
      expect(validateQrPublicId("<script>alert(1)</script>").isValid).toBe(false);
      expect(validateQrPublicId("SELECT * FROM qrs").isValid).toBe(false);
    });

    it("enforces length bounds (4 to 32 characters)", () => {
      expect(validateQrPublicId("ABC").isValid).toBe(false);
      expect(validateQrPublicId("ABC").errorCode).toBe("TOO_SHORT");

      const tooLong = "A".repeat(33);
      expect(validateQrPublicId(tooLong).isValid).toBe(false);
      expect(validateQrPublicId(tooLong).errorCode).toBe("TOO_LONG");
    });
  });

  describe("02. Visible Support Code Formatting & Parsing", () => {
    it("formats 8-character public ID into human-friendly grouped code (VS-XXXX-XXXX)", () => {
      expect(formatVisibleCode("7F3K9021")).toBe("VS-7F3K-9021");
      expect(formatVisibleCode("8M2P4510")).toBe("VS-8M2P-4510");
    });

    it("preserves or normalizes already prefixed visible codes", () => {
      expect(formatVisibleCode("VS-7F3K-9021")).toBe("VS-7F3K-9021");
      expect(formatVisibleCode("vs-7f3k-9021")).toBe("VS-7F3K-9021");
    });

    it("parses visible code back into authoritative public identifier", () => {
      expect(parseVisibleCode("VS-7F3K-9021")).toBe("7F3K9021");
      expect(parseVisibleCode("vs-8m2p-4510")).toBe("8M2P4510");
      expect(parseVisibleCode("VS-DEMO-CODE")).toBe("DEMOCODE");
    });
  });

  describe("03. Permanent Printed QR URL Contract", () => {
    it("strictly formats QR URL using the owned domain (qr.vaahansafe.com)", () => {
      const url = getQrUrl("7F3K9021");
      expect(url).toBe("https://qr.vaahansafe.com/7F3K9021");
      expect(url.startsWith(PERMANENT_QR_BASE_URL)).toBe(true);
      expect(isPermanentQrUrl(url)).toBe(true);
    });

    it("rejects non-owned, staging, preview, or third-party hostnames", () => {
      expect(isPermanentQrUrl("https://vaahansafe.workers.dev/7F3K9021")).toBe(false);
      expect(isPermanentQrUrl("https://vaahansafe.pages.dev/7F3K9021")).toBe(false);
      expect(isPermanentQrUrl("https://vaahansafe.vercel.app/7F3K9021")).toBe(false);
      expect(isPermanentQrUrl("http://localhost:3000/7F3K9021")).toBe(false);
      expect(isPermanentQrUrl("https://preview.vaahansafe.com/7F3K9021")).toBe(false);
      expect(isPermanentQrUrl("http://qr.vaahansafe.com/7F3K9021")).toBe(false); // Insecure HTTP
    });
  });

  describe("04. Canonical State Transition Matrix", () => {
    it("allows valid forward lifecycle progression", () => {
      expect(canTransitionQrStatus("PRINTED", "IN_TRANSIT_DISTRIBUTOR").allowed).toBe(true);
      expect(canTransitionQrStatus("IN_TRANSIT_DISTRIBUTOR", "WITH_DISTRIBUTOR").allowed).toBe(true);
      expect(canTransitionQrStatus("WITH_DISTRIBUTOR", "WITH_RETAILER").allowed).toBe(true);
      expect(canTransitionQrStatus("WITH_RETAILER", "SOLD").allowed).toBe(true);
      expect(canTransitionQrStatus("WITH_RETAILER", "ACTIVATED").allowed).toBe(true);
      expect(canTransitionQrStatus("SOLD", "ACTIVATED").allowed).toBe(true);
      expect(canTransitionQrStatus("ACTIVATED", "REPLACED").allowed).toBe(true);
      expect(canTransitionQrStatus("ACTIVATED", "LOST_DAMAGED").allowed).toBe(true);
      expect(canTransitionQrStatus("ACTIVATED", "BLOCKED").allowed).toBe(true);
    });

    it("strictly blocks illegal transitions and shortcuts", () => {
      // Direct jump from PRINTED to ACTIVATED without retail/distribution
      const jumpAttempt = canTransitionQrStatus("PRINTED", "ACTIVATED");
      expect(jumpAttempt.allowed).toBe(false);
      expect(jumpAttempt.reason).toContain("must pass through distribution/retail");

      // Reactivating a replaced sticker
      const reactivateReplaced = canTransitionQrStatus("REPLACED", "ACTIVATED");
      expect(reactivateReplaced.allowed).toBe(false);
      expect(reactivateReplaced.reason).toContain("permanently retired");

      // Returning decommissioned lost/damaged sticker to retailer stock
      const lostToRetailer = canTransitionQrStatus("LOST_DAMAGED", "WITH_RETAILER");
      expect(lostToRetailer.allowed).toBe(false);
      expect(lostToRetailer.reason).toContain("permanently decommissioned");

      // Activating expired stock
      const expiredToActive = canTransitionQrStatus("EXPIRED_UNSOLD", "ACTIVATED");
      expect(expiredToActive.allowed).toBe(false);
      expect(expiredToActive.reason).toContain("Expired unsold inventory cannot transition");
    });

    it("throws InvalidQrTransitionError when asserting invalid transitions", () => {
      expect(() => assertCanTransitionQrStatus("REPLACED", "ACTIVATED")).toThrowError(
        /permanently retired/
      );
    });
  });

  describe("05. Internal Operational State to Public Resolver State Mapping", () => {
    it("maps all pre-activation inventory states to ACTIVATION_AVAILABLE without leaking retailer info", () => {
      expect(mapInternalToPublicResolverState("PRINTED")).toBe("ACTIVATION_AVAILABLE");
      expect(mapInternalToPublicResolverState("IN_TRANSIT_DISTRIBUTOR")).toBe("ACTIVATION_AVAILABLE");
      expect(mapInternalToPublicResolverState("WITH_DISTRIBUTOR")).toBe("ACTIVATION_AVAILABLE");
      expect(mapInternalToPublicResolverState("WITH_RETAILER")).toBe("ACTIVATION_AVAILABLE");
      expect(mapInternalToPublicResolverState("SOLD")).toBe("ACTIVATION_AVAILABLE");
    });

    it("maps ACTIVATED to ACTIVE and retired states safely", () => {
      expect(mapInternalToPublicResolverState("ACTIVATED")).toBe("ACTIVE");
      expect(mapInternalToPublicResolverState("REPLACED")).toBe("REPLACED");
      expect(mapInternalToPublicResolverState("LOST_DAMAGED")).toBe("LOST_DAMAGED");
      expect(mapInternalToPublicResolverState("EXPIRED_UNSOLD")).toBe("LOST_DAMAGED");
      expect(mapInternalToPublicResolverState("BLOCKED")).toBe("BLOCKED");
      expect(mapInternalToPublicResolverState(null)).toBe("UNKNOWN");
    });

    it("provides safe user-facing metadata and next actions for every public state", () => {
      const activeMeta = getPublicResolverMeta("ACTIVE");
      expect(activeMeta.badgeVariant).toBe("success");
      expect(activeMeta.safeNextAction.actionType).toBe("CALL");

      const activationMeta = getPublicResolverMeta("ACTIVATION_AVAILABLE", { publicId: "7F3K9021" });
      expect(activationMeta.badgeVariant).toBe("outline");
      expect(activationMeta.safeNextAction.actionType).toBe("NAVIGATE_ACTIVATE");
      expect(activationMeta.safeNextAction.url).toBe("https://activate.vaahansafe.com/7F3K9021");

      const replacedMeta = getPublicResolverMeta("REPLACED");
      expect(replacedMeta.safeNextAction.actionType).toBe("NAVIGATE_HELP");

      const blockedMeta = getPublicResolverMeta("BLOCKED");
      expect(blockedMeta.badgeVariant).toBe("destructive");
      expect(blockedMeta.title).not.toContain("fraud"); // No internal leak
    });
  });
});
