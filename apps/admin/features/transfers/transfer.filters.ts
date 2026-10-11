import {
  EMPTY_TRANSFER_FILTERS,
  TRANSFER_STATUSES,
  type TransferFilters,
} from "./transfer.types";
export function parseTransferFilters(p: URLSearchParams): TransferFilters {
  const f = { ...EMPTY_TRANSFER_FILTERS };
  for (const k of Object.keys(f) as (keyof TransferFilters)[])
    f[k] = (p.get(k) || "").trim().slice(0, 100);
  f.q = f.q.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (
    !TRANSFER_STATUSES.includes(f.status as (typeof TRANSFER_STATUSES)[number])
  )
    f.status = "";
  if (
    !["", "attention", "transit", "reconcile", "approvals", "closed"].includes(
      f.view,
    )
  )
    f.view = "";
  if (!["", "central", "retail"].includes(f.movement)) f.movement = "";
  for (const k of ["from", "to"] as const)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(f[k]) ||
      !Number.isFinite(Date.parse(f[k])) ||
      new Date(f[k]).toISOString().slice(0, 10) !== f[k]
    )
      f[k] = "";
  for (const k of ["source", "destination", "batch"] as const)
    if (!/^[A-Za-z0-9_-]*$/.test(f[k])) f[k] = "";
  if (f.from && f.to && f.from > f.to) f.to = "";
  return f;
}
export function serializeTransferFilters(f: TransferFilters) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, v);
  return p.toString();
}
export function transferCursor(value: string | null) {
  if (!value) return null;
  try {
    if (value.length > 500) throw Error();
    const c = JSON.parse(atob(value));
    if (
      typeof c.id !== "string" ||
      !/^[A-Za-z0-9_-]{1,100}$/.test(c.id) ||
      typeof c.created_at !== "string" ||
      !Number.isFinite(Date.parse(c.created_at))
    )
      throw Error();
    return { id: c.id, created_at: c.created_at };
  } catch {
    throw Error("INVALID_CURSOR");
  }
}
export function transferPage<T extends { id: string; created_at: string }>(
  rows: T[],
  size: number,
) {
  const visible = rows.slice(0, size),
    last = visible.at(-1);
  return {
    rows: visible,
    nextCursor:
      rows.length > size && last
        ? btoa(JSON.stringify({ id: last.id, created_at: last.created_at }))
        : null,
  };
}
