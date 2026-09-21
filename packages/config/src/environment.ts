/**
 * Runtime Environment Utilities
 */

export type AppEnvironment = "development" | "test" | "production";

/**
 * Returns the current runtime environment safely across node, edge, and browser runtimes.
 */
export function getAppEnv(): AppEnvironment {
  const env =
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.NODE_ENV ||
    "development";

  if (env === "production" || env === "prod") {
    return "production";
  }
  if (env === "test") {
    return "test";
  }
  return "development";
}

export function isProduction(): boolean {
  return getAppEnv() === "production";
}

export function isDevelopment(): boolean {
  return getAppEnv() === "development";
}

export function isTest(): boolean {
  return getAppEnv() === "test";
}
