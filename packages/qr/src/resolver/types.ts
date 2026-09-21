/**
 * VaahanSafe QR Resolver State Types
 *
 * Establishes the authoritative boundary between internal operations/database lifecycle states
 * and public resolver states shown to the scanning finder.
 */

import { QrLifecycleState } from "@vaahansafe/types";

/**
 * Internal lifecycle states stored in database / inventory records.
 */
export type QrInternalLifecycleState =
  | QrLifecycleState
  | "BLOCKED"
  | "UNKNOWN";

/**
 * Authoritative public resolver states.
 * INVARIANT: Never expose internal operational terminology or security reasons to the finder.
 */
export type QrPublicResolverState =
  | "ACTIVE"               // Authorized, active emergency safety profile
  | "ACTIVATION_AVAILABLE" // Legit sticker produced/sold but not yet activated by customer
  | "REPLACED"             // QR sticker was replaced with a new sticker; safe recovery direction
  | "LOST_DAMAGED"         // QR sticker decommissioned, lost, or damaged
  | "BLOCKED"              // Blocked for security/abuse; generic unavailable display
  | "UNKNOWN";             // Unrecognized identifier or malformed query

export interface PublicResolverMeta {
  state: QrPublicResolverState;
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeVariant: "success" | "warning" | "destructive" | "secondary" | "outline";
  safeNextAction: {
    label: string;
    actionType: "CALL" | "NAVIGATE_ACTIVATE" | "NAVIGATE_HELP" | "NAVIGATE_STATUS" | "RETRY";
    url?: string;
  };
}
