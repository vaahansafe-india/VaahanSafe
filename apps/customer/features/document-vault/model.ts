export const CATEGORIES = {
  DRIVING_LICENCE: "Driving Licence",
  REGISTRATION_CERTIFICATE: "Registration Certificate",
  INSURANCE: "Insurance",
  PUC: "Pollution Under Control",
  FITNESS_CERTIFICATE: "Fitness Certificate",
  PERMIT: "Permit",
  ROAD_TAX: "Road Tax",
  PURCHASE_INVOICE: "Purchase Invoice",
  SERVICE_RECORD: "Service Record",
  WARRANTY: "Warranty",
  LOAN_HYPOTHECATION: "Loan / Hypothecation",
  CLAIM: "Accident / Claim",
  ROADSIDE_ASSISTANCE: "Roadside Assistance",
  FASTAG: "FASTag",
  OTHER: "Other document",
} as const;
export type Category = keyof typeof CATEGORIES;
export type SecurityMode = "ACCOUNT" | "VAULT_PIN" | "DOCUMENT_PASSWORD";
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export interface VaultDocument {
  id: string;
  title: string;
  category: Category;
  vehicle_id: string | null;
  vehicle_label: string | null;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  issued_at: string | null;
  valid_from: string | null;
  expires_at: string | null;
  issuer_name: string | null;
  document_number_masked: string | null;
  metadata: Record<string, string>;
  security_mode: SecurityMode;
  created_at: string;
  updated_at: string;
  version_number: number;
  thumbnail_token?: string;
}
export interface VaultPage {
  documents: VaultDocument[];
  cursor: string | null;
  vehicles: Array<{ id: string; label: string }>;
  summary: {
    count: number;
    expiring: number;
    categories: Partial<Record<Category, number>>;
  };
  usage: { bytes: number; maxBytes: number; maxDocuments: number };
  vault: {
    enabled: boolean;
    locked: boolean;
    autoLockMinutes: number;
    unlockExpiresAt: string | null;
  };
  workerUrl: string;
}
export interface DocumentDetail {
  document: VaultDocument;
  versions: Array<{
    id: string;
    version_number: number;
    original_filename: string;
    file_size_bytes: number;
    created_at: string;
  }>;
  shares: Array<{
    id: string;
    expires_at: string;
    allow_download: boolean;
    view_count: number;
    max_views: number | null;
    revoked_at: string | null;
  }>;
  events: Array<{ id: string; event_type: string; created_at: string }>;
}
export function validity(expires: string | null, now = new Date()) {
  if (!expires) return { key: "NO_EXPIRY", label: "No expiry date" };
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const days = Math.round(
    (Date.parse(expires + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) /
      86400000,
  );
  if (days < 0) return { key: "EXPIRED", label: "Expired" };
  if (days <= 30)
    return {
      key: "EXPIRING_SOON",
      label: days === 0 ? "Expires today" : `Expires in ${days} days`,
    };
  return {
    key: "VALID",
    label: `Valid until ${new Date(expires + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`,
  };
}
export function sizeLabel(bytes: number) {
  return bytes < 1048576
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1048576).toFixed(1)} MB`;
}
export function detectMime(
  bytes: Uint8Array,
): (typeof MIME_TYPES)[number] | null {
  if (bytes.length < 12) return null;
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  )
    return "application/pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
    return "image/png";
  if (
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}
export function safeFilename(name: string) {
  return name.replace(/[\x00-\x1f\x7f/\\]/g, "_").slice(0, 160) || "document";
}
