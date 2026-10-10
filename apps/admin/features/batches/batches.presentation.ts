import type { BatchItem, BatchStatus, BatchChannel } from "./batches.types";

/**
 * Format quantity according to Indian locale grouping (e.g. 1,00,000 or 1,000)
 */
export function formatQuantity(qty: number): string {
  if (typeof qty !== "number" || isNaN(qty)) return "0";
  return new Intl.NumberFormat("en-IN").format(qty);
}

/**
 * Humanize internal channel enums for operations personnel
 */
export function humanizeChannel(channel: BatchChannel | string): string {
  if (channel === "OFFLINE_RETAIL") return "Offline retail";
  if (channel === "ONLINE_SYSTEM") return "Online system";
  return channel.replace(/_/g, " ").toLowerCase();
}

/**
 * Status configuration with presentation labels, semantic colors, and operational descriptions
 */
export function batchStatusConfig(status: BatchStatus | string): {
  label: string;
  badgeClass: string;
  dotColor: string;
  description: string;
} {
  switch (status) {
    case "DRAFT":
      return {
        label: "Draft",
        badgeClass: "batch-state-draft",
        dotColor: "#9c824a",
        description: "Lot created. Physical credentials not yet generated.",
      };
    case "GENERATING":
      return {
        label: "Generating",
        badgeClass: "batch-state-generating",
        dotColor: "#35628d",
        description: "Identity generation job running in background.",
      };
    case "GENERATED":
      return {
        label: "Generated",
        badgeClass: "batch-state-generated",
        dotColor: "#4f7a55",
        description: "Credentials generated. Awaiting manufacturing validation.",
      };
    case "VALIDATED":
      return {
        label: "Validated",
        badgeClass: "batch-state-validated",
        dotColor: "#397349",
        description: "All records cryptographically checked and verified.",
      };
    case "PRINT_READY":
      return {
        label: "Print ready",
        badgeClass: "batch-state-print-ready",
        dotColor: "#2b6b55",
        description: "Approved for print. Ready for production job spooling.",
      };
    case "PRINTED":
      return {
        label: "Printed",
        badgeClass: "batch-state-printed",
        dotColor: "#58784d",
        description: "Physical printing confirmed by production partner.",
      };
    case "RECEIVED":
      return {
        label: "Received",
        badgeClass: "batch-state-received",
        dotColor: "#2e6a4f",
        description: "Physical lots received and confirmed in active inventory.",
      };
    case "CLOSED":
      return {
        label: "Closed",
        badgeClass: "batch-state-closed",
        dotColor: "#6c7265",
        description: "Batch lifecycle completed. All items allocated.",
      };
    case "FAILED":
      return {
        label: "Failed",
        badgeClass: "batch-state-failed",
        dotColor: "#ad4438",
        description: "Generation or validation failed. Operator attention required.",
      };
    case "QUARANTINED":
      return {
        label: "Quarantined",
        badgeClass: "batch-state-quarantined",
        dotColor: "#b23e3e",
        description: "Lot isolated from distribution due to security or quality alert.",
      };
    case "VOIDED":
      return {
        label: "Voided",
        badgeClass: "batch-state-voided",
        dotColor: "#804040",
        description: "Lot voided. All associated identities unusable.",
      };
    default:
      return {
        label: status,
        badgeClass: "batch-state-default",
        dotColor: "#74796f",
        description: "Status recorded.",
      };
  }
}

/**
 * Determine the contextual next action derived from lifecycle state
 */
export function nextActionForBatch(batch: BatchItem): {
  action: string;
  primary: boolean;
  label: string;
  detail: string;
} {
  const genCount = batch.generatedCount || 0;
  const isGenerated = genCount >= batch.quantity;

  switch (batch.status) {
    case "DRAFT":
      if (!isGenerated) {
        return {
          action: "GENERATE",
          primary: true,
          label: "Generate identities",
          detail: "Create secure public IDs and activation proofs for this lot.",
        };
      }
      return {
        action: "VALIDATE",
        primary: true,
        label: "Validate batch",
        detail: "Run integrity checks across generated records.",
      };
    case "GENERATING":
      return {
        action: "MONITOR",
        primary: false,
        label: "Monitor progress",
        detail: "Generation worker is processing lot chunks.",
      };
    case "GENERATED":
      return {
        action: "VALIDATE",
        primary: true,
        label: "Validate lot",
        detail: "Verify uniqueness, cryptographic proofs and packaging requirements.",
      };
    case "VALIDATED":
      return {
        action: "APPROVE_PRINT",
        primary: true,
        label: "Approve for print",
        detail: "Queue batch into production print schedule.",
      };
    case "PRINT_READY":
      return {
        action: "RECORD_PRINT",
        primary: true,
        label: "Record print completion",
        detail: "Confirm physical print run completion from manufacturing vendor.",
      };
    case "PRINTED":
      return {
        action: "RECEIVE",
        primary: true,
        label: "Verify & receive into stock",
        detail: "Confirm delivery of physical stickers into inventory custody.",
      };
    case "RECEIVED":
      return {
        action: "VIEW_INVENTORY",
        primary: false,
        label: "View in inventory",
        detail: "Lot is deployed. Inspect identities in QR Inventory workspace.",
      };
    case "FAILED":
      return {
        action: "RETRY_DIAGNOSTICS",
        primary: true,
        label: "Review diagnostics",
        detail: "Inspect error log and resume generation safely.",
      };
    case "QUARANTINED":
    case "VOIDED":
      return {
        action: "AUDIT",
        primary: false,
        label: "View audit trail",
        detail: "Lot is non-operational. Review security records.",
      };
    default:
      return {
        action: "INSPECT",
        primary: false,
        label: "Inspect lot",
        detail: "Review batch parameters.",
      };
  }
}

/**
 * Format timestamp in Asia/Kolkata timezone
 */
export function formatBatchDate(at: string | null): string {
  if (!at) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(new Date(at));
  } catch {
    return at;
  }
}

/**
 * Short relative time formatter (e.g. 12m ago, 2h ago, 3d ago)
 */
export function timeAgo(at: string | null): string {
  if (!at) return "—";
  try {
    const diffMs = Date.now() - new Date(at).getTime();
    if (diffMs < 0) return "just now";
    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatBatchDate(at).split(",")[0] || `${days}d ago`;
  } catch {
    return "—";
  }
}
