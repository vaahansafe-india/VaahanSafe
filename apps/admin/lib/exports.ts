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
  const fields = getAdminModule(key)?.fields || [];
  return rows.map((row) => {
    const masked = maskAdminRow(row);
    return fields.map((field) => csvCell(masked[field])).join(",");
  });
}
