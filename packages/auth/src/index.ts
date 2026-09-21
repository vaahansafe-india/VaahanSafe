/**
 * @vaahansafe/auth
 * Authoritative Identity, Authentication & Session Subsystem
 */

import type { User, UserRole, Session } from "@vaahansafe/types";

export interface AuthContext {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
}

export interface AuthGuardResult {
  allowed: boolean;
  redirectTo?: string;
  reason?: string;
}

/**
 * Checks role-based access
 */
export function checkRoleAccess(user: User | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export interface IOtpAuthProvider {
  sendOtp(phone: string): Promise<{ success: boolean; requestId?: string }>;
  verifyOtp(phone: string, otp: string, requestId?: string): Promise<{ success: boolean; user?: User }>;
}

export interface IOAuthAdapter {
  getAuthorizationUrl(redirectUri: string, state: string): string;
  handleCallback(code: string): Promise<{ providerUserId: string; email: string; name?: string }>;
}

// ----------------------------------------------------
// Section 7 Core Modules
// ----------------------------------------------------
export * from "./tokens/session-token";
export * from "./cookies/session-cookie";
export * from "./onboarding/first-login-machine";
export * from "./linking/account-linking";
export * from "./guards/route-guards";
export * from "./stepup/step-up";
