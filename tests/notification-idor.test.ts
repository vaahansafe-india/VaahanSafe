import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  D1NotificationRepository,
  DatabaseClient,
} from "@vaahansafe/database";
import { createNotification } from "@vaahansafe/notifications";

describe("In-App Notification Authorization & IDOR Guards", () => {
  let dbSync: DatabaseSync;
  let dbClient: DatabaseClient;
  let notifRepo: D1NotificationRepository;

  beforeEach(() => {
    dbSync = new DatabaseSync(":memory:");
    dbSync.exec("PRAGMA foreign_keys = ON;");

    const migrationsDir = path.resolve(
      __dirname,
      "../infrastructure/cloudflare/d1/migrations"
    );
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      dbSync.exec(sql);
    }

    dbClient = {
      async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
        const stmt = dbSync.prepare(sql);
        return stmt.all(...params) as T[];
      },
      async queryFirst<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
        const stmt = dbSync.prepare(sql);
        const rows = stmt.all(...params) as T[];
        return rows[0] || null;
      },
      async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean; rowsAffected?: number }> {
        const stmt = dbSync.prepare(sql);
        const info = stmt.run(...params);
        return { success: true, rowsAffected: Number(info.changes) };
      },
      async batch(operations: Array<{ sql: string; params?: unknown[] }>): Promise<boolean> {
        for (const op of operations) {
          const stmt = dbSync.prepare(op.sql);
          stmt.run(...(op.params || []));
        }
        return true;
      },
    };

    // Seed two distinct users and their notification intents
    dbSync.exec(`
      INSERT INTO users (id, primary_phone, primary_email, full_name, onboarding_status, status)
      VALUES 
        ('user_alice', '+919876543210', 'alice@vaahansafe.com', 'Alice', 'COMPLETED', 'ACTIVE'),
        ('user_bob', '+919999988888', 'bob@vaahansafe.com', 'Bob', 'COMPLETED', 'ACTIVE');

      INSERT INTO notification_intents (id, event_type, recipient_user_id, category, priority, template_key, template_version, payload_json, source_type, source_id, dedupe_key)
      VALUES
        ('intent_alice', 'QR_ACTIVATED', 'user_alice', 'SAFETY', 'NORMAL', 'QR_ACTIVATED_V1', 1, '{}', 'TEST', '1', 'dedupe_alice'),
        ('intent_bob', 'PAYMENT_SUCCEEDED', 'user_bob', 'COMMERCE', 'NORMAL', 'PAYMENT_SUCCESS_V1', 1, '{}', 'TEST', '2', 'dedupe_bob');
    `);

    notifRepo = new D1NotificationRepository(dbClient);
  });

  it("should prevent User A from marking User B notification read (IDOR guard)", async () => {
    // 1. Create notification for Bob
    const bobNotification = createNotification({
      id: "notif_bob_private",
      userId: "user_bob",
      intentId: "intent_bob",
      eventType: "PAYMENT_SUCCEEDED",
      category: "COMMERCE",
      title: "Payment Received",
      bodySafe: "Your payment of ₹499 was confirmed.",
    });

    await notifRepo.save(bobNotification);

    // 2. Alice tries to mark Bob's notification as read
    const aliceModifiedBobNotif = await notifRepo.markAsRead("notif_bob_private", "user_alice");

    // Must be DENIED (rowsAffected === 0, returns false)
    expect(aliceModifiedBobNotif).toBe(false);

    // Verify Bob's notification is still unread
    const notifAfter = await notifRepo.findById("notif_bob_private");
    expect(notifAfter?.readAt).toBeUndefined();

    // 3. Bob marks his own notification as read
    const bobModifiedOwnNotif = await notifRepo.markAsRead("notif_bob_private", "user_bob");
    expect(bobModifiedOwnNotif).toBe(true);

    const notifAfterBob = await notifRepo.findById("notif_bob_private");
    expect(notifAfterBob?.readAt).toBeDefined();
  });

  it("should prevent User A from listing User B notifications", async () => {
    // Save notifications for both Alice and Bob
    await notifRepo.save(
      createNotification({
        id: "notif_alice_1",
        userId: "user_alice",
        intentId: "intent_alice",
        eventType: "QR_ACTIVATED",
        category: "SAFETY",
        title: "Alice QR Activated",
        bodySafe: "Your QR is active.",
      })
    );

    await notifRepo.save(
      createNotification({
        id: "notif_bob_1",
        userId: "user_bob",
        intentId: "intent_bob",
        eventType: "PAYMENT_SUCCEEDED",
        category: "COMMERCE",
        title: "Bob Payment",
        bodySafe: "Your payment is confirmed.",
      })
    );

    // Query for Alice: must only return Alice's notifications
    const aliceNotifs = await notifRepo.findByUserId("user_alice");
    expect(aliceNotifs).toHaveLength(1);
    expect(aliceNotifs[0].id).toBe("notif_alice_1");
    expect(aliceNotifs[0].userId).toBe("user_alice");

    // Query for Bob: must only return Bob's notifications
    const bobNotifs = await notifRepo.findByUserId("user_bob");
    expect(bobNotifs).toHaveLength(1);
    expect(bobNotifs[0].id).toBe("notif_bob_1");
    expect(bobNotifs[0].userId).toBe("user_bob");
  });
});
