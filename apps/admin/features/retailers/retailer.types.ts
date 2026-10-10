export interface RetailerFilters {
  q: string;
  status: string;
  verification: string;
  state: string;
  district: string;
  distributor: string;
  locality: string;
  inventory: string;
  activity: string;
  from: string;
  to: string;
  sort: "newest" | "oldest";
}
export interface RetailerRow {
  id: string;
  reference_code: string;
  name: string;
  city: string;
  status: "ACTIVE" | "SUSPENDED";
  verification_status: "PENDING" | "VERIFIED" | "REQUIRES_CORRECTION";
  state_code: string | null;
  district_code: string | null;
  state_name: string | null;
  district_name: string | null;
  parent_distributor_id: string | null;
  distributor_name: string | null;
  distributor_reference: string | null;
  distributor_status: string | null;
  stock_threshold: number;
  on_hand: number;
  reserved: number;
  available: number;
  in_transit: number;
  activations_today: number;
  activations_7d: number;
  activations_30d: number;
  last_activation_at: string | null;
  last_receipt_at: string | null;
  unresolved_variance: number;
  reconciliation_issues: number;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}
export interface RetailerPage {
  rows: RetailerRow[];
  nextCursor: string | null;
}
export interface RetailerSummary {
  total: number;
  active: number;
  districts: number;
  stock: number;
  transit: number;
  activations: number;
  attention: number;
  low_stock: number;
}
export interface DistributorOption {
  id: string;
  name: string;
  reference_code: string;
  city: string;
  state_name: string | null;
  district_name: string | null;
  status: string;
  territories: {
    state_code: string;
    district_code: string;
    district_name: string;
  }[];
}
export interface RetailerInput {
  name: string;
  legal_name: string;
  parent_distributor_id: string;
  state_code: string;
  district_code: string;
  city: string;
  postal_code: string;
  address_line_1: string;
  address_line_2: string;
  landmark: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  notes: string;
  stock_threshold: number;
  territory_override: boolean;
  reason: string;
}
export type HistorySection =
  "inventory" | "transfers" | "activations" | "reconciliations" | "activity";
export interface RetailerHistoryRow {
  id: string;
  created_at: string;
  reference_code?: string;
  visible_code?: string;
  status?: string;
  quantity?: number;
  source_name?: string;
  source_partner_id?: string;
  destination_partner_id?: string;
  batch_reference?: string;
  expected_quantity?: number;
  counted_quantity?: number;
  variance?: number;
  updated_at?: string;
  action?: string;
  reason?: string;
  actor_name?: string;
}
export interface RetailerDetail {
  retailer: RetailerRow & Omit<RetailerInput, "territory_override" | "reason">;
  inventory: { status: string; quantity: number }[];
  parent: DistributorOption | null;
  territory_match: boolean;
  contacts_allowed: boolean;
}
