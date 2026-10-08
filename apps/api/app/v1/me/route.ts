import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../_auth";
import { getUserRepository } from "@vaahansafe/database";
import { getApiDatabase } from "../_db";

export const dynamic = "force-dynamic";

/**
 * Customer Profile Endpoint (GET /v1/me, PATCH /v1/me)
 */
export async function GET(req: NextRequest) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;

  return NextResponse.json(
    {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        onboardingState: user.onboardingState,
        status: user.status,
        createdAt: user.createdAt,
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

export async function PATCH(req: NextRequest) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const body = await req.json().catch(() => ({}));

  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const email = typeof body?.email === "string" ? body.email.trim() : undefined;

  const db = getApiDatabase();
  const userRepo = getUserRepository(db);

  try {
    const updated = await userRepo.save({
      id: user.id,
      name: name !== undefined ? name : user.name,
      email: email !== undefined ? email : user.email,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: updated.id,
          phone: updated.phone,
          email: updated.email,
          name: updated.name,
          role: updated.role,
          onboardingState: updated.onboardingState,
          status: updated.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiMePatch] Update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile", code: "ERR_UPDATE_FAILED" },
      { status: 500 }
    );
  }
}
