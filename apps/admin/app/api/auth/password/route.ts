import {
  getSupabaseAdminClient,
  getSupabaseClient,
} from "@vaahansafe/database";
import {
  generateRawSessionToken,
  hashSessionToken,
  ADMIN_SESSION_COOKIE_NAME,
} from "@vaahansafe/auth";
import { AdminError, assertSameOrigin } from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
import {
  adminCredentials,
  isAdminWorkEmail,
} from "../../../../lib/password-policy";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let boundary = "input_validation";
  try {
    assertSameOrigin(request);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Please enter your email and password.",
      );
    // Bound the actual stream, rather than trusting user-controlled Content-Length.
    const reader = request.body?.getReader();
    if (!reader)
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Please enter your email and password.",
      );
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        throw new AdminError(
          413,
          "INVALID_REQUEST",
          "Please enter your email and password.",
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Please enter your email and password.",
      );
    }
    if (
      !body ||
      typeof body !== "object" ||
      !isAdminWorkEmail((body as Record<string, unknown>).email)
    )
      throw new AdminError(
        400,
        "WORK_EMAIL_REQUIRED",
        "Use your @vaahansafe.com work email to continue.",
      );
    const credentials = adminCredentials(body);
    if (!credentials)
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Please enter a valid email and password.",
      );
    boundary = "database_configuration";
    const db = getSupabaseAdminClient();
    boundary = "attempt_reservation";
    const {
      data: allowed,
      error: limitError,
      status: limitStatus,
    } = await db.rpc("admin_reserve_password_attempt", {
      p_email_hash: await hashSessionToken(credentials.email),
    });
    if (limitError) {
      console.error("[admin] password reservation failed", {
        requestId,
        status: limitStatus,
        code: limitError.code,
      });
      throw new Error("Authentication service unavailable");
    }
    if (allowed !== true)
      throw new AdminError(
        429,
        "RATE_LIMITED",
        "Too many sign-in attempts. Please wait 15 minutes and try again.",
      );
    // This client is isolated per request. Password sign-in must not replace the
    // privileged database client's Authorization header with a user's JWT.
    boundary = "password_provider";
    const auth = getSupabaseClient({
      url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      key:
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SECRET_KEY,
    });
    const { data, error } = await auth.auth.signInWithPassword(credentials);
    if (error) {
      boundary = "failed_sign_in_audit";
      const { data: actor, error: actorError } = await db
        .from("admin_users")
        .select("id")
        .eq("email", credentials.email)
        .eq("status", "ACTIVE")
        .maybeSingle();
      if (actorError) throw new Error("Authentication service unavailable");
      if (actor) {
        const { error: auditError } = await db.from("admin_audit_logs").insert({
          actor_id: actor.id,
          action: "PASSWORD_SIGN_IN_REJECTED",
          resource_type: "admin_user",
          resource_id: actor.id,
          reason: "Password sign-in did not complete",
          request_id: requestId,
          before_summary: {},
          after_summary: {},
        });
        if (auditError) throw new Error("Authentication service unavailable");
      }
      if (error.status === 429)
        throw new AdminError(
          429,
          "RATE_LIMITED",
          "Too many sign-in attempts. Please wait and try again.",
        );
      if (!error.status || error.status >= 500)
        throw new Error("Authentication service unavailable");
      throw new AdminError(
        401,
        "SIGN_IN_REJECTED",
        "We couldn't sign you in with those details. Check your email and password, or contact your platform administrator.",
      );
    }
    try {
      boundary = "identity_authorization";
      if (
        !data.user?.id ||
        !data.user.email_confirmed_at ||
        data.user.email?.toLowerCase() !== credentials.email
      )
        throw new AdminError(
          401,
          "SIGN_IN_REJECTED",
          "We couldn't sign you in with those details. Check your email and password, or contact your platform administrator.",
        );
      const { data: actor, error: actorError } = await db
        .from("admin_users")
        .select("id")
        .eq("auth_user_id", data.user.id)
        .eq("status", "ACTIVE")
        .maybeSingle();
      if (actorError) throw new Error("Authentication service unavailable");
      if (!actor)
        throw new AdminError(
          401,
          "SIGN_IN_REJECTED",
          "We couldn't sign you in with those details. Check your email and password, or contact your platform administrator.",
        );
      const raw = generateRawSessionToken();
      boundary = "session_creation";
      const { error: sessionError } = await db.rpc("admin_password_session", {
        p_email: credentials.email,
        p_auth_user: data.user.id,
        p_hash: await hashSessionToken(raw),
        p_request: requestId,
      });
      if (sessionError) throw new Error("Authentication service unavailable");
      const response = adminResponse({ next: "/verify-phone" });
      response.cookies.set(ADMIN_SESSION_COOKIE_NAME, raw, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 4 * 3600,
      });
      return response;
    } finally {
      // Provider bearer/refresh tokens stay server-side and are discarded. Only
      // the revocable VaahanSafe session is ever delivered to the browser.
      await auth.auth.signOut({ scope: "local" });
    }
  } catch (error) {
    if (!(error instanceof AdminError))
      console.error("[admin] password service unavailable", {
        requestId,
        boundary,
      });
    const response = adminFailure(error, requestId);
    if (error instanceof AdminError && error.status === 429)
      response.headers.set("Retry-After", "900");
    return response;
  }
}
