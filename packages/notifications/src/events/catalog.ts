/**
 * Canonical Event Catalog
 *
 * Provides metadata, human-readable descriptions, and category associations
 * for all business events that generate notification intents.
 */

import { NotificationEventType, NOTIFICATION_EVENT_TYPES } from "../domain/notification-event";
import { EVENT_CHANNEL_POLICY, ChannelPolicyRule } from "./event-policy";

export interface EventCatalogEntry extends ChannelPolicyRule {
  displayName: string;
  description: string;
}

export const EVENT_CATALOG: Record<NotificationEventType, EventCatalogEntry> = {
  ACCOUNT_WELCOME: {
    ...EVENT_CHANNEL_POLICY.ACCOUNT_WELCOME,
    displayName: "Welcome to VaahanSafe",
    description: "Sent when a user completes registration and first-time account setup.",
  },
  QR_ACTIVATED: {
    ...EVENT_CHANNEL_POLICY.QR_ACTIVATED,
    displayName: "QR Sticker Activated",
    description: "Sent when a customer successfully pairs and activates a QR sticker for their vehicle.",
  },
  PAYMENT_SUCCEEDED: {
    ...EVENT_CHANNEL_POLICY.PAYMENT_SUCCEEDED,
    displayName: "Payment Succeeded",
    description: "Sent after authoritative payment confirmation from payment gateway.",
  },
  SUBSCRIPTION_RENEWED: {
    ...EVENT_CHANNEL_POLICY.SUBSCRIPTION_RENEWED,
    displayName: "Subscription Renewed",
    description: "Sent when a vehicle subscription or safety plan is successfully renewed.",
  },
  SUBSCRIPTION_RENEWAL_FAILED: {
    ...EVENT_CHANNEL_POLICY.SUBSCRIPTION_RENEWAL_FAILED,
    displayName: "Subscription Renewal Failed",
    description: "Sent when an automatic renewal payment attempt fails.",
  },
  SHIPMENT_UPDATED: {
    ...EVENT_CHANNEL_POLICY.SHIPMENT_UPDATED,
    displayName: "Shipment Status Updated",
    description: "Sent when a physical QR package changes shipment status (shipped, out for delivery, delivered).",
  },
  REPLACEMENT_APPROVED: {
    ...EVENT_CHANNEL_POLICY.REPLACEMENT_APPROVED,
    displayName: "QR Replacement Approved",
    description: "Sent when an authorized QR replacement request is approved and scheduled.",
  },
  EMERGENCY_SCAN_ALERT: {
    ...EVENT_CHANNEL_POLICY.EMERGENCY_SCAN_ALERT,
    displayName: "QR Scanned Alert",
    description: "Sent when a public QR sticker is scanned, informing the owner without alarming panic language.",
  },
  SECURITY_CHANGED: {
    ...EVENT_CHANNEL_POLICY.SECURITY_CHANGED,
    displayName: "Security Settings Changed",
    description: "Critical alert sent when phone, credentials, or sessions are modified or revoked.",
  },
  SUPPORT_UPDATED: {
    ...EVENT_CHANNEL_POLICY.SUPPORT_UPDATED,
    displayName: "Support Ticket Updated",
    description: "Sent when a support ticket receives an agent response or status change.",
  },
};

export function getEventCatalogEntry(type: NotificationEventType): EventCatalogEntry {
  const entry = EVENT_CATALOG[type];
  if (!entry) {
    throw new Error(`Unrecognized notification event type: ${type}`);
  }
  return entry;
}

export function listAllEventCatalogEntries(): EventCatalogEntry[] {
  return NOTIFICATION_EVENT_TYPES.map((t) => EVENT_CATALOG[t]);
}
