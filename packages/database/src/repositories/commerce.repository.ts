/**
 * VaahanSafe D1 Commerce Repositories Implementation
 *
 * Implements ProductRepository, PlanRepository, OrderRepository, and PaymentRepository
 * against Cloudflare D1 with strict integer minor units and parameterized SQL.
 */

import {
  Product,
  ProductId,
  Plan,
  PlanId,
  Order,
  OrderId,
  OrderItem,
  OrderItemId,
  OrderStatus,
  PaymentStatus,
  PaymentRecord,
  ProductRepository,
  PlanRepository,
  OrderRepository,
  PaymentRepository,
} from "@vaahansafe/commerce";
import type { DatabaseClient } from "../client/d1";

interface DbProductRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  product_type: string;
  status: string;
  price_minor: number;
  currency: string;
  requires_shipping: number;
  requires_qr_allocation: number;
  created_at: string;
  updated_at: string;
}

interface DbPlanRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  billing_interval: string;
  price_minor: number;
  currency: string;
  vehicle_limit: number;
  contact_limit: number;
  features_json: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface DbOrderRow {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  shipping_minor: number;
  tax_minor: number;
  total_minor: number;
  shipping_address_id: string | null;
  vehicle_id: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

interface DbOrderItemRow {
  id: string;
  order_id: string;
  item_type: string;
  product_id: string | null;
  plan_id: string | null;
  catalog_code: string;
  name: string;
  quantity: number;
  unit_price_minor: number;
  total_price_minor: number;
  snapshot_json: string | null;
  created_at: string;
}

interface DbPaymentRow {
  id: string;
  order_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  status: string;
  amount_minor: number;
  currency: string;
  attempt_number: number;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
}

export class D1ProductRepository implements ProductRepository {
  constructor(private db: DatabaseClient) {}

  private mapRow(r: DbProductRow): Product {
    return {
      id: r.id as ProductId,
      code: r.code,
      name: r.name,
      description: r.description ?? undefined,
      productType: r.product_type as Product["productType"],
      status: r.status as Product["status"],
      priceMinor: r.price_minor,
      currency: r.currency as Product["currency"],
      requiresShipping: r.requires_shipping === 1,
      requiresQrAllocation: r.requires_qr_allocation === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.db.queryFirst<DbProductRow>(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByCode(code: string): Promise<Product | null> {
    const row = await this.db.queryFirst<DbProductRow>(
      "SELECT * FROM products WHERE code = ?",
      [code.toUpperCase()]
    );
    return row ? this.mapRow(row) : null;
  }

  async findActiveProducts(): Promise<Product[]> {
    const rows = await this.db.query<DbProductRow>(
      "SELECT * FROM products WHERE status = 'ACTIVE' ORDER BY price_minor ASC"
    );
    return rows.map((r) => this.mapRow(r));
  }

  async save(p: Product): Promise<void> {
    await this.db.execute(
      `INSERT INTO products (id, code, name, description, product_type, status, price_minor, currency, requires_shipping, requires_qr_allocation, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         code = excluded.code,
         name = excluded.name,
         description = excluded.description,
         product_type = excluded.product_type,
         status = excluded.status,
         price_minor = excluded.price_minor,
         currency = excluded.currency,
         requires_shipping = excluded.requires_shipping,
         requires_qr_allocation = excluded.requires_qr_allocation,
         updated_at = excluded.updated_at`,
      [
        p.id,
        p.code,
        p.name,
        p.description ?? null,
        p.productType,
        p.status,
        p.priceMinor,
        p.currency,
        p.requiresShipping ? 1 : 0,
        p.requiresQrAllocation ? 1 : 0,
        p.createdAt,
        p.updatedAt,
      ]
    );
  }
}

export class D1PlanRepository implements PlanRepository {
  constructor(private db: DatabaseClient) {}

  private mapRow(r: DbPlanRow): Plan {
    let features: string[] = [];
    if (r.features_json) {
      try {
        features = JSON.parse(r.features_json);
      } catch {
        features = [];
      }
    }
    return {
      id: r.id as PlanId,
      code: r.code,
      name: r.name,
      description: r.description ?? undefined,
      billingInterval: r.billing_interval as Plan["billingInterval"],
      priceMinor: r.price_minor,
      currency: r.currency as Plan["currency"],
      vehicleLimit: r.vehicle_limit,
      contactLimit: r.contact_limit,
      features,
      isActive: r.is_active === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async findById(id: string): Promise<Plan | null> {
    const row = await this.db.queryFirst<DbPlanRow>(
      "SELECT * FROM plans WHERE id = ?",
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByCode(code: string): Promise<Plan | null> {
    const row = await this.db.queryFirst<DbPlanRow>(
      "SELECT * FROM plans WHERE code = ?",
      [code.toUpperCase()]
    );
    return row ? this.mapRow(row) : null;
  }

  async findActivePlans(): Promise<Plan[]> {
    const rows = await this.db.query<DbPlanRow>(
      "SELECT * FROM plans WHERE is_active = 1 ORDER BY price_minor ASC"
    );
    return rows.map((r) => this.mapRow(r));
  }

  async save(p: Plan): Promise<void> {
    await this.db.execute(
      `INSERT INTO plans (id, code, name, description, billing_interval, price_minor, currency, vehicle_limit, contact_limit, features_json, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         code = excluded.code,
         name = excluded.name,
         description = excluded.description,
         billing_interval = excluded.billing_interval,
         price_minor = excluded.price_minor,
         currency = excluded.currency,
         vehicle_limit = excluded.vehicle_limit,
         contact_limit = excluded.contact_limit,
         features_json = excluded.features_json,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at`,
      [
        p.id,
        p.code,
        p.name,
        p.description ?? null,
        p.billingInterval,
        p.priceMinor,
        p.currency,
        p.vehicleLimit,
        p.contactLimit,
        JSON.stringify(p.features),
        p.isActive ? 1 : 0,
        p.createdAt,
        p.updatedAt,
      ]
    );
  }
}

export class D1OrderRepository implements OrderRepository {
  constructor(private db: DatabaseClient) {}

  private mapRow(r: DbOrderRow): Order {
    return {
      id: r.id as OrderId,
      userId: r.user_id,
      orderNumber: r.order_number,
      status: r.status as OrderStatus,
      currency: r.currency as Order["currency"],
      subtotalMinor: r.subtotal_minor,
      discountMinor: r.discount_minor,
      shippingMinor: r.shipping_minor,
      taxMinor: r.tax_minor,
      totalMinor: r.total_minor,
      shippingAddressId: r.shipping_address_id ?? undefined,
      vehicleId: r.vehicle_id ?? undefined,
      idempotencyKey: r.idempotency_key ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      paidAt: r.paid_at ?? undefined,
    };
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.db.queryFirst<DbOrderRow>(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const row = await this.db.queryFirst<DbOrderRow>(
      "SELECT * FROM orders WHERE order_number = ?",
      [orderNumber]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const row = await this.db.queryFirst<DbOrderRow>(
      "SELECT * FROM orders WHERE idempotency_key = ?",
      [key]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const rows = await this.db.query<DbOrderRow>(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async createWithItems(order: Order, items: OrderItem[]): Promise<void> {
    await this.db.execute(
      `INSERT INTO orders (id, user_id, order_number, status, currency, subtotal_minor, discount_minor, shipping_minor, tax_minor, total_minor, shipping_address_id, vehicle_id, idempotency_key, created_at, updated_at, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.userId,
        order.orderNumber,
        order.status,
        order.currency,
        order.subtotalMinor,
        order.discountMinor,
        order.shippingMinor,
        order.taxMinor,
        order.totalMinor,
        order.shippingAddressId ?? null,
        order.vehicleId ?? null,
        order.idempotencyKey ?? null,
        order.createdAt,
        order.updatedAt,
        order.paidAt ?? null,
      ]
    );

    for (const item of items) {
      await this.db.execute(
        `INSERT INTO order_items (id, order_id, item_type, product_id, plan_id, catalog_code, name, quantity, unit_price_minor, total_price_minor, snapshot_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          order.id,
          item.itemType,
          item.productId ?? null,
          item.planId ?? null,
          item.catalogCode,
          item.name,
          item.quantity,
          item.unitPriceMinor,
          item.totalPriceMinor,
          item.snapshotJson ?? null,
          item.createdAt,
        ]
      );
    }
  }

  async updateStatus(id: string, status: OrderStatus, paidAt?: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE orders SET status = ?, paid_at = COALESCE(?, paid_at), updated_at = ? WHERE id = ?`,
      [status, paidAt ?? null, now, id]
    );
  }

  async getItems(orderId: string): Promise<OrderItem[]> {
    const rows = await this.db.query<DbOrderItemRow>(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orderId]
    );
    return rows.map((r) => ({
      id: r.id as OrderItemId,
      orderId: r.order_id,
      itemType: r.item_type as OrderItem["itemType"],
      productId: r.product_id ?? undefined,
      planId: r.plan_id ?? undefined,
      catalogCode: r.catalog_code,
      name: r.name,
      quantity: r.quantity,
      unitPriceMinor: r.unit_price_minor,
      totalPriceMinor: r.total_price_minor,
      snapshotJson: r.snapshot_json ?? undefined,
      createdAt: r.created_at,
    }));
  }
}

export class D1PaymentRepository implements PaymentRepository {
  constructor(private db: DatabaseClient) {}

  private mapRow(r: DbPaymentRow): PaymentRecord {
    return {
      id: r.id,
      orderId: r.order_id,
      provider: r.provider as PaymentRecord["provider"],
      providerOrderId: r.provider_order_id ?? undefined,
      providerPaymentId: r.provider_payment_id ?? undefined,
      status: r.status as PaymentStatus,
      amountMinor: r.amount_minor,
      currency: r.currency,
      attemptNumber: r.attempt_number,
      paymentMethod: r.payment_method ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      confirmedAt: r.confirmed_at ?? undefined,
    };
  }

  async findById(id: string): Promise<PaymentRecord | null> {
    const row = await this.db.queryFirst<DbPaymentRow>(
      "SELECT * FROM payments WHERE id = ?",
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByOrderId(orderId: string): Promise<PaymentRecord[]> {
    const rows = await this.db.query<DbPaymentRow>(
      "SELECT * FROM payments WHERE order_id = ? ORDER BY attempt_number ASC",
      [orderId]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async findByProviderOrder(provider: string, providerOrderId: string): Promise<PaymentRecord | null> {
    const row = await this.db.queryFirst<DbPaymentRow>(
      "SELECT * FROM payments WHERE provider = ? AND provider_order_id = ?",
      [provider, providerOrderId]
    );
    return row ? this.mapRow(row) : null;
  }

  async create(p: PaymentRecord): Promise<void> {
    await this.db.execute(
      `INSERT INTO payments (id, order_id, provider, provider_order_id, provider_payment_id, status, amount_minor, currency, attempt_number, payment_method, created_at, updated_at, confirmed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.orderId,
        p.provider,
        p.providerOrderId ?? null,
        p.providerPaymentId ?? null,
        p.status,
        p.amountMinor,
        p.currency,
        p.attemptNumber,
        p.paymentMethod ?? null,
        p.createdAt,
        p.updatedAt,
        p.confirmedAt ?? null,
      ]
    );
  }

  async updateStatus(id: string, status: PaymentStatus, confirmedAt?: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE payments SET status = ?, confirmed_at = COALESCE(?, confirmed_at), updated_at = ? WHERE id = ?`,
      [status, confirmedAt ?? null, now, id]
    );
  }
}
