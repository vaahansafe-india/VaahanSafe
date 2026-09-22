/**
 * VaahanSafe Server-Only Secret Configuration
 *
 * INVARIANT: Must NEVER be imported or executed in browser client bundles.
 * Enforces strict environment separation and secret validation for backend services.
 */

import { z } from "zod";

export const serverConfigSchema = z.object({
  // Session & Security
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters").optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // MSG91 Provider
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_OTP_TEMPLATE_ID: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),

  // Payment Provider Configuration
  PAYMENT_PROVIDER: z.enum(["razorpay", "cashfree"]).default("razorpay"),
  RAZORPAY_MODE: z.enum(["test", "live"]).default("test"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Legacy Cashfree Payment Gateway (Retained for historical audit)
  CASHFREE_CLIENT_ID: z.string().optional(),
  CASHFREE_CLIENT_SECRET: z.string().optional(),
  CASHFREE_WEBHOOK_SECRET: z.string().optional(),

  // Email Provider
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().email().optional(),

  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

/**
 * Asserts that the code is running in a server runtime and returns validated server configuration.
 * Throws an error immediately if accidentally invoked inside a browser window.
 */
export function getServerConfig(options?: { strict?: boolean }): ServerConfig {
  const isBrowser = typeof globalThis !== "undefined" && "window" in globalThis;
  if (isBrowser) {
    throw new Error(
      "[Security Invariant Violation] getServerConfig() was called in a browser context! Server secrets must never be loaded on the client."
    );
  }


  const parsed = serverConfigSchema.safeParse(process.env);

  if (!parsed.success) {
    const errorMsg = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");

    if (options?.strict || process.env.NODE_ENV === "production") {
      throw new Error(`[VaahanSafe ServerConfig] Invalid server environment: ${errorMsg}`);
    }
  }

  return (parsed.success ? parsed.data : {}) as ServerConfig;
}
