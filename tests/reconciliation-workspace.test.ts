import { describe, it, expect } from "vitest";
import {
  parseReconciliationFilters,
  reconciliationCursor,
  reconciliationPage,
  serializeReconciliationFilters,
} from "../apps/admin/features/reconciliation/reconciliation.filters";
import {
  reconciliationActions,
  varianceDescription,
  EMPTY_RECONCILIATION_FILTERS,
  type ReconciliationRow,
} from "../apps/admin/features/reconciliation/reconciliation.types";
import { reconciliationCommandSchema } from "../apps/admin/features/reconciliation/reconciliation.schema";
import { exportRows } from "../apps/admin/lib/exports";
describe("Stock reconciliation contracts", () => {
  it("keeps human names searchable and excludes view from the server-query identity", () => {
    const f = parseReconciliationFilters(
      new URLSearchParams("q=Sri%20Sai%20Distributor&view=grid&status=CLOSED"),
    );
    expect(f.q).toBe("Sri Sai Distributor");
    expect(serializeReconciliationFilters(f)).not.toContain("view");
    expect(
      parseReconciliationFilters(new URLSearchParams("view=rows")),
    ).toEqual(EMPTY_RECONCILIATION_FILTERS);
  });
  it("normalizes wildcard search and invalid dates without admitting SQL sort names", () => {
    const f = parseReconciliationFilters(
      new URLSearchParams({
        q: "%_% Venkat",
        from: "2026-02-30",
        to: "2026-10-13",
        sort: "drop table",
        status: "MATCHED",
      }),
    );
    expect(f.q).toBe("Venkat");
    expect(f.from).toBe("");
    expect(f.to).toBe("2026-10-13");
    expect(f.sort).toBe("newest");
    expect(f.status).toBe("");
  });
  it("uses a stable sort value and identity tie-breaker for cursor pages", () => {
    const rows = [
      { id: "rec-a", sort_value: "2026-10-13 00:00:00+00" },
      { id: "rec-b", sort_value: "2026-10-13 00:00:00+00" },
    ];
    const p = reconciliationPage(rows, 1);
    expect(p.rows).toHaveLength(1);
    expect(reconciliationCursor(p.nextCursor)).toEqual({
      id: "rec-a",
      value: rows[0]!.sort_value,
    });
    expect(() =>
      reconciliationCursor(btoa(JSON.stringify({ id: "bad'", value: "0" }))),
    ).toThrow();
    expect(reconciliationPage(rows, 2).nextCursor).toBe(null);
  });
  it("keeps closed workflow independent of variance and does not permit transfer actions", () => {
    const closed = {
      phase: "CLOSED",
      status: "CLOSED",
      variance: -1,
      damaged_quantity: null,
    } as ReconciliationRow;
    expect(varianceDescription(closed)).toBe("1 fewer than ledger");
    expect(reconciliationActions(closed)).toEqual([]);
    expect(
      reconciliationActions({
        ...closed,
        status: "OPEN",
        phase: "COUNTED",
        transfer_id: "transfer-a",
      }),
    ).toEqual([]);
  });
  it("requires reviewed resolution before privileged changes and never offers a blind surplus adjustment", () => {
    const row = {
      status: "OPEN",
      phase: "COUNTED",
      transfer_id: null,
    } as ReconciliationRow;
    expect(reconciliationActions(row)).not.toContain("adjust");
    expect(reconciliationActions({ ...row, phase: "RESOLVED" })).toEqual([
      "approve",
      "recount",
    ]);
    expect(
      reconciliationActions({
        ...row,
        phase: "APPROVED",
        snapshot_at: "2026-10-13",
        missing_quantity: 1,
        extra_quantity: 0,
      }),
    ).toContain("adjust");
    expect(
      reconciliationActions({
        ...row,
        phase: "APPROVED",
        snapshot_at: "2026-10-13",
        extra_quantity: 1,
      }),
    ).not.toContain("adjust");
  });
  it("rejects total-setting, excessive counts and arbitrary workflow mutations", () => {
    const base = {
      revision: 1,
      reason: "Reviewed the actual physical count.",
      requestId: "2ec19d20-eef7-4a9e-99dc-2cba7393869a",
    };
    expect(
      reconciliationCommandSchema.safeParse({
        ...base,
        action: "save",
        values: { counted: 5 },
      }).success,
    ).toBe(true);
    for (const value of [
      { action: "adjust", values: { expected: 5 } },
      { action: "save", values: { counted: -1 } },
      { action: "save", values: { counted: 100001 } },
      { action: "set_status", values: {} },
    ])
      expect(
        reconciliationCommandSchema.safeParse({ ...base, ...value }).success,
      ).toBe(false);
  });
  it("exports named custodians and protects spreadsheet cells from formula injection", () => {
    const csv = exportRows("reconciliation", [
      {
        reference_code: "VS-REC-A",
        custodian_name: "=HYPERLINK(secret)",
        partner_id: "private-id",
        expected_quantity: 1,
        counted_quantity: 0,
        variance: -1,
        status: "CLOSED",
        outcome: "CLOSED_VARIANCE",
      },
    ]);
    expect(csv[0]).toContain("'=HYPERLINK(secret)");
    expect(csv[0]).not.toContain("private-id");
    expect(csv[0]).toContain("CLOSED_VARIANCE");
  });
});
