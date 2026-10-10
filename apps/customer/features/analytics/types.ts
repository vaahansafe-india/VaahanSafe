export const sections = [
  "context",
  "vehicles",
  "scans",
  "documents",
  "security",
  "network",
  "activity",
  "storage-history",
  "storage-details",
  "storage-access",
  "scan-summary",
  "scan-flow",
  "scan-timeline",
  "scan-geography",
  "scan-heatmap",
  "scan-rhythm",
  "scan-top",
  "scan-calendar",
  "scan-recent",
] as const;
export type Section = (typeof sections)[number];
export type Lens =
  "overview" | "vehicles" | "scans" | "documents" | "security" | "network";
export interface Filters {
  from: string;
  to: string;
  vehicle: string;
  qr: string;
  outcome: string;
  category: string;
  event: string;
  device: string;
  region: string;
  grouping: "auto" | "hour" | "day" | "week" | "month";
  compare: boolean;
  file: string;
  validity: string;
  protection: string;
  documentActivity: string;
  state: string;
  city: string;
  weekday: string;
  hour: string;
}
export interface Range {
  from: string;
  to: string;
  timezone: "Asia/Kolkata";
  granularity: string;
}
export interface Series {
  timestamp: string;
  value: number;
  successful?: number;
  previous?: number;
}
export interface VehicleUsage {
  id: string;
  label: string;
  name: string;
  qr: string | null;
  scans: number;
  documents: number;
  bytes: number;
  expiring: number;
  lastScan: string | null;
  activatedAt: string | null;
}
export interface Activity {
  id: string;
  type: string;
  timestamp: string;
  title: string;
  vehicle: string | null;
  reference: string;
  href: string;
}
export interface AnalyticsData {
  "scan-summary": {
    total: number;
    identities: number;
    previousIdentities: number;
    successful: number;
    partial: number;
    unsuccessful: number;
    previousTotal: number;
    previousSuccessful: number;
    previousPartial: number;
    previousUnsuccessful: number;
    series: ScanBucket[];
  };
  "scan-flow": { total: number; rows: ScanFlowRow[] };
  "scan-timeline": { series: ScanBucket[] };
  "scan-geography": {
    total: number;
    located: number;
    states: Array<{
      code: string;
      label: string;
      count: number;
      successful: number;
      topCity: string | null;
    }>;
    cities: Array<{ state: string; label: string; count: number }>;
  };
  "scan-heatmap": {
    cells: Array<{
      day: number;
      hour: number;
      count: number;
      successful: number;
    }>;
  };
  "scan-rhythm": { hours: Array<{ hour: number; count: number }> };
  "scan-top": {
    total: number;
    qrs: Array<{
      id: string;
      label: string;
      vehicle: string;
      vehicleLabel: string;
      count: number;
      successful: number;
    }>;
  };
  "scan-calendar": {
    days: Array<{ date: string; count: number; successful: number }>;
  };
  "scan-recent": { events: ScanRecord[]; cursor: string | null };
  "scan-export": { events: ScanRecord[] };
  context: {
    vehicles: Array<{ id: string; label: string }>;
    qrs: Array<{ id: string; label: string; vehicle: string }>;
  };
  vehicles: {
    vehicles: VehicleUsage[];
    ribbon: Array<{
      vehicle: string;
      timestamp: string;
      scans: number;
      documents: number;
      activations: number;
    }>;
    subscriptions: Array<{
      vehicle: string | null;
      name: string;
      status: string;
      tier: string;
    }>;
  };
  scans: {
    total: number;
    previousTotal: number | null;
    successful: number;
    series: Series[];
    rhythm: Array<{ day: number; hour: number; count: number }>;
    regions: Array<{ label: string; count: number }>;
    outcomes: Array<{ label: string; count: number }>;
  };
  documents: {
    total: number;
    bytes: number;
    quotaBytes: number;
    reservedBytes: number;
    composition: Array<{ label: string; bytes: number; count: number }>;
    byVehicle: Array<{
      id: string | null;
      label: string;
      name: string;
      documents: number;
      bytes: number;
    }>;
    expiry: Array<{ id: string; title: string; date: string }>;
    activity: Array<{ label: string; count: number }>;
    series: Series[];
    rhythm: Array<{ day: number; hour: number; count: number }>;
    statuses: Array<{ label: string; count: number }>;
    allocation: Array<{
      vehicle: string | null;
      category: string;
      bytes: number;
      documents: number;
    }>;
    versions: {
      currentBytes: number;
      previousBytes: number;
      previousCount: number;
    };
    expirySummary: {
      week: number;
      month: number;
      quarter: number;
      expired: number;
    };
  };
  "storage-history": {
    startedAt: string | null;
    growth: Array<{
      timestamp: string;
      values: Record<string, number> | null;
      asOf: string | null;
    }>;
  };
  "storage-details": {
    distribution: Array<{ label: string; count: number; bytes: number }>;
    median: number;
    p90: number;
    largestBytes: number;
    largest: StorageDocument[];
    atlas: StorageDocument[];
  };
  "storage-access": {
    series: Array<{
      timestamp: string;
      previews: number;
      downloads: number;
      shares: number;
    }>;
  };
  "storage-export": { documents: StorageDocument[] };
  security: {
    activeSessions: number;
    lastLogin: string | null;
    series: Series[];
    sessions: Array<{
      current: boolean;
      device: string;
      created: string;
      lastSeen: string;
      expires: string;
    }>;
    events: Array<{ id: string; title: string; timestamp: string }>;
  };
  network: {
    observed: number;
    activeResolutions: number;
    series: Series[];
    uploads: Array<{ label: string; count: number }>;
    notifications: Array<{ label: string; count: number }>;
  };
  activity: { events: Activity[]; cursor: string | null };
}
export interface Envelope<S extends Section> {
  scope: string;
  range: Range;
  updatedAt: string;
  data: AnalyticsData[S];
}
export interface StorageDocument {
  id: string | null;
  title: string;
  vehicle: string | null;
  vehicleLabel: string;
  category: string;
  mime: string;
  bytes: number;
  versions: number;
  documents: number;
  createdAt: string | null;
}
export interface ScanBucket {
  timestamp: string;
  successful: number;
  partial: number;
  unsuccessful: number;
}
export interface ScanFlowRow {
  vehicle: string;
  vehicleLabel: string;
  name: string;
  qr: string;
  qrLabel: string;
  outcome: string;
  count: number;
}
export interface ScanRecord {
  id: string;
  timestamp: string;
  qr: string;
  qrLabel: string;
  vehicle: string;
  vehicleLabel: string;
  vehicleName: string;
  result: string | null;
  state: string;
  city: string | null;
  device: string | null;
  referrer: string | null;
}
