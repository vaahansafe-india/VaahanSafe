import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  D1FulfilmentRepository,
  D1ReservationRepository,
  D1ShipmentRepository,
  D1QrInventoryAdapter,
} from "@vaahansafe/database";
import type { DatabaseClient } from "@vaahansafe/database";
import {
  createFulfilment,
  createQrReservation,
  createShipment,
  assertValidFulfilmentTransition,
  assertValidShipmentTransition,
} from "@vaahansafe/shipping";

describe("Phase 12 — Return to Origin (RTO) Lifecycle & Quarantine Invariant", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;

  let fulfilmentRepo: D1FulfilmentRepository;
  let reservationRepo: D1ReservationRepository;
  let shipmentRepo: D1ShipmentRepository;
  let inventoryAdapter: D1QrInventoryAdapter;

  const sampleAddress = {
    fullName: "Ramesh Kumar",
    phone: "+919876543210",
    line1: "Flat 402, Safety Residency",
    city: "Pune",
    state: "Maharashtra",
    postalCode: "411045",
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
    shipmentRepo = new D1ShipmentRepository(client);
    inventoryAdapter = new D1QrInventoryAdapter(client);

    db.exec(`
      INSERT OR IGNORE INTO orders (
        id, order_number, user_id, status, subtotal_minor, discount_minor,
        tax_minor, shipping_minor, total_minor, currency, created_at, updated_at
      ) VALUES 
      ('ord_rto_demo', 'VS-ORD-2026-0009', 'usr_demo_101', 'PAID', 49900, 0, 0, 0, 49900, 'INR', datetime('now'), datetime('now'));
    `);
  });

  it("progresses delivery failure to RTO and terminal RECEIVED_RTO", async () => {
    const ful = createFulfilment({
      id: "ful_rto_1",
      orderId: "ord_rto_demo",
      userId: "usr_demo_101",
      shippingAddressSnapshot: sampleAddress,
    });
    await fulfilmentRepo.save(ful);

    const shp = createShipment({
      id: "shp_rto_1",
      fulfilmentId: ful.id,
      orderId: ful.orderId,
      userId: ful.userId,
      shippingAddressSnapshot: sampleAddress,
    });
    await shipmentRepo.save(shp);

    // Progress to SHIPPED / IN_TRANSIT
    assertValidFulfilmentTransition("PAID", "PROCESSING");
    assertValidFulfilmentTransition("PROCESSING", "PACKED");
    assertValidFulfilmentTransition("PACKED", "SHIPPED");

    await fulfilmentRepo.updateStatus(ful.id, "SHIPPED");
    await shipmentRepo.updateStatus(shp.id, "IN_TRANSIT", {
      trackingReference: "TRACK-RTO-9999",
      shippedAt: new Date().toISOString(),
    });

    // Courier attempts delivery -> DELIVERY_FAILED
    assertValidFulfilmentTransition("SHIPPED", "DELIVERY_FAILED");
    assertValidShipmentTransition("IN_TRANSIT", "DELIVERY_FAILED");

    await fulfilmentRepo.updateStatus(ful.id, "DELIVERY_FAILED");
    await shipmentRepo.updateStatus(shp.id, "DELIVERY_FAILED");

    // Initiate Return to Origin -> RTO / RTO_INITIATED
    assertValidFulfilmentTransition("DELIVERY_FAILED", "RTO");
    assertValidShipmentTransition("DELIVERY_FAILED", "RTO_INITIATED");

    await fulfilmentRepo.updateStatus(ful.id, "RTO");
    await shipmentRepo.updateStatus(shp.id, "RTO_INITIATED");

    // Warehouse receives package back -> RECEIVED_RTO / RTO_DELIVERED
    assertValidFulfilmentTransition("RTO", "RECEIVED_RTO");
    assertValidShipmentTransition("RTO_INITIATED", "RTO_DELIVERED");

    await fulfilmentRepo.updateStatus(ful.id, "RECEIVED_RTO");
    await shipmentRepo.updateStatus(shp.id, "RTO_DELIVERED", {
      deliveredAt: new Date().toISOString(),
    });

    const finalFul = await fulfilmentRepo.findById(ful.id);
    expect(finalFul?.status).toBe("RECEIVED_RTO");

    const finalShp = await shipmentRepo.findById(shp.id);
    expect(finalShp?.status).toBe("RTO_DELIVERED");
  });

  it("INVARIANT 19: RECEIVED_RTO QR sticker is quarantined and NEVER automatically returned to sellable inventory", async () => {
    // Reserve the printed sticker for an order that eventually RTOs
    const sticker = (await inventoryAdapter.findEligiblePrintedSticker())!;
    const ful = createFulfilment({
      id: "ful_rto_quarantine",
      orderId: "ord_rto_demo",
      userId: "usr_demo_101",
      shippingAddressSnapshot: sampleAddress,
    });
    await fulfilmentRepo.save(ful);

    const res = createQrReservation({
      qrStickerId: sticker.id,
      fulfilmentId: ful.id,
      orderId: ful.orderId,
      status: "ALLOCATED",
    });
    await reservationRepo.createReservation(res);

    // Simulate RTO flow completion
    await fulfilmentRepo.updateStatus(ful.id, "RECEIVED_RTO");

    // INVARIANT: The reservation remains ALLOCATED / QUARANTINED.
    // The sticker has been handled, packaging opened, scratch area potentially exposed.
    // Therefore, it CANNOT be auto-restocked to sellable inventory!
    const activeRes = await reservationRepo.findActiveByQrId(sticker.id);
    expect(activeRes).not.toBeNull();
    expect(activeRes?.status).toBe("ALLOCATED");

    // Verify eligible printed inventory query returns ZERO stickers
    const eligibleNow = await inventoryAdapter.findEligiblePrintedSticker();
    expect(eligibleNow).toBeNull();
  });
});
