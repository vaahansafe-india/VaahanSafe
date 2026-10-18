export const REPLACEMENT_STATUSES = [
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "QR_ALLOCATED",
  "MIGRATED",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;
export const REPLACEMENT_REASONS = [
  "LOST",
  "DAMAGED",
  "PRINT_DEFECT",
  "DELIVERY_DAMAGE",
  "OTHER",
] as const;
export interface ReplacementFilters {
  q: string;
  status: string;
  reason: string;
  risk: string;
  scope: string;
  qr: string;
  dateMode: string;
  from: string;
  to: string;
  sort: string;
}
export const EMPTY_REPLACEMENT_FILTERS: ReplacementFilters = {
  q: "",
  status: "",
  reason: "",
  risk: "",
  scope: "",
  qr: "",
  dateMode: "requested",
  from: "",
  to: "",
  sort: "newest",
};
export interface ReplacementRow {
  id: string;
  reference_code: string;
  user_id: string;
  vehicle_id: string;
  old_qr_sticker_id: string;
  new_qr_sticker_id: string | null;
  reason: string;
  status: string;
  revision: number;
  stage: string;
  requested_at: string;
  updated_at: string;
  approved_at: string | null;
  allocated_at: string | null;
  retired_at: string | null;
  activated_at: string | null;
  closed_at: string | null;
  customer_name: string;
  make: string;
  model: string;
  color: string;
  vehicle_type: string;
  registration_masked: string;
  old_visible_code: string;
  old_qr_status: string;
  new_visible_code: string | null;
  new_qr_status: string | null;
  risk_level: string;
  risk_signals: string[];
  attention: string | null;
  eligible: boolean;
  scans_after_report: number;
  prior_replacements: number;
  failed_attempts: number;
  order_id: string | null;
  order_number: string | null;
  payment_state: string | null;
  fulfilment_id: string | null;
  fulfilment_status: string | null;
  shipment_id: string | null;
  shipment_status: string | null;
  tracking_reference: string | null;
  waybill_number: string | null;
  courier_code: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  sort_value: string;
}
export interface ReplacementDetail {
  record: ReplacementRow;
  notes: string | null;
  reviewNote: string | null;
  rejectionReason: string | null;
  approvedBy: string | null;
  evidence: string;
}
export interface ReplacementSummary {
  total: number;
  review: number;
  risk: number;
  issue: number;
  fulfilment: number;
  activation: number;
  attention: number;
}
export interface ReplacementPage<T = ReplacementRow> {
  rows: T[];
  nextCursor: string | null;
}
export interface ReplacementHistory {
  id: string;
  created_at: string;
  action?: string;
  reason: string;
  actor_name?: string;
  from_status?: string;
  to_status?: string;
  old_visible_code?: string;
  new_visible_code?: string;
  metadata?: Record<string, unknown>;
}
export interface ReplacementOptions {
  orders: {
    id: string;
    order_number: string;
    total_minor: number;
    currency: string;
  }[];
  batches: { id: string; reference_code: string; available: number }[];
}
export const replacementLabel = (v: string) =>
  v
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
export function replacementActions(r: ReplacementRow): string[] {
  if (["REQUESTED", "UNDER_REVIEW"].includes(r.status))
    return [
      ...(r.status === "REQUESTED" ? ["review"] : []),
      ...(r.eligible ? ["approve"] : []),
      "reject",
      "cancel",
    ];
  if (r.status === "APPROVED")
    return [...(r.eligible ? ["allocate"] : []), "cancel"];
  if (r.status === "QR_ALLOCATED")
    return [...(r.eligible ? ["retire"] : []), "cancel"];
  if (["MIGRATED", "SHIPPED"].includes(r.status))
    return [
      ...(r.fulfilment_status === "PROCESSING" ? ["pack"] : []),
      ...(r.status === "MIGRATED" &&
      ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
        r.shipment_status || "",
      )
        ? ["sync_shipment"]
        : []),
      ...(r.activated_at &&
      r.shipment_status === "DELIVERED" &&
      r.payment_state === "PAID"
        ? ["close"]
        : []),
    ];
  return [];
}
