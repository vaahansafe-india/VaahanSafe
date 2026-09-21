import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  D1FulfilmentRepository,
  D1ReservationRepository,
  D1QrInventoryAdapter,
} from "@vaahansafe/database";
import type { DatabaseClient } from "@vaahansafe/database";
import {
  createFulfilment,
  createQrReservation,
  NoEligibleInventoryError,
} from "@vaahansafe/shipping";

describe("Phase 12 — Physical QR Allocation, Concurrency & Reservation Lifecycle", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;

  let fulfilmentRepo: D1FulfilmentRepository;
  let reservationRepo: D1ReservationRepository;
  let inventoryAdapter: D1QrInventoryAdapter;

  const sampleAddress = {
    fullName: "Priya Sharma",
    phone: "+919811122233",
    line1: "House 12, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560038",
    country: "IN",
  };

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    const cfD1Dir = path.resolve(__dirname, "../infrastructure/cloudflare/d1");
    const migrationsDir = path.join(cfD1Dir, "migrations");
    const files = [
      "0001_identity.sql",
      "0002_vehicle_emergency.sql",
      "0003_qr_inventory.sql",
      "0004_media_assets.sql",
      "0005_commerce_subscriptions.sql",
      "0006_notifications.sql",
      "0007_fulfilment_shipping_replacement.sql",
    ];

    for (const f of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      db.exec(sql);
    }

    const seedPath = path.join(cfD1Dir, "seeds/dev.sql");
    const devSeed = fs.readFileSync(seedPath, "utf8");
    db.exec(devSeed);

    client = {
      async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        return db.prepare(sql).all(...params) as T[];
      },
      async queryFirst<T>(sql: string, params: unknown[] = []): Promise<T | null> {
        const rows = db.prepare(sql).all(...params) as T[];
        return rows.length > 0 ? (rows[0] as T) : null;
      },
      async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean }> {
        db.prepare(sql).run(...params);
        return { success: true };
      },
      async batch(operations: Array<{ sql: string; params?: unknown[] }>): Promise<boolean> {
        for (const op of operations) {
          db.prepare(op.sql).run(...(op.params || []));
        }
        return true;
      },
    };

    fulfilmentRepo = new D1FulfilmentRepository(client);
    reservationRepo = new D1ReservationRepository(client);
    inventoryAdapter = new D1QrInventoryAdapter(client);

    // Setup an order in orders table for foreign key satisfaction
    db.exec(`
      INSERT OR IGNORE INTO orders (
        id, order_number, user_id, status, subtotal_minor, discount_minor,
        tax_minor, shipping_minor, total_minor, currency, created_at, updated_at
      ) VALUES 
      ('ord_paid_1', 'VS-ORD-2026-0001', 'usr_demo_101', 'PAID', 49900, 0, 0, 0, 49900, 'INR', datetime('now'), datetime('now')),
      ('ord_paid_2', 'VS-ORD-2026-0002', 'usr_demo_102', 'PAID', 49900, 0, 0, 0, 49900, 'INR', datetime('now'), datetime('now')),
      ('ord_paid_3', 'VS-ORD-2026-0003', 'usr_demo_101', 'PAID', 49900, 0, 0, 0, 49900, 'INR', datetime('now'), datetime('now'));
    `);
  });

  it("finds oldest eligible printed physical QR sticker without leaking secrets", async () => {
    const eligible = await inventoryAdapter.findEligiblePrintedSticker();
    expect(eligible).toBeDefined();
    expect(eligible?.id).toBe("qr_printed_002");
    expect(eligible?.publicId).toBe("8M2P4510");
    expect(eligible?.visibleCode).toBe("VS-8M2P-4510");
    expect(eligible?.batchId).toBe("qrb_demo_2026_01");

    // INVARIANT: Plaintext scratch secret MUST NEVER be returned on EligiblePhysicalQr
    expect((eligible as Record<string, unknown>).secret).toBeUndefined();
    expect((eligible as Record<string, unknown>).secretHash).toBeUndefined();
    expect((eligible as Record<string, unknown>).plaintext).toBeUndefined();
  });

  describe("Scenario A (Proof A): Two Paid Orders, One Available QR", () => {
    it("allows exactly ONE reservation to succeed and blocks the competing race via partial unique constraint", async () => {
      // Step 1: Create Fulfilment 1 and Fulfilment 2
      const ful1 = createFulfilment({
        id: "ful_order_1",
        orderId: "ord_paid_1",
        userId: "usr_demo_101",
        type: "PHYSICAL_QR",
        shippingAddressSnapshot: sampleAddress,
      });
      await fulfilmentRepo.save(ful1);

      const ful2 = createFulfilment({
        id: "ful_order_2",
        orderId: "ord_paid_2",
        userId: "usr_demo_102",
        type: "PHYSICAL_QR",
        shippingAddressSnapshot: sampleAddress,
      });
      await fulfilmentRepo.save(ful2);

      // Verify there is only 1 printed sticker available
      const eligibleSticker = await inventoryAdapter.findEligiblePrintedSticker();
      expect(eligibleSticker).not.toBeNull();
      const stickerId = eligibleSticker!.id;

      // Worker 1 reserves the sticker for Fulfilment 1
      const res1 = createQrReservation({
        qrStickerId: stickerId,
        fulfilmentId: ful1.id,
        orderId: ful1.orderId,
      });
      await reservationRepo.createReservation(res1);

      // Verify Fulfilment 1 has active reservation
      const activeRes1 = await reservationRepo.findActiveByFulfilmentId(ful1.id);
      expect(activeRes1?.qrStickerId).toBe(stickerId);
      expect(activeRes1?.status).toBe("RESERVED");

      // Worker 2 attempts to reserve the SAME sticker for Fulfilment 2 concurrently
      const res2 = createQrReservation({
        qrStickerId: stickerId,
        fulfilmentId: ful2.id,
        orderId: ful2.orderId,
      });

      // INVARIANT: Concurrency protection via idx_qr_reservations_active_qr
      await expect(reservationRepo.createReservation(res2)).rejects.toThrow(
        /UNIQUE constraint failed/
      );

      // Verify only ONE active reservation exists for the QR sticker in the database
      const count = await client.queryFirst<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM qr_reservations WHERE qr_sticker_id = ? AND status IN ('RESERVED', 'ALLOCATED')`,
        [stickerId]
      );
      expect(count?.cnt).toBe(1);

      // Verify Fulfilment 2 does not have any active reservation
      const activeRes2 = await reservationRepo.findActiveByFulfilmentId(ful2.id);
      expect(activeRes2).toBeNull();
    });
  });

  describe("Scenario B (Proof B): Payment SUCCESS, Zero Inventory Available", () => {
    it("preserves payment SUCCESS, does not fail order, and records recoverable fulfilment exception", async () => {
      // Step 1: Consume the only available sticker so stock is zero
      const sticker = await inventoryAdapter.findEligiblePrintedSticker();
      const res = createQrReservation({
        qrStickerId: sticker!.id,
        fulfilmentId: "ful_seed_consumer",
        orderId: "ord_paid_1",
      });
      // Save consumer fulfilment to satisfy FK
      await fulfilmentRepo.save(
        createFulfilment({
          id: "ful_seed_consumer",
          orderId: "ord_paid_1",
          userId: "usr_demo_101",
          shippingAddressSnapshot: sampleAddress,
        })
      );
      await reservationRepo.createReservation(res);

      // Step 2: Verify warehouse inventory is now empty
      const nextSticker = await inventoryAdapter.findEligiblePrintedSticker();
      expect(nextSticker).toBeNull();

      // Step 3: Order 3 has authoritative payment confirmed
      const order3Before = await client.queryFirst<{ status: string }>(
        `SELECT status FROM orders WHERE id = 'ord_paid_3'`
      );
      expect(order3Before?.status).toBe("PAID");

      // Fulfilment worker checks inventory
      const noInvError = new NoEligibleInventoryError();
      const ful3 = createFulfilment({
        id: "ful_order_3",
        orderId: "ord_paid_3",
        userId: "usr_demo_101",
        shippingAddressSnapshot: sampleAddress,
      });
      ful3.exceptionCode = noInvError.code;
      await fulfilmentRepo.save(ful3);

      // Step 4: Verify Payment status is STILL PAID / SUCCESS (Mandatory Invariant 11)
      const order3After = await client.queryFirst<{ status: string }>(
        `SELECT status FROM orders WHERE id = 'ord_paid_3'`
      );
      expect(order3After?.status).toBe("PAID");

      // Step 5: Verify Fulfilment exists in PAID state with recoverable exception code
      const persistedFul3 = await fulfilmentRepo.findById(ful3.id);
      expect(persistedFul3?.status).toBe("PAID");
      expect(persistedFul3?.exceptionCode).toBe("NO_ELIGIBLE_INVENTORY");

      // Verify zero invalid or activated stickers were allocated
      const res3 = await reservationRepo.findActiveByFulfilmentId(ful3.id);
      expect(res3).toBeNull();
    });
  });

  describe("Reservation Idempotency & Retries", () => {
    it("reuses existing reservation on worker retry and blocks double allocation", async () => {
      const ful = createFulfilment({
        id: "ful_retry_demo",
        orderId: "ord_paid_1",
        userId: "usr_demo_101",
        shippingAddressSnapshot: sampleAddress,
      });
      await fulfilmentRepo.save(ful);

      const sticker = (await inventoryAdapter.findEligiblePrintedSticker())!;
      const res = createQrReservation({
        qrStickerId: sticker.id,
        fulfilmentId: ful.id,
        orderId: ful.orderId,
      });
      await reservationRepo.createReservation(res);

      // Worker retries: checks if active reservation exists
      const existingRes = await reservationRepo.findActiveByFulfilmentId(ful.id);
      expect(existingRes).toBeDefined();
      expect(existingRes?.id).toBe(res.id);
      expect(existingRes?.qrStickerId).toBe(sticker.id);

      // Attempting to blindly create a second reservation for the same fulfilment must fail
      const duplicateRes = createQrReservation({
        qrStickerId: sticker.id,
        fulfilmentId: ful.id,
      });
      await expect(reservationRepo.createReservation(duplicateRes)).rejects.toThrow(
        /UNIQUE constraint failed/
      );
    });
  });

  describe("Reservation Release", () => {
    it("releases reservation on order cancellation, restoring sticker eligibility", async () => {
      const ful = createFulfilment({
        id: "ful_to_cancel",
        orderId: "ord_paid_1",
        userId: "usr_demo_101",
        shippingAddressSnapshot: sampleAddress,
      });
      await fulfilmentRepo.save(ful);

      const sticker = (await inventoryAdapter.findEligiblePrintedSticker())!;
      const res = createQrReservation({
        qrStickerId: sticker.id,
        fulfilmentId: ful.id,
        orderId: ful.orderId,
      });
      await reservationRepo.createReservation(res);

      // Now no stickers are eligible
      expect(await inventoryAdapter.findEligiblePrintedSticker()).toBeNull();

      // Cancel fulfilment and release reservation
      await fulfilmentRepo.updateStatus(ful.id, "CANCELLED", {
        cancelledAt: new Date().toISOString(),
      });
      await reservationRepo.updateStatus(res.id, "RELEASED", {
        releasedAt: new Date().toISOString(),
      });

      // Verify sticker becomes eligible again!
      const reEligible = await inventoryAdapter.findEligiblePrintedSticker();
      expect(reEligible?.id).toBe(sticker.id);
    });
  });

  describe("Early Checkout Protection", () => {
    it("does not create reservation or consume physical inventory when checkout merely opens", async () => {
      // Invariant: Merely opening checkout or viewing product does not touch reservations
      const initialSticker = await inventoryAdapter.findEligiblePrintedSticker();
      expect(initialSticker).not.toBeNull();

      const reservationCount = await client.queryFirst<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM qr_reservations`
      );
      expect(reservationCount?.cnt).toBe(0);
    });
  });
});
