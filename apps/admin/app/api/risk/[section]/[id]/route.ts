import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../../lib/api";
import {
  riskSignalDetail,
  riskCaseDetail,
  riskCommand,
} from "../../../../../features/risk/server/risk";
function kind(section: string) {
  if (!["signals", "cases"].includes(section))
    throw new AdminError(
      404,
      "NOT_FOUND",
      "This investigation record is unavailable.",
    );
  return section === "signals" ? "signal" : "case";
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ section: string; id: string }> },
) {
  try {
    const i = await requireAdmin("fraud"),
      p = await params;
    return adminResponse(
      await (kind(p.section) === "signal"
        ? riskSignalDetail(i, p.id)
        : riskCaseDetail(i, p.id)),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ section: string; id: string }> },
) {
  try {
    assertSameOrigin(request);
    const i = await requireAdmin("fraud"),
      p = await params;
    if (Number(request.headers.get("content-length")) > 6000)
      throw new AdminError(
        413,
        "INVALID_COMMAND",
        "Provide a concise investigation reason.",
      );
    let body;
    try {
      body = await request.json();
    } catch {
      throw new AdminError(
        400,
        "INVALID_COMMAND",
        "Provide a valid investigation decision.",
      );
    }
    return adminResponse(await riskCommand(i, kind(p.section), p.id, body));
  } catch (e) {
    return adminFailure(e);
  }
}
