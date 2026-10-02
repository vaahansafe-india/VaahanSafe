/**
 * Authoritative Supabase PostgreSQL Database Client Adapter
 * 
 * Replaces Cloudflare D1 (SQLite) with Supabase (PostgreSQL) as the
 * single authoritative source of truth for all domain services.
 */

import type { DatabaseClient } from "./d1";

export interface SupabaseAdapterConfig {
  url?: string;
  serviceKey?: string;
}

export class SupabaseDatabaseAdapter implements DatabaseClient {
  private url: string;
  private serviceKey: string;

  constructor(config?: SupabaseAdapterConfig) {
    this.url = (
      config?.url ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://zpjwrptrqgpeyvlvscpv.supabase.co"
    ).replace(/\/$/, "");

    this.serviceKey =
      config?.serviceKey ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY || "";
    if (!this.serviceKey) throw new Error("Supabase server credentials are missing");
  }

  /**
   * Safely formats SQL statements by substituting ? positional parameters
   * with properly escaped PostgreSQL literals and translating SQLite idioms.
   */
  private formatSql(sql: string, params: unknown[] = []): string {
    let paramIndex = 0;
    
    // Replace ? with formatted values
    let formatted = sql.replace(/\?/g, () => {
      if (paramIndex >= params.length) {
        throw new Error(`[SupabaseAdapter] Parameter index mismatch: expected ${paramIndex + 1} parameters, got ${params.length}`);
      }
      const val = params[paramIndex++];
      return this.escapeValue(val);
    });

    // Translate SQLite idioms to PostgreSQL
    if (/insert\s+or\s+ignore\s+into/i.test(formatted)) {
      formatted = formatted.replace(/insert\s+or\s+ignore\s+into/gi, "INSERT INTO");
      if (!/on\s+conflict/i.test(formatted)) {
        formatted += " ON CONFLICT DO NOTHING";
      }
    }

    return formatted;
  }

  private escapeValue(val: unknown): string {
    if (val === null || val === undefined) {
      return "NULL";
    }
    if (typeof val === "number") {
      return Number.isFinite(val) ? String(val) : "NULL";
    }
    if (typeof val === "boolean") {
      return val ? "TRUE" : "FALSE";
    }
    if (typeof val === "string") {
      return `'${val.replace(/'/g, "''")}'`;
    }
    if (typeof val === "object") {
      const json = JSON.stringify(val);
      return `'${json.replace(/'/g, "''")}'::jsonb`;
    }
    return `'${String(val).replace(/'/g, "''")}'`;
  }

  private async callRpc(sql: string): Promise<unknown> {
    const endpoint = `${this.url}/rest/v1/rpc/exec_sql`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.serviceKey,
        Authorization: `Bearer ${this.serviceKey}`,
      },
      body: JSON.stringify({ p_sql: sql }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`[SupabaseAdapter Error ${response.status}]: ${errorText}`);
    }

    return response.json();
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const formatted = this.formatSql(sql, params);
    const result = await this.callRpc(formatted);
    if (Array.isArray(result)) {
      return result as T[];
    }
    return [];
  }

  async queryFirst<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? (rows[0] as T) : null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean; rowsAffected?: number }> {
    const formatted = this.formatSql(sql, params);
    await this.callRpc(formatted);
    return { success: true };
  }

  async batch(operations: Array<{ sql: string; params?: unknown[] }>): Promise<boolean> {
    const formattedStatements = operations.map((op) => this.formatSql(op.sql, op.params || []));
    const transactionSql = `DO $$ BEGIN\n${formattedStatements.map(s => `  ${s.replace(/;?\s*$/, "")};`).join("\n")}\nEND $$;`;
    await this.callRpc(transactionSql);
    return true;
  }
}
