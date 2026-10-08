import type { AdminRow } from "./contracts";
export function maskAdminRow(row: Record<string, unknown>): AdminRow {
  const safe: AdminRow = {};
  for (const [key, value] of Object.entries(row)) {
    if (/secret|token|payload|medical|metadata|address|ip_hash/i.test(key))
      continue;
    if (key.includes("phone")) {
      safe[key] = value ? `••••••${String(value).slice(-4)}` : null;
      continue;
    }
    if (key.includes("email")) {
      const parts = String(value || "").split("@");
      safe[key] = parts[1] ? `${parts[0]?.slice(0, 1)}•••@${parts[1]}` : null;
      continue;
    }
    if (key.includes("registration_number")) {
      safe[key] = value
        ? `${String(value).slice(0, 4)}••${String(value).slice(-2)}`
        : null;
      continue;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    )
      safe[key] = value;
  }
  return safe;
}
export function columnLabel(key: string) {
  return (
    (
      {
        id: "Reference",
        visible_code: "VaahanSafe ID",
        reference_code: "Reference",
        registration_number_normalized: "Registration",
        total_minor: "Order total",
        amount_minor: "Amount",
        price_minor: "Price",
        created_at: "Created",
        requires_step_up: "Step-up",
        lifecycle_state: "QR lifecycle",
      } as Record<string, string>
    )[key] || key.replaceAll("_", " ")
  );
}
export function displayValue(
  key: string,
  value: unknown,
  row?: AdminRow,
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (key.endsWith("_minor"))
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: String(row?.currency || "INR"),
      maximumFractionDigits: 2,
    }).format(Number(value) / 100);
  if (key.endsWith("_at") || key.endsWith("_end")) {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? "—"
      : new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        }).format(date);
  }
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return String(value);
}
