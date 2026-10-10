import { adminResponse, adminFailure } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/session";
import {
  retailerRpc,
  validRetailerId,
} from "../../../../features/retailers/server/retailers";
import { normalizeRetailerSearch } from "../../../../features/retailers/retailer.filters";
export async function GET(request: Request) {
  try {
    const identity = await requireAdmin("retailers"),
      p = new URL(request.url).searchParams;
    return adminResponse(
      await retailerRpc(identity, "admin_retailer_distributors", {
        p_q: normalizeRetailerSearch(p.get("q") || ""),
        p_id: p.get("id") ? validRetailerId(p.get("id")!) : null,
      }),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
