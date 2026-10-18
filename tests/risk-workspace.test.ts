import { describe, it, expect } from "vitest";
import {
  parseRiskFilters,
  serializeRiskFilters,
  riskCursor,
  riskPage,
} from "../apps/admin/features/risk/risk.filters";
import { EMPTY_RISK_FILTERS } from "../apps/admin/features/risk/risk.types";
import {
  canExport,
  RISK_EXPORT_FIELDS,
  exportRows,
} from "../apps/admin/lib/exports";
describe("Risk operations query boundaries", () => {
  it("normalizes reference searches and rejects wildcard and unsupported values", () => {
    const f = parseRiskFilters(
      new URLSearchParams(
        "q=vs-awgm-%_&severity=99&status=FRAUD&category=PAYMENT&from=2026-02-30",
      ),
    );
    expect(f.q).toBe("VS-AWGM-");
    expect(f.severity).toBe("");
    expect(f.status).toBe("");
    expect(f.category).toBe("");
    expect(f.from).toBe("");
  });
  it("keeps calendar dates and excludes presentation controls from query identity", () => {
    const f = parseRiskFilters(
      new URLSearchParams(
        "from=2026-10-13&to=2026-10-14&workspace=signals&view=grid",
      ),
    );
    expect(serializeRiskFilters(f)).toBe("from=2026-10-13&to=2026-10-14");
    expect(
      serializeRiskFilters(
        parseRiskFilters(
          new URLSearchParams("from=2026-10-13&to=2026-10-14&view=rows"),
        ),
      ),
    ).toBe(serializeRiskFilters(f));
  });
  it("handles inverted dates and high-attention queue scope", () => {
    const f = parseRiskFilters(
      new URLSearchParams("from=2026-10-14&to=2026-10-13&scope=high_attention"),
    );
    expect(f.to).toBe("");
    expect(f.scope).toBe("high_attention");
  });
  it("paginates tied timestamps with a stable identity and no offset", () => {
    const rows = Array.from({ length: 51 }, (_, i) => ({
      id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
      observed_at: "2026-10-13T19:00:00Z",
    }));
    const page = riskPage(rows, "observed_at");
    expect(page.rows).toHaveLength(50);
    expect(riskCursor(page.nextCursor)).toEqual({
      id: rows[49]!.id,
      at: rows[49]!.observed_at,
    });
    expect(riskPage([], "id").nextCursor).toBeNull();
    expect(riskPage(rows.slice(0, 1), "observed_at").nextCursor).toBeNull();
  });
  it("rejects malformed and oversized cursors", () => {
    expect(() => riskCursor("x".repeat(501))).toThrow();
    expect(() =>
      riskCursor(btoa(JSON.stringify({ id: "internal_id", at: "2026-10-13" }))),
    ).toThrow();
    expect(() =>
      riskCursor(
        btoa(
          JSON.stringify({
            id: "00000000-0000-0000-0000-000000000001",
            at: "bad-date",
          }),
        ),
      ),
    ).toThrow();
  });
  it("round-trips all supported filters", () => {
    const f = {
      ...EMPTY_RISK_FILTERS,
      q: "SIG-ABC",
      severity: "REVIEW",
      category: "ACTIVATION",
      assignment: "mine",
      hasCase: "yes",
      lifecycle: "ACTIVATED",
    };
    expect(
      parseRiskFilters(new URLSearchParams(serializeRiskFilters(f))),
    ).toEqual(f);
  });
});
describe("Risk exports", () => {
  it("uses masked projections and blocks unauthorized export roles", () => {
    expect(canExport("READ_ONLY_ANALYST", "fraud")).toBe(true);
    expect(canExport("SUPPORT_AGENT", "fraud")).toBe(false);
    expect(canExport("FINANCE_ADMIN", "fraud")).toBe(false);
    expect(RISK_EXPORT_FIELDS).not.toContain("id");
    expect(RISK_EXPORT_FIELDS).not.toContain("activation_secret_hash");
    expect(RISK_EXPORT_FIELDS).not.toContain("phone");
  });
  it("neutralizes spreadsheet formula injection in investigation explanations", () => {
    const result = exportRows("fraud", [
      {
        reference_code: "SIG-A",
        evidence_summary: '=HYPERLINK("unsafe")',
        activation_secret_hash: "secret",
        phone: "private",
      },
    ]);
    expect(result[0]).toContain("'=HYPERLINK");
    expect(result[0]).not.toContain("secret");
    expect(result[0]).not.toContain("private");
  });
});
