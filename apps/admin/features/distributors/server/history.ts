import "server-only";
import type { AdminIdentity } from "../../../lib/contracts";
import { AdminError } from "../../../lib/session";
import { decodeDistributorCursor } from "../distributor.filters";
import { distributorRpc } from "./distributors";
export async function distributorHistory(
  identity: AdminIdentity,
  id: string,
  section: string,
  cursor: string | null,
) {
  if (
    !["transfers", "retailers", "reconciliations", "activity"].includes(
      section,
    ) ||
    !/^[A-Za-z0-9_-]{1,100}$/.test(id)
  )
    throw new AdminError(
      400,
      "INVALID_SECTION",
      "Choose a valid distributor section.",
    );
  let parsed;
  try {
    parsed = decodeDistributorCursor(cursor);
  } catch {
    throw new AdminError(
      400,
      "INVALID_CURSOR",
      "Reload this distributor section.",
    );
  }
  const records = await distributorRpc<{ id: string; created_at: string }[]>(
    identity,
    "admin_distributor_history",
    { p_id: id, p_section: section, p_cursor: parsed },
  );
  const rows = records.slice(0, 20),
    last = rows.at(-1);
  return {
    rows,
    nextCursor:
      records.length > 20 && last
        ? btoa(JSON.stringify({ id: last.id, created_at: last.created_at }))
        : null,
  };
}
