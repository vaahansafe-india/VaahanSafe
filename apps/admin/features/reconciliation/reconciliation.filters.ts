import {
  EMPTY_RECONCILIATION_FILTERS,
  type ReconciliationFilters,
} from "./reconciliation.types";
export function parseReconciliationFilters(
  p: URLSearchParams,
): ReconciliationFilters {
  const f = { ...EMPTY_RECONCILIATION_FILTERS };
  for (const k of Object.keys(f) as (keyof ReconciliationFilters)[])
    if (p.has(k)) f[k] = (p.get(k) || "").trim().slice(0, 100);
  f.q = f.q
    .replace(/[%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const [key, allowed] of Object.entries({
    status: ["", "OPEN", "REVIEWED", "CLOSED"],
    scope: ["", "open", "attention", "approval", "closed"],
    kind: ["", "WAREHOUSE", "DISTRIBUTOR", "RETAILER"],
    variance: ["", "matched", "any", "shortage", "surplus", "damaged"],
    dateMode: ["count", "created", "closed"],
    sort: ["newest", "oldest", "updated", "shortage", "surplus", "unresolved"],
  })) {
    const k = key as keyof ReconciliationFilters;
    if (!allowed.includes(f[k])) f[k] = EMPTY_RECONCILIATION_FILTERS[k];
  }
  for (const k of ["partner", "state", "district"] as const)
    if (!/^[A-Za-z0-9_-]*$/.test(f[k])) f[k] = "";
  for (const k of ["from", "to"] as const)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(f[k]) ||
      !Number.isFinite(Date.parse(f[k])) ||
      new Date(f[k]).toISOString().slice(0, 10) !== f[k]
    )
      f[k] = "";
  if (f.from && f.to && f.from > f.to) f.to = "";
  return f;
}
export function serializeReconciliationFilters(f: ReconciliationFilters) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f))
    if (
      v &&
      v !== EMPTY_RECONCILIATION_FILTERS[k as keyof ReconciliationFilters]
    )
      p.set(k, v);
  return p.toString();
}
export function reconciliationCursor(value: string | null) {
  if (!value) return null;
  if (value.length > 600) throw Error("INVALID_CURSOR");
  const c = JSON.parse(atob(value));
  if (
    typeof c.id !== "string" ||
    !/^[A-Za-z0-9_-]{1,100}$/.test(c.id) ||
    typeof c.value !== "string" ||
    c.value.length > 80 ||
    (!Number.isFinite(Date.parse(c.value)) && !/^-?\d{1,10}$/.test(c.value))
  )
    throw Error("INVALID_CURSOR");
  return { id: c.id, value: c.value };
}
export function reconciliationPage<
  T extends { id: string; sort_value?: string; created_at?: string },
>(rows: T[], size = 50) {
  const visible = rows.slice(0, size),
    last = visible.at(-1);
  return {
    rows: visible,
    nextCursor:
      rows.length > size && last
        ? btoa(
            JSON.stringify(
              last.sort_value
                ? { id: last.id, value: last.sort_value }
                : { id: last.id, created_at: last.created_at },
            ),
          )
        : null,
  };
}
export function historyCursor(value: string | null) {
  if (!value) return null;
  if (value.length > 600) throw Error();
  const c = JSON.parse(atob(value));
  if (
    !/^[A-Za-z0-9_-]{1,100}$/.test(c.id) ||
    !Number.isFinite(Date.parse(c.created_at))
  )
    throw Error();
  return { id: c.id, created_at: c.created_at };
}
