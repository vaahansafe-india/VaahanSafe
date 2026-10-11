import { describe, it, expect } from "vitest";
import {
  activationQrLookup,
  normalizePublicId,
} from "../apps/activate/lib/activation-qr-id";
describe("Activation canonical QR lookup", () => {
  it("preserves the uppercase stored ID returned by recognition for proof verification", () => {
    expect(activationQrLookup("BF42R86V")).toEqual({
      publicId: "BF42R86V",
      visibleCode: "VS-BF42R86V",
    });
    expect(
      activationQrLookup("https://qr.vaahansafe.com/BF42R86V").publicId,
    ).toBe("BF42R86V");
  });
  it("resolves printed ID variants through the same visible-code predicate at both stages", () => {
    for (const input of ["BF42R86V", "bf42r86v", "VS-BF42R86V", "vs_bf42r86v"])
      expect(activationQrLookup(input).visibleCode).toBe("VS-BF42R86V");
  });
  it("preserves mixed-case opaque identities and legacy vs_ aliases", () => {
    expect(normalizePublicId("aB9xT7pQ2")).toBe("aB9xT7pQ2");
    expect(normalizePublicId("VS-7F3K-9021")).toBe("vs_7f3k-9021");
    expect(
      normalizePublicId("https://activate.vaahansafe.com/vs_7f3k9021?ref=box"),
    ).toBe("vs_7f3k9021");
    expect(normalizePublicId("   VS_7F3K9021   ")).toBe("vs_7f3k9021");
  });
});
