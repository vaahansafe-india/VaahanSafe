import type { InventorySelection } from "./inventory.types";
export function parseInventorySelection(value: unknown): InventorySelection {
  if (!value || typeof value !== "object")
    throw new Error("Select inventory identities first.");
  const s = value as Record<string, unknown>;
  const ids = (v: unknown) =>
    Array.isArray(v) &&
    v.length <= 100 &&
    v.every(
      (id) => typeof id === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(id),
    );
  if (s.mode === "ids" && ids(s.ids) && (s.ids as string[]).length)
    return { mode: "ids", ids: [...new Set(s.ids as string[])] };
  if (
    s.mode === "all" &&
    typeof s.token === "string" &&
    /^[a-f0-9-]{36}$/.test(s.token) &&
    ids(s.excluded)
  )
    return {
      mode: "all",
      token: s.token,
      count: Number(s.count) || 0,
      excluded: [...new Set(s.excluded as string[])],
    };
  throw new Error(
    "Select up to 100 identities, or select all matching results.",
  );
}
export function selectedCount(s: InventorySelection) {
  return s.mode === "ids"
    ? s.ids.length
    : Math.max(0, s.count - s.excluded.length);
}
export function isSelected(s: InventorySelection, id: string) {
  return s.mode === "ids" ? s.ids.includes(id) : !s.excluded.includes(id);
}
export function toggleSelected(
  s: InventorySelection,
  id: string,
): InventorySelection {
  if (s.mode === "ids")
    return {
      ...s,
      ids: s.ids.includes(id) ? s.ids.filter((v) => v !== id) : [...s.ids, id],
    };
  return {
    ...s,
    excluded: s.excluded.includes(id)
      ? s.excluded.filter((v) => v !== id)
      : [...s.excluded, id],
  };
}
