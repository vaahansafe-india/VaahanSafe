import { describe, expect, it } from "vitest";
import {
  parseReceiptCodes,
  receiptField,
  pendingReceiptUnits,
  receiptSelectionError,
} from "../apps/admin/features/transfers/receipt-validation";
import { transferActions } from "../apps/admin/features/transfers/transfer.types";
describe("Transfer receipt entry", () => {
  it("rejects condition notes without presenting words as received identities", () => {
    const input = receiptField("this is good condition");
    expect(input.validCount).toBe(0);
    expect(input.error).toContain("Operational reason");
    expect(receiptSelectionError([input.codes], 1)).toContain("printed QR IDs");
  });
  it("accepts pasted printed IDs and normalizes casing and typographic dashes", () => {
    expect(parseReceiptCodes("vs–bf42r86v; VS-ABCDEF12\nVS-12345678")).toEqual([
      "VS-BF42R86V",
      "VS-ABCDEF12",
      "VS-12345678",
    ]);
    expect(receiptField("vs–bf42r86v").error).toBe("");
  });
  it("blocks repeated IDs, including across received and damaged categories", () => {
    expect(receiptField("VS-BF42R86V vs-bf42r86v").error).toContain("once");
    expect(
      receiptSelectionError([["VS-BF42R86V"], ["VS-BF42R86V"]], 2),
    ).toContain("one receipt category");
  });
  it("limits new receipts to pending units and permits explicit final all-missing accounting", () => {
    const row = {
      quantity: 3,
      received_quantity: 1,
      damaged_quantity: 0,
      missing_quantity: 1,
    };
    expect(pendingReceiptUnits(row)).toBe(1);
    expect(
      receiptSelectionError([["VS-BF42R86V", "VS-ABCDEF12"]], 1),
    ).toContain("at most 1");
    expect(receiptSelectionError([[]], 1)).toContain("at least one");
    expect(receiptSelectionError([[]], 1, true)).toBe("");
    expect(receiptSelectionError([[]], 0, true)).toContain(
      "Resolve missing identities",
    );
  });
  it("offers Resolve as the next action for a fully missing shipment", () => {
    const row = {
      quantity: 1,
      received_quantity: 0,
      damaged_quantity: 0,
      missing_quantity: 1,
    };
    expect(transferActions("DISCREPANCY", row)).toEqual([
      "resolve",
      "reconcile",
    ]);
    expect(transferActions("DISCREPANCY", { ...row, quantity: 2 })).toEqual([
      "receive",
      "resolve",
      "reconcile",
    ]);
    expect(
      transferActions("DISCREPANCY", {
        ...row,
        damaged_quantity: 1,
        missing_quantity: 0,
      }),
    ).toEqual(["reconcile"]);
  });
});
