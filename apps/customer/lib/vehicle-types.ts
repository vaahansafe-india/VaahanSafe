/**
 * @vaahansafe/customer
 * Vehicle Identity Registry & Dossier Typed Domain Read Models
 *
 * Enforces real Cloudflare D1 data structures with zero dummy data or mock fallbacks.
 */

export type VehicleCategory =
  | "CAR"
  | "MOTORCYCLE"
  | "SCOOTER"
  | "AUTO"
  | "COMMERCIAL"
  | "OTHER";

export type QrStatus =
  | "ACTIVE"
  | "ACTIVATED"
  | "UNLINKED"
  | "PRINTED"
  | "BLOCKED"
  | "LOST_DAMAGED"
  | "REPLACED";

export type SafetyViewStatus = "CONFIGURED" | "NEEDS_SETUP";

export type ReadinessNodeState = "ready" | "attention" | "not_configured";

export interface VehicleAttentionItem {
  id: string;
  severity: "AMBER" | "RED" | "INFO";
  title: string;
  description: string;
  actionLabel: string;
  actionTarget: "qr" | "safety" | "contact" | "vehicle";
}

export interface VehicleRegistryItem {
  id: string;
  registrationNumber: string;
  registrationNumberNormalized: string;
  registrationNumberMasked: string;
  make: string;
  model: string;
  variant?: string;
  year?: number;
  color?: string;
  type: VehicleCategory;
  status: string;
  createdAt: string;
  identityId: string;
  qr: {
    hasQr: boolean;
    publicId?: string;
    status: QrStatus;
    assignedAt?: string;
    replacementPending?: boolean;
    replacementStatus?: string;
    replacementReason?: string;
  };
  safety: {
    isConfigured: boolean;
    status: SafetyViewStatus;
    showOwnerName: boolean;
    showBloodGroup: boolean;
    showMedicalNotes: boolean;
    showVehicleDetails: boolean;
    bloodGroup?: string | null;
    medicalNotes?: string | null;
  };
  contacts: {
    count: number;
    primaryName?: string;
    primaryRelationship?: string;
  };
  readiness: {
    isReady: boolean;
    vehicleNode: ReadinessNodeState;
    identityNode: ReadinessNodeState;
    qrNode: ReadinessNodeState;
    safetyNode: ReadinessNodeState;
    contactNode: ReadinessNodeState;
  };
  attention: VehicleAttentionItem[];
}

export interface VehicleEmergencyContactDetail {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  phoneMasked: string;
  priority: number;
  isEnabled: boolean;
  allowCall: boolean;
  allowMessage: boolean;
}

export interface VehicleScanEventItem {
  id: string;
  scanType: string;
  result: string;
  city?: string | null;
  state?: string | null;
  createdAt: string;
}

export interface VehicleHistoryMilestone {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "VEHICLE_CREATED" | "QR_LINKED" | "SAFETY_CONFIGURED" | "CONTACT_ADDED" | "SYSTEM";
}

export interface VehicleDossierData extends VehicleRegistryItem {
  emergencyProfileId?: string;
  emergencyContacts: VehicleEmergencyContactDetail[];
  recentScans: VehicleScanEventItem[];
  lifecycleHistory: VehicleHistoryMilestone[];
}

export interface VehicleFilterState {
  query?: string;
  types?: VehicleCategory[];
  qrStatus?: "ACTIVE" | "UNLINKED" | "ALL";
  safetyStatus?: "CONFIGURED" | "NEEDS_SETUP" | "ALL";
  viewMode: "REGISTRY" | "COMPACT";
  sort: "RECENT" | "NAME" | "ATTENTION";
}
