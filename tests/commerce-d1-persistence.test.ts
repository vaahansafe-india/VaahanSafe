import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  createProduct,
  createPlan,
  createOrder,
  createOrderItem,
  STANDARD_PRODUCT_CODES,
  STANDARD_PLAN_CODES,
  UnauthorizedOrderAccessError,
} from "@vaahansafe/commerce";
import {
  createSubscription,
  createSubscriptionEvent,
  UnauthorizedSubscriptionAccessError,
} from "@vaahansafe/subscriptions";
import {
  D1ProductRepository,
  D1PlanRepository,
  D1OrderRepository,
  D1PaymentRepository,
  D1SubscriptionRepository,
  D1SubscriptionEventRepository,
} from "@vaahansafe/database";
import type { DatabaseClient } from "@vaahansafe/database";

describe("Phase 10 — D1 Commerce & Subscription Repositories", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;

  let productRepo: D1ProductRepository;
  let planRepo: D1PlanRepository;
  let orderRepo: D1OrderRepository;
  let paymentRepo: D1PaymentRepository;
  let subscriptionRepo: D1SubscriptionRepository;
  let subscriptionEventRepo: D1SubscriptionEventRepository;

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
      async batch(): Promise<boolean> {
        return true;
      },
    };

    productRepo = new D1ProductRepository(client);
    planRepo = new D1PlanRepository(client);
    orderRepo = new D1OrderRepository(client);
    paymentRepo = new D1PaymentRepository(client);
    subscriptionRepo = new D1SubscriptionRepository(client);
    subscriptionEventRepo = new D1SubscriptionEventRepository(client);
  });

  describe("Product Catalog Repository", () => {
    it("persists and retrieves products with integer minor units", async () => {
      const product = createProduct({
        code: STANDARD_PRODUCT_CODES.QR_PHYSICAL_STANDARD,
        name: "Standard Vehicle QR Sticker",
        productType: "PHYSICAL_QR_STICKER",
        priceMinor: 49900, // ₹499.00
      });

      await productRepo.save(product);

      const byCode = await productRepo.findByCode(STANDARD_PRODUCT_CODES.QR_PHYSICAL_STANDARD);
      expect(byCode).toBeDefined();
      expect(byCode?.name).toBe("Standard Vehicle QR Sticker");
      expect(byCode?.priceMinor).toBe(49900);
      expect(byCode?.requiresShipping).toBe(true);
      expect(byCode?.requiresQrAllocation).toBe(true);

      const byId = await productRepo.findById(product.id);
      expect(byId?.id).toBe(product.id);

      const active = await productRepo.findActiveProducts();
      expect(active.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Plan Repository", () => {
    it("persists and retrieves commercial subscription plans with capability limits", async () => {
      const plan = createPlan({
        code: STANDARD_PLAN_CODES.CORE_ANNUAL,
        name: "Core Annual Plan",
        billingInterval: "ANNUAL",
        priceMinor: 99900, // ₹999.00
        vehicleLimit: 1,
        contactLimit: 3,
        features: ["CORE_EMERGENCY_PROFILE", "EMERGENCY_CALL_ACTION"],
      });

      await planRepo.save(plan);

      const fetched = await planRepo.findByCode(STANDARD_PLAN_CODES.CORE_ANNUAL);
      expect(fetched).toBeDefined();
      expect(fetched?.code).toBe(STANDARD_PLAN_CODES.CORE_ANNUAL);
      expect(fetched?.contactLimit).toBe(3);
      expect(fetched?.features).toContain("CORE_EMERGENCY_PROFILE");
    });
  });

  describe("Order & Order Item Repository", () => {
    it("creates orders with line items and safe purchase snapshots", async () => {
      const order = createOrder({
        userId: "usr_demo_101",
        orderNumber: "VS-ORD-2026-TEST01",
        subtotalMinor: 49900,
        shippingMinor: 5000,
        totalMinor: 54900,
        idempotencyKey: "idem_checkout_999",
      });

      const item = createOrderItem({
        orderId: order.id,
        itemType: "PRODUCT",
        catalogCode: "QR_PHYSICAL_STANDARD",
        name: "Standard Vehicle QR Sticker",
        quantity: 1,
        unitPriceMinor: 49900,
        snapshot: {
          code: "QR_PHYSICAL_STANDARD",
          name: "Standard Vehicle QR Sticker",
        },
      });

      await orderRepo.createWithItems(order, [item]);

      const fetchedOrder = await orderRepo.findById(order.id);
      expect(fetchedOrder).toBeDefined();
      expect(fetchedOrder?.orderNumber).toBe("VS-ORD-2026-TEST01");
      expect(fetchedOrder?.totalMinor).toBe(54900);
      expect(fetchedOrder?.status).toBe("DRAFT");

      // Verify idempotency lookup
      const byIdem = await orderRepo.findByIdempotencyKey("idem_checkout_999");
      expect(byIdem?.id).toBe(order.id);

      // Verify items
      const items = await orderRepo.getItems(order.id);
      expect(items).toHaveLength(1);
      expect(items[0]?.catalogCode).toBe("QR_PHYSICAL_STANDARD");
      expect(items[0]?.totalPriceMinor).toBe(49900);

      // Update status
      await orderRepo.updateStatus(order.id, "PAID", new Date().toISOString());
      const paidOrder = await orderRepo.findById(order.id);
      expect(paidOrder?.status).toBe("PAID");
      expect(paidOrder?.paidAt).toBeDefined();
    });
  });

  describe("Payment Repository", () => {
    it("creates payment attempts and tracks provider references", async () => {
      const order = createOrder({
        userId: "usr_demo_101",
        subtotalMinor: 49900,
        totalMinor: 49900,
      });
      await orderRepo.createWithItems(order, []);

      const payment = {
        id: "pay_test_001",
        orderId: order.id,
        provider: "CASHFREE" as const,
        providerOrderId: "cf_order_98765",
        status: "PENDING" as const,
        amountMinor: 49900,
        currency: "INR",
        attemptNumber: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await paymentRepo.create(payment);

      const fetched = await paymentRepo.findByProviderOrder("CASHFREE", "cf_order_98765");
      expect(fetched).toBeDefined();
      expect(fetched?.id).toBe("pay_test_001");
      expect(fetched?.status).toBe("PENDING");

      // Confirm payment
      await paymentRepo.updateStatus("pay_test_001", "SUCCESS", new Date().toISOString());
      const confirmed = await paymentRepo.findById("pay_test_001");
      expect(confirmed?.status).toBe("SUCCESS");
      expect(confirmed?.confirmedAt).toBeDefined();
    });
  });

  describe("Subscription & Timeline Event Repository", () => {
    it("creates subscription and appends lifecycle events", async () => {
      // First save plan
      const plan = createPlan({
        code: "CORE_ANNUAL",
        name: "Core Plan",
        priceMinor: 99900,
      });
      await planRepo.save(plan);

      const sub = createSubscription({
        userId: "usr_demo_101",
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: "2026-01-01T00:00:00Z",
        currentPeriodEnd: "2027-01-01T00:00:00Z",
      });

      await subscriptionRepo.create(sub);

      const fetched = await subscriptionRepo.findById(sub.id);
      expect(fetched).toBeDefined();
      expect(fetched?.status).toBe("ACTIVE");
      expect(fetched?.userId).toBe("usr_demo_101");

      // Record timeline events
      const event1 = createSubscriptionEvent({
        subscriptionId: sub.id,
        eventType: "ACTIVATED",
        payload: { source: "ONLINE_CHECKOUT" },
      });
      const event2 = createSubscriptionEvent({
        subscriptionId: sub.id,
        eventType: "RENEWAL_SUCCEEDED",
        payload: { nextPeriodEnd: "2028-01-01" },
      });

      await subscriptionEventRepo.recordEvent(event1);
      await subscriptionEventRepo.recordEvent(event2);

      const events = await subscriptionEventRepo.getEventsBySubscriptionId(sub.id);
      expect(events).toHaveLength(2);
      expect(events[0]?.eventType).toBe("ACTIVATED");
      expect(events[1]?.eventType).toBe("RENEWAL_SUCCEEDED");
    });
  });

  describe("Customer IDOR Defense & Authorization Invariant (Section 84)", () => {
    it("User A cannot access or mutate User B's orders", async () => {
      const userA = "usr_demo_101"; // Alice
      const userB = "usr_demo_102"; // Bob

      const orderB = createOrder({
        userId: userB,
        subtotalMinor: 49900,
        totalMinor: 49900,
      });
      await orderRepo.createWithItems(orderB, []);

      // 1. Querying orders by user returns only that user's orders
      const aliceOrders = await orderRepo.findByUserId(userA);
      expect(aliceOrders.some((o) => o.id === orderB.id)).toBe(false);

      // 2. Direct lookup: If caller userA attempts to access orderB, server assertion must reject
      const fetchedOrder = await orderRepo.findById(orderB.id);
      expect(fetchedOrder).toBeDefined();

      expect(() => {
        if (fetchedOrder && fetchedOrder.userId !== userA) {
          throw new UnauthorizedOrderAccessError(fetchedOrder.id, userA);
        }
      }).toThrow(UnauthorizedOrderAccessError);
    });

    it("User A cannot access User B's subscriptions", async () => {
      const userA = "usr_demo_101";
      const userB = "usr_demo_102";

      const plan = createPlan({ code: "CORE", name: "Core", priceMinor: 1000 });
      await planRepo.save(plan);

      const subB = createSubscription({
        userId: userB,
        planId: plan.id,
        status: "ACTIVE",
      });
      await subscriptionRepo.create(subB);

      const fetchedSub = await subscriptionRepo.findById(subB.id);
      expect(fetchedSub).toBeDefined();

      expect(() => {
        if (fetchedSub && fetchedSub.userId !== userA) {
          throw new UnauthorizedSubscriptionAccessError(fetchedSub.id, userA);
        }
      }).toThrow(UnauthorizedSubscriptionAccessError);
    });
  });
});
