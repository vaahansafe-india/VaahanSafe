import { canReadModule, type AdminRole } from "../../lib/modules";
export function canReadInventory(role: AdminRole) {
  return canReadModule(role, "inventory");
}
export function canPrintInventory(role: AdminRole) {
  return canReadInventory(role) && ["SUPER_ADMIN", "OPS_ADMIN"].includes(role);
}
export function canReprintInventory(role: AdminRole) {
  return role === "SUPER_ADMIN";
}
export function getPrintEligibility(
  role: AdminRole,
  input: {
    status: string;
    hasSecret: boolean;
    hasArchive: boolean;
    consumed: boolean;
    hasPrintHistory: boolean;
    hasOpenJob: boolean;
    contextEligible: boolean;
  },
) {
  let reason: string | null = null;
  if (!canPrintInventory(role))
    reason = "Your role can inspect inventory but cannot create print jobs.";
  else if (!["INVENTORY", "PRINTED"].includes(input.status))
    reason = "This identity cannot be printed in its current lifecycle.";
  else if (!input.contextEligible)
    reason = "This identity or batch is not eligible for manufacturing.";
  else if (!input.hasSecret || !input.hasArchive || input.consumed)
    reason =
      "Verified, recoverable activation material is required for production printing.";
  else if (input.hasOpenJob)
    reason = "An existing print job must be completed or resolved first.";
  return {
    print: !reason && !input.hasPrintHistory,
    reprint: !reason && input.hasPrintHistory && canReprintInventory(role),
    reason:
      reason ||
      (input.hasPrintHistory && !canReprintInventory(role)
        ? "A super administrator must authorize a reprint."
        : null),
  };
}
