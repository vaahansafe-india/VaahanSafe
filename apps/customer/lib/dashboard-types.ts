/**
 * Authoritative Dashboard Types for VaahanSafe Vehicle Identity Command Surface
 * Built exclusively from real Cloudflare D1 domain records.
 */

export type VehicleCategory = "CAR" | "BIKE" | "TRUCK" | "BUS" | "OTHER";

export type QrStatus =
  | "PRINTED"
  | "ALLOCATED"
  | "PAIRED"
  | "ACTIVE"
  | "ACTIVATED"
  | "SUSPENDED"
  | "REPLACED"
  | "REVOKED";

export interface DashboardVehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  type: VehicleCategory;
  status: string;
  createdAt: string;
}

export interface DashboardQrSticker {
  id: string;
  publicId: string;
  visibleCode: string;
  batchId: string;
  status: QrStatus;
  activatedAt?: string;
  assignedAt?: string;
  replacementPending?: boolean;
  replacementStatus?: string;
  replacementReason?: string;
}

export interface DashboardEmergencyProfile {
  id?: string;
  displayName?: string;
  bloodGroup?: string;
  medicalNotes?: string;
  showOwnerName: boolean;
  showBloodGroup: boolean;
  showMedicalNotes: boolean;
  showVehicleDetails: boolean;
  contacts: DashboardEmergencyContact[];
}

export interface DashboardEmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPriority: boolean;
  isEnabled: boolean;
  allowCall: boolean;
  allowMessage: boolean;
}

export interface DashboardScanPulsePoint {
  dateBucket: string;
  timestamp: string;
  count: number;
  emergencyCount: number;
  latestCity?: string;
  latestState?: string;
}

export interface DashboardScanSummary {
  totalScans: number;
  emergencyScans: number;
  peakCount: number;
  lastScanAt?: string;
  lastScanLocation?: string;
  points: DashboardScanPulsePoint[];
}

export interface DashboardQrLifelineEvent {
  id: string;
  status: string;
  title: string;
  description: string;
  timestamp: string;
  actorType: string;
  reasonCode?: string;
}

export type ConstellationLane =
  | "SCAN"
  | "QR"
  | "VEHICLE"
  | "SAFETY"
  | "ORDER"
  | "NOTIF";

export interface DashboardConstellationEvent {
  id: string;
  lane: ConstellationLane;
  title: string;
  summary: string;
  timestamp: string;
  level?: "NORMAL" | "ATTENTION" | "EMERGENCY";
  metadata?: Record<string, unknown>;
}

export interface DashboardAttentionItem {
  id: string;
  severity: "AMBER" | "RED";
  title: string;
  description: string;
  actionLabel: string;
  actionTarget: "emergency-contacts" | "qr" | "safety-view" | "subscription" | "vehicle";
}

export interface DashboardSubscriptionSummary {
  id?: string;
  planName?: string;
  status?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  expiresAt?: string;
  autoRenew: boolean;
}

export interface DashboardOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalMinor: number;
  createdAt: string;
}

export interface DashboardNotificationItem {
  id: string;
  category: string;
  priority: string;
  title: string;
  bodySafe: string;
  readAt?: string;
  createdAt: string;
}

export interface DashboardFilterState {
  range: "today" | "7d" | "30d" | "all";
  qrId?: string;
  eventType?: string;
}

export interface DashboardOverviewData {
  user: {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  vehicles: DashboardVehicle[];
  activeVehicle: DashboardVehicle | null;
  qrSticker: DashboardQrSticker | null;
  safetyProfile: DashboardEmergencyProfile;
  scanSummary: DashboardScanSummary;
  qrLifeline: DashboardQrLifelineEvent[];
  constellationEvents: DashboardConstellationEvent[];
  attentionItems: DashboardAttentionItem[];
  subscription: DashboardSubscriptionSummary | null;
  recentOrders: DashboardOrderSummary[];
  recentNotifications: DashboardNotificationItem[];
  unreadNotificationCount: number;
  filterState: DashboardFilterState;
}
