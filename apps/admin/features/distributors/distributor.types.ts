export interface GeographyOption {
  code: string;
  name: string;
}
export interface DistributorFilters {
  q: string;
  status: string;
  verification: string;
  state: string;
  district: string;
  inventory: string;
  network: string;
  from: string;
  to: string;
  sort: "newest" | "oldest";
}
export interface DistributorRow {
  id: string;
  reference_code: string;
  name: string;
  city: string;
  status: "ACTIVE" | "SUSPENDED";
  verification_status: "PENDING" | "VERIFIED" | "REQUIRES_CORRECTION";
  state_code: string | null;
  state_name: string | null;
  district_code: string | null;
  district_name: string | null;
  territory_count: number;
  on_hand: number;
  in_transit: number;
  retailer_count: number;
  open_transfers: number;
  unresolved_variance: number;
  reconciliation_issues: number;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}
export interface DistributorSummary {
  total: number;
  active: number;
  states: number;
  stock: number;
  transit: number;
  attention: number;
}
export interface DistributorPage {
  rows: DistributorRow[];
  nextCursor: string | null;
}
export interface Territory {
  state_code: string;
  district_code: string;
  district_name?: string;
  state_name?: string;
}
export interface DistributorInput {
  name: string;
  legal_name: string;
  state_code: string;
  district_code: string;
  city: string;
  postal_code: string;
  address_line_1: string;
  address_line_2: string;
  landmark: string;
  contact_name: string;
  contact_role: string;
  contact_phone: string;
  contact_email: string;
  notes: string;
  territories: Territory[];
  reason: string;
}
export interface DistributorDetail {
  distributor: DistributorRow &
    Omit<DistributorInput, "territories" | "reason">;
  territories: Territory[];
  inventory: { status: string; quantity: number }[];
  transfers: {
    id: string;
    reference_code: string;
    quantity: number;
    status: string;
    created_at: string;
    source_name: string | null;
    destination_name: string;
    destination_partner_id: string;
  }[];
  retailers: {
    id: string;
    reference_code: string;
    name: string;
    city: string;
    status: string;
    stock: number;
    created_at: string;
  }[];
  reconciliations: {
    id: string;
    expected_quantity: number;
    counted_quantity: number;
    variance: number;
    status: string;
    updated_at: string;
    created_at: string;
  }[];
  activity: {
    id: string;
    action: string;
    reason: string;
    created_at: string;
    actor_name: string;
  }[];
  nextSections: string[];
}
