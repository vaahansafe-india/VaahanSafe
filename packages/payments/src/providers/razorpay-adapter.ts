import type {
  PaymentStatus,
  PaymentGateway,
  PaymentOrderInput,
  PaymentOrderSession,
  WebhookVerificationResult,
  RazorpayWebhookPayload,
  IPaymentProvider,
  CreatePaymentOrderInput,
  CreatePaymentOrderResult,
} from "../types";
import { RazorpayClient } from "../client/razorpay-client";
import { verifyRazorpayWebhookSignature } from "../signatures/razorpay-signatures";

export interface RazorpayAdapterConfig {
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
  mode?: "test" | "live";
}

/**
 * Razorpay Payment Gateway Adapter implementing the provider-agnostic PaymentGateway port.
 *
 * INVARIANTS:
 * - Direct Cloudflare edge/worker compatible REST communication.
 * - Browser receives ONLY the public keyId and authoritative orderId.
 * - Secrets never leave the server.
 * - Checkout signatures and webhook signatures are cryptographically verified with timing-safe checks.
 */
export class RazorpayPaymentAdapter
  implements IPaymentProvider, PaymentGateway
{
  private readonly client: RazorpayClient;
  private readonly keyId: string;
  private readonly keySecret?: string;
  private readonly webhookSecret?: string;
  public readonly mode: "test" | "live";

  constructor(config?: RazorpayAdapterConfig) {
    this.keyId = config?.keyId || process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = config?.keySecret || process.env.RAZORPAY_KEY_SECRET;
    this.webhookSecret =
      config?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
    this.mode =
      config?.mode || (process.env.RAZORPAY_MODE as "test" | "live") || "test";
    if (
      !["test", "live"].includes(this.mode) ||
      (this.keyId && !this.keyId.startsWith(`rzp_${this.mode}_`))
    )
      throw new Error("Payment provider mode mismatch");
    this.client = new RazorpayClient(this.keyId, this.keySecret);
  }

  get rawClient(): RazorpayClient {
    return this.client;
  }

  // ==========================================
  // PaymentGateway PORT METHODS
  // ==========================================

  async createPaymentOrder(
    input: PaymentOrderInput,
  ): Promise<PaymentOrderSession> {
    const rzpOrder = await this.client.createOrder({
      amount: input.amountPaise,
      currency: input.currency || "INR",
      receipt: input.orderId,
      notes: {
        vaahansafe_order_ref: input.orderId,
        purchase_type: "QR_SAFETY_KIT",
      },
    });

    if (
      !/^order_[A-Za-z0-9]+$/.test(rzpOrder.id) ||
      rzpOrder.amount !== input.amountPaise ||
      rzpOrder.currency !== "INR" ||
      rzpOrder.receipt !== input.orderId
    )
      throw new Error("Payment provider order mismatch");
    return {
      gatewayOrderId: rzpOrder.id,
      orderId: input.orderId,
      gatewayStatus: this.mapGatewayStatusToInternalStatus(rzpOrder.status),
      checkoutOptions: {
        keyId: this.keyId,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || "INR",
        name: "VaahanSafe",
        description: "VaahanSafe QR Safety Kit",
        prefill: {
          name: input.customerName,
          email: input.customerEmail,
          contact: input.customerPhone,
        },
        theme: {
          color: "#CC785C",
        },
      },
    };
  }

  async fetchPaymentStatus(gatewayOrderId: string): Promise<{
    status: PaymentStatus;
    gatewayPaymentId?: string;
    amountPaise: number;
  }> {
    try {
      const order = await this.client.getOrder(gatewayOrderId);
      const payments = await this.client.getOrderPayments(gatewayOrderId);
      const captured = payments.items.find(
        (payment) =>
          payment.order_id === order.id &&
          payment.status === "captured" &&
          payment.captured === true &&
          payment.amount === order.amount &&
          payment.currency === order.currency,
      );
      const isPaid =
        order.status === "paid" &&
        order.amount_paid === order.amount &&
        order.amount_due === 0 &&
        Boolean(captured);

      return {
        status: isPaid ? "SUCCESS" : "PENDING",
        gatewayPaymentId: isPaid ? captured?.id : undefined,
        amountPaise: order.amount,
      };
    } catch (err) {
      throw new Error("Payment provider status unavailable");
    }
  }

  async verifyWebhook(
    rawBody: string,
    signature: string,
    _timestamp?: string,
  ): Promise<WebhookVerificationResult> {
    const isValid = await verifyRazorpayWebhookSignature(
      rawBody,
      signature,
      this.webhookSecret,
    );

    if (!isValid) {
      return { isValid: false };
    }

    try {
      const parsed = JSON.parse(rawBody) as RazorpayWebhookPayload;
      const payment = parsed.payload?.payment?.entity;
      const order = parsed.payload?.order?.entity;

      return {
        isValid: true,
        eventTime: parsed.created_at
          ? new Date(parsed.created_at * 1000).toISOString()
          : undefined,
        eventType: parsed.event,
        rawSafePayload: {
          orderId:
            order?.receipt ||
            payment?.notes?.vaahansafe_order_ref ||
            payment?.order_id,
          gatewayOrderId: payment?.order_id || order?.id,
          gatewayPaymentId: payment?.id,
          paymentStatus: payment?.status,
          amount: payment?.amount,
        },
      };
    } catch {
      return { isValid: false };
    }
  }

  // ==========================================
  // IPaymentProvider LEGACY METHODS
  // ==========================================

  async createOrder(
    input: CreatePaymentOrderInput,
  ): Promise<CreatePaymentOrderResult> {
    const session = await this.createPaymentOrder({
      orderId: input.orderId,
      amountPaise: Math.round(input.orderAmount * 100),
      currency: (input.orderCurrency as "INR") || "INR",
      customerId: input.customerDetails.customerId,
      customerPhone: input.customerDetails.customerPhone,
      customerName: input.customerDetails.customerName,
      customerEmail: input.customerDetails.customerEmail,
      returnUrl: input.orderMeta?.returnUrl || "",
      notifyUrl: input.orderMeta?.notifyUrl || "",
    });

    return {
      gatewayOrderId: session.gatewayOrderId,
      orderId: session.orderId,
      orderStatus: session.gatewayStatus as any,
      checkoutOptions: session.checkoutOptions,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
    return verifyRazorpayWebhookSignature(
      rawBody,
      signature,
      this.webhookSecret,
    );
  }

  mapGatewayStatusToInternalStatus(status: string): PaymentStatus {
    switch (status.toLowerCase()) {
      case "paid":
      case "captured":
      case "success":
        return "SUCCESS";
      case "failed":
        return "FAILED";
      case "attempted":
      case "created":
      case "authorized":
      default:
        return "PENDING";
    }
  }
}
