/**
 * @vaahansafe/customer
 * Authoritative Type Definitions for the Scan Intelligence Center (/scan-history)
 *
 * Strict single source of truth contracts matching Cloudflare D1 schemas.
 * Zero mock models, zero simulated surveillance data.
 */

export type ScanPeriodFilter = "24H" | "7D" | "30D" | "90D" | "ALL";

export interface ScanHistoryFilterState {
  period: ScanPeriodFilter;
  vehicleId: string; // "all" or specific vehicle id
  qrPublicId: string; // "all" or specific public id (e.g. "VS-••••-XXXX")
  eventType: "all" | "PUBLIC_RESOLVE" | "EMERGENCY_TRIGGER" | "ADMIN_INSPECT";
  deviceCategory: "all" | "Mobile" | "Desktop" | "Tablet" | "Undisclosed";
  search: string;
}

export interface ScanSignalRailData {
  totalScans: number;
  lastScan: {
    occurredAt: string;
    formatted: string;
    relativeTime: string;
  } | null;
  activeQrCount: number;
  periodLabel: string;
  periodScansCount: number;
}

export interface ScanRhythmPoint {
  timestamp: string; // ISO datetime
  label: string; // "14:00" for 24H, "19 Sep" for 30D
  fullDate: string; // Localized date string
  scanCount: number;
  emergencyCount: number;
  uniqueQrCount: number;
  mostRecentTime?: string;
}

export interface TemporalScanHour {
  hour: number; // 0 to 23
  hourLabel: string; // "00", "04", "08", "12", "16", "20", "23"
  scanCount: number;
  percentage: number;
}

export interface QrDistributionItem {
  qrId: string;
  publicId: string; // Masked public identity "VS-••••-9021"
  rawPublicId: string;
  vehiclePlate: string;
  vehicleName: string;
  vehicleType: string;
  scanCount: number;
  percentage: number;
  status: string;
}

export interface AccessContextDistribution {
  mobileCount: number;
  desktopCount: number;
  tabletCount: number;
  undisclosedCount: number;
}

export type ScanJourneyMilestoneKey =
  | "QR_ENCOUNTERED"
  | "IDENTITY_RESOLVED"
  | "PUBLIC_VIEW_SERVED"
  | "SUPPORTED_ACTION";

export interface ScanJourneyMilestone {
  key: ScanJourneyMilestoneKey;
  title: string;
  description: string;
  occurredAt?: string;
  isCompleted: boolean;
  statusText?: string;
  badgeVariant?: "success" | "warning" | "destructive" | "outline" | "secondary";
}

export interface ScanEventItem {
  id: string; // Safe scan event identifier
  qrId: string;
  publicQrIdentity: string; // e.g. "VS-••••-9021"
  rawPublicId: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleDisplay: string;
  vehicleType: string;
  occurredAt: string; // ISO string
  occurredAtFormatted: string; // e.g. "21:42"
  occurredDateFormatted: string; // e.g. "19 Sep 2026"
  dateGroupKey: string; // "TODAY" | "YESTERDAY" | "19 Sep 2026"
  scanType: "PUBLIC_RESOLVE" | "EMERGENCY_TRIGGER" | "ADMIN_INSPECT";
  scanTypeLabel: string;
  result:
    | "RESOLVED_ACTIVE"
    | "RESOLVED_INACTIVE"
    | "RESOLVED_REPLACED"
    | "RESOLVED_BLOCKED"
    | "NOT_FOUND";
  resultLabel: string;
  resultBadgeVariant: "success" | "warning" | "destructive" | "outline";
  approximateRegion: string | null; // Clearly labeled approximate region (e.g. "Pune, Maharashtra")
  deviceCategory: "Mobile" | "Desktop" | "Tablet" | "Undisclosed";
  referrerClass: string | null;
  journey: ScanJourneyMilestone[];
}

export interface AuthorizedVehicleScope {
  id: string;
  plate: string;
  maskedPlate: string;
  make: string;
  model: string;
  vehicleType: string;
  qrId?: string;
  qrPublicId?: string;
}

export interface AuthorizedQrScope {
  qrId: string;
  publicId: string;
  maskedPublicId: string;
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleDisplay?: string;
}

export interface ScanHistoryOverview {
  userHasQr: boolean;
  authorizedVehicles: AuthorizedVehicleScope[];
  authorizedQrs: AuthorizedQrScope[];
  signals: ScanSignalRailData;
  rhythmSeries: ScanRhythmPoint[];
  temporalField: TemporalScanHour[];
  qrDistribution: QrDistributionItem[];
  accessContext: AccessContextDistribution;
  events: ScanEventItem[];
  appliedFilters: ScanHistoryFilterState;
  totalFilteredCount: number;
}
