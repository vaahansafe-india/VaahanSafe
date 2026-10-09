import type { RazorpayOrderEntity, RazorpayPaymentEntity } from "../types";
export interface CreateOrderParams {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}
export interface RefundParams {
  amount?: number;
  notes?: Record<string, string>;
}
/** Server-only HTTPS client. Provider failures never become synthetic success. */
export class RazorpayClient {
  private readonly baseUrl = "https://api.razorpay.com/v1";
  constructor(
    private readonly keyId?: string,
    private readonly keySecret?: string,
  ) {}
  isConfigured() {
    return Boolean(
      /^rzp_(test|live)_[A-Za-z0-9]+$/.test(this.keyId || "") &&
      this.keySecret &&
      this.keySecret.length > 8 &&
      !/placeholder|test_secret|replace_with/i.test(
        `${this.keyId}:${this.keySecret}`,
      ),
    );
  }
  private async request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    if (!this.isConfigured())
      throw new Error("Payment provider configuration unavailable");
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${btoa(`${this.keyId}:${this.keySecret}`)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.error("[Razorpay] Request unavailable", {
        method,
        status: response.status,
      });
      throw new Error("Payment provider unavailable");
    }
    return response.json() as Promise<T>;
  }
  createOrder(params: CreateOrderParams) {
    if (
      !Number.isSafeInteger(params.amount) ||
      params.amount <= 0 ||
      (params.currency || "INR") !== "INR" ||
      !params.receipt ||
      params.receipt.length > 40
    )
      throw new Error("Invalid payment order");
    return this.request<RazorpayOrderEntity>("/orders", "POST", {
      ...params,
      currency: "INR",
    });
  }
  getOrder(orderId: string) {
    return this.request<RazorpayOrderEntity>(
      `/orders/${encodeURIComponent(orderId)}`,
    );
  }
  getOrderPayments(orderId: string) {
    return this.request<{ items: RazorpayPaymentEntity[] }>(
      `/orders/${encodeURIComponent(orderId)}/payments`,
    );
  }
  getPayment(paymentId: string) {
    return this.request<RazorpayPaymentEntity>(
      `/payments/${encodeURIComponent(paymentId)}`,
    );
  }
  createRefund(paymentId: string, params?: RefundParams) {
    if (
      params?.amount !== undefined &&
      (!Number.isSafeInteger(params.amount) || params.amount <= 0)
    )
      throw new Error("Invalid refund amount");
    return this.request<{ id: string; status: string }>(
      `/payments/${encodeURIComponent(paymentId)}/refund`,
      "POST",
      params || {},
    );
  }
}
