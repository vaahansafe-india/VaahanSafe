/**
 * VaahanSafe Subscription Repository Ports
 */

import { Subscription } from "../domain/subscription";
import { SubscriptionStatus } from "../domain/subscription-status";
import { SubscriptionEvent } from "../domain/subscription-event";

export interface SubscriptionRepository {
  findById(id: string): Promise<Subscription | null>;
  findByUserId(userId: string): Promise<Subscription[]>;
  findByVehicleId(vehicleId: string): Promise<Subscription | null>;
  create(subscription: Subscription): Promise<void>;
  updateStatus(
    id: string,
    status: SubscriptionStatus,
    updates?: {
      currentPeriodStart?: string;
      currentPeriodEnd?: string;
      cancelAtPeriodEnd?: boolean;
    }
  ): Promise<void>;
}

export interface SubscriptionEventRepository {
  recordEvent(event: SubscriptionEvent): Promise<void>;
  getEventsBySubscriptionId(subscriptionId: string): Promise<SubscriptionEvent[]>;
}
