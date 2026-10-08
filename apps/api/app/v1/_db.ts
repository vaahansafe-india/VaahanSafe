/**
 * Authoritative Database Resolver for Central API (apps/api)
 *
 * Resolves Cloudflare D1 native bindings when running on Cloudflare Workers,
 * or falls back to CloudflareD1HttpClient / Supabase in Next.js Server environments.
 */

import {
  getAuthoritativeDatabaseClient,
  D1DatabaseAdapter,
  type DatabaseClient,
  type D1DatabaseBinding,
} from "@vaahansafe/database";

export function getApiDatabase(): DatabaseClient {
  const env = process.env as Record<string, unknown>;
  const d1Binding = env.DB;

  if (d1Binding && typeof (d1Binding as { prepare?: unknown }).prepare === "function") {
    return new D1DatabaseAdapter(d1Binding as unknown as D1DatabaseBinding);
  }

  return getAuthoritativeDatabaseClient();
}
