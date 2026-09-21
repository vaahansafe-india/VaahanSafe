/**
 * Central Event-to-Channel Policy Matrix
 *
 * Defines the default channel eligibility, categories, and priority for canonical events.
 * INVARIANT: Never scatter this matrix across UI components or distributed services.
 */

import { NotificationEventType } from "../domain/notification-event";
import { NotificationChannel } from "../domain/channel";
import { NotificationCategory } from "../domain/category";
import { NotificationPriority } from "../domain/priority";

export interface ChannelPolicyRule {
  eventType: NotificationEventType;
  category: NotificationCategory;
  defaultPriority: NotificationPriority;
  templateKey: string;
  inApp: boolean;
  whatsApp: "YES" | "OPTIONAL" | "IF_ENABLED" | "NO";
  email: "YES" | "OPTIONAL" | "RECEIPT" | "NO";
  isMandatorySecurity: boolean;
}

export const EVENT_CHANNEL_POLICY: Record<NotificationEventType, ChannelPolicyRule> = {
  ACCOUNT_WELCOME: {
    eventType: "ACCOUNT_WELCOME",
    category: "ACCOUNT",
    defaultPriority: "NORMAL",
    templateKey: "ACCOUNT_WELCOME_V1",
    inApp: true,
    whatsApp: "OPTIONAL",
    email: "YES",
    isMandatorySecurity: false,
  },
  QR_ACTIVATED: {
    eventType: "QR_ACTIVATED",
    category: "SAFETY",
    defaultPriority: "NORMAL",
    templateKey: "QR_ACTIVATED_V1",
    inApp: true,
    whatsApp: "YES",
    email: "YES",
    isMandatorySecurity: false,
  },
  PAYMENT_SUCCEEDED: {
    eventType: "PAYMENT_SUCCEEDED",
    category: "COMMERCE",
    defaultPriority: "NORMAL",
    templateKey: "PAYMENT_SUCCESS_V1",
    inApp: true,
    whatsApp: "YES",
    email: "RECEIPT",
    isMandatorySecurity: false,
  },
  SUBSCRIPTION_RENEWED: {
    eventType: "SUBSCRIPTION_RENEWED",
    category: "SUBSCRIPTION",
    defaultPriority: "NORMAL",
    templateKey: "SUBSCRIPTION_RENEWED_V1",
    inApp: true,
    whatsApp: "YES",
    email: "YES",
    isMandatorySecurity: false,
  },
  SUBSCRIPTION_RENEWAL_FAILED: {
    eventType: "SUBSCRIPTION_RENEWAL_FAILED",
    category: "SUBSCRIPTION",
    defaultPriority: "HIGH",
    templateKey: "SUBSCRIPTION_RENEWAL_FAILED_V1",
    inApp: true,
    whatsApp: "YES",
    email: "YES",
    isMandatorySecurity: false,
  },
  SHIPMENT_UPDATED: {
    eventType: "SHIPMENT_UPDATED",
    category: "FULFILMENT",
    defaultPriority: "NORMAL",
    templateKey: "SHIPMENT_UPDATE_V1",
    inApp: true,
    whatsApp: "YES",
    email: "OPTIONAL",
    isMandatorySecurity: false,
  },
  REPLACEMENT_APPROVED: {
    eventType: "REPLACEMENT_APPROVED",
    category: "SAFETY",
    defaultPriority: "NORMAL",
    templateKey: "REPLACEMENT_APPROVED_V1",
    inApp: true,
    whatsApp: "YES",
    email: "YES",
    isMandatorySecurity: false,
  },
  EMERGENCY_SCAN_ALERT: {
    eventType: "EMERGENCY_SCAN_ALERT",
    category: "SAFETY",
    defaultPriority: "HIGH",
    templateKey: "EMERGENCY_SCAN_ALERT_V1",
    inApp: true,
    whatsApp: "IF_ENABLED",
    email: "OPTIONAL",
    isMandatorySecurity: false,
  },
  SECURITY_CHANGED: {
    eventType: "SECURITY_CHANGED",
    category: "SECURITY",
    defaultPriority: "CRITICAL",
    templateKey: "SECURITY_CHANGED_V1",
    inApp: true,
    whatsApp: "YES",
    email: "YES",
    isMandatorySecurity: true,
  },
  SUPPORT_UPDATED: {
    eventType: "SUPPORT_UPDATED",
    category: "SUPPORT",
    defaultPriority: "LOW",
    templateKey: "SUPPORT_UPDATE_V1",
    inApp: true,
    whatsApp: "OPTIONAL",
    email: "YES",
    isMandatorySecurity: false,
  },
};

/**
 * Returns the default eligible channels for an event before user preference evaluation.
 */
export function getEligibleChannelsForEvent(eventType: NotificationEventType): NotificationChannel[] {
  const policy = EVENT_CHANNEL_POLICY[eventType];
  if (!policy) return [];

  const channels: NotificationChannel[] = [];
  if (policy.inApp) channels.push("IN_APP");
  if (policy.whatsApp !== "NO") channels.push("WHATSAPP");
  if (policy.email !== "NO") channels.push("EMAIL");

  return channels;
}
