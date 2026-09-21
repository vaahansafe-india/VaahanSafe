/**
 * VaahanSafe Public Resolver State Mapping
 *
 * SECTION 32 — INTERNAL VS PUBLIC STATES:
 * Maps internal operations/inventory lifecycle states to safe public resolver states.
 *
 * CRITICAL INVARIANT:
 * Never leak internal distributor, shipment, or retailer logistics to a public scanner.
 */

import { QrLifecycleState } from "./qr-status";

export type QrPublicResolverState =
  | "ACTIVE"
  | "ACTIVATION_AVAILABLE"
  | "REPLACED"
  | "LOST_DAMAGED"
  | "BLOCKED"
  | "UNKNOWN";

export interface PublicResolverMeta {
  state: QrPublicResolverState;
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeVariant: "success" | "warning" | "destructive" | "secondary" | "outline";
  safeNextAction: {
    label: string;
    actionType: "CALL" | "NAVIGATE_ACTIVATE" | "NAVIGATE_HELP" | "RETRY";
    url?: string;
  };
}

/**
 * Maps an internal database lifecycle state to an authoritative public resolver state.
 */
export function mapInternalToPublicResolverState(
  internalState: QrLifecycleState | string | undefined | null
): QrPublicResolverState {
  if (!internalState) {
    return "UNKNOWN";
  }

  const normalized = String(internalState).trim().toUpperCase();

  switch (normalized) {
    case "ACTIVATED":
    case "ACTIVE":
      return "ACTIVE";

    case "PRINTED":
    case "IN_TRANSIT_DISTRIBUTOR":
    case "WITH_DISTRIBUTOR":
    case "WITH_RETAILER":
    case "SOLD":
    case "ACTIVATION_AVAILABLE":
      return "ACTIVATION_AVAILABLE";

    case "REPLACED":
      return "REPLACED";

    case "LOST_DAMAGED":
    case "EXPIRED_UNSOLD":
      return "LOST_DAMAGED";

    case "BLOCKED":
    case "SUSPENDED":
    case "DISABLED":
      return "BLOCKED";

    case "UNKNOWN":
    default:
      return "UNKNOWN";
  }
}

/**
 * Returns user-facing metadata and safe actions for a public resolver state.
 */
export function getPublicResolverMeta(
  state: QrPublicResolverState,
  options?: {
    publicId?: string;
    activateUrl?: string;
    helpUrl?: string;
  }
): PublicResolverMeta {
  switch (state) {
    case "ACTIVE":
      return {
        state: "ACTIVE",
        title: "Verified VaahanSafe QR",
        subtitle: "Authoritative Emergency Profile active and verified.",
        badgeLabel: "Active Safety Profile",
        badgeVariant: "success",
        safeNextAction: {
          label: "Call Primary Emergency Contact",
          actionType: "CALL",
        },
      };

    case "ACTIVATION_AVAILABLE":
      return {
        state: "ACTIVATION_AVAILABLE",
        title: "VaahanSafe QR — Ready for Activation",
        subtitle: "This official VaahanSafe QR sticker has not been activated yet.",
        badgeLabel: "Unactivated Sticker",
        badgeVariant: "outline",
        safeNextAction: {
          label: "Activate this QR",
          actionType: "NAVIGATE_ACTIVATE",
          url: options?.activateUrl || `https://activate.vaahansafe.com/${options?.publicId || ""}`,
        },
      };

    case "REPLACED":
      return {
        state: "REPLACED",
        title: "This VaahanSafe QR has been replaced",
        subtitle: "This vehicle safety profile has transitioned to a replacement sticker.",
        badgeLabel: "Replaced QR",
        badgeVariant: "secondary",
        safeNextAction: {
          label: "VaahanSafe Help & Support",
          actionType: "NAVIGATE_HELP",
          url: options?.helpUrl || "https://vaahansafe.com/help",
        },
      };

    case "LOST_DAMAGED":
      return {
        state: "LOST_DAMAGED",
        title: "This VaahanSafe QR is no longer available",
        subtitle: "This QR code has been retired or reported damaged.",
        badgeLabel: "Retired Code",
        badgeVariant: "secondary",
        safeNextAction: {
          label: "Learn About QR Safety",
          actionType: "NAVIGATE_HELP",
          url: options?.helpUrl || "https://vaahansafe.com/help",
        },
      };

    case "BLOCKED":
      return {
        state: "BLOCKED",
        title: "This VaahanSafe QR is currently unavailable",
        subtitle: "We are unable to display safety records for this QR code at this time.",
        badgeLabel: "Unavailable",
        badgeVariant: "destructive",
        safeNextAction: {
          label: "Contact Support",
          actionType: "NAVIGATE_HELP",
          url: options?.helpUrl || "https://vaahansafe.com/help",
        },
      };

    case "UNKNOWN":
    default:
      return {
        state: "UNKNOWN",
        title: "QR Code Not Recognized",
        subtitle: "This identifier was not found in the VaahanSafe registry. Check the link or rescan.",
        badgeLabel: "Not Recognized",
        badgeVariant: "destructive",
        safeNextAction: {
          label: "Try Scanning Again",
          actionType: "RETRY",
        },
      };
  }
}
