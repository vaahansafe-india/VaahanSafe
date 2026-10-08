import { NextRequest, NextResponse } from "next/server";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
  parseSessionCookie,
  validateSessionToken,
} from "@vaahansafe/auth";
import {
  getSessionRepository,
  getUserRepository,
} from "@vaahansafe/database";
import type { User, Session } from "@vaahansafe/types";
import { getApiDatabase } from "./_db";

export interface ApiAuthContext {
  user: User;
  session: Session;
  rawToken: string;
  isAdmin: boolean;
}

/**
 * Extracts and cryptographically verifies the active session from either:
 * 1. Authorization: Bearer <token>
 * 2. Cookie: vs_session / vs_admin_session
 */
export async function getApiAuthContext(req: Request): Promise<ApiAuthContext | null> {
  let rawToken: string | null = null;

  // 1. Check Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    rawToken = authHeader.slice(7).trim();
  }

  // 2. Check cookies
  if (!rawToken) {
    const cookieHeader = req.headers.get("cookie");
    rawToken =
      parseSessionCookie(cookieHeader, ADMIN_SESSION_COOKIE_NAME) ||
      parseSessionCookie(cookieHeader, CUSTOMER_SESSION_COOKIE_NAME);
  }

  if (!rawToken || rawToken.length < 32) {
    return null;
  }

  const db = getApiDatabase();
  const sessionRepo = getSessionRepository(db);
  const userRepo = getUserRepository(db);

  try {
    const session = await validateSessionToken(rawToken, sessionRepo);
    if (!session) {
      return null;
    }

    const user = await userRepo.findById(session.userId);
    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    const isAdmin =
      user.role === "ADMIN" ||
      user.role === "OPERATOR";

    return {
      user,
      session,
      rawToken,
      isAdmin,
    };
  } catch (err) {
    console.error("[ApiAuth] Session validation error:", err);
    return null;
  }
}

/**
 * Guard that guarantees an authenticated customer session or returns a standardized 401 response.
 */
export async function requireUserSession(req: Request): Promise<ApiAuthContext | NextResponse> {
  const auth = await getApiAuthContext(req);
  if (!auth) {
    return NextResponse.json(
      {
        error: "Authentication required to access this resource",
        code: "UNAUTHORIZED",
      },
      { status: 401 }
    );
  }
  return auth;
}

/**
 * Guard that guarantees an authenticated administrator session or returns 401/403.
 */
export async function requireAdminSession(req: Request): Promise<ApiAuthContext | NextResponse> {
  const auth = await getApiAuthContext(req);
  if (!auth) {
    return NextResponse.json(
      {
        error: "Authentication required to access this admin resource",
        code: "UNAUTHORIZED",
      },
      { status: 401 }
    );
  }

  if (!auth.isAdmin) {
    return NextResponse.json(
      {
        error: "Insufficient permissions for operations resource",
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }

  return auth;
}
