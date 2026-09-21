/**
 * VaahanSafe Canonical QR Lifecycle States
 *
 * SECTION 13 — QR LIFECYCLE:
 * PRINTED
 *    ↓
 * IN_TRANSIT_DISTRIBUTOR
 *    ↓
 * WITH_DISTRIBUTOR
 *    ↓
 * WITH_RETAILER
 *    ↓
 * SOLD
 *    ↓
 * ACTIVATED
 *    ├──────────→ LOST_DAMAGED
 *    │
 *    └──────────→ REPLACED
 *
 * Additional states:
 * EXPIRED_UNSOLD (Inventory terminal state)
 * BLOCKED (Security/fraud isolation)
 */

export type QrLifecycleState =
  | "PRINTED"
  | "IN_TRANSIT_DISTRIBUTOR"
  | "WITH_DISTRIBUTOR"
  | "WITH_RETAILER"
  | "SOLD"
  | "ACTIVATED"
  | "EXPIRED_UNSOLD"
  | "LOST_DAMAGED"
  | "REPLACED"
  | "BLOCKED";

export const CANONICAL_QR_LIFECYCLE_STATES: readonly QrLifecycleState[] = [
  "PRINTED",
  "IN_TRANSIT_DISTRIBUTOR",
  "WITH_DISTRIBUTOR",
  "WITH_RETAILER",
  "SOLD",
  "ACTIVATED",
  "EXPIRED_UNSOLD",
  "LOST_DAMAGED",
  "REPLACED",
  "BLOCKED",
] as const;

export function isValidLifecycleState(state: string): state is QrLifecycleState {
  return CANONICAL_QR_LIFECYCLE_STATES.includes(state as QrLifecycleState);
}

/**
 * Checks if a state is considered an inventory state (pre-activation).
 */
export function isInventoryState(state: QrLifecycleState): boolean {
  return [
    "PRINTED",
    "IN_TRANSIT_DISTRIBUTOR",
    "WITH_DISTRIBUTOR",
    "WITH_RETAILER",
    "SOLD",
    "EXPIRED_UNSOLD",
  ].includes(state);
}

/**
 * Checks if a state is terminal.
 */
export function isTerminalLifecycleState(state: QrLifecycleState): boolean {
  return ["REPLACED", "LOST_DAMAGED", "EXPIRED_UNSOLD"].includes(state);
}
