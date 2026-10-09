/**
 * Authoritative Database Resolver for Central API (apps/api)
 *
 * Business records are stored in Supabase. Cloudflare bindings are used only
 * by storage and monitoring services.
 */

import {
  getAuthoritativeDatabaseClient,
  type DatabaseClient,
} from "@vaahansafe/database";

export function getApiDatabase(): DatabaseClient {
  return getAuthoritativeDatabaseClient();
}
