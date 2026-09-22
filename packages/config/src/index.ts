import { z } from "zod";

export * from "./surfaces";
export * from "./environment";
export * from "./domains";
export * from "./client";
export * from "./server";
export * from "./cloudflare-env";
export * from "./bindings";



export const APP_PORTS = {
  web: 3000,
  customer: 3001,
  activate: 3002,
  qr: 3003,
  admin: 3004,
  api: 3005,
  blog: 3006,
  status: 3007,
} as const;

export const DOMAINS = {
  web: process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000",
  customer: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  activate: process.env.NEXT_PUBLIC_ACTIVATE_URL || "http://localhost:3002",
  qr: process.env.NEXT_PUBLIC_QR_URL || "http://localhost:3003",
  admin: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3004",
  api: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005",
  blog: process.env.NEXT_PUBLIC_BLOG_URL || "http://localhost:3006",
  status: process.env.NEXT_PUBLIC_STATUS_URL || "http://localhost:3007",
} as const;

export const APP_NAMES = {
  web: "VaahanSafe Web",
  customer: "Customer Portal",
  activate: "QR Activation",
  qr: "QR Resolver",
  admin: "Operations Console",
  api: "Central API",
  blog: "Editorial & Safety",
  status: "System Status",
} as const;

export const FEATURE_FLAGS = {
  enableTurnstile: false,
  enableRazorpayTestMode: true,
  enableCashfreeSandbox: false,
  enableWhatsappAlerts: false,
} as const;

/**
 * Public client-safe environment schema
 */
export const publicEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  NEXT_PUBLIC_WEB_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_ACTIVATE_URL: z.string().url().optional(),
  NEXT_PUBLIC_QR_URL: z.string().url().optional(),
});

/**
 * Server-only secret environment schema (validated when required at runtime)
 */
export const serverEnvSchema = z.object({
  SESSION_SECRET: z.string().min(16).optional(),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_OTP_TEMPLATE_ID: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(["razorpay", "cashfree"]).default("razorpay"),
  RAZORPAY_MODE: z.enum(["test", "live"]).default("test"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CASHFREE_CLIENT_ID: z.string().optional(),
  CASHFREE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getPublicConfig(): PublicEnv {
  return publicEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ACTIVATE_URL: process.env.NEXT_PUBLIC_ACTIVATE_URL,
    NEXT_PUBLIC_QR_URL: process.env.NEXT_PUBLIC_QR_URL,
  });
}
