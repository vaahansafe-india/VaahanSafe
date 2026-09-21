/**
 * VaahanSafe Cloudflare Environment & Resource Contract
 *
 * Enforces strict environment isolation, deterministic resource naming,
 * stable logical application bindings, and provider-mode guards.
 */

export type RuntimeEnvironment = "local" | "development" | "staging" | "production";

export type ProviderMode = "mock" | "sandbox" | "live";

export type R2BucketClass = "public" | "private" | "exports";

export type QueueType = "notifications" | "analytics" | "commerce" | "dlq";

/**
 * Stable application binding names across all environments.
 * INVARIANT: Physical resource names change per environment, but application
 * code interacts exclusively with these stable binding identifiers.
 */
export const BINDING_NAMES = {
  DB: "DB",
  PUBLIC_STORAGE: "PUBLIC_STORAGE",
  PRIVATE_STORAGE: "PRIVATE_STORAGE",
  EXPORT_STORAGE: "EXPORT_STORAGE",
  NOTIFICATION_QUEUE: "NOTIFICATION_QUEUE",
  ANALYTICS_QUEUE: "ANALYTICS_QUEUE",
  COMMERCE_QUEUE: "COMMERCE_QUEUE",
} as const;

export type LogicalBindingName = keyof typeof BINDING_NAMES;

/**
 * Maps runtime environment to standard short code for resource naming.
 */
function envShortCode(env: RuntimeEnvironment): string {
  switch (env) {
    case "production":
      return "prod";
    case "staging":
      return "staging";
    case "development":
      return "dev";
    case "local":
    default:
      return "dev";
  }
}

/**
 * Generates deterministic, environment-qualified D1 database names.
 * Example: "vaahansafe-dev-db", "vaahansafe-prod-db"
 */
export function getD1DatabaseName(env: RuntimeEnvironment): string {
  return `vaahansafe-${envShortCode(env)}-db`;
}

/**
 * Generates deterministic, environment-qualified R2 bucket names.
 * Example: "vaahansafe-dev-public", "vaahansafe-prod-private"
 */
export function getR2BucketName(bucketClass: R2BucketClass, env: RuntimeEnvironment): string {
  return `vaahansafe-${envShortCode(env)}-${bucketClass}`;
}

/**
 * Generates deterministic, environment-qualified Queue names.
 * Example: "vaahansafe-dev-notifications", "vaahansafe-prod-commerce-events"
 */
export function getQueueName(queueType: QueueType, env: RuntimeEnvironment): string {
  const code = envShortCode(env);
  switch (queueType) {
    case "notifications":
      return `vaahansafe-${code}-notifications`;
    case "analytics":
      return `vaahansafe-${code}-analytics-events`;
    case "commerce":
      return `vaahansafe-${code}-commerce-events`;
    case "dlq":
      return `vaahansafe-${code}-dlq`;
  }
}

/**
 * Returns current runtime environment, defaulting safely to "local".
 */
export function getRuntimeEnvironment(): RuntimeEnvironment {
  const env =
    process.env.APP_ENV ||
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.NODE_ENV ||
    "local";

  switch (env.toLowerCase()) {
    case "production":
    case "prod":
      return "production";
    case "staging":
      return "staging";
    case "development":
    case "dev":
      return "development";
    case "local":
    case "test":
    default:
      return "local";
  }
}

export function isLocalEnv(): boolean {
  return getRuntimeEnvironment() === "local";
}

export function isDevelopmentEnv(): boolean {
  return getRuntimeEnvironment() === "development";
}

export function isStagingEnv(): boolean {
  return getRuntimeEnvironment() === "staging";
}

export function isProductionEnv(): boolean {
  return getRuntimeEnvironment() === "production";
}


/**
 * Guard preventing destructive or test operations from running in production.
 */
export function assertNonProduction(env: RuntimeEnvironment, operation: string): void {
  if (env === "production") {
    throw new Error(
      `[Security Invariant Violation] Dangerous operation "${operation}" is strictly forbidden in PRODUCTION environment!`
    );
  }
}

/**
 * Guard verifying that production operations are explicitly running against production.
 */
export function assertProduction(env: RuntimeEnvironment, operation: string): void {
  if (env !== "production") {
    throw new Error(
      `[Configuration Error] Production-only operation "${operation}" was invoked in non-production environment "${env}"!`
    );
  }
}

/**
 * Guard preventing live provider credentials from being used in non-production,
 * and preventing test/sandbox providers from being used in production.
 *
 * INVARIANT 14: Local, development, and staging payment modes are NEVER live.
 */
export function assertProviderModeSafety(
  env: RuntimeEnvironment,
  providerMode: ProviderMode
): void {
  if (env !== "production" && providerMode === "live") {
    throw new Error(
      `[Security Invariant Violation] Live provider mode cannot be active in non-production environment "${env}"!`
    );
  }

  if (env === "production" && providerMode !== "live") {
    throw new Error(
      `[Configuration Error] Production environment requires live provider mode, but received "${providerMode}"!`
    );
  }
}

/**
 * Validates machine-readable resource lists to ensure strict environment isolation.
 *
 * INVARIANT 01–03:
 * - Production must NEVER reference -dev-, -staging-, or -local- resources.
 * - Staging must NEVER reference -prod- resources.
 * - Development/local must NEVER reference -prod- resources.
 */
export function validateResourceCrossover(
  env: RuntimeEnvironment,
  resourceNames: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const name of resourceNames) {
    if (env === "production") {
      if (name.includes("-dev-") || name.includes("-staging-") || name.includes("-local-")) {
        errors.push(
          `Production environment references non-production resource: "${name}"`
        );
      }
    } else if (env === "staging") {
      if (name.includes("-prod-")) {
        errors.push(`Staging environment references production resource: "${name}"`);
      }
    } else {
      // local or development
      if (name.includes("-prod-") || name.includes("-staging-")) {
        errors.push(
          `${env} environment references protected higher-tier resource: "${name}"`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
