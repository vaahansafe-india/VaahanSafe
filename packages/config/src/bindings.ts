/**
 * VaahanSafe Surface-to-Resource Least-Privilege Binding Matrix
 *
 * Enforces least-privilege resource allocation across the 8 Worker surfaces.
 * INVARIANT 07: Every Worker receives ONLY the bindings it strictly needs.
 * INVARIANT 08: QR does NOT receive payment or messaging secrets.
 * INVARIANT 16: Status can report outages without depending on main DB or customer session.
 */

import { SurfaceId } from "./surfaces";
import { LogicalBindingName } from "./cloudflare-env";

export interface SurfaceResourcePermissions {
  d1: boolean;
  publicStorage: boolean;
  privateStorage: boolean;
  exportStorage: boolean;
  notificationQueue: boolean;
  analyticsQueue: boolean;
  commerceQueue: boolean;
  allowedSecrets: readonly string[];
  rationale: string;
}

export const SURFACE_BINDINGS_MATRIX: Record<SurfaceId, SurfaceResourcePermissions> = {
  web: {
    d1: false,
    publicStorage: true,
    privateStorage: false,
    exportStorage: false,
    notificationQueue: false,
    analyticsQueue: false,
    commerceQueue: false,
    allowedSecrets: [],
    rationale: "Public product marketing. Read-only static delivery with optional public brand assets.",
  },
  customer: {
    d1: true,
    publicStorage: true,
    privateStorage: true,
    exportStorage: false,
    notificationQueue: false,
    analyticsQueue: false,
    commerceQueue: true,
    allowedSecrets: ["SESSION_SECRET", "GOOGLE_CLIENT_SECRET"],
    rationale: "Customer portal. Manages vehicles and orders; initiates commerce jobs asynchronously.",
  },
  activate: {
    d1: true,
    publicStorage: false,
    privateStorage: false,
    exportStorage: false,
    notificationQueue: true,
    analyticsQueue: false,
    commerceQueue: false,
    allowedSecrets: ["TURNSTILE_SECRET_KEY", "SESSION_SECRET"],
    rationale: "Retail QR activation. Verifies scratch code, associates vehicle, queues confirmation alert.",
  },
  qr: {
    d1: true,
    publicStorage: false,
    privateStorage: false,
    exportStorage: false,
    notificationQueue: false,
    analyticsQueue: true,
    commerceQueue: false,
    allowedSecrets: [],
    rationale: "Safety-critical resolver. Authoritatively resolves emergency profiles and queues scan telemetry.",
  },
  admin: {
    d1: true,
    publicStorage: true,
    privateStorage: true,
    exportStorage: true,
    notificationQueue: true,
    analyticsQueue: true,
    commerceQueue: true,
    allowedSecrets: [
      "SESSION_SECRET",
      "GOOGLE_CLIENT_SECRET",
      "TURNSTILE_SECRET_KEY",
    ],
    rationale: "Operations console. Full administrative inventory, batch export, and customer management.",
  },
  api: {
    d1: true,
    publicStorage: true,
    privateStorage: true,
    exportStorage: true,
    notificationQueue: true,
    analyticsQueue: true,
    commerceQueue: true,
    allowedSecrets: [
      "SESSION_SECRET",
      "CASHFREE_CLIENT_ID",
      "CASHFREE_CLIENT_SECRET",
      "CASHFREE_WEBHOOK_SECRET",
      "MSG91_AUTH_KEY",
      "EMAIL_PROVIDER_API_KEY",
      "TURNSTILE_SECRET_KEY",
    ],
    rationale: "Central API & provider webhook handlers. Interacts with payment gateways and messaging providers.",
  },
  blog: {
    d1: false,
    publicStorage: true,
    privateStorage: false,
    exportStorage: false,
    notificationQueue: false,
    analyticsQueue: false,
    commerceQueue: false,
    allowedSecrets: [],
    rationale: "Editorial safety guides. Consumes only public image assets without database access.",
  },
  status: {
    d1: false,
    publicStorage: false,
    privateStorage: false,
    exportStorage: false,
    notificationQueue: false,
    analyticsQueue: false,
    commerceQueue: false,
    allowedSecrets: [],
    rationale: "Independent reliability reporter. Completely isolated from main DB and provider dependencies.",
  },
} as const;

/**
 * Validates that a target surface has permission to consume a given Cloudflare logical binding.
 */
export function isBindingAllowedForSurface(
  surfaceId: SurfaceId,
  binding: LogicalBindingName
): boolean {
  const perms = SURFACE_BINDINGS_MATRIX[surfaceId];
  if (!perms) return false;

  switch (binding) {
    case "DB":
      return perms.d1;
    case "PUBLIC_STORAGE":
      return perms.publicStorage;
    case "PRIVATE_STORAGE":
      return perms.privateStorage;
    case "EXPORT_STORAGE":
      return perms.exportStorage;
    case "NOTIFICATION_QUEUE":
      return perms.notificationQueue;
    case "ANALYTICS_QUEUE":
      return perms.analyticsQueue;
    case "COMMERCE_QUEUE":
      return perms.commerceQueue;
  }
}

/**
 * Asserts least-privilege compliance, throwing if a surface attempts to attach an unauthorized resource.
 */
export function assertBindingAllowedForSurface(
  surfaceId: SurfaceId,
  binding: LogicalBindingName
): void {
  if (!isBindingAllowedForSurface(surfaceId, binding)) {
    throw new Error(
      `[Least-Privilege Violation] Surface "${surfaceId}" is not authorized to bind to "${binding}"! Rationale: ${SURFACE_BINDINGS_MATRIX[surfaceId]?.rationale}`
    );
  }
}
