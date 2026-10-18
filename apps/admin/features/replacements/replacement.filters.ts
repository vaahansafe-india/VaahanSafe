import {
  EMPTY_REPLACEMENT_FILTERS,
  REPLACEMENT_REASONS,
  REPLACEMENT_STATUSES,
  type ReplacementFilters,
} from "./replacement.types";
export function parseReplacementFilters(
  p: URLSearchParams,
): ReplacementFilters {
  const f = { ...EMPTY_REPLACEMENT_FILTERS };
  for (const k of Object.keys(f) as (keyof ReplacementFilters)[])
    if (p.has(k)) f[k] = (p.get(k) || "").trim().slice(0, 100);
  f.q = f.q
    .replace(/[%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const allowed: Partial<Record<keyof ReplacementFilters, readonly string[]>> =
    {
      status: ["", ...REPLACEMENT_STATUSES],
      reason: ["", ...REPLACEMENT_REASONS],
      risk: ["", "LOW", "MEDIUM", "HIGH"],
      scope: [
        "",
        "review",
        "risk",
        "issue",
        "fulfilment",
        "activation",
        "attention",
        "closed",
      ],
      qr: [
        "",
        "old_active",
        "old_retired",
        "unallocated",
        "allocated",
        "new_active",
      ],
      dateMode: [
        "requested",
        "approved",
        "shipped",
        "delivered",
        "activated",
        "closed",
      ],
      sort: ["newest", "oldest", "updated", "pending"],
    };
  for (const k of Object.keys(allowed) as (keyof ReplacementFilters)[])
    if (!allowed[k]!.includes(f[k])) f[k] = EMPTY_REPLACEMENT_FILTERS[k];
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
export function serializeReplacementFilters(f: ReplacementFilters) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f))
    if (v && v !== EMPTY_REPLACEMENT_FILTERS[k as keyof ReplacementFilters])
      p.set(k, v);
  return p.toString();
}
export function replacementCursor(v: string | null) {
  if (!v) return null;
  if (v.length > 600) throw Error("INVALID_CURSOR");
  const c = JSON.parse(atob(v));
  if (
    typeof c.id !== "string" ||
    !/^[A-Za-z0-9_-]{1,100}$/.test(c.id) ||
    typeof c.value !== "string" ||
    c.value.length > 80 ||
    !Number.isFinite(Date.parse(c.value))
  )
    throw Error("INVALID_CURSOR");
  return { id: c.id, value: c.value };
}
export function replacementPage<
  T extends { id: string; sort_value?: string; created_at?: string },
>(rows: T[], size = 50) {
  const visible = rows.slice(0, size),
    last = visible.at(-1);
  return {
    rows: visible,
    nextCursor:
      rows.length > size && last
        ? btoa(
            JSON.stringify({
              id: last.id,
              value: last.sort_value || last.created_at,
            }),
          )
        : null,
  };
}
