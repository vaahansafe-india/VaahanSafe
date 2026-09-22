import type {
  PaymentStatus,
  PaymentGateway,
  PaymentOrderInput,
  PaymentOrderSession,
  RazorpayCheckoutOptions,
  WebhookVerificationResult,
} from "@vaahansafe/types";

export type {
  PaymentStatus,
  PaymentGateway,
  PaymentOrderInput,
  PaymentOrderSession,
  RazorpayCheckoutOptions,
  WebhookVerificationResult,
};

export type PaymentProviderType = "RAZORPAY" | "CASHFREE" | "INTERNAL" | "MANUAL";

export interface CreatePaymentOrderInput {
  orderId: string;
  orderAmount: number; // in INR
  orderCurrency?: string;
  customerDetails: {
    customerId: string;
    customerPhone: string;
    customerEmail?: string;
    customerName?: string;
  };
  orderMeta?: {
    returnUrl?: string;
    notifyUrl?: string;
  };
}

export interface CreatePaymentOrderResult {
  cfOrderId?: string;
  gatewayOrderId: string;
  orderId: string;
  paymentSessionId?: string;
  orderStatus: "ACTIVE" | "PAID" | "EXPIRED" | "CREATED";
  checkoutOptions?: RazorpayCheckoutOptions;
}

export interface RazorpayOrderEntity {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentEntity {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  order_id: string;
  invoice_id?: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string | null;
  captured: boolean;
  description?: string;
  card_id?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  email: string;
  contact: string;
  notes: Record<string, string>;
  fee?: number;
  tax?: number;
  error_code?: string | null;
  error_description?: string | null;
  created_at: number;
}

export interface RazorpayWebhookPayload {
  entity: "event";
  account_id: string;
  event:
    | "payment.authorized"
    | "payment.captured"
    | "payment.failed"
    | "order.paid"
    | "refund.processed"
    | "refund.failed"
    | string;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    order?: {
      entity: RazorpayOrderEntity;
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        currency: string;
        status: string;
      };
    };
  };
  created_at: number;
}

export interface CashfreeWebhookPayload {
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
      order_tags?: Record<string, string>;
    };
    payment: {
      cf_payment_id: string;
      payment_status: "SUCCESS" | "FAILED" | "USER_DROPPED";
      payment_amount: number;
      payment_currency: string;
      payment_time: string;
      payment_method?: Record<string, unknown>;
    };
    customer_details: {
      customer_id: string;
      customer_phone: string;
      customer_email?: string;
    };
  };
  event_time: string;
  type: string;
}

export interface IPaymentProvider {
  createOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult>;
  verifyWebhookSignature(rawBody: string, signature: string, timestamp?: string): boolean;
  mapGatewayStatusToInternalStatus(status: string): PaymentStatus;
}
