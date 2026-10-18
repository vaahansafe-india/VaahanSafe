import { describe, it, expect } from "vitest";
import {
  parseReplacementFilters,
  replacementCursor,
  replacementPage,
  serializeReplacementFilters,
} from "../apps/admin/features/replacements/replacement.filters";
import {
  replacementActions,
  type ReplacementRow,
} from "../apps/admin/features/replacements/replacement.types";
import {
  csvCell,
  REPLACEMENT_EXPORT_FIELDS,
  canExport,
} from "../apps/admin/lib/exports";
describe("Replacement query boundaries", () => {
  it("normalizes unsupported filters and strips wildcard search", () => {
    const f = parseReplacementFilters(
      new URLSearchParams(
        "q=VS-%_\\&status=ACTIVE&risk=CRITICAL&sort=amount&from=2026-02-30",
      ),
    );
    expect(f.q).toBe("VS-");
    expect(f.status).toBe("");
    expect(f.risk).toBe("");
    expect(f.sort).toBe("newest");
    expect(f.from).toBe("");
  });
  it("preserves IST calendar dates independently of a view toggle", () => {
    const f = parseReplacementFilters(
      new URLSearchParams(
        "from=2026-10-13&to=2026-10-15&dateMode=delivered&view=rows",
      ),
    );
    expect(serializeReplacementFilters(f)).toBe(
      "dateMode=delivered&from=2026-10-13&to=2026-10-15",
    );
  });
  it("removes an inverted date interval", () =>
    expect(
      parseReplacementFilters(
        new URLSearchParams("from=2026-10-15&to=2026-10-13"),
      ).to,
    ).toBe(""));
  it("uses a timestamp and identity cursor rather than offsets", () => {
    const rows = Array.from({ length: 51 }, (_, i) => ({
      id: `record_${i}`,
      sort_value: "2026-10-13T00:00:00Z",
    }));
    const p = replacementPage(rows);
    expect(p.rows).toHaveLength(50);
    expect(replacementCursor(p.nextCursor)).toEqual({
      id: "record_49",
      value: "2026-10-13T00:00:00Z",
    });
  });
  it("rejects arbitrary cursor values", () => {
    expect(() =>
      replacementCursor(
        btoa(JSON.stringify({ id: "record", value: "not-a-date" })),
      ),
    ).toThrow();
    expect(() => replacementCursor("x".repeat(601))).toThrow();
  });
});
describe("Replacement operation boundaries", () => {
  const row = (r: Partial<ReplacementRow>) => r as ReplacementRow;
  it("blocks allocation when ownership is no longer eligible", () =>
    expect(
      replacementActions(row({ status: "APPROVED", eligible: false })),
    ).toEqual(["cancel"]));
  it("requires paid allocation before original retirement", () => {
    expect(
      replacementActions(row({ status: "APPROVED", eligible: true })),
    ).not.toContain("retire");
    expect(
      replacementActions(row({ status: "QR_ALLOCATED", eligible: true })),
    ).toContain("retire");
  });
  it("offers no cancellation after original retirement", () =>
    expect(
      replacementActions(
        row({ status: "MIGRATED", fulfilment_status: "PACKED" }),
      ),
    ).not.toContain("cancel"));
  it("offers closure only after delivery, activation and paid acquisition", () => {
    const r = row({
      status: "SHIPPED",
      activated_at: "2026-10-13",
      shipment_status: "DELIVERED",
      payment_state: "PAID",
    });
    expect(replacementActions(r)).toContain("close");
    expect(
      replacementActions({ ...r, payment_state: "REFUNDED" }),
    ).not.toContain("close");
    expect(
      replacementActions({ ...r, shipment_status: "IN_TRANSIT" }),
    ).not.toContain("close");
  });
  it("keeps support inspection separate from privileged exports", () => {
    expect(canExport("SUPPORT_AGENT", "replacements")).toBe(false);
    expect(canExport("OPS_ADMIN", "replacements")).toBe(true);
  });
  it("exports safe lineage fields and defends spreadsheet formula cells", () => {
    expect(REPLACEMENT_EXPORT_FIELDS).toContain("registration_masked");
    expect(REPLACEMENT_EXPORT_FIELDS).not.toContain("secret_hash");
    expect(REPLACEMENT_EXPORT_FIELDS).not.toContain(
      "shipping_address_snapshot_json",
    );
    expect(csvCell(' =HYPERLINK("x")')).toBe('"\' =HYPERLINK(""x"")"');
  });
});
