import { describe, it, expect } from "vitest";
import {
  ADMIN_MODULES,
  ADMIN_ROLES,
  canReadModule,
  canMutateModule,
  canSearchPhone,
} from "../apps/admin/lib/modules";
import { maskAdminRow } from "../apps/admin/lib/presentation";
import { canExport, csvCell, exportRows } from "../apps/admin/lib/exports";
import { adminSearchFilters } from "../apps/admin/lib/search-filters";
describe("Typed reference search", () => {
  it("searches customer names without applying pattern operators to UUID columns", () => {
    expect(
      adminSearchFilters(["id", "full_name"], "customer name", ["id"]),
    ).toEqual(["full_name.ilike.%customer name%"]);
  });
  it("matches a complete UUID by exact reference", () => {
    const id = "dfc45a9c-cb87-43dd-b4ec-5a93ca8c2b91";
    expect(adminSearchFilters(["id", "full_name"], id, ["id"])).toEqual([
      `id.eq.${id}`,
      `full_name.ilike.%${id}%`,
    ]);
  });
});
describe("Admin role isolation", () => {
  it("allows the super admin to read every module", () => {
    for (const m of ADMIN_MODULES)
      expect(canReadModule("SUPER_ADMIN", m.key)).toBe(true);
  });
  it("keeps support out of finance and configuration", () => {
    expect(canReadModule("SUPPORT_AGENT", "customers")).toBe(true);
    for (const key of ["payments", "refunds", "flags", "settings", "articles"])
      expect(canReadModule("SUPPORT_AGENT", key)).toBe(false);
  });
  it("separates content, status, operations and finance responsibilities", () => {
    expect(canReadModule("CONTENT_EDITOR", "articles")).toBe(true);
    expect(canReadModule("CONTENT_EDITOR", "inventory")).toBe(false);
    expect(canReadModule("STATUS_MANAGER", "incidents")).toBe(true);
    expect(canReadModule("STATUS_MANAGER", "customers")).toBe(false);
    expect(canReadModule("OPS_ADMIN", "payments")).toBe(false);
    expect(canReadModule("FINANCE_ADMIN", "inventory")).toBe(false);
  });
  it("prevents analysts and all roles from direct financial state mutations", () => {
    for (const m of ADMIN_MODULES)
      expect(canMutateModule("READ_ONLY_ANALYST", m.key)).toBe(false);
    for (const role of ADMIN_ROLES)
      for (const key of [
        "payments",
        "orders",
        "refunds",
        "subscriptions",
        "plans",
      ])
        expect(canMutateModule(role, key)).toBe(false);
  });
  it("rejects unknown modules and limits phone search", () => {
    for (const role of ADMIN_ROLES)
      expect(canReadModule(role, "__proto__")).toBe(false);
    expect(canSearchPhone("SUPPORT_AGENT")).toBe(true);
    expect(canSearchPhone("FINANCE_ADMIN")).toBe(false);
  });
});
describe("Server projection and export privacy", () => {
  it("masks personal identifiers and excludes secrets before client delivery", () => {
    const row = maskAdminRow({
      id: "reference",
      primary_phone: "+919876543210",
      primary_email: "person@example.com",
      registration_number_normalized: "DL01AB1234",
      activation_secret_hash: "private",
      token_hash: "private",
      raw_payload: { private: true },
      medical_notes: "private",
      metadata: { private: true },
      status: "ACTIVE",
    });
    expect(row.primary_phone).toBe("••••••3210");
    expect(row.primary_email).toBe("p•••@example.com");
    expect(row.registration_number_normalized).toBe("DL01••34");
    expect(Object.keys(row)).toEqual([
      "id",
      "primary_phone",
      "primary_email",
      "registration_number_normalized",
      "status",
    ]);
  });
  it("restricts export modules by the current actor role", () => {
    expect(canExport("FINANCE_ADMIN", "payments")).toBe(true);
    expect(canExport("OPS_ADMIN", "payments")).toBe(false);
    expect(canExport("SUPPORT_AGENT", "customers")).toBe(false);
    expect(canExport("SUPER_ADMIN", "settings")).toBe(false);
  });
  it("prevents spreadsheet formula injection and escapes CSV delimiters", () => {
    for (const v of ["=SUM(1,2)", "+cmd", "-cmd", "@SUM", " \t=HYPERLINK()"]) {
      expect(csvCell(v).startsWith("\"'")).toBe(true);
    }
    expect(csvCell('A "quoted", value')).toBe('"A ""quoted"", value"');
  });
  it("masks CSV export fields independently of UI masking", () => {
    const [line] = exportRows("customers", [
      {
        id: "reference",
        primary_phone: "+919876543210",
        primary_email: "person@example.com",
        activation_secret_hash: "private",
      },
    ]);
    expect(line).not.toContain("9876543210");
    expect(line).not.toContain("person@");
    expect(line).not.toContain("private");
  });
});
