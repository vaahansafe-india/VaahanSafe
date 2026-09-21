/**
 * Authoritative Resolver State Machine & Mapping
 * Transforms internal operational states into safe, privacy-preserving public resolver states.
 */

import { QrInternalLifecycleState, QrPublicResolverState, PublicResolverMeta } from "./types";

/**
 * Maps an internal database lifecycle state to an authoritative public resolver state.
 *
 * INVARIANT: Does NOT leak internal distributor or retail logistics terminology.
 * Does NOT leak fraud scores or internal blocking reasons.
 */
export function mapInternalToPublicResolverState(
  internalState: QrInternalLifecycleState | string | undefined | null
): QrPublicResolverState {
  if (!internalState) {
    return "UNKNOWN";
  }

  const normalized = String(internalState).trim().toUpperCase();

  switch (normalized) {
    case "ACTIVATED":
    case "ACTIVE":
      return "ACTIVE";

    // Legitimate sticker in retail pipeline or sold, ready for activation
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
 * Generates safe public resolver UI metadata and safe next actions.
 * INVARIANT: Every public resolver state MUST have a safe next action.
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
