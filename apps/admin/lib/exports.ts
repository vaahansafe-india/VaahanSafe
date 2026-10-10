import { canReadModule, getAdminModule, type AdminRole } from "./modules";
import { maskAdminRow } from "./presentation";
export const EXPORTABLE_MODULES = [
  "inventory",
  "batches",
  "distributors",
  "retailers",
  "reconciliation",
  "transfers",
  "customers",
  "vehicles",
  "activations",
  "plans",
  "subscriptions",
  "orders",
  "payments",
  "refunds",
  "shipping",
  "replacements",
  "analytics",
  "fraud",
  "notifications",
  "support",
  "documents",
  "gallery",
  "incidents",
];
export function canExport(role: AdminRole, key: string) {
  return (
    ["SUPER_ADMIN", "OPS_ADMIN", "FINANCE_ADMIN", "READ_ONLY_ANALYST"].includes(
      role,
    ) &&
    EXPORTABLE_MODULES.includes(key) &&
    canReadModule(role, key)
  );
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function exportRows(key: string, rows: Record<string, unknown>[]) {
  const fields =
    key === "inventory"
      ? INVENTORY_EXPORT_FIELDS
      : key === "distributors"
        ? DISTRIBUTOR_EXPORT_FIELDS
        : key === "retailers"
          ? RETAILER_EXPORT_FIELDS
          : getAdminModule(key)?.fields || [];
  return rows.map((row) => {
    const masked = maskAdminRow(row);
    return fields.map((field) => csvCell(masked[field])).join(",");
  });
}
export const INVENTORY_EXPORT_FIELDS = [
  "visible_code",
  "public_id",
  "batch_reference",
  "batch_id",
  "inventory_channel",
  "status",
  "lifecycle_state",
  "print_evidence",
  "activated_at",
  "created_at",
  "id",
];
export const DISTRIBUTOR_EXPORT_FIELDS = [
  "reference_code",
  "name",
  "city",
  "state_name",
  "district_name",
  "status",
  "verification_status",
  "territory_count",
  "on_hand",
  "in_transit",
  "retailer_count",
  "unresolved_variance",
  "created_at",
];
export const RETAILER_EXPORT_FIELDS = [
  "reference_code",
  "name",
  "city",
  "state_name",
  "district_name",
  "distributor_reference",
  "distributor_name",
  "status",
  "verification_status",
  "available",
  "reserved",
  "in_transit",
  "stock_threshold",
  "activations_30d",
  "last_activation_at",
  "unresolved_variance",
  "created_at",
];
