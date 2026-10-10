import type { InventoryFilters, InventoryCursor } from "./inventory.types";
export const INVENTORY_STATUSES = [
  "INVENTORY",
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
export const EMPTY_FILTERS: InventoryFilters = {
  q: "",
  statuses: [],
  lifecycles: [],
  batch: "",
  channel: "",
  print: "",
  activation: "",
  custody: "",
  from: "",
  to: "",
  risk: "",
  sort: "newest",
};
const allowed = (value: string, values: string[]) =>
  values.includes(value) ? value : "";
export function normalizeInventorySearch(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, "")
    .slice(0, 64);
}
export function parseInventoryFilters(
  params: URLSearchParams,
): InventoryFilters {
  const states = (key: string) =>
    [
      ...new Set(
        (params.get(key) || "")
          .split(",")
          .filter((s) => (INVENTORY_STATUSES as readonly string[]).includes(s)),
      ),
    ].sort();
  const date = (key: string) => {
    const d = params.get(key) || "";
    return /^\d{4}-\d{2}-\d{2}$/.test(d) &&
      !Number.isNaN(Date.parse(d)) &&
      new Date(d).toISOString().slice(0, 10) === d
      ? d
      : "";
  };
  const batch = params.get("batch") || "";
  return {
    q: normalizeInventorySearch(params.get("q") || ""),
    statuses: states("status"),
    lifecycles: states("lifecycle"),
    batch: /^[A-Za-z0-9_-]{1,100}$/.test(batch) ? batch : "",
    channel: allowed(params.get("channel") || "", [
      "ONLINE_SYSTEM",
      "OFFLINE_RETAIL",
    ]),
    print: allowed(params.get("print") || "", ["recorded", "unrecorded"]),
    activation: allowed(params.get("activation") || "", ["active", "inactive"]),
    custody: allowed(params.get("custody") || "", [
      "distributor",
      "retailer",
      "unrecorded",
    ]),
    from: date("from"),
    to: date("to"),
    risk: allowed(params.get("risk") || "", [
      "failed",
      "blocked",
      "replacement",
    ]),
    sort: params.get("sort") === "oldest" ? "oldest" : "newest",
  };
}
export function serializeInventoryFilters(filters: InventoryFilters) {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    const name =
      key === "statuses" ? "status" : key === "lifecycles" ? "lifecycle" : key;
    const v = Array.isArray(value) ? [...value].sort().join(",") : value;
    if (v && !(name === "sort" && v === "newest")) p.set(name, v);
  }
  return p.toString();
}
export function encodeInventoryCursor(cursor: InventoryCursor) {
  return btoa(JSON.stringify(cursor));
}
export function decodeInventoryCursor(
  value: string | null,
): InventoryCursor | null {
  if (!value) return null;
  if (value.length > 512) throw new Error("Invalid inventory cursor");
  try {
    const c = JSON.parse(atob(value));
    if (
      typeof c.id !== "string" ||
      !/^[A-Za-z0-9_-]{1,100}$/.test(c.id) ||
      typeof c.createdAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(c.createdAt) ||
      Number.isNaN(Date.parse(c.createdAt))
    )
      throw new Error();
    return { id: c.id, createdAt: c.createdAt };
  } catch {
    throw new Error("Invalid inventory cursor");
  }
}
export function appendInventoryRows<T extends { id: string }>(
  pages: T[][],
): T[] {
  const seen = new Set<string>();
  return pages.flat().filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}
