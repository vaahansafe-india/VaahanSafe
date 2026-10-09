/**
 * Authoritative Database Client & Repository Factory
 *
 * Application services use Supabase PostgreSQL. Explicit D1 clients are retained
 * only for legacy tooling; missing Supabase credentials never select D1.
 * INVARIANT: Never falls back to mock or local databases.
 */

import type { DatabaseClient, D1DatabaseBinding } from "./d1";
import { D1DatabaseAdapter } from "./d1";
import { CloudflareD1HttpClient } from "./cloudflare-d1-http";
import { SupabaseDatabaseAdapter } from "./supabase-adapter";
import { SupabaseUserRepository, SupabaseAuthIdentityRepository, SupabaseSessionRepository } from "../repositories/supabase-auth.repository";
import type { UserRepository, AuthIdentityRepository, SessionRepository } from "@vaahansafe/types";
import { D1UserRepository } from "../repositories/user.repository";
import { D1AuthIdentityRepository } from "../repositories/auth-identity.repository";
import { D1SessionRepository } from "../repositories/session.repository";
import { D1VehicleRepository } from "../repositories/vehicle.repository";
import { D1EmergencyProfileRepository } from "../repositories/emergency.repository";
import {
  D1NotificationIntentRepository,
  D1NotificationRepository,
  D1NotificationDeliveryRepository,
  D1NotificationPreferenceRepository,
} from "../repositories/notification.repository";
import { D1JournalRepository } from "../repositories/journal.repository";
import { D1QrRepository } from "../repositories/qr.repository";
import { D1QrActivationSecretRepository } from "../repositories/qr-activation-secret.repository";
import { D1QrActivationAttemptRepository } from "../repositories/qr-activation-attempt.repository";
import { D1QrActivationChallengeRepository } from "../repositories/qr-activation-challenge.repository";

let defaultDatabaseClient: DatabaseClient | null = null;

/** Explicit D1-only resolver for authentication and provider operations. */
export function getCloudflareDatabaseClient(binding?: D1DatabaseBinding): DatabaseClient {
  const runtimeBinding = binding || (process.env as unknown as { DB?: D1DatabaseBinding }).DB;
  if (runtimeBinding && typeof runtimeBinding.prepare === "function") {
    return new D1DatabaseAdapter(runtimeBinding);
  }
  return new CloudflareD1HttpClient();
}

export function getAuthoritativeDatabaseClient(
  binding?: D1DatabaseBinding
): DatabaseClient {
  if (binding && typeof binding.prepare === "function") {
    return new D1DatabaseAdapter(binding);
  }
  if (!defaultDatabaseClient) {
    defaultDatabaseClient = new SupabaseDatabaseAdapter();
  }
  return defaultDatabaseClient;
}

export function getUserRepository(client?: DatabaseClient): UserRepository {
  return client && !(client instanceof SupabaseDatabaseAdapter) ? new D1UserRepository(client) : new SupabaseUserRepository();
}

export function getAuthIdentityRepository(
  client?: DatabaseClient
): AuthIdentityRepository {
  return client && !(client instanceof SupabaseDatabaseAdapter) ? new D1AuthIdentityRepository(client) : new SupabaseAuthIdentityRepository();
}

export function getSessionRepository(
  client?: DatabaseClient
): SessionRepository {
  return client && !(client instanceof SupabaseDatabaseAdapter) ? new D1SessionRepository(client) : new SupabaseSessionRepository();
}

export function getVehicleRepository(
  client?: DatabaseClient
): D1VehicleRepository {
  return new D1VehicleRepository(client || getAuthoritativeDatabaseClient());
}

export function getEmergencyRepository(
  client?: DatabaseClient
): D1EmergencyProfileRepository {
  return new D1EmergencyProfileRepository(client || getAuthoritativeDatabaseClient());
}

export function getNotificationRepositories(client?: DatabaseClient) {
  const db = client || getAuthoritativeDatabaseClient();
  return {
    intents: new D1NotificationIntentRepository(db),
    notifications: new D1NotificationRepository(db),
    deliveries: new D1NotificationDeliveryRepository(db),
  };
}

export function getNotificationRepository(client?: DatabaseClient): D1NotificationRepository {
  return getNotificationRepositories(client).notifications;
}

export function getNotificationPreferenceRepository(client?: DatabaseClient): D1NotificationPreferenceRepository {
  return new D1NotificationPreferenceRepository(client || getAuthoritativeDatabaseClient());
}

export function getJournalRepository(client?: DatabaseClient): D1JournalRepository {
  return new D1JournalRepository(client || getAuthoritativeDatabaseClient());
}

export function getQrRepository(client?: DatabaseClient): D1QrRepository {
  return new D1QrRepository(client || getAuthoritativeDatabaseClient());
}

export function getQrActivationSecretRepository(client?: DatabaseClient): D1QrActivationSecretRepository {
  return new D1QrActivationSecretRepository(client || getAuthoritativeDatabaseClient());
}

export function getQrActivationAttemptRepository(client?: DatabaseClient): D1QrActivationAttemptRepository {
  return new D1QrActivationAttemptRepository(client || getAuthoritativeDatabaseClient());
}

export function getQrActivationChallengeRepository(client?: DatabaseClient): D1QrActivationChallengeRepository {
  return new D1QrActivationChallengeRepository(client || getAuthoritativeDatabaseClient());
}
