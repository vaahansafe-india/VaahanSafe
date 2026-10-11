import { describe, expect, it } from "vitest";
import { stockReleaseSchema } from "../apps/admin/features/inventory/stock-release.schema";
const valid = {
  reason: "Verified physical stickers",
  confirmed: true,
  requestId: "41ef9595-f869-4e08-9fa3-73ac27a677b8",
};
describe("Verified print release request", () => {
  it("requires explicit confirmation, an operational reason and a retry identity", () => {
    for (const change of [
      { confirmed: false },
      { reason: "done" },
      { reason: "x".repeat(501) },
      { requestId: "invalid" },
    ])
      expect(
        stockReleaseSchema.safeParse({ ...valid, ...change }).success,
      ).toBe(false);
    expect(
      stockReleaseSchema.parse({ ...valid, reason: ` ${valid.reason} ` })
        .reason,
    ).toBe(valid.reason);
  });
  it("rejects client-controlled stock, ownership and entitlement truth", () => {
    for (const field of [
      "quantity",
      "qrIds",
      "batchStatus",
      "isActive",
      "userId",
      "entitlement",
      "activationSecret",
    ])
      expect(
        stockReleaseSchema.safeParse({ ...valid, [field]: true }).success,
      ).toBe(false);
  });
});
