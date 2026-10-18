import { requireAdmin, AdminError } from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
import { parseRiskFilters } from "../../../../features/risk/risk.filters";
import {
  listRiskSignals,
  listRiskCases,
  riskSummary,
  riskPulse,
  riskPatterns,
  riskRpc,
} from "../../../../features/risk/server/risk";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ section: string }> },
) {
  try {
    const i = await requireAdmin("fraud"),
      { section } = await params,
      p = new URL(request.url).searchParams,
      f = parseRiskFilters(p);
    switch (section) {
      case "signals":
        return adminResponse(await listRiskSignals(i, f, p.get("cursor")));
      case "cases":
        return adminResponse(await listRiskCases(i, f, p.get("cursor")));
      case "summary":
        return adminResponse(await riskSummary(i));
      case "pulse":
        return adminResponse(await riskPulse(i));
      case "patterns":
        return adminResponse(await riskPatterns(i, f));
      case "options": {
        const kind = p.get("kind");
        if (!["investigators", "cases"].includes(kind || ""))
          throw new AdminError(
            400,
            "INVALID_OPTIONS",
            "Choose an investigation option.",
          );
        return adminResponse(
          await riskRpc(i, "admin_risk_options", { p_kind: kind }),
        );
      }
      default:
        throw new AdminError(
          404,
          "NOT_FOUND",
          "This risk operation is unavailable.",
        );
    }
  } catch (e) {
    return adminFailure(e);
  }
}
