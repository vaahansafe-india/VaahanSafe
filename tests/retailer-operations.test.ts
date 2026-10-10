import { describe, it, expect } from "vitest";
import {
  parseRetailerFilters,
  serializeRetailerFilters,
  normalizeRetailerSearch,
  retailerHealth,
  canManageRetailers,
  canReadRetailerContacts,
} from "../apps/admin/features/retailers/retailer.filters";
import { retailerSchema } from "../apps/admin/features/retailers/retailer.schema";
import { RETAILER_EXPORT_FIELDS, exportRows } from "../apps/admin/lib/exports";
import { changePartnerState } from "../apps/admin/features/geography/geography.types";
const input = {
  name: "Contract validation",
  parent_distributor_id: "partner_existing",
  state_code: "AP",
  district_code: "district_valid",
  city: "Kakinada",
  address_line_1: "Contract validation",
  contact_name: "Contract validation",
  contact_phone: "9876543210",
  stock_threshold: 0,
  reason: "Contract validation only",
};
describe("Retailer operations contracts", () => {
  it("normalizes search without wildcard expansion", () =>
    expect(normalizeRetailerSearch("  Shop%_\\  Name ")).toBe("shop name"));
  it("round trips supported URL filters", () => {
    const f = parseRetailerFilters(
      new URLSearchParams(
        "state=AP&district=area&distributor=partner_1&inventory=low&activity=today&sort=oldest&locality=Kakinada",
      ),
    );
    expect(
      parseRetailerFilters(new URLSearchParams(serializeRetailerFilters(f))),
    ).toEqual(f);
  });
  it("drops invalid filters, private fields and impossible calendar dates", () => {
    const f = parseRetailerFilters(
      new URLSearchParams(
        "status=LOW_STOCK&phone=999&from=2026-02-30&distributor=a%27&district=area",
      ),
    );
    expect(f.status).toBe("");
    expect(f.from).toBe("");
    expect(f.distributor).toBe("");
    expect(f.district).toBe("");
    expect(serializeRetailerFilters(f)).not.toContain("phone");
  });
  it("requires a supply network and normalizes real Indian mobile format", () => {
    const parsed = retailerSchema.parse(input);
    expect(parsed.contact_phone).toBe("+919876543210");
    expect(parsed.territory_override).toBe(false);
    expect(
      retailerSchema.safeParse({ ...input, parent_distributor_id: "" }).success,
    ).toBe(false);
  });
  it("permits missing optional postcode and rejects malformed contact/postcode", () => {
    expect(
      retailerSchema.safeParse({ ...input, postal_code: "" }).success,
    ).toBe(true);
    expect(
      retailerSchema.safeParse({ ...input, postal_code: "000000" }).success,
    ).toBe(false);
    expect(
      retailerSchema.safeParse({ ...input, contact_phone: "12345" }).success,
    ).toBe(false);
  });
  it("rejects client authority and unbounded thresholds", () => {
    expect(
      retailerSchema.safeParse({ ...input, status: "VERIFIED", available: 100 })
        .success,
    ).toBe(false);
    expect(
      retailerSchema.safeParse({ ...input, stock_threshold: -1 }).success,
    ).toBe(false);
    expect(
      retailerSchema.safeParse({ ...input, stock_threshold: 100001 }).success,
    ).toBe(false);
  });
  it("clears an incompatible district when state changes", () =>
    expect(
      changePartnerState({ state_code: "AP", district_code: "area" }, "KA")
        .district_code,
    ).toBe(""));
  it("separates low stock health from canonical partner status", () => {
    const r = {
      status: "ACTIVE" as const,
      verification_status: "VERIFIED" as const,
      available: 4,
      stock_threshold: 20,
      reconciliation_issues: 0,
      parent_distributor_id: "partner",
      distributor_status: "ACTIVE",
    };
    expect(retailerHealth(r)).toEqual(["Low stock"]);
    expect(r.status).toBe("ACTIVE");
    expect(retailerHealth({ ...r, available: 0 })).toEqual(["Out of stock"]);
    expect(retailerHealth({ ...r, stock_threshold: 0 })).toEqual([]);
  });
  it("flags distributor availability and reconciliation independently", () =>
    expect(
      retailerHealth({
        status: "ACTIVE",
        verification_status: "PENDING",
        available: 100,
        stock_threshold: 20,
        reconciliation_issues: 1,
        parent_distributor_id: "partner",
        distributor_status: "SUSPENDED",
      }),
    ).toEqual([
      "Verification required",
      "Distributor unavailable",
      "Reconciliation required",
    ]));
  it("limits mutations and contacts to operations roles", () => {
    for (const role of ["SUPER_ADMIN", "OPS_ADMIN"]) {
      expect(canManageRetailers(role)).toBe(true);
      expect(canReadRetailerContacts(role)).toBe(true);
    }
    for (const role of ["READ_ONLY_ANALYST", "FINANCE_ADMIN", "SUPPORT_ADMIN"])
      expect(canManageRetailers(role)).toBe(false);
  });
  it("exports only operational fields with formula-safe cells", () => {
    expect(RETAILER_EXPORT_FIELDS).not.toContain("contact_phone");
    expect(RETAILER_EXPORT_FIELDS).not.toContain("activation_secret_hash");
    const csv = exportRows("retailers", [
      { name: "=SUM(1)", contact_phone: "private contact" },
    ]).join("");
    expect(csv).toContain("'=SUM(1)");
    expect(csv).not.toContain("private contact");
  });
});
