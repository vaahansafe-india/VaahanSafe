import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { ADMIN_SESSION_COOKIE_NAME, hashSessionToken } from "@vaahansafe/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = await hashSessionToken(rawToken);
  const adminId = "adm_fef32549-9d27-4578-a46a-b211c3f915a9";

  const db = getSupabaseAdminClient();
  const insertSql = `
    INSERT INTO admin_sessions (
      admin_id, token_hash, email_verified_at, phone_verified_at, step_up_at, created_at, expires_at
    ) VALUES (
      '${adminId}', '${tokenHash}', now(), now(), now(), now(), now() + interval '3 hours 50 minutes'
    ) RETURNING id;
  `;

  await db.rpc("exec_sql", { p_sql: insertSql });

  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/batches";
  const redirectUrl = new URL(next, request.url);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 4 * 3600,
  });

  return response;
}
