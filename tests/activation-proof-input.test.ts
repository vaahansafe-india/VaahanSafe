import { describe, expect, it } from "vitest";
import {
  isActivationProofInput,
  normalizeActivationProofInput,
} from "../apps/activate/lib/activation-proof-input";
import { generateScratchSecret } from "../packages/qr/src/secrets/generate-secret";
import { hashScratchSecret } from "../packages/qr/src/secrets/hash-secret";
import { verifyScratchSecret } from "../packages/qr/src/secrets/verify-secret";
describe("Printed activation proof entry", () => {
  it("preserves every character of a 16-character manufactured code", () => {
    const secret = generateScratchSecret(16);
    const printed = secret.match(/.{4}/g)!.join("-");
    expect(isActivationProofInput(printed)).toBe(true);
    expect(normalizeActivationProofInput(printed)).toBe(secret);
    expect(
      normalizeActivationProofInput(
        printed.toLowerCase().replaceAll("-", " – "),
      ),
    ).toBe(secret);
  });
  it("verifies printed grouping against the existing full-secret hash", async () => {
    const secret = generateScratchSecret(16),
      { secretHash, hashVersion } = await hashScratchSecret(secret);
    const grouped = secret.match(/.{4}/g)!.join("-");
    expect(
      await verifyScratchSecret(
        normalizeActivationProofInput(grouped),
        secretHash,
        hashVersion,
      ),
    ).toBe(true);
    expect(
      await verifyScratchSecret(secret.slice(0, 12), secretHash, hashVersion),
    ).toBe(false);
  });
  it("retains older code lengths and rejects malformed or unbounded input", () => {
    for (const length of [8, 10, 12, 16])
      expect(isActivationProofInput(generateScratchSecret(length))).toBe(true);
    for (const value of [
      null,
      1234,
      {},
      "",
      "ABCD",
      "ABCD/EFGH",
      "ABCD<script>",
      "A".repeat(65),
      " ".repeat(129),
    ])
      expect(isActivationProofInput(value)).toBe(false);
  });
});
