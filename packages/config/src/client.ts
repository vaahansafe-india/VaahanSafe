/**
 * VaahanSafe Client-Safe Configuration
 *
 * INVARIANT: Contains ONLY public configuration. Never expose secrets or credentials here.
 * Safe to import and execute in browser, Edge runtime, and React Server/Client components.
 */

import { z } from "zod";

export const clientEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  NEXT_PUBLIC_WEB_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_ACTIVATE_URL: z.string().url().optional(),
  NEXT_PUBLIC_QR_URL: z.string().url().optional(),
  NEXT_PUBLIC_BLOG_URL: z.string().url().optional(),
  NEXT_PUBLIC_STATUS_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_ADMIN_URL: z.string().url().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

export type ClientConfig = z.infer<typeof clientEnvSchema>;

/**
 * Returns strictly validated client-safe configuration.
 */
export function getClientConfig(): ClientConfig {
  return clientEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ACTIVATE_URL: process.env.NEXT_PUBLIC_ACTIVATE_URL,
    NEXT_PUBLIC_QR_URL: process.env.NEXT_PUBLIC_QR_URL,
    NEXT_PUBLIC_BLOG_URL: process.env.NEXT_PUBLIC_BLOG_URL,
    NEXT_PUBLIC_STATUS_URL: process.env.NEXT_PUBLIC_STATUS_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
}
