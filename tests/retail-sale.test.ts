import { describe, expect, it } from "vitest";
import { retailSaleSchema } from "../apps/admin/features/retailers/retail-sale.schema";
const valid = {
  requestId: "41ef9595-f869-4e08-9fa3-73ac27a677b8",
  codes: ["VS-ABCDEF12"],
  receipt: "INV-24",
  reason: "Physical retail sale verified",
};
describe("Retail sale submission boundaries", () => {
  it("normalizes printed visible IDs and receipt references", () => {
    expect(
      retailSaleSchema.parse({
        ...valid,
        codes: [" vs–abcdef12 "],
        receipt: " inv-24 ",
      }).codes,
    ).toEqual(valid.codes);
    expect(
      retailSaleSchema.parse({ ...valid, receipt: " inv-24 " }).receipt,
    ).toBe("INV-24");
  });
  it("rejects duplicate identities after normalization", () => {
    expect(
      retailSaleSchema.safeParse({
        ...valid,
        codes: ["VS-ABCDEF12", "vs-abcdef12"],
      }).success,
    ).toBe(false);
  });
  it("does not accept client ownership, entitlement or payment state", () => {
    for (const key of [
      "userId",
      "vehicleId",
      "isPaid",
      "status",
      "entitlement",
      "activationSecret",
    ])
      expect(
        retailSaleSchema.safeParse({ ...valid, [key]: "true" }).success,
      ).toBe(false);
  });
  it("bounds requests and requires a receipt, reason and retry identity", () => {
    for (const change of [
      { codes: [] },
      {
        codes: Array.from(
          { length: 101 },
          (_, i) => `VS-CODE${i.toString().padStart(5, "0")}`,
        ),
      },
      { codes: ["https://qr.vaahansafe.com/example"] },
      { receipt: "  " },
      { reason: "ok" },
      { requestId: "reused" },
    ])
      expect(retailSaleSchema.safeParse({ ...valid, ...change }).success).toBe(
        false,
      );
  });
});
