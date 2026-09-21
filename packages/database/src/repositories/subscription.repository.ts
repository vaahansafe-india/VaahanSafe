/**
 * VaahanSafe D1 Subscription Repositories Implementation
 *
 * Implements SubscriptionRepository and SubscriptionEventRepository
 * against Cloudflare D1 with strict SQL parameterization and append-only audit.
 */

import {
  Subscription,
  SubscriptionId,
  SubscriptionStatus,
  SubscriptionEvent,
  SubscriptionEventId,
  SubscriptionEventType,
  SubscriptionRepository,
  SubscriptionEventRepository,
} from "@vaahansafe/subscriptions";
import type { DatabaseClient } from "../client/d1";

interface DbSubscriptionRow {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  provider: string;
  provider_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DbSubscriptionEventRow {
  id: string;
  subscription_id: string;
  event_type: string;
  payload_json: string | null;
  created_at: string;
}

export class D1SubscriptionRepository implements SubscriptionRepository {
  constructor(private db: DatabaseClient) {}

  private mapRow(r: DbSubscriptionRow): Subscription {
    return {
      id: r.id as SubscriptionId,
      userId: r.user_id,
      vehicleId: r.vehicle_id ?? undefined,
      planId: r.plan_id,
      status: r.status as SubscriptionStatus,
      currentPeriodStart: r.current_period_start ?? undefined,
      currentPeriodEnd: r.current_period_end ?? undefined,
      cancelAtPeriodEnd: r.cancel_at_period_end === 1,
      provider: r.provider as Subscription["provider"],
      providerSubscriptionId: r.provider_subscription_id ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async findById(id: string): Promise<Subscription | null> {
    const row = await this.db.queryFirst<DbSubscriptionRow>(
      "SELECT * FROM subscriptions WHERE id = ?",
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async findByUserId(userId: string): Promise<Subscription[]> {
    const rows = await this.db.query<DbSubscriptionRow>(
      "SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async findByVehicleId(vehicleId: string): Promise<Subscription | null> {
    const row = await this.db.queryFirst<DbSubscriptionRow>(
      "SELECT * FROM subscriptions WHERE vehicle_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC",
      [vehicleId]
    );
    return row ? this.mapRow(row) : null;
  }

  async create(s: Subscription): Promise<void> {
    await this.db.execute(
      `INSERT INTO subscriptions (id, user_id, vehicle_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, provider, provider_subscription_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.userId,
        s.vehicleId ?? null,
        s.planId,
        s.status,
        s.currentPeriodStart ?? null,
        s.currentPeriodEnd ?? null,
        s.cancelAtPeriodEnd ? 1 : 0,
        s.provider,
        s.providerSubscriptionId ?? null,
        s.createdAt,
        s.updatedAt,
      ]
    );
  }

  async updateStatus(
    id: string,
    status: SubscriptionStatus,
    updates?: {
      currentPeriodStart?: string;
      currentPeriodEnd?: string;
      cancelAtPeriodEnd?: boolean;
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE subscriptions SET 
         status = ?, 
         current_period_start = COALESCE(?, current_period_start), 
         current_period_end = COALESCE(?, current_period_end), 
         cancel_at_period_end = CASE WHEN ? IS NOT NULL THEN ? ELSE cancel_at_period_end END,
         updated_at = ? 
       WHERE id = ?`,
      [
        status,
        updates?.currentPeriodStart ?? null,
        updates?.currentPeriodEnd ?? null,
        updates?.cancelAtPeriodEnd !== undefined ? 1 : null,
        updates?.cancelAtPeriodEnd ? 1 : 0,
        now,
        id,
      ]
    );
  }
}

export class D1SubscriptionEventRepository implements SubscriptionEventRepository {
  constructor(private db: DatabaseClient) {}

  async recordEvent(ev: SubscriptionEvent): Promise<void> {
    await this.db.execute(
      `INSERT INTO subscription_events (id, subscription_id, event_type, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        ev.id,
        ev.subscriptionId,
        ev.eventType,
        ev.payloadJson ?? null,
        ev.createdAt,
      ]
    );
  }

  async getEventsBySubscriptionId(subscriptionId: string): Promise<SubscriptionEvent[]> {
    const rows = await this.db.query<DbSubscriptionEventRow>(
      "SELECT * FROM subscription_events WHERE subscription_id = ? ORDER BY created_at ASC",
      [subscriptionId]
    );
    return rows.map((r) => ({
      id: r.id as SubscriptionEventId,
      subscriptionId: r.subscription_id,
      eventType: r.event_type as SubscriptionEventType,
      payloadJson: r.payload_json ?? undefined,
      createdAt: r.created_at,
    }));
  }
}
