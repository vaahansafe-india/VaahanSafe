import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { z } from "zod";
import type { AdminIdentity } from "../../../lib/contracts";
import { canReadModule } from "../../../lib/modules";
import { AdminError } from "../../../lib/session";
import { riskCursor, riskPage } from "../risk.filters";
import type {
  RiskSignal,
  RiskCase,
  RiskFilters,
  RiskSummary,
  RiskPulse,
  RiskPattern,
  RiskDetail,
  RiskCaseDetail,
} from "../risk.types";
export async function riskRpc<T>(
  i: AdminIdentity,
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!canReadModule(i.role, "fraud"))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role cannot access risk operations.",
    );
  const { data, error } = await getSupabaseAdminClient()
    .rpc(name, { ...args, p_session: i.sessionId })
    .abortSignal(AbortSignal.timeout(20000));
  if (error) {
    if (/ADMIN_REQUIRED/.test(error.message))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Sign in with an authorized admin account to continue.",
      );
    if (/NOT_FOUND/.test(error.message))
      throw new AdminError(
        404,
        "NOT_FOUND",
        "This investigation record could not be found.",
      );
    if (/STATE_CHANGED|REQUEST_CONFLICT/.test(error.message))
      throw new AdminError(
        409,
        "STATE_CHANGED",
        "This record changed. Refresh the evidence before continuing.",
      );
    if (/UNREVIEWED_SIGNALS/.test(error.message))
      throw new AdminError(
        409,
        "REVIEW_REQUIRED",
        "Review and resolve the linked signals before closing this investigation.",
      );
    if (/RATE_LIMIT/.test(error.message))
      throw new AdminError(
        429,
        "RATE_LIMITED",
        "Wait before requesting another risk report.",
      );
    if (/INVALID_/.test(error.message))
      throw new AdminError(
        400,
        "INVALID_ACTION",
        "Review the selected action, outcome and current investigation state.",
      );
    console.error("[risk] service unavailable", {
      operation: name,
      code: error.code,
    });
    throw new AdminError(
      503,
      "RISK_UNAVAILABLE",
      "We couldn't load risk operations right now. Please try again.",
    );
  }
  return data as T;
}
export function riskId(id: string) {
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)
  )
    throw new AdminError(
      400,
      "INVALID_REFERENCE",
      "Choose a valid investigation record.",
    );
  return id;
}
function cursor(v: string | null) {
  try {
    return riskCursor(v);
  } catch {
    throw new AdminError(
      400,
      "INVALID_CURSOR",
      "Refresh the investigation queue to continue.",
    );
  }
}
export const listRiskSignals = async (
  i: AdminIdentity,
  f: RiskFilters,
  c: string | null = null,
) =>
  riskPage(
    await riskRpc<RiskSignal[]>(i, "admin_risk_signals", {
      p_filters: f,
      p_cursor: cursor(c),
    }),
    "observed_at",
  );
export const listRiskCases = async (
  i: AdminIdentity,
  f: RiskFilters,
  c: string | null = null,
) =>
  riskPage(
    await riskRpc<RiskCase[]>(i, "admin_risk_cases", {
      p_filters: f,
      p_cursor: cursor(c),
    }),
    "opened_at",
  );
export const riskSummary = (i: AdminIdentity) =>
  riskRpc<RiskSummary>(i, "admin_risk_summary");
export const riskPulse = (i: AdminIdentity) =>
  riskRpc<RiskPulse>(i, "admin_risk_pulse");
export const riskPatterns = (i: AdminIdentity, f: RiskFilters) =>
  riskRpc<RiskPattern[]>(i, "admin_risk_patterns", { p_filters: f });
export const riskSignalDetail = (i: AdminIdentity, id: string) =>
  riskRpc<RiskDetail>(i, "admin_risk_signal_detail", { p_id: riskId(id) });
export const riskCaseDetail = (i: AdminIdentity, id: string) =>
  riskRpc<RiskCaseDetail>(i, "admin_risk_case_detail", { p_id: riskId(id) });
const command = z
  .object({
    action: z.enum([
      "review",
      "create_case",
      "attach_case",
      "monitor",
      "resolve",
      "dismiss",
      "assign",
      "note",
      "close",
    ]),
    revision: z.number().int().min(0),
    reason: z.string().trim().min(10).max(1000),
    outcome: z.string().max(60).default(""),
    target: z
      .string()
      .regex(/^[A-Za-z0-9_-]*$/)
      .max(100)
      .default(""),
    requestId: z.string().uuid(),
  })
  .strict();
export function canReviewRisk(role: AdminIdentity["role"]) {
  return ["SUPER_ADMIN", "OPS_ADMIN"].includes(role);
}
export async function riskCommand(
  i: AdminIdentity,
  kind: "signal" | "case",
  id: string,
  body: unknown,
) {
  if (!canReviewRisk(i.role))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role can inspect evidence but cannot record investigation decisions.",
    );
  const parsed = command.safeParse(body);
  if (!parsed.success)
    throw new AdminError(
      400,
      "INVALID_COMMAND",
      "Provide a valid action and an operational reason of at least 10 characters.",
    );
  const b = parsed.data;
  return riskRpc<{ id: string; caseId: string | null; recorded: boolean }>(
    i,
    "admin_risk_command",
    {
      p_kind: kind,
      p_id: riskId(id),
      p_action: b.action,
      p_revision: b.revision,
      p_reason: b.reason,
      p_outcome: b.outcome,
      p_target: b.target,
      p_request: b.requestId,
    },
  );
}
