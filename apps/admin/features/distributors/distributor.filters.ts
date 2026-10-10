import type { DistributorFilters } from "./distributor.types";
export const EMPTY_DISTRIBUTOR_FILTERS: DistributorFilters = {
  q: "",
  status: "",
  verification: "",
  state: "",
  district: "",
  inventory: "",
  network: "",
  from: "",
  to: "",
  sort: "newest",
};
export function normalizeDistributorSearch(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N} .-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}
export function parseDistributorFilters(
  p: URLSearchParams,
): DistributorFilters {
  const choice = (key: string, options: string[]) =>
    options.includes(p.get(key) || "") ? p.get(key)! : "";
  const date = (key: string) => {
    const s = p.get(key) || "";
    return /^\d{4}-\d{2}-\d{2}$/.test(s) &&
      Number.isFinite(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s
      ? s
      : "";
  };
  const code = (key: string) =>
    /^[A-Za-z0-9_-]{1,64}$/.test(p.get(key) || "") ? p.get(key)! : "";
  const state = code("state");
  return {
    q: normalizeDistributorSearch(p.get("q") || ""),
    status: choice("status", ["ACTIVE", "SUSPENDED"]),
    verification: choice("verification", [
      "PENDING",
      "VERIFIED",
      "REQUIRES_CORRECTION",
    ]),
    state,
    district: state ? code("district") : "",
    inventory: choice("inventory", ["held", "empty", "transit", "variance"]),
    network: choice("network", ["retailers", "none"]),
    from: date("from"),
    to: date("to"),
    sort: p.get("sort") === "oldest" ? "oldest" : "newest",
  };
}
export function serializeDistributorFilters(f: DistributorFilters) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v && !(k === "sort" && v === "newest")) p.set(k, v);
  });
  return p.toString();
}
export { changePartnerState as changeDistributorState } from "../geography/geography.types";
export function decodeDistributorCursor(value: string | null) {
  if (!value) return null;
  try {
    if (value.length > 600) throw new Error();
    const c = JSON.parse(atob(value));
    if (
      typeof c.id !== "string" ||
      !/^[A-Za-z0-9_-]{1,100}$/.test(c.id) ||
      typeof c.created_at !== "string" ||
      !Number.isFinite(Date.parse(c.created_at))
    )
      throw new Error();
    return { id: c.id, created_at: c.created_at as string };
  } catch {
    throw new Error("Invalid distributor cursor");
  }
}
export function uniqueDistributorRows<T extends { id: string }>(pages: T[][]) {
  const seen = new Set<string>();
  return pages.flat().filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}
