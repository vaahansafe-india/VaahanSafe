import { describe, it, expect } from "vitest";
import { distributorSchema } from "../apps/admin/features/distributors/distributor.schema";
import {
  parseDistributorFilters,
  serializeDistributorFilters,
  normalizeDistributorSearch,
  decodeDistributorCursor,
  changeDistributorState,
  uniqueDistributorRows,
} from "../apps/admin/features/distributors/distributor.filters";
import {
  canManageDistributors,
  canReadDistributorContacts,
} from "../apps/admin/features/distributors/distributor.permissions";
import directory from "../apps/admin/features/geography/india-directory.json";
import { DISTRIBUTOR_EXPORT_FIELDS, csvCell } from "../apps/admin/lib/exports";
describe("Distributor filter contracts", () => {
  it("normalizes search consistently and strips wildcard syntax", () =>
    expect(normalizeDistributorSearch("  ＡＰ % _ Company  ")).toBe(
      "ap company",
    ));
  it("round trips supported URL filters", () => {
    const f = parseDistributorFilters(
      new URLSearchParams(
        "q=Coastal&state=AP&district=abc&status=ACTIVE&inventory=transit&from=2026-10-01&sort=oldest",
      ),
    );
    expect(
      parseDistributorFilters(
        new URLSearchParams(serializeDistributorFilters(f)),
      ),
    ).toEqual(f);
  });
  it("rejects invalid enums, dates and district without a state", () => {
    const f = parseDistributorFilters(
      new URLSearchParams("status=PAID&from=2026-02-31&district=abc"),
    );
    expect(f.status).toBe("");
    expect(f.from).toBe("");
    expect(f.district).toBe("");
  });
  it("clears incompatible districts after state changes", () => {
    expect(
      changeDistributorState({ state_code: "AP", district_code: "a" }, "KA")
        .district_code,
    ).toBe("");
    expect(
      changeDistributorState({ state_code: "AP", district_code: "a" }, "AP")
        .district_code,
    ).toBe("a");
  });
  it("accepts stable timestamp/id cursors and rejects malformed or oversized ones", () => {
    const cursor = {
      id: "partner_123",
      created_at: "2026-10-10T00:00:00+00:00",
    };
    expect(decodeDistributorCursor(btoa(JSON.stringify(cursor)))).toEqual(
      cursor,
    );
    expect(() => decodeDistributorCursor("bad")).toThrow();
    expect(() => decodeDistributorCursor("a".repeat(601))).toThrow();
  });
  it("does not append duplicate records across cursors", () =>
    expect(
      uniqueDistributorRows([
        [{ id: "a" }, { id: "b" }],
        [{ id: "b" }, { id: "c" }],
      ]),
    ).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]));
});
describe("Canonical administrative geography", () => {
  it("contains a complete government state snapshot and unique district IDs", () => {
    expect(directory.states).toHaveLength(36);
    expect(directory.districts.length).toBeGreaterThan(750);
    expect(new Set(directory.districts.map((d) => d.code)).size).toBe(
      directory.districts.length,
    );
    expect(
      directory.districts.every((d) =>
        directory.states.some((s) => s.code === d.state_code),
      ),
    ).toBe(true);
  });
  it("constrains Kakinada to Andhra Pradesh", () => {
    const d = directory.districts.find((d) => d.name === "Kakinada");
    expect(d?.state_code).toBe("AP");
    expect(
      directory.districts
        .filter((d) => d.state_code === "KA")
        .some((d) => d.name === "Kakinada"),
    ).toBe(false);
  });
});
describe("Distributor validation and permissions", () => {
  it("rejects client-defined identity, status and unknown fields", () => {
    expect(
      distributorSchema.safeParse({ name: "Name", isActive: true }).success,
    ).toBe(false);
    expect(
      distributorSchema.shape.contact_phone.safeParse("1234567890").success,
    ).toBe(false);
  });
  it("normalizes Indian mobile and requires distinct service areas", () => {
    expect(distributorSchema.shape.contact_phone.parse("9876543210")).toBe(
      "+919876543210",
    );
    expect(
      distributorSchema.shape.territories.safeParse([
        { state_code: "AP", district_code: "same" },
        { state_code: "AP", district_code: "same" },
      ]).success,
    ).toBe(false);
  });
  it("restricts writes and contact access to operations roles", () => {
    expect(canManageDistributors("OPS_ADMIN")).toBe(true);
    expect(canManageDistributors("SUPER_ADMIN")).toBe(true);
    expect(canManageDistributors("READ_ONLY_ANALYST")).toBe(false);
    expect(canReadDistributorContacts("SUPPORT_AGENT")).toBe(false);
  });
  it("excludes private contact and audit fields from exports and neutralizes formulas", () => {
    expect(DISTRIBUTOR_EXPORT_FIELDS).not.toContain("contact_phone");
    expect(DISTRIBUTOR_EXPORT_FIELDS).not.toContain("notes");
    expect(csvCell("=1+1")).toBe('"\'=1+1"');
  });
});
