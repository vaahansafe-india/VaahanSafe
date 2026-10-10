import type { VaahanIconName } from "@vaahansafe/icons";

export const SEARCH_SCOPES = [
  "all",
  "qr",
  "vehicle",
  "customer",
  "order",
  "batch",
  "partner",
  "transfer",
  "shipment",
  "support",
] as const;

export type SearchScope = (typeof SEARCH_SCOPES)[number];

export interface BaseSearchResult {
  id: string;
  reference: string;
  title: string;
  subtitle?: string;
  status: string;
  statusSeverity?: "default" | "success" | "warning" | "error" | "info";
  updatedAt?: string;
  createdAt: string;
  href: string;
  entityType: SearchScope;
}

export interface QrSearchResult extends BaseSearchResult {
  entityType: "qr";
  publicId: string;
  visibleCode: string;
  batchId: string | null;
  batchReference: string | null;
  lifecycleState: string;
  activatedAt: string | null;
  assignedVehicle: string | null; // Masked
  assignedVehicleId?: string | null;
  ownerCustomer: string | null; // Masked
  ownerCustomerId?: string | null;
  custody: string | null;
  scanCount: number;
  lastScanAt: string | null;
}

export interface VehicleSearchResult extends BaseSearchResult {
  entityType: "vehicle";
  registrationNumberNormalized: string;
  registrationNumberDisplay: string;
  vehicleType: string;
  make: string;
  model: string;
  ownerCustomerId: string | null;
  ownerCustomerName: string | null; // Masked
  assignedQrId: string | null;
  assignedQrCode: string | null;
}

export interface CustomerSearchResult extends BaseSearchResult {
  entityType: "customer";
  fullName: string; // Masked
  primaryPhone: string; // Masked
  primaryEmail: string; // Masked
  vehicleCount: number;
  orderCount: number;
}

export interface OrderSearchResult extends BaseSearchResult {
  entityType: "order";
  orderNumber: string;
  paymentState: string;
  totalMinor: number;
  currency: string;
  paidAt: string | null;
  customerName: string | null; // Masked
  customerId: string | null;
  vehicleId: string | null;
  assignedQrId: string | null;
  assignedQrCode: string | null;
  fulfillmentStatus: string | null;
}

export interface BatchSearchResult extends BaseSearchResult {
  entityType: "batch";
  referenceCode: string;
  inventoryChannel: string;
  quantity: number;
  manufacturerName: string | null;
  printedAt: string | null;
}

export interface TransferSearchResult extends BaseSearchResult {
  entityType: "transfer";
  referenceCode: string;
  quantity: number;
  sourcePartnerId: string | null;
  sourceName: string | null;
  destinationPartnerId: string | null;
  destinationName: string | null;
}

export interface PartnerSearchResult extends BaseSearchResult {
  entityType: "partner";
  referenceCode: string;
  kind: "DISTRIBUTOR" | "RETAILER";
  name: string;
  city: string;
  state: string | null;
  stockCount: number | null;
}

export interface ShipmentSearchResult extends BaseSearchResult {
  entityType: "shipment";
  trackingReference: string;
  courierCode: string;
  orderId: string;
  orderNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export interface SupportSearchResult extends BaseSearchResult {
  entityType: "support";
  referenceCode: string;
  subject: string;
  priority: string;
  customerId: string | null;
  customerName: string | null; // Masked
}

export type GlobalSearchResult =
  | QrSearchResult
  | VehicleSearchResult
  | CustomerSearchResult
  | OrderSearchResult
  | BatchSearchResult
  | TransferSearchResult
  | PartnerSearchResult
  | ShipmentSearchResult
  | SupportSearchResult;

export interface OperationalLensData {
  identity: {
    label: string;
    reference: string;
    type: string;
    createdAt: string;
    subLabel?: string;
  };
  state: {
    lifecycle: string;
    status: string;
    custody: string;
    alert?: string;
  };
  relationships: {
    vehicle?: { id: string; reference: string; label: string };
    customer?: { id: string; reference: string; label: string };
    batch?: { id: string; reference: string; label: string };
    order?: { id: string; reference: string; label: string };
    support?: { count: number; openCount: number };
    scans?: { total: number; lastScanAt?: string };
    transfer?: { id: string; reference: string; label: string };
  };
  activity: {
    lastActivityLabel: string;
    lastActivityTimestamp: string;
    totalEvents: number;
  };
}

export interface ReferenceSpineNode {
  id: string;
  label: string;
  type: SearchScope;
  reference: string;
  status?: string;
  meta?: string;
  active?: boolean;
  children?: ReferenceSpineNode[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: VaahanIconName;
  badge?: string;
  severity?: "default" | "success" | "warning" | "error";
}

export interface ExactMatchData {
  primaryResult: GlobalSearchResult;
  lens: OperationalLensData;
  spine: ReferenceSpineNode;
  timeline: TimelineEvent[];
}

export interface QueryClassification {
  rawQuery: string;
  normalizedQuery: string;
  likelyScope: SearchScope | "phone";
  isSensitivePhone: boolean;
  isExactCandidate: boolean;
  hintBadge: string | null;
}

export interface SearchResponseData {
  results: GlobalSearchResult[];
  groupedResults: Partial<Record<SearchScope, GlobalSearchResult[]>>;
  exactMatch: ExactMatchData | null;
  latencyMs: number;
  totalCount: number;
  classification: QueryClassification;
}

export interface InvestigationBreadcrumb {
  entityType: SearchScope;
  id: string;
  reference: string;
  title: string;
}

export interface EntityPreviewData {
  entityType: SearchScope;
  id: string;
  reference: string;
  title: string;
  status: string;
  statusSeverity?: "default" | "success" | "warning" | "error" | "info";
  createdAt: string;
  updatedAt?: string;
  href: string;
  sections: {
    heading: string;
    fields: { label: string; value: string | number | null | undefined; isCode?: boolean }[];
  }[];
  relatedEntities: {
    label: string;
    entityType: SearchScope;
    id: string;
    reference: string;
    title: string;
    meta?: string;
  }[];
  activity?: TimelineEvent[];
}
