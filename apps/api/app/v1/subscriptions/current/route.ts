import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../../_auth";
import { getApiDatabase } from "../../_db";

export const dynamic = "force-dynamic";

/**
 * Current Subscription & Service Entitlements (GET /v1/subscriptions/current)
 *
 * Implements decoupled Concept 3 & 4 (Entitlements vs Subscriptions).
 */
export async function GET(req: NextRequest) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const db = getApiDatabase();

  try {
    // 1. Fetch active subscription & plan info
    const sub = await db.queryFirst<{
      id: string;
      plan_id: string;
      status: string;
      current_period_start: string | null;
      current_period_end: string | null;
      plan_name: string | null;
      plan_code: string | null;
      vehicle_limit: number | null;
      contact_limit: number | null;
    }>(
      `SELECT s.id, s.plan_id, s.status, s.current_period_start, s.current_period_end,
              p.name AS plan_name, p.code AS plan_code, p.vehicle_limit, p.contact_limit
       FROM subscriptions s
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = ? AND s.status = 'ACTIVE'
       ORDER BY s.created_at DESC`,
      [user.id]
    );

    // 2. Fetch authoritative service entitlements (Concept 3)
    const entitlements = await db.query<{
      capability: string;
      status: string;
      vehicle_id: string;
      qr_sticker_id: string;
      acquisition_source: string;
    }>(
      `SELECT capability, status, vehicle_id, qr_sticker_id, acquisition_source
       FROM service_entitlements
       WHERE user_id = ? AND status = 'ENABLED'`,
      [user.id]
    );

    return NextResponse.json(
      {
        success: true,
        subscription: sub
          ? {
              id: sub.id,
              planCode: sub.plan_code || "STANDARD",
              planName: sub.plan_name || "Standard Safety Tier",
              status: sub.status,
              currentPeriodStart: sub.current_period_start,
              currentPeriodEnd: sub.current_period_end,
              limits: {
                vehicleLimit: sub.vehicle_limit || 1,
                contactLimit: sub.contact_limit || 3,
              },
            }
          : {
              planCode: "COMMUNITY_FREE",
              planName: "Community Safety",
              status: "ACTIVE",
              limits: {
                vehicleLimit: 1,
                contactLimit: 2,
              },
            },
        entitlements: entitlements.map((e) => ({
          capability: e.capability,
          status: e.status,
          vehicleId: e.vehicle_id,
          stickerId: e.qr_sticker_id,
          source: e.acquisition_source,
        })),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[ApiSubscriptionCurrentGet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load subscription details", code: "ERR_LOAD_SUBSCRIPTION" },
      { status: 500 }
    );
  }
}
