import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "../../_auth";

export const dynamic = "force-dynamic";

/**
 * Session Inspection Endpoint (GET /v1/auth/session)
 *
 * Returns active user identity and session validity.
 */
export async function GET(req: NextRequest) {
  const auth = await getApiAuthContext(req);

  if (!auth) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: auth.user.id,
        phone: auth.user.phone,
        email: auth.user.email,
        name: auth.user.name,
        role: auth.user.role,
        onboardingState: auth.user.onboardingState,
        status: auth.user.status,
      },
      session: {
        id: auth.session.id,
        expiresAt: auth.session.expiresAt,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}
