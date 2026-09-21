/**
 * Cloudflare D1 Authoritative HTTP Client
 *
 * Provides a production-grade DatabaseClient implementation for Next.js, Edge,
 * and Server environments communicating with the real Cloudflare D1 database.
 * INVARIANT: Never uses mock databases or local SQLite fallback.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { DatabaseClient, normalizeDatabaseError } from "./d1";

import dns from "dns";
if (typeof dns !== "undefined" && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

function findRepoRoot(startDir: string = process.cwd()): string {
  let current = path.resolve(startDir);
  while (true) {
    if (
      fs.existsSync(
        path.join(current, "infrastructure", "cloudflare", "environments", "wrangler.dev.toml")
      ) ||
      fs.existsSync(path.join(current, "turbo.json"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return startDir;
}

export interface CloudflareD1HttpClientOptions {
  accountId?: string;
  databaseId?: string;
  token?: string;
}

export function formatSql(sql: string, params: unknown[] = []): string {
  if (!params || params.length === 0) return sql;
  let idx = 0;
  return sql.replace(/\?/g, () => {
    if (idx >= params.length) return "?";
    const val = params[idx++];
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "number") return String(val);
    if (typeof val === "boolean") return val ? "1" : "0";
    return `'${String(val).replace(/'/g, "''")}'`;
  });
}

export class CloudflareD1HttpClient implements DatabaseClient {
  private accountId: string;
  private databaseId: string;
  private token: string;

  constructor(options: CloudflareD1HttpClientOptions = {}) {
    this.accountId =
      options.accountId ||
      process.env.CLOUDFLARE_ACCOUNT_ID ||
      "980cb7ee6eaacd3746d51f46bd62217a";

    this.databaseId =
      options.databaseId ||
      process.env.CLOUDFLARE_D1_DATABASE_ID ||
      "ed46249f-2967-4cd4-8807-75e1421d1754";

    this.token =
      options.token ||
      process.env.CLOUDFLARE_API_TOKEN ||
      this.extractTokenFromWrangler() ||
      "";
  }

  private extractTokenFromWrangler(): string | null {
    try {
      const candidates = [
        path.join(
          process.env.APPDATA || "",
          "xdg.config",
          ".wrangler",
          "config",
          "default.toml"
        ),
        path.join(
          process.env.USERPROFILE || process.env.HOME || "",
          ".wrangler",
          "config",
          "default.toml"
        ),
      ];

      for (const p of candidates) {
        if (p && fs.existsSync(p)) {
          const content = fs.readFileSync(p, "utf8");
          const match = content.match(/oauth_token\s*=\s*"([^"]+)"/);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
    } catch {
      // Ignored
    }
    return null;
  }

  private executeViaWrangler(
    sql: string,
    params: unknown[] = []
  ): { results: any[]; meta: any; success: boolean } {
    const formatted = formatSql(sql, params);
    const repoRoot = findRepoRoot();
    const configFile = path.join(
      repoRoot,
      "infrastructure",
      "cloudflare",
      "environments",
      "wrangler.dev.toml"
    );

    // Collapse newlines and whitespace for Windows shell execution
    const onelineSql = formatted.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
    const safeSql = onelineSql.replace(/"/g, '""');

    try {
      const remoteCmd = `npx wrangler d1 execute vaahansafe-dev-db --remote --config "${configFile}" --command "${safeSql}" --json`;
      const output = execSync(remoteCmd, {
        encoding: "utf8",
        cwd: repoRoot,
        stdio: ["pipe", "pipe", "pipe"],
      });

      const parsed = JSON.parse(output);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch (err: unknown) {
      throw normalizeDatabaseError(err);
    }

    return { results: [], meta: { changes: 0 }, success: true };
  }

  private async executeQuery(
    sql: string,
    params: unknown[] = []
  ): Promise<{ results: any[]; meta: any; success: boolean }> {
    // Dynamically retrieve the latest token from wrangler config
    const currentToken = this.token || this.extractTokenFromWrangler();

    // If token exists, attempt direct Cloudflare REST API execution first
    if (currentToken && !currentToken.startsWith("simulated")) {
      const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sql, params }),
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            success: boolean;
            errors?: Array<{ message: string; code: number }>;
            result?: Array<{ results: any[]; meta: any; success: boolean }>;
          };

          if (data.success && data.result && data.result.length > 0) {
            return data.result[0]!;
          }

          if (data.errors && data.errors.length > 0) {
            console.error("[CloudflareD1Http] D1 query errors:", data.errors);
            if (process.env.VERCEL || process.env.NODE_ENV === "production") {
              throw new Error(`D1 query error: ${data.errors[0]?.message}`);
            }
          }
        } else {
          const errText = await res.text();
          console.error(`[CloudflareD1Http] D1 API HTTP ${res.status}:`, errText);
          if (process.env.VERCEL || process.env.NODE_ENV === "production") {
            throw new Error(`D1 API query failed (HTTP ${res.status}): ${errText}`);
          }
        }
      } catch (err: unknown) {
        if (process.env.VERCEL || process.env.NODE_ENV === "production") {
          throw normalizeDatabaseError(err);
        }
        // Fall through to wrangler execution locally
      }
    }

    // In serverless / production environments (like Vercel), wrangler CLI is unavailable
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      throw new Error(
        "Cloudflare D1 credentials missing in production. Ensure CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_D1_DATABASE_ID are set in environment variables."
      );
    }

    // Authoritative execution via Cloudflare Wrangler runner
    return this.executeViaWrangler(sql, params);
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const res = await this.executeQuery(sql, params);
    return (res.results || []) as T[];
  }

  async queryFirst<T = unknown>(
    sql: string,
    params: unknown[] = []
  ): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 && results[0] !== undefined ? results[0] : null;
  }

  async execute(
    sql: string,
    params: unknown[] = []
  ): Promise<{ success: boolean; rowsAffected?: number }> {
    const res = await this.executeQuery(sql, params);
    const rowsAffected =
      typeof res.meta?.changes === "number" ? res.meta.changes : undefined;
    return { success: res.success, rowsAffected };
  }

  async batch(
    operations: Array<{ sql: string; params?: unknown[] }>
  ): Promise<boolean> {
    for (const op of operations) {
      await this.execute(op.sql, op.params || []);
    }
    return true;
  }
}
