export const TRANSFER_STATUSES = [
  "REQUESTED",
  "APPROVED",
  "IN_TRANSIT",
  "PARTIALLY_RECEIVED",
  "DISCREPANCY",
  "RECEIVED",
  "RECONCILED",
  "CLOSED",
  "CANCELLED",
  "REJECTED",
] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];
export interface TransferRow {
  id: string;
  reference_code: string;
  source_partner_id: string | null;
  destination_partner_id: string;
  source_name: string;
  destination_name: string;
  source_kind: string | null;
  destination_kind: string;
  source_reference: string | null;
  destination_reference: string;
  quantity: number;
  status: TransferStatus;
  revision: number;
  received_quantity: number;
  damaged_quantity: number;
  missing_quantity: number;
  resolved_quantity: number;
  carrier: string;
  tracking_reference: string;
  expected_arrival: string | null;
  dispatched_at: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
  overdue: boolean;
  attention: boolean;
}
export interface TransferDetail {
  transfer: TransferRow;
  allocations: { batch_id: string; reference_code: string; quantity: number }[];
  reconciliation: {
    id: string;
    status: string;
    expected: number;
    counted: number;
    variance: number;
  } | null;
}
export interface TransferSummary {
  active: number;
  transit: number;
  attention: number;
  receivedToday: number;
}
export interface TransferPage<T = TransferRow> {
  rows: T[];
  nextCursor: string | null;
}
export interface TransferHistory {
  id: string;
  action?: string;
  actor_name?: string;
  reason?: string | null;
  to_status?: string;
  from_status?: string;
  quantities?: Record<string, number>;
  created_at: string;
  visible_code?: string;
  status?: string;
  receipt_state?: string;
  batch_reference?: string;
  custodian?: string;
}
export interface PartnerOption {
  id: string;
  reference_code: string;
  name: string;
  kind: string;
  city: string;
  status: string;
  verification_status: string;
  parent_distributor_id: string | null;
}
export interface InventoryOption {
  id: string;
  reference_code: string;
  available: number;
}
export interface TransferFilters {
  q: string;
  status: string;
  view: string;
  source: string;
  destination: string;
  batch: string;
  movement: string;
  from: string;
  to: string;
}
export const EMPTY_TRANSFER_FILTERS: TransferFilters = {
  q: "",
  status: "",
  view: "",
  source: "",
  destination: "",
  batch: "",
  movement: "",
  from: "",
  to: "",
};
export const transferLabel = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (v) => v.toUpperCase());
export function transferActions(
  status: TransferStatus,
  receipt?: Pick<
    TransferRow,
    "quantity" | "received_quantity" | "damaged_quantity" | "missing_quantity"
  >,
) {
  switch (status) {
    case "REQUESTED":
      return ["approve", "reject", "cancel"];
    case "APPROVED":
      return ["dispatch", "cancel"];
    case "IN_TRANSIT":
    case "PARTIALLY_RECEIVED":
      return ["receive"];
    case "DISCREPANCY":
      return [
        ...(!receipt ||
        receipt.quantity >
          receipt.received_quantity +
            receipt.damaged_quantity +
            receipt.missing_quantity
          ? ["receive"]
          : []),
        ...(!receipt || receipt.missing_quantity > 0 ? ["resolve"] : []),
        "reconcile",
      ];
    case "RECEIVED":
      return ["reconcile"];
    case "RECONCILED":
      return ["close"];
    default:
      return [];
  }
}
