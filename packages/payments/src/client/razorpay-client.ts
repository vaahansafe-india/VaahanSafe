import type {
  RazorpayOrderEntity,
  RazorpayPaymentEntity,
} from "../types";

export interface CreateOrderParams {
  amount: number; // in minor units (paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RefundParams {
  amount?: number; // optional partial refund in paise
  notes?: Record<string, string>;
}

/**
 * Cloudflare-native Razorpay REST Client.
 *
 * Implements direct HTTPS communication with Razorpay v1 REST API using standard fetch
 * and Basic Authentication. Completely free of Node.js-specific modules (https, stream, etc.).
 */
export class RazorpayClient {
  private readonly baseUrl = "https://api.razorpay.com/v1";

  constructor(
    private readonly keyId?: string,
    private readonly keySecret?: string
  ) {}

  public isConfigured(): boolean {
    return Boolean(
      this.keyId &&
        this.keySecret &&
        this.keyId.length > 8 &&
        this.keySecret.length > 8 &&
        !this.keyId.includes("placeholder") &&
        !this.keyId.includes("test_id") &&
        !this.keyId.startsWith("mock_") &&
        (this.keyId.startsWith("rzp_test_") || this.keyId.startsWith("rzp_live_"))
    );
  }

  private get authHeaders(): Record<string, string> {
    const credentials = `${this.keyId || ""}:${this.keySecret || ""}`;
    const encoded = typeof btoa === "function"
      ? btoa(credentials)
      : Buffer.from(credentials).toString("base64");

    return {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Creates an order with Razorpay Orders API.
   */
  async createOrder(params: CreateOrderParams): Promise<RazorpayOrderEntity> {
    if (!this.isConfigured()) {
      // Synthetic fallback for offline local mock tests without API credentials
      return {
        id: `order_${Math.random().toString(36).slice(2, 12)}`,
        entity: "order",
        amount: params.amount,
        amount_paid: 0,
        amount_due: params.amount,
        currency: params.currency || "INR",
        receipt: params.receipt,
        status: "created",
        attempts: 0,
        notes: params.notes || {},
        created_at: Math.floor(Date.now() / 1000),
      };
    }

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: this.authHeaders,
      body: JSON.stringify({
        amount: Math.round(params.amount),
        currency: params.currency || "INR",
        receipt: params.receipt.slice(0, 40), // Razorpay limits receipt to 40 chars
        notes: params.notes || {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const hint = response.status === 401 ? " (Authentication failed: verify RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env.local)" : "";
      throw new Error(
        `[RazorpayClient] Order creation failed (${response.status}): ${errorText}${hint}`
      );
    }

    return (await response.json()) as RazorpayOrderEntity;
  }

  /**
   * Fetches order details from Razorpay.
   */
  async getOrder(orderId: string): Promise<RazorpayOrderEntity> {
    if (!this.isConfigured()) {
      return {
        id: orderId,
        entity: "order",
        amount: 149900,
        amount_paid: 149900,
        amount_due: 0,
        currency: "INR",
        receipt: `rcpt_${orderId}`,
        status: "paid",
        attempts: 1,
        notes: {},
        created_at: Math.floor(Date.now() / 1000),
      };
    }

    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: "GET",
      headers: this.authHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `[RazorpayClient] Failed to fetch order ${orderId} (${response.status}): ${errorText}`
      );
    }

    return (await response.json()) as RazorpayOrderEntity;
  }

  /**
   * Fetches payment details from Razorpay.
   */
  async getPayment(paymentId: string): Promise<RazorpayPaymentEntity> {
    if (!this.isConfigured()) {
      return {
        id: paymentId,
        entity: "payment",
        amount: 149900,
        currency: "INR",
        status: "captured",
        order_id: `order_mock_${paymentId}`,
        international: false,
        method: "upi",
        amount_refunded: 0,
        captured: true,
        email: "customer@example.com",
        contact: "+919999999999",
        notes: {},
        created_at: Math.floor(Date.now() / 1000),
      };
    }

    const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
      method: "GET",
      headers: this.authHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `[RazorpayClient] Failed to fetch payment ${paymentId} (${response.status}): ${errorText}`
      );
    }

    return (await response.json()) as RazorpayPaymentEntity;
  }

  /**
   * Creates a refund for a payment.
   */
  async createRefund(paymentId: string, params?: RefundParams): Promise<{ id: string; status: string }> {
    if (!this.isConfigured()) {
      return {
        id: `rfnd_${Math.random().toString(36).slice(2, 12)}`,
        status: "processed",
      };
    }

    const response = await fetch(`${this.baseUrl}/payments/${paymentId}/refund`, {
      method: "POST",
      headers: this.authHeaders,
      body: JSON.stringify({
        amount: params?.amount ? Math.round(params.amount) : undefined,
        notes: params?.notes || {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `[RazorpayClient] Refund failed for payment ${paymentId} (${response.status}): ${errorText}`
      );
    }

    return (await response.json()) as { id: string; status: string };
  }
}
