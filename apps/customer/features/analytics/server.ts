import "server-only";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { getAuthenticatedCustomer } from "@/lib/session";
import { parseFilters, granularity, AnalyticsInputError } from "./filters";
import { buildAnalyticsSql } from "./sql";
import {
  sections,
  type AnalyticsData,
  type Envelope,
  type Section,
} from "./types";
export class AnalyticsError extends Error {
  constructor(public status: number) {
    super("Analytics unavailable");
  }
}
export async function getAnalytics(section: string, params: URLSearchParams) {
  if (!sections.includes(section as Section)) throw new AnalyticsError(404);
  const auth = await getAuthenticatedCustomer();
  if (!auth || !auth.phoneVerified) throw new AnalyticsError(401);
  const f = parseFilters(params),
    db = getAuthoritativeDatabaseClient();
  const owner = auth.user.id,
    session = auth.session.id;
  const limited = await db.queryFirst<{ allowed: boolean }>(
    "SELECT public.customer_analytics_limit(?) AS allowed",
    [session],
  );
  if (!limited?.allowed) throw new AnalyticsError(429);
  // Invalid or foreign scopes are errors, never widened into an all-vehicle view.
  if (f.vehicle) {
    const vehicle = await db.queryFirst(
      "SELECT id FROM vehicles WHERE id=? AND user_id=? AND deleted_at IS NULL AND status<>'DELETED'",
      [f.vehicle, owner],
    );
    if (!vehicle) throw new AnalyticsError(404);
  }
  if (f.qr) {
    const qr = await db.queryFirst(
      "SELECT a.qr_id FROM qr_assignments a JOIN vehicles v ON v.id=a.vehicle_id WHERE a.qr_id=? AND a.user_id=? AND a.ended_at IS NULL AND v.user_id=? AND v.deleted_at IS NULL AND v.status<>'DELETED' AND (?='' OR a.vehicle_id=?) LIMIT 1",
      [f.qr, owner, owner, f.vehicle, f.vehicle],
    );
    if (!qr) throw new AnalyticsError(404);
  }
  let cursor: { timestamp: string; id: string } | undefined;
  if (params.get("cursor")) {
    try {
      const encoded = params.get("cursor")!;
      if (encoded.length > 700) throw new Error();
      const value = JSON.parse(Buffer.from(encoded, "base64url").toString());
      if (
        typeof value.timestamp !== "string" ||
        !Number.isFinite(Date.parse(value.timestamp)) ||
        typeof value.id !== "string" ||
        !/^[A-Za-z0-9:_-]{1,160}$/.test(value.id)
      )
        throw new Error();
      cursor = value;
    } catch {
      throw new AnalyticsInputError("Please refresh the activity list.");
    }
  }
  const bucket = granularity(f);
  const query = buildAnalyticsSql(
    section as Section,
    owner,
    session,
    f,
    bucket,
    cursor,
  );
  const result = await db.queryFirst<{ data: AnalyticsData[Section] }>(
    query.sql,
    query.params,
  );
  if (!result) throw new AnalyticsError(401);
  if (section === "activity" || section === "scan-recent") {
    const data = result.data as
      AnalyticsData["activity"] | AnalyticsData["scan-recent"];
    const more = data.events.length > 25;
    data.events = data.events.slice(0, 25);
    const last = data.events.at(-1);
    data.cursor =
      more && last
        ? Buffer.from(
            JSON.stringify({ timestamp: last.timestamp, id: last.id }),
          ).toString("base64url")
        : null;
  }
  return {
    scope: `${owner}:${session}`,
    range: {
      from: f.from,
      to: f.to,
      timezone: "Asia/Kolkata",
      granularity: bucket,
    },
    updatedAt: new Date().toISOString(),
    data: result.data,
  } satisfies Envelope<Section>;
}
