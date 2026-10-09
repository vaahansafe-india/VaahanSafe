import { afterEach, describe, expect, it, vi } from "vitest";
import { SupabaseDatabaseAdapter } from "../packages/database/src/client/supabase-adapter";
afterEach(() => vi.unstubAllGlobals());
const client = () =>
  new SupabaseDatabaseAdapter({
    url: "https://database.example",
    serviceKey: "server-fixture-key",
  });
describe("Supabase server write contract", () => {
  it("preserves conditional row counts, including denied ownership writes", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ success: true, rowsAffected: 0 })),
        ),
    );
    expect(
      await client().execute(
        "UPDATE notifications SET read_at=NULL WHERE id=? AND user_id=?",
        ["record", "other"],
      ),
    ).toEqual({ success: true, rowsAffected: 0 });
  });
  it("does not mistake a literal question mark for a parameter", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("[]"));
    vi.stubGlobal("fetch", fetch);
    await client().query("SELECT '?' AS symbol, ? AS text -- ?\n", [
      "owner's value",
    ]);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.p_sql).toContain(
      "SELECT '?' AS symbol, 'owner''s value' AS text -- ?",
    );
  });
  it("rejects surplus parameters before executing a query", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(client().query("SELECT ?", ["one", "two"])).rejects.toThrow(
      "count mismatch",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
  it("uses a collision-free transaction delimiter around bound dollar text", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{"success":true}'));
    vi.stubGlobal("fetch", fetch);
    await client().batch([
      {
        sql: "INSERT INTO notices(body) VALUES (?)",
        params: ["$$; DELETE FROM users; --"],
      },
    ]);
    const sql = JSON.parse(fetch.mock.calls[0][1].body).p_sql;
    expect(sql).toMatch(/^DO \$vs_[a-f0-9]+\$ BEGIN/);
    expect(sql).toContain("'$$; DELETE FROM users; --'");
  });
  it("fails closed on an unconfirmed or erroneous write", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response('{"success":false,"error":"private database details"}'),
        ),
    );
    await expect(
      client().execute("UPDATE notices SET read_at=NULL"),
    ).rejects.toThrow("Database operation failed");
  });
  it("keeps raw database errors out of application error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("private customer value", { status: 500 }),
        ),
    );
    await expect(client().query("SELECT 1")).rejects.toThrow(
      "Database service unavailable (500)",
    );
  });
});
