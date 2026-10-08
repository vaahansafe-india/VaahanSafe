import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { hashSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@vaahansafe/auth";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { ADMIN_ROLES, canReadModule } from "./modules";
import type { AdminIdentity } from "./contracts";

export class AdminError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const getAdminIdentity = cache(
  async (): Promise<AdminIdentity | null> => {
    const token = (await cookies()).get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!token || token.length < 32 || token.length > 256) return null;
    const db = getSupabaseAdminClient();
    const { data: session, error } = await db
      .from("admin_sessions")
      .select("id,admin_id,phone_verified_at,step_up_at,created_at,expires_at")
      .eq("token_hash", await hashSessionToken(token))
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error)
      throw new AdminError(
        503,
        "SERVICE_UNAVAILABLE",
        "We couldn't open the admin workspace right now. Please try again.",
      );
    if (
      !session ||
      Date.now() - Date.parse(session.created_at) > 4 * 60 * 60 * 1000
    )
      return null;
    const { data: actor, error: actorError } = await db
      .from("admin_users")
      .select("id,name,email,role,status")
      .eq("id", session.admin_id)
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (actorError)
      throw new AdminError(
        503,
        "SERVICE_UNAVAILABLE",
        "We couldn't open the admin workspace right now. Please try again.",
      );
    if (!actor || !ADMIN_ROLES.includes(actor.role)) return null;
    return {
      id: actor.id,
      name: actor.name,
      email: actor.email,
      role: actor.role,
      sessionId: session.id,
      phoneVerified: !!session.phone_verified_at,
      stepUpAt: session.step_up_at,
    };
  },
);
export async function requireAdmin(
  moduleKey?: string,
  options?: { pendingPhone?: boolean; stepUp?: boolean },
) {
  const identity = await getAdminIdentity();
  if (!identity)
    throw new AdminError(
      401,
      "AUTH_REQUIRED",
      "Sign in to your admin account to continue.",
    );
  if (!identity.phoneVerified && !options?.pendingPhone)
    throw new AdminError(
      403,
      "PHONE_REQUIRED",
      "Verify your mobile number to continue.",
    );
  if (moduleKey && !canReadModule(identity.role, moduleKey))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role does not have access to this workspace.",
    );
  if (
    options?.stepUp &&
    (!identity.stepUpAt ||
      Date.now() - Date.parse(identity.stepUpAt) > 10 * 60 * 1000)
  )
    throw new AdminError(
      403,
      "STEP_UP_REQUIRED",
      "Verify a fresh mobile OTP before this action.",
    );
  return identity;
}
export async function requireAdminPage(moduleKey: string) {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/login");
  if (!identity.phoneVerified) redirect("/verify-phone");
  if (!canReadModule(identity.role, moduleKey)) redirect("/access-denied");
  return identity;
}
export function assertSameOrigin(request: Request) {
  const expected =
    process.env.ADMIN_ORIGIN ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3004"
      : "https://admin.vaahansafe.com");
  if (request.headers.get("origin") !== expected)
    throw new AdminError(
      403,
      "ORIGIN_REJECTED",
      "Please reload this page and try again.",
    );
}
export function adminOrigin() {
  return (
    process.env.ADMIN_ORIGIN ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3004"
      : "https://admin.vaahansafe.com")
  );
}
