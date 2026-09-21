import type { ServiceState } from "../domain/service-state";
import type { PublicStatusServiceDto } from "../dto/public-status";

export interface AggregateStatusResult {
  overallState: ServiceState;
  headline: string;
  description: string;
}

/**
 * Derives composite overall system status according to authoritative precedence:
 * MAJOR OUTAGE > PARTIAL OUTAGE > DEGRADED > MAINTENANCE > OPERATIONAL (or UNKNOWN if unconfirmed).
 */
export function deriveOverallStatus(
  services: PublicStatusServiceDto[],
  isStale: boolean = false
): AggregateStatusResult {
  if (isStale || services.length === 0) {
    return {
      overallState: "UNKNOWN",
      headline: "Current service condition could not be confirmed.",
      description: "Status telemetry is temporarily delayed or offline. We are actively verifying operational data.",
    };
  }

  const hasUnknown = services.some((s) => s.state === "UNKNOWN");
  const hasMajorOutage = services.some((s) => s.state === "MAJOR OUTAGE");
  const hasPartialOutage = services.some((s) => s.state === "PARTIAL OUTAGE");
  const hasDegraded = services.some((s) => s.state === "DEGRADED");
  const hasMaintenance = services.some((s) => s.state === "MAINTENANCE");

  if (hasMajorOutage) {
    const majorServices = services
      .filter((s) => s.state === "MAJOR OUTAGE")
      .map((s) => s.name)
      .join(", ");
    return {
      overallState: "MAJOR OUTAGE",
      headline: "A VaahanSafe service is currently unavailable.",
      description: `Critical operational disruption affecting ${majorServices}. Engineering is actively investigating and restoring service capability.`,
    };
  }

  if (hasPartialOutage) {
    const partialServices = services
      .filter((s) => s.state === "PARTIAL OUTAGE")
      .map((s) => s.name)
      .join(", ");
    return {
      overallState: "PARTIAL OUTAGE",
      headline: "Partial service interruption reported.",
      description: `Localized disruption affecting ${partialServices}. Other customer journey capabilities remain fully operational.`,
    };
  }

  if (hasDegraded) {
    const degradedServices = services
      .filter((s) => s.state === "DEGRADED")
      .map((s) => s.name)
      .join(", ");
    return {
      overallState: "DEGRADED",
      headline: "Some VaahanSafe services are experiencing disruption.",
      description: `Elevated latency or delayed processing observed for ${degradedServices}. Responders and users may experience intermittent delays.`,
    };
  }

  if (hasMaintenance) {
    return {
      overallState: "MAINTENANCE",
      headline: "Scheduled maintenance in progress.",
      description: "Planned infrastructure or service updates are underway. Services will resume standard routing once verification completes.",
    };
  }

  if (hasUnknown) {
    return {
      overallState: "UNKNOWN",
      headline: "Current service condition could not be confirmed.",
      description: "Telemetry for one or more services is currently unavailable.",
    };
  }

  return {
    overallState: "OPERATIONAL",
    headline: "VaahanSafe services are operating normally.",
    description: "All customer journey capabilities, emergency bystander QR resolvers, and dispatch channels are active and responding within nominal limits.",
  };
}

/**
 * Formats a Date or ISO timestamp into visitor-friendly Indian Standard Time (IST).
 * Output example: "21 Sep 2026, 12:36 IST"
 */
export function formatIstTimestamp(dateInput: string | Date | number): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Unknown Time";

    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    const formatted = new Intl.DateTimeFormat("en-IN", options).format(d);
    return `${formatted} IST`;
  } catch {
    return "Unknown Time";
  }
}
