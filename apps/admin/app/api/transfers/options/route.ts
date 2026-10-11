import { adminResponse, adminFailure } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/session";
import {
  transferRpc,
  validTransferId,
} from "../../../../features/transfers/server/transfers";
export async function GET(r: Request) {
  try {
    const i = await requireAdmin("transfers"),
      p = new URL(r.url).searchParams;
    return adminResponse(
      await transferRpc(i, "admin_transfer_options", {
        p_kind: p.get("kind") || "partners",
        p_source: p.get("source") ? validTransferId(p.get("source")!) : null,
        p_q: (p.get("q") || "").slice(0, 100),
        p_partner_kind: ["DISTRIBUTOR", "RETAILER"].includes(
          p.get("partnerKind") || "",
        )
          ? p.get("partnerKind")
          : null,
        p_active: p.get("active") === "true",
      }),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
