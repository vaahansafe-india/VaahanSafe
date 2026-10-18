export interface ReconciliationFilters {
  q: string;
  status: string;
  scope: string;
  partner: string;
  kind: string;
  variance: string;
  state: string;
  district: string;
  dateMode: string;
  from: string;
  to: string;
  sort: string;
}
export const EMPTY_RECONCILIATION_FILTERS: ReconciliationFilters = {
  q: "",
  status: "",
  scope: "",
  partner: "",
  kind: "",
  variance: "",
  state: "",
  district: "",
  dateMode: "count",
  from: "",
  to: "",
  sort: "newest",
};
export interface ReconciliationRow {
  id: string;
  reference_code: string;
  partner_id: string | null;
  custodian_name: string;
  custodian_kind: string;
  custodian_reference: string | null;
  city: string | null;
  state_name: string | null;
  district_name: string | null;
  state_code: string | null;
  district_code: string | null;
  expected_quantity: number;
  counted_quantity: number;
  variance: number;
  status: string;
  phase: string;
  outcome: string;
  missing_quantity: number | null;
  damaged_quantity: number | null;
  extra_quantity: number | null;
  attention: string | null;
  transfer_id: string | null;
  transfer_reference: string | null;
  transfer_status: string | null;
  snapshot_at: string | null;
  snapshot_reserved: number;
  count_completed_at: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  revision: number;
  sort_value: string;
}
export interface ReconciliationPage<T = ReconciliationRow> {
  rows: T[];
  nextCursor: string | null;
}
export interface ReconciliationSummary {
  total: number;
  open: number;
  variances: number;
  review: number;
  matchedToday: number;
}
export interface ReconciliationDetail {
  record: ReconciliationRow;
  resolution: string | null;
  adjustmentAppliedAt: string | null;
  countedBy: string | null;
  approvedBy: string | null;
  snapshotBatches: string[];
  hasSnapshot: boolean;
}
export interface ReconciliationHistory {
  id: string;
  created_at?: string;
  action?: string;
  reason?: string;
  actor_name?: string;
  quantities?: Record<string, number>;
  visible_code?: string;
  status?: string;
  receipt_state?: string;
  batch_reference?: string;
  reference_code?: string;
  expected?: number;
}
export interface CustodianOption {
  id: string;
  name: string;
  kind: string;
  city: string;
  reference_code: string;
  state_name: string | null;
  district_name: string | null;
  status: string;
}
export interface LedgerSnapshot {
  partner: string | null;
  snapshotAt: string;
  expected: number;
  reserved: number;
  batches: { id: string; reference_code: string; expected: number }[];
}
export const reconciliationLabel = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (v) => v.toUpperCase());
export function reconciliationActions(r: ReconciliationRow): string[] {
  if (r.status === "CLOSED" || r.phase === "CANCELLED" || r.transfer_id)
    return [];
  if (r.phase === "COUNTING") return ["save", "complete", "cancel"];
  if (r.phase === "APPROVED")
    return [
      ...(r.snapshot_at &&
      !r.extra_quantity &&
      (!!r.missing_quantity || !!r.damaged_quantity)
        ? ["adjust"]
        : []),
      "close",
    ];
  if (r.phase === "RESOLVED") return ["approve", "recount"];
  if (r.phase === "REVIEWING") return ["close"];
  return [
    ...(r.phase !== "INVESTIGATING" ? ["investigate"] : []),
    "resolve",
    "recount",
  ];
}
export function varianceDescription(
  r: Pick<ReconciliationRow, "phase" | "variance" | "damaged_quantity">,
) {
  if (r.phase === "COUNTING") return "Physical count pending";
  if (r.variance < 0)
    return `${Math.abs(r.variance).toLocaleString("en-IN")} fewer than ledger`;
  if (r.variance > 0)
    return `${r.variance.toLocaleString("en-IN")} unexpected units`;
  return r.damaged_quantity
    ? `${r.damaged_quantity} damaged · quantity matches`
    : "Ledger and physical count match";
}
