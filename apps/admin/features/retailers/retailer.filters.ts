import type { RetailerFilters, RetailerRow } from "./retailer.types";
export const EMPTY_RETAILER_FILTERS: RetailerFilters = {
  q: "",
  status: "",
  verification: "",
  state: "",
  district: "",
  distributor: "",
  locality: "",
  inventory: "",
  activity: "",
  from: "",
  to: "",
  sort: "newest",
};
export function normalizeRetailerSearch(v: string) {
  return v
    .trim()
    .replace(/[%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100)
    .toLowerCase();
}
export function parseRetailerFilters(p: URLSearchParams): RetailerFilters {
  const choice = (k: string, a: string[]) =>
    a.includes(p.get(k) || "") ? p.get(k)! : "";
  const code = (k: string) =>
    /^[A-Za-z0-9_-]{1,100}$/.test(p.get(k) || "") ? p.get(k)! : "";
  const date = (k: string) => {
    const v = p.get(k) || "";
    return /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      Number.isFinite(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v
      ? v
      : "";
  };
  const state = code("state");
  return {
    q: normalizeRetailerSearch(p.get("q") || ""),
    status: choice("status", ["ACTIVE", "SUSPENDED"]),
    verification: choice("verification", [
      "PENDING",
      "VERIFIED",
      "REQUIRES_CORRECTION",
    ]),
    state,
    district: state ? code("district") : "",
    distributor: code("distributor"),
    locality: normalizeRetailerSearch(p.get("locality") || ""),
    inventory: choice("inventory", [
      "held",
      "low",
      "empty",
      "transit",
      "variance",
    ]),
    activity: choice("activity", ["today", "week", "quiet"]),
    from: date("from"),
    to: date("to"),
    sort: p.get("sort") === "oldest" ? "oldest" : "newest",
  };
}
export function serializeRetailerFilters(f: RetailerFilters) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v && !(k === "sort" && v === "newest")) p.set(k, v);
  });
  return p.toString();
}
export function retailerHealth(
  r: Pick<
    RetailerRow,
    | "status"
    | "verification_status"
    | "available"
    | "stock_threshold"
    | "reconciliation_issues"
    | "parent_distributor_id"
    | "distributor_status"
  >,
) {
  const signals: string[] = [];
  if (r.status === "SUSPENDED") signals.push("Suspended");
  if (r.verification_status !== "VERIFIED")
    signals.push("Verification required");
  if (!r.parent_distributor_id) signals.push("Supply setup required");
  else if (r.distributor_status !== "ACTIVE")
    signals.push("Distributor unavailable");
  if (r.available === 0) signals.push("Out of stock");
  else if (r.stock_threshold > 0 && r.available <= r.stock_threshold)
    signals.push("Low stock");
  if (r.reconciliation_issues > 0) signals.push("Reconciliation required");
  return signals;
}
export const canManageRetailers = (role: string) =>
  role === "SUPER_ADMIN" || role === "OPS_ADMIN";
export const canReadRetailerContacts = canManageRetailers;
