/**
 * Emergency Scan Alert Cooldown & Storm Protection
 *
 * Implements sliding-window deduplication and rate-limiting for public QR scans.
 * INVARIANT 01: Finder view rendering must NEVER wait on scan alert generation.
 * INVARIANT 02: A QR scan alone does NOT prove an accident.
 * INVARIANT 03: Public scanning of a QR sticker must never cause an alert storm.
 */

import { DedupeKeys } from "../domain/dedupe";

export interface ScanAlertEvaluationResult {
  shouldDispatchAlert: boolean;
  dedupeKey: string;
  reason: "COOLDOWN_ACTIVE" | "ELIGIBLE";
}

export interface IScanCooldownStore {
  /**
   * Checks if an alert was recently dispatched for this vehicle within windowSeconds.
   * If not, records the timestamp and returns true.
   */
  checkAndRecordScan(vehicleId: string, windowSeconds: number): Promise<boolean>;
}

/**
 * In-memory / cache-based cooldown tracker for emergency scan alerts.
 */
export class InMemoryScanCooldownStore implements IScanCooldownStore {
  private readonly recentScans = new Map<string, number>();

  async checkAndRecordScan(vehicleId: string, windowSeconds: number): Promise<boolean> {
    const now = Date.now();
    const lastScan = this.recentScans.get(vehicleId);

    if (lastScan && now - lastScan < windowSeconds * 1000) {
      // Cooldown active; suppress redundant alert dispatch
      return false;
    }

    this.recentScans.set(vehicleId, now);
    return true;
  }

  clear(): void {
    this.recentScans.clear();
  }
}

/**
 * Evaluates whether an emergency scan should generate a notification alert.
 *
 * @param vehicleId Authoritative vehicle identifier
 * @param cooldownStore Store tracking recent alert timestamps
 * @param cooldownSeconds Cooldown window duration (default 900s = 15 minutes)
 */
export async function evaluateScanAlertEligibility(
  vehicleId: string,
  cooldownStore: IScanCooldownStore,
  cooldownSeconds = 900
): Promise<ScanAlertEvaluationResult> {
  const dedupeKey = DedupeKeys.emergencyScanAlert(vehicleId, cooldownSeconds);
  const isEligible = await cooldownStore.checkAndRecordScan(vehicleId, cooldownSeconds);

  if (!isEligible) {
    return {
      shouldDispatchAlert: false,
      dedupeKey,
      reason: "COOLDOWN_ACTIVE",
    };
  }

  return {
    shouldDispatchAlert: true,
    dedupeKey,
    reason: "ELIGIBLE",
  };
}
