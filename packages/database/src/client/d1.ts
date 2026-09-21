/**
 * VaahanSafe D1 Database Client Adapter & Error Normalization
 */

export interface DatabaseQueryResult<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rowsRead?: number;
    rowsWritten?: number;
    changes?: number;
    last_row_id?: number;
  };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): {
    all<T = unknown>(): Promise<DatabaseQueryResult<T>>;
    first<T = unknown>(): Promise<T | null>;
    run(): Promise<{ success: boolean; meta: Record<string, unknown> }>;
  };
}

export interface D1DatabaseBinding {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<DatabaseQueryResult<T>[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface DatabaseClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  queryFirst<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<{ success: boolean; rowsAffected?: number }>;
  batch(operations: Array<{ sql: string; params?: unknown[] }>): Promise<boolean>;
}

export class D1DatabaseAdapter implements DatabaseClient {
  constructor(private binding: D1DatabaseBinding) {}

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      const res = await this.binding.prepare(sql).bind(...params).all<T>();
      return res.results;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err);
    }
  }

  async queryFirst<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    try {
      return await this.binding.prepare(sql).bind(...params).first<T>();
    } catch (err: unknown) {
      throw normalizeDatabaseError(err);
    }
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean; rowsAffected?: number }> {
    try {
      const res = await this.binding.prepare(sql).bind(...params).run();
      const rowsAffected = typeof res.meta?.changes === "number" ? res.meta.changes : undefined;
      return { success: res.success, rowsAffected };
    } catch (err: unknown) {
      throw normalizeDatabaseError(err);
    }
  }

  async batch(operations: Array<{ sql: string; params?: unknown[] }>): Promise<boolean> {
    try {
      const statements = operations.map((op) =>
        this.binding.prepare(op.sql).bind(...(op.params || []))
      );
      await this.binding.batch(statements as unknown as D1PreparedStatement[]);
      return true;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err);
    }
  }
}

/**
 * Normalizes raw D1 / SQLite errors into domain-safe operational errors.
 * Never leaks raw schema constraints or database internals to untrusted callers.
 */
export function normalizeDatabaseError(err: unknown): Error {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes("UNIQUE constraint failed")) {
      const field = msg.split(":")[1]?.trim() || "record";
      return new Error(`[DatabaseError] Duplicate entry detected: ${field} already exists.`);
    }
    if (msg.includes("FOREIGN KEY constraint failed")) {
      return new Error("[DatabaseError] Referential integrity violation: Referenced entity does not exist.");
    }
    if (msg.includes("CHECK constraint failed")) {
      return new Error("[DatabaseError] Validation violation: Data does not meet database constraint rules.");
    }
    return new Error(`[DatabaseError] Database operation failed: ${msg}`);
  }
  return new Error("[DatabaseError] An unexpected database error occurred.");
}
