import {
  EMPTY_RISK_FILTERS,
  RISK_CATEGORIES,
  RISK_SEVERITIES,
  RISK_STATUSES,
  type RiskFilters,
} from "./risk.types";
export function parseRiskFilters(p: URLSearchParams): RiskFilters {
  const f = { ...EMPTY_RISK_FILTERS };
  for (const k of Object.keys(f) as (keyof RiskFilters)[])
    f[k] = (p.get(k) || "").trim().slice(0, 100);
  f.q = f.q
    .replace(/[^\p{L}\p{N} -]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  for (const [key, allowed] of Object.entries({
    severity: ["", ...RISK_SEVERITIES],
    category: ["", ...RISK_CATEGORIES],
    status: ["", ...RISK_STATUSES],
    assignment: ["", "mine", "unassigned"],
    hasCase: ["", "yes", "no"],
    scope: ["", "resolved_today", "high_attention"],
    period: ["", "24h"],
    lifecycle: [
      "",
      "INVENTORY",
      "PRINTED",
      "DISTRIBUTED",
      "ASSIGNED",
      "ACTIVATED",
      "REPLACED",
      "BLOCKED",
      "RETIRED",
      "LOST",
      "DAMAGED",
    ],
  })) {
    const k = key as keyof RiskFilters;
    if (!allowed.includes(f[k])) f[k] = "";
  }
  for (const k of ["from", "to"] as const) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(f[k]) ||
      !Number.isFinite(Date.parse(f[k])) ||
      new Date(f[k]).toISOString().slice(0, 10) !== f[k]
    )
      f[k] = "";
  }
  if (f.from && f.to && f.from > f.to) f.to = "";
  return f;
}
export function serializeRiskFilters(f: RiskFilters) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v) p.set(k, v);
  });
  return p.toString();
}
export function riskCursor(v: string | null) {
  if (!v) return null;
  if (v.length > 500) throw new Error("INVALID_CURSOR");
  const c = JSON.parse(atob(v));
  if (
    typeof c.id !== "string" ||
    !/^[a-f0-9-]{36}$/.test(c.id) ||
    typeof c.at !== "string" ||
    !Number.isFinite(Date.parse(c.at))
  )
    throw new Error("INVALID_CURSOR");
  return { id: c.id, at: c.at };
}
export function riskPage<T extends { id: string }>(
  rows: T[],
  field: keyof T,
  size = 50,
) {
  const visible = rows.slice(0, size),
    last = visible.at(-1);
  return {
    rows: visible,
    nextCursor:
      rows.length > size && last
        ? btoa(JSON.stringify({ id: last.id, at: last[field] }))
        : null,
  };
}
