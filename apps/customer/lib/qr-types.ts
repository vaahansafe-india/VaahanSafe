/**
 * @vaahansafe/customer
 * Authoritative Type Definitions for the My QR Experience & QR Identity Center
 *
 * Strict single source of truth contracts matching Cloudflare D1 schemas.
 * Zero mock models.
 */

import type { QrLifecycleState } from "@vaahansafe/types";

export type QrReadinessNodeState = "active" | "attention" | "not_configured";

export interface QrSignalRailStates {
  vehicleNode: QrReadinessNodeState;
  identityNode: QrReadinessNodeState;
  qrNode: QrReadinessNodeState;
  contactNode: QrReadinessNodeState;
  safetyNode: QrReadinessNodeState;
}

export interface QrVehicleSummary {
  id: string;
  plate: string;
  maskedPlate: string;
  make: string;
  model: string;
  type: string;
  identityId: string;
  qrStatus: QrLifecycleState | "NO_QR";
  qrPublicId?: string;
  hasEmergencyContacts: boolean;
  isSafetyViewConfigured: boolean;
}

export interface QrStickerDetail {
  id: string;
  publicId: string;
  visibleCode: string;
  status: QrLifecycleState;
  batchId?: string;
  activatedAt?: string;
  assignedAt?: string;
  resolverUrl: string;
  linkedVehicle?: {
    id: string;
    plate: string;
    maskedPlate: string;
    make: string;
    model: string;
    type: string;
    identityId: string;
  };
  safetyViewConfigured: boolean;
  emergencyContactsCount: number;
  replacementInfo?: {
    requestId: string;
    status: string;
    reason: string;
    newQrPublicId?: string;
  };
}

export interface QrAttentionItem {
  id: string;
  title: string;
  description: string;
  severity: "YELLOW" | "RED";
  actionLabel: string;
  actionHref: string;
}

export interface QrOverviewData {
  primaryVehicle?: QrVehicleSummary;
  primarySticker?: QrStickerDetail;
  railStates: QrSignalRailStates;
  vehicles: QrVehicleSummary[];
  stickersCount: number;
  activeStickersCount: number;
  attentionItems: QrAttentionItem[];
  recommendedAction: "BUY" | "ACTIVATE" | "MANAGE" | "DIGITAL";
}

export interface QrRegistryItemData {
  id: string;
  publicId: string;
  visibleCode: string;
  status: QrLifecycleState;
  activatedAt?: string;
  assignedAt?: string;
  resolverUrl: string;
  vehicle?: {
    id: string;
    plate: string;
    maskedPlate: string;
    make: string;
    model: string;
    type: string;
  };
  emergencyContactsCount: number;
  safetyViewConfigured: boolean;
  replacementPending: boolean;
}

export interface QrFilterState {
  search?: string;
  status?: "ALL" | "ACTIVATED" | "UNLINKED" | "REPLACED";
  vehicleType?: string;
}

export interface BuyQrPlan {
  id: string;
  title: string;
  priceInr: number;
  period: string;
  description: string;
  features: string[];
  isPopular: boolean;
}

export interface BuyQrVehicle {
  id: string;
  plate: string;
  maskedPlate: string;
  make: string;
  model: string;
  type: string;
  hasActiveQr: boolean;
}

export interface BuyQrPageData {
  plans: BuyQrPlan[];
  eligibleVehicles: BuyQrVehicle[];
}

export interface QrBuyOffering {
  productCode: string;
  name: string;
  description: string;
  priceMinor: number;
  priceFormatted: string;
  currency: string;
  inclusions: string[];
  requiresShipping: boolean;
  eligibleVehicles: Array<{
    id: string;
    plate: string;
    maskedPlate: string;
    make: string;
    model: string;
    type: string;
    hasActiveQr: boolean;
  }>;
}

export interface QrActivationData {
  eligibleVehicles: Array<{
    id: string;
    plate: string;
    maskedPlate: string;
    make: string;
    model: string;
    type: string;
    hasActiveQr: boolean;
  }>;
}

export interface QrDigitalPassData {
  publicId: string;
  visibleCode: string;
  resolverUrl: string;
  vehicle: {
    id: string;
    plate: string;
    maskedPlate: string;
    make: string;
    model: string;
    type: string;
    identityId: string;
  };
  safetySummary: {
    ownerDisplayName?: string;
    bloodGroup?: string;
    medicalNotes?: string;
    emergencyContactsCount: number;
    allowDirectCall: boolean;
  };
}

export interface QrReplacementData {
  eligibleStickers: Array<{
    id: string;
    publicId: string;
    visibleCode: string;
    status: QrLifecycleState;
    vehiclePlate: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleType: string;
    hasActiveRequest?: boolean;
    activeRequestStatus?: string;
  }>;
  activeRequests: Array<{
    id: string;
    oldQrPublicId: string;
    vehiclePlate: string;
    reason: string;
    status: string;
    requestedAt: string;
  }>;
}
