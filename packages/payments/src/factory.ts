import type { PaymentGateway } from "@vaahansafe/types";
import { RazorpayPaymentAdapter, type RazorpayAdapterConfig } from "./providers/razorpay-adapter";
import { CashfreePaymentAdapter } from "./providers/cashfree-adapter";

/**
 * Factory resolving the active RazorpayPaymentAdapter from environment or explicit config.
 */
export function getRazorpayPaymentGateway(options?: RazorpayAdapterConfig): RazorpayPaymentAdapter {
  return new RazorpayPaymentAdapter({
    keyId: options?.keyId || process.env.RAZORPAY_KEY_ID,
    keySecret: options?.keySecret || process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: options?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET,
    mode: options?.mode || (process.env.RAZORPAY_MODE as "test" | "live") || "test",
  });
}

/**
 * Factory resolving legacy CashfreePaymentAdapter (retained for historical audit).
 */
export function getCashfreePaymentGateway(options?: {
  clientId?: string;
  clientSecret?: string;
  env?: "TEST" | "PROD";
}): CashfreePaymentAdapter {
  const clientId =
    options?.clientId || process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_APP_ID;
  const clientSecret =
    options?.clientSecret || process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET;
  const env =
    options?.env || (process.env.CASHFREE_ENV as "TEST" | "PROD") || "TEST";
  return new CashfreePaymentAdapter(clientId, clientSecret, env);
}

/**
 * Master payment gateway resolver.
 * Defaults to Razorpay unless PAYMENT_PROVIDER is explicitly set to cashfree.
 */
export function getPaymentGateway(): PaymentGateway {
  const provider = (process.env.PAYMENT_PROVIDER || "razorpay").toLowerCase();

  if (provider === "cashfree") {
    return getCashfreePaymentGateway();
  }

  return getRazorpayPaymentGateway();
}
