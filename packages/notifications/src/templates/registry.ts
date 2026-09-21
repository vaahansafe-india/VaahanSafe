/**
 * Canonical Notification Template Registry
 *
 * Centralized, versioned repository of approved messaging templates for VaahanSafe.
 * INVARIANT: Provider template IDs and messaging structures are mapped centrally here,
 * never scattered through UI or business domain components.
 */

import { TemplateDefinition } from "./definition";
import { escapeHtml } from "./renderer";
import {
  AccountWelcomeVariablesSchema,
  AccountWelcomeVariables,
  QrActivatedVariablesSchema,
  QrActivatedVariables,
  PaymentSuccessVariablesSchema,
  PaymentSuccessVariables,
  SubscriptionRenewedVariablesSchema,
  SubscriptionRenewedVariables,
  SubscriptionRenewalFailedVariablesSchema,
  SubscriptionRenewalFailedVariables,
  ShipmentUpdateVariablesSchema,
  ShipmentUpdateVariables,
  ReplacementApprovedVariablesSchema,
  ReplacementApprovedVariables,
  EmergencyScanAlertVariablesSchema,
  EmergencyScanAlertVariables,
  SecurityChangedVariablesSchema,
  SecurityChangedVariables,
  SupportUpdateVariablesSchema,
  SupportUpdateVariables,
} from "./variables";

export const ACCOUNT_WELCOME_V1: TemplateDefinition<AccountWelcomeVariables> = {
  key: "ACCOUNT_WELCOME_V1",
  version: 1,
  category: "ACCOUNT",
  supportedChannels: ["IN_APP", "EMAIL", "WHATSAPP"],
  schema: AccountWelcomeVariablesSchema,
  renderInApp: (v) => ({
    title: "Welcome to VaahanSafe",
    body: `Hello ${v.displayName}, your account has been created. Pair a vehicle QR sticker to activate emergency protection.`,
    actionType: "VIEW_QR",
  }),
  renderWhatsApp: (v) => ({
    templateName: "vhn_welcome_v1",
    parameters: {
      name: v.displayName,
    },
  }),
  renderEmail: (v) => {
    const safeName = escapeHtml(v.displayName);
    return {
      subject: "Welcome to VaahanSafe — Vehicle Emergency & Safety Network",
      html: `<div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h2>Welcome to VaahanSafe, ${safeName}!</h2>
        <p>Your account is now ready. With VaahanSafe, your vehicle is protected by smart emergency identification stickers.</p>
        <p>Get started by pairing your QR sticker in the customer portal.</p>
      </div>`,
      text: `Welcome to VaahanSafe, ${v.displayName}!\n\nYour account is now ready. Pair your QR sticker in the customer portal to activate emergency identification.`,
    };
  },
};

export const QR_ACTIVATED_V1: TemplateDefinition<QrActivatedVariables> = {
  key: "QR_ACTIVATED_V1",
  version: 1,
  category: "SAFETY",
  supportedChannels: ["IN_APP", "WHATSAPP", "EMAIL"],
  schema: QrActivatedVariablesSchema,
  renderInApp: (v) => ({
    title: "QR Sticker Activated",
    body: `Sticker ${v.publicId} is now active for vehicle ${v.vehicleRegMasked}.`,
    actionType: "VIEW_QR",
    actionTarget: v.publicId,
  }),
  renderWhatsApp: (v) => ({
    templateName: "vhn_qr_activated_v1",
    parameters: {
      public_id: v.publicId,
      vehicle_reg: v.vehicleRegMasked,
    },
  }),
  renderEmail: (v) => {
    const safeReg = escapeHtml(v.vehicleRegMasked);
    const safePublicId = escapeHtml(v.publicId);
    return {
      subject: `QR Sticker Activated for ${v.vehicleRegMasked}`,
      html: `<div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h2>QR Sticker Successfully Activated</h2>
        <p>Sticker ID: <strong>${safePublicId}</strong></p>
        <p>Assigned Vehicle: <strong>${safeReg}</strong></p>
        <p>Your vehicle is now actively protected. Anyone scanning the sticker in an emergency can view your safety profile and contact emergency services.</p>
      </div>`,
      text: `QR Sticker Successfully Activated\n\nSticker ID: ${v.publicId}\nAssigned Vehicle: ${v.vehicleRegMasked}\n\nYour vehicle is now actively protected.`,
    };
  },
};

export const PAYMENT_SUCCESS_V1: TemplateDefinition<PaymentSuccessVariables> = {
  key: "PAYMENT_SUCCESS_V1",
  version: 1,
  category: "COMMERCE",
  supportedChannels: ["IN_APP", "WHATSAPP", "EMAIL"],
  schema: PaymentSuccessVariablesSchema,
  renderInApp: (v) => ({
    title: "Payment Received",
    body: `Payment of ${v.amountDisplay} for order #${v.orderNumber} was successful.`,
    actionType: "VIEW_ORDER",
    actionTarget: v.orderId,
  }),
  renderWhatsApp: (v) => ({
    templateName: "vhn_payment_success_v1",
    parameters: {
      order_number: v.orderNumber,
      amount: v.amountDisplay,
    },
  }),
  renderEmail: (v) => {
    const safeOrderNum = escapeHtml(v.orderNumber);
    const safeAmount = escapeHtml(v.amountDisplay);
    const safePayId = escapeHtml(v.paymentId);
    return {
      subject: `Payment Receipt: Order #${v.orderNumber}`,
      html: `<div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h2>Payment Confirmation</h2>
        <p>Thank you for your payment of <strong>${safeAmount}</strong> for order <strong>#${safeOrderNum}</strong>.</p>
        <p>Transaction Reference: <code>${safePayId}</code></p>
        <p>You can access your verified tax invoice securely inside the VaahanSafe customer app.</p>
      </div>`,
      text: `Payment Confirmation\n\nOrder: #${v.orderNumber}\nAmount: ${v.amountDisplay}\nReference: ${v.paymentId}\n\nAccess your tax invoice securely inside the customer app.`,
    };
  },
};

export const SUBSCRIPTION_RENEWED_V1: TemplateDefinition<SubscriptionRenewedVariables> = {
  key: "SUBSCRIPTION_RENEWED_V1",
  version: 1,
  category: "SUBSCRIPTION",
  supportedChannels: ["IN_APP", "WHATSAPP", "EMAIL"],
  schema: SubscriptionRenewedVariablesSchema,
  renderInApp: (v) => ({
    title: "Subscription Renewed",
    body: `Your ${v.planName} subscription has been renewed until ${v.nextBillingDate}.`,
    actionType: "VIEW_SUBSCRIPTION",
    actionTarget: v.subscriptionId,
  }),
  renderWhatsApp: (v) => ({
    templateName: "vhn_sub_renewed_v1",
    parameters: {
      plan_name: v.planName,
      next_date: v.nextBillingDate,
    },
  }),
  renderEmail: (v) => {
    const safePlan = escapeHtml(v.planName);
    const safeDate = escapeHtml(v.nextBillingDate);
    return {
      subject: `Subscription Renewed: ${v.planName}`,
      html: `<div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h2>Subscription Renewed Successfully</h2>
        <p>Your subscription to <strong>${safePlan}</strong> has been renewed.</p>
        <p>Next billing cycle: <strong>${safeDate}</strong></p>
      </div>`,
      text: `Subscription Renewed Successfully\n\nPlan: ${v.planName}\nNext billing cycle: ${v.nextBillingDate}`,
    };
  },
};

export const SUBSCRIPTION_RENEWAL_FAILED_V1: TemplateDefinition<SubscriptionRenewalFailedVariables> = {
  key: "SUBSCRIPTION_RENEWAL_FAILED_V1",
  version: 1,
  category: "SUBSCRIPTION",
  supportedChannels: ["IN_APP", "WHATSAPP", "EMAIL"],
  schema: SubscriptionRenewalFailedVariablesSchema,
  renderInApp: (v) => ({
    title: "Renewal Payment Failed",
    body: `Renewal for ${v.planName} failed. Please update your payment method to maintain premium features.`,
    actionType: "VIEW_SUBSCRIPTION",
    actionTarget: v.subscriptionId,
  }),
  renderWhatsApp: (v) => ({
    templateName: "vhn_sub_failed_v1",
    parameters: {
      plan_name: v.planName,
    },
  }),
  renderEmail: (v) => {
    const safePlan = escapeHtml(v.planName);
    return {
      subject: `Action Required: Renewal Payment Failed for ${v.planName}`,
      html: `<div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h2>Subscription Renewal Notice</h2>
        <p>We were unable to process the renewal payment for your <strong>${safePlan}</strong> plan.</p>
        <p>Please review and update your payment method in the customer portal. (Note: Your core QR emergency safety profile remains active).</p>
      </div>`,
      text: `Subscription Renewal Notice\n\nWe could not process renewal for ${v.planName}. Please update your payment method in the customer portal. Core QR safety remains active.`,
    };
  },
};

export const SHIPMENT_UPDATE_V1: TemplateDefinition<ShipmentUpdateVariables> = {
  key: "SHIPMENT_UPDATE_V1",
  version: 1,
  category: "FULFILMENT",
  supportedChannels: ["IN_APP", "WHATSAPP", "EMAIL"],
  schema: ShipmentUpdateVariablesSchema,
  renderInApp: (v) => ({
    title: "Shipment Updated",
    body: `Shipment status is now: ${v.status}.`,
    actionType: "VIEW_SHIPMENT",
    actionTarget: v.shipmentId,
  }),
  renderWhatsApp: (v) => ({
    templateName: "vhn_shipment_update_v1",
    parameters: {
      status: v.status,
      tracking: v.trackingNumber || "N/A",
    },
  }),
  renderEmail: (v) => {
    const safeStatus = escapeHtml(v.status);
    const safeTracking = escapeHtml(v.trackingNumber || "Not available yet");
    return {
      subject: `Shipment Update: ${v.status}`,
      html: `<div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h2>Shipment Status Update</h2>
        <p>Current Status: <strong>${safeStatus}</strong></p>
        <p>Tracking Reference: <code>${safeTracking}</code></p>
      </div>`,
      text: `Shipment Status Update\n\nCurrent Status: ${v.status}\nTracking: ${v.trackingNumber || "N/A"}`,
    };
  },
};

export const REPLACEMENT_APPROVED_V1: TemplateDefinition<ReplacementApprovedVariables> = {
  key: "REPLACEMENT_APPROVED_V1",
  version: 1,
  category: "SAFETY",
  supportedChannels: ["IN_APP", "WHATSAPP", "EMAIL"],
  schema: ReplacementApprovedVariablesSchema,
  renderInApp: (v) => ({
    title: "QR Replacement Approved",
    body: `Your replacement request for sticker ${v.originalPublicId} has been approved.`,
    actionType: "VIEW_QR",
    actionTarget: v.newPublicId || v.originalPublicId,
  }),
  renderWhatsApp: (v) => ({
    templateName: "vhn_replace_approved_v1",
    parameters: {
      original_id: v.originalPublicId,
    },
  }),
  renderEmail: (v) => {
    const safeOrig = escapeHtml(v.originalPublicId);
    return {
      subject: `QR Replacement Approved (${v.originalPublicId})`,
      html: `<div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h2>QR Replacement Approved</h2>
        <p>Your request to replace QR sticker <strong>${safeOrig}</strong> has been approved by operations.</p>
        <p>A replacement physical sticker has been scheduled for dispatch.</p>
      </div>`,
      text: `QR Replacement Approved\n\nReplacement for QR sticker ${v.originalPublicId} has been approved. A replacement sticker has been scheduled for dispatch.`,
    };
  },
};

export const EMERGENCY_SCAN_ALERT_V1: TemplateDefinition<EmergencyScanAlertVariables> = {
  key: "EMERGENCY_SCAN_ALERT_V1",
  version: 1,
  category: "SAFETY",
  supportedChannels: ["IN_APP", "WHATSAPP", "EMAIL"],
  schema: EmergencyScanAlertVariablesSchema,
  renderInApp: (v) => ({
    title: "Vehicle QR Scanned",
    body: `A VaahanSafe QR associated with your vehicle ${v.vehicleMaskedReg} was scanned at ${v.scannedAtFormatted}.`,
    actionType: "VIEW_QR",
  }),
  renderWhatsApp: (v) => ({
    templateName: "vhn_qr_scan_alert_v1",
    parameters: {
      vehicle_reg: v.vehicleMaskedReg,
      scanned_at: v.scannedAtFormatted,
    },
  }),
  renderEmail: (v) => {
    const safeReg = escapeHtml(v.vehicleMaskedReg);
    const safeTime = escapeHtml(v.scannedAtFormatted);
    const safeLoc = v.approximateLocation ? `<p>Approximate Location: ${escapeHtml(v.approximateLocation)}</p>` : "";
    return {
      subject: `Safety Alert: QR Scanned for vehicle ${v.vehicleMaskedReg}`,
      html: `<div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h2>Vehicle QR Scanned</h2>
        <p>A VaahanSafe emergency QR sticker associated with your vehicle <strong>${safeReg}</strong> was scanned on <strong>${safeTime}</strong>.</p>
        ${safeLoc}
        <p style="color: #666; font-size: 13px;">Note: A scan alone does not indicate an accident. The public finder view has safely displayed your designated emergency contacts.</p>
      </div>`,
      text: `Safety Alert: Vehicle QR Scanned\n\nA VaahanSafe QR sticker for vehicle ${v.vehicleMaskedReg} was scanned on ${v.scannedAtFormatted}.\n${
        v.approximateLocation ? `Approximate Location: ${v.approximateLocation}\n` : ""
      }\nNote: A scan alone does not indicate an accident.`,
    };
  },
};

export const SECURITY_CHANGED_V1: TemplateDefinition<SecurityChangedVariables> = {
  key: "SECURITY_CHANGED_V1",
  version: 1,
  category: "SECURITY",
  supportedChannels: ["IN_APP", "WHATSAPP", "EMAIL"],
  schema: SecurityChangedVariablesSchema,
  renderInApp: (v) => ({
    title: "Security Settings Modified",
    body: `${v.changeType}: ${v.actionSummary} at ${v.occurredAt}.`,
    actionType: "VIEW_SECURITY",
  }),
  renderWhatsApp: (v) => ({
    templateName: "vhn_security_alert_v1",
    parameters: {
      change_type: v.changeType,
      occurred_at: v.occurredAt,
    },
  }),
  renderEmail: (v) => {
    const safeType = escapeHtml(v.changeType);
    const safeSummary = escapeHtml(v.actionSummary);
    const safeTime = escapeHtml(v.occurredAt);
    return {
      subject: `Security Alert: ${v.changeType}`,
      html: `<div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h2 style="color: #c00;">Security Change Notification</h2>
        <p>We detected the following security modification on your VaahanSafe account:</p>
        <p><strong>${safeType}</strong>: ${safeSummary}</p>
        <p>Timestamp: <strong>${safeTime}</strong></p>
        <p>If you did not perform this change, please log in immediately and revoke active sessions.</p>
      </div>`,
      text: `Security Change Notification\n\nType: ${v.changeType}\nDetails: ${v.actionSummary}\nTime: ${v.occurredAt}\n\nIf you did not authorize this, log in immediately and revoke active sessions.`,
    };
  },
};

export const SUPPORT_UPDATE_V1: TemplateDefinition<SupportUpdateVariables> = {
  key: "SUPPORT_UPDATE_V1",
  version: 1,
  category: "SUPPORT",
  supportedChannels: ["IN_APP", "WHATSAPP", "EMAIL"],
  schema: SupportUpdateVariablesSchema,
  renderInApp: (v) => ({
    title: "Support Ticket Updated",
    body: `Ticket "${v.ticketSubject}" status changed to ${v.status}.`,
    actionType: "VIEW_SUPPORT_TICKET",
    actionTarget: v.ticketId,
  }),
  renderWhatsApp: (v) => ({
    templateName: "vhn_support_update_v1",
    parameters: {
      ticket_id: v.ticketId,
      status: v.status,
    },
  }),
  renderEmail: (v) => {
    const safeSubject = escapeHtml(v.ticketSubject);
    const safeStatus = escapeHtml(v.status);
    const safeId = escapeHtml(v.ticketId);
    return {
      subject: `Support Update: Ticket #${v.ticketId}`,
      html: `<div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h2>Support Case Update</h2>
        <p>Ticket ID: <strong>#${safeId}</strong></p>
        <p>Subject: <strong>${safeSubject}</strong></p>
        <p>Status: <strong>${safeStatus}</strong></p>
      </div>`,
      text: `Support Case Update\n\nTicket: #${v.ticketId}\nSubject: ${v.ticketSubject}\nStatus: ${v.status}`,
    };
  },
};

export const TEMPLATE_REGISTRY: Record<string, TemplateDefinition<any>> = {
  ACCOUNT_WELCOME_V1,
  QR_ACTIVATED_V1,
  PAYMENT_SUCCESS_V1,
  SUBSCRIPTION_RENEWED_V1,
  SUBSCRIPTION_RENEWAL_FAILED_V1,
  SHIPMENT_UPDATE_V1,
  REPLACEMENT_APPROVED_V1,
  EMERGENCY_SCAN_ALERT_V1,
  SECURITY_CHANGED_V1,
  SUPPORT_UPDATE_V1,
};

export function getTemplateDefinition(key: string): TemplateDefinition<any> {
  const tpl = TEMPLATE_REGISTRY[key];
  if (!tpl) {
    throw new Error(`Template not found in registry: "${key}"`);
  }
  return tpl;
}
