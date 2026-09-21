/**
 * VaahanSafe Settings Domain Types and Contracts
 * Authoritative data models for the Account & Control Center
 */

export type SettingsCategory =
  | "profile"
  | "account"
  | "notifications"
  | "appearance"
  | "privacy"
  | "vehicles"
  | "security"
  | "sessions"
  | "data";

export interface SettingsUserSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
  memberSince: string;
  safeAccountId: string;
  timezone: string;
}

export interface SettingsIdentities {
  google: {
    connected: boolean;
    email?: string;
    connectedAt?: string;
  };
  mobile: {
    verified: boolean;
    phone: string;
    maskedPhone: string;
  };
}

export interface SessionItem {
  id: string;
  isCurrent: boolean;
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet" | "device";
  lastSeenAt: string;
  createdAt: string;
  ipAddressMasked: string;
  rawUserAgent?: string;
}

export type NotificationMatrixCategory =
  | "SAFETY"
  | "FULFILMENT"
  | "COMMERCE"
  | "SECURITY";

export type NotificationDeliveryChannel = "IN_APP" | "WHATSAPP" | "EMAIL";

export interface NotificationCategoryConfig {
  key: NotificationMatrixCategory;
  label: string;
  description: string;
  channels: Record<NotificationDeliveryChannel, {
    enabled: boolean;
    disabledReason?: "REQUIRED_SECURITY" | "UNSUPPORTED";
  }>;
}

export interface PrivacyVehicleProfile {
  vehicleId: string;
  registrationNumber: string;
  make: string;
  model: string;
  displayName: string | null;
  bloodGroup: string | null;
  medicalNotes: string | null;
  showOwnerName: boolean;
  showBloodGroup: boolean;
  showMedicalNotes: boolean;
  showVehicleDetails: boolean;
  publicId: string | null;
  previewUrl: string | null;
}

export interface VehicleOption {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year?: number | null;
  isDefault: boolean;
}

export interface SecurityActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  channel?: string;
}

export interface SettingsData {
  user: SettingsUserSummary;
  identities: SettingsIdentities;
  sessions: {
    current: SessionItem;
    otherSessions: SessionItem[];
  };
  notifications: NotificationCategoryConfig[];
  privacy: PrivacyVehicleProfile | null;
  vehicles: VehicleOption[];
  recentActivity: SecurityActivityItem[];
}
