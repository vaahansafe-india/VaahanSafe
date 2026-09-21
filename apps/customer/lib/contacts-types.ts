/**
 * @vaahansafe/customer
 * Authoritative Type Definitions for the Safety Contact Network (/emergency-contacts)
 *
 * Strict single source of truth contracts matching Cloudflare D1 schemas.
 * Zero mock models, zero synthetic contacts.
 */

export type ContactRoleType =
  | "PARENT"
  | "SPOUSE_PARTNER"
  | "SIBLING"
  | "CHILD"
  | "GUARDIAN"
  | "FRIEND"
  | "RELATIVE"
  | "COLLEAGUE"
  | "DOCTOR_MEDICAL"
  | "OTHER";

export interface ContactRoleDefinition {
  type: ContactRoleType;
  label: string;
  description: string;
  iconName: "user" | "users" | "shield" | "id-card" | "activity";
}

export interface AssociatedVehicleRef {
  vehicleId: string;
  plate: string;
  maskedPlate: string;
  makeModel: string;
  qrPublicId?: string;
  priority: number; // 1 = Primary, 2 = Secondary, 3+ = Additional
  isEnabled: boolean; // Public view visibility
  contactId: string; // Database ID in emergency_contacts for this vehicle
}

export interface SafetyContactItem {
  id: string; // Primary ID representing this contact
  name: string;
  relationshipLabel: string; // Original owner-entered label (e.g. "Father", "Spouse", "Doctor")
  role: ContactRoleType; // Normalized role for consistent icon mapping
  phone: string; // Full E.164 phone number for owner
  maskedPhone: string; // Masked representation "+91 ••••• ••321"
  priority: number; // Minimum priority across vehicles (1..5)
  isPrimary: boolean; // priority === 1 on any vehicle
  isPubliclyAvailable: boolean; // is_enabled === 1 on any vehicle
  allowCall: boolean;
  allowMessage: boolean;
  associatedVehicles: AssociatedVehicleRef[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactSignalRailData {
  totalContacts: number;
  publiclyAvailable: number;
  primaryContactName: string | null;
  vehiclesCovered: number;
  totalVehicles: number;
  lastUpdatedAt: string | null;
}

export interface ContactsFilterState {
  search: string;
  role: "all" | ContactRoleType;
  vehicleId: string; // "all" or specific vehicle ID
  visibility: "all" | "public" | "private";
}

export interface VehicleOption {
  id: string;
  plate: string;
  maskedPlate: string;
  makeModel: string;
  vehicleType: string;
  qrPublicId?: string;
}

export interface PublicPreviewContact {
  name: string;
  relationship: string;
  isPriority: boolean;
  role: ContactRoleType;
}

export interface PublicSafetyPreviewData {
  vehiclePlate: string;
  vehicleDisplay: string;
  vehicleType: string;
  contacts: PublicPreviewContact[];
  bloodGroup?: string;
  medicalNotes?: string;
}

export interface SafetyContactNetworkData {
  contacts: SafetyContactItem[];
  primaryContact: SafetyContactItem | null;
  signals: ContactSignalRailData;
  vehicles: VehicleOption[];
  appliedFilters: ContactsFilterState;
}

export interface AddContactInput {
  name: string;
  relationshipLabel: string;
  role: ContactRoleType;
  phone: string;
  vehicleIds: string[];
  isPrimary?: boolean;
  isPubliclyAvailable?: boolean;
}

export interface UpdateContactInput {
  contactId: string;
  name: string;
  relationshipLabel: string;
  role: ContactRoleType;
  phone: string;
  vehicleIds: string[];
  isPrimary?: boolean;
  isPubliclyAvailable?: boolean;
}
