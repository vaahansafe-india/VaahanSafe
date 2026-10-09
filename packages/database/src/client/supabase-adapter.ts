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
  readonly dialect = "postgres" as const;
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
    // Ignore SQL strings/comments: a customer's literal '?' is not a bind marker.
    let formatted = sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|--[^\n]*|\/\*[\s\S]*?\*\/|\?/g, (token) => {
      if (token !== "?") return token;
      if (paramIndex >= params.length) {
        throw new Error(`[SupabaseAdapter] Parameter index mismatch: expected ${paramIndex + 1} parameters, got ${params.length}`);
      }
      const val = params[paramIndex++];
      return this.escapeValue(val);
    });
    if (paramIndex !== params.length) throw new Error("Database parameter count mismatch");

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
      throw new Error(`Database service unavailable (${response.status})`);
    }

    const result = await response.json();
    if (result?.error || result?.success === false) throw new Error("Database operation failed");
    return result;
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const formatted = this.formatSql(sql, params);
    const result = await this.callRpc(formatted);
    if (Array.isArray(result)) {
      return result as T[];
    }
    throw new Error("Database query returned an invalid result");
  }

  async queryFirst<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? (rows[0] as T) : null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean; rowsAffected?: number }> {
    const formatted = this.formatSql(sql, params);
    const result = await this.callRpc(formatted) as { success?: boolean; rowsAffected?: number };
    if (result?.success !== true) throw new Error("Database write was not confirmed");
    return { success: true, rowsAffected: result.rowsAffected };
  }

  async batch(operations: Array<{ sql: string; params?: unknown[] }>): Promise<boolean> {
    const formattedStatements = operations.map((op) => this.formatSql(op.sql, op.params || []));
    // A fixed $$ delimiter can be terminated by a bound string in the block body.
    let delimiter: string;
    do { delimiter = `$vs_${crypto.randomUUID().replaceAll("-", "")}$`; }
    while (formattedStatements.some(statement => statement.includes(delimiter)));
    const transactionSql = `DO ${delimiter} BEGIN\n${formattedStatements.map(s => `  ${s.replace(/;?\s*$/, "")};`).join("\n")}\nEND ${delimiter};`;
    await this.callRpc(transactionSql);
    return true;
  }
}
