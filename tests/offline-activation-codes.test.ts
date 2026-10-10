import { describe, it, expect } from "vitest";
import { generateScratchSecret } from "../packages/qr/src/secrets/generate-secret";
import { hashScratchSecret } from "../packages/qr/src/secrets/hash-secret";
import { verifyScratchSecret } from "../packages/qr/src/secrets/verify-secret";
import {
  encryptActivationManifest,
  decryptActivationManifest,
} from "../packages/qr/src/secrets/encrypted-manifest";

describe("Offline activation code storage", () => {
  it("generates unique independent codes verified by the existing activation service", async () => {
    const code = generateScratchSecret(16),
      other = generateScratchSecret(16);
    const first = await hashScratchSecret(code),
      second = await hashScratchSecret(code);
    expect(code).not.toBe(other);
    expect(code).toHaveLength(16);
    expect(first.secretHash).not.toBe(second.secretHash);
    expect(await verifyScratchSecret(code, first.secretHash)).toBe(true);
    expect(await verifyScratchSecret(other, first.secretHash)).toBe(false);
  });
  it("stores encrypted originals and rejects tampering, wrong keys and wrong batches", async () => {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const code = generateScratchSecret(16),
      plain = JSON.stringify({ activationCode: code });
    const envelope = await encryptActivationManifest(plain, key, "batch_one");
    expect(envelope).not.toContain(code);
    expect(await decryptActivationManifest(envelope, key, "batch_one")).toBe(
      plain,
    );
    await expect(
      decryptActivationManifest(envelope, key, "batch_two"),
    ).rejects.toThrow();
    const other = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    await expect(
      decryptActivationManifest(envelope, other, "batch_one"),
    ).rejects.toThrow();
    const changed = JSON.parse(envelope);
    changed.ciphertext =
      (changed.ciphertext[0] === "A" ? "B" : "A") + changed.ciphertext.slice(1);
    await expect(
      decryptActivationManifest(JSON.stringify(changed), key, "batch_one"),
    ).rejects.toThrow();
  });
});
