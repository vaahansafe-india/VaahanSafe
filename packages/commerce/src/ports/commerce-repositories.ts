/**
 * VaahanSafe Commerce Repository Ports
 *
 * INVARIANT: Domain layer defines repository interfaces;
 * D1 database adapters implement them in persistence layer.
 */

import { Product } from "../catalog/product";
import { Plan } from "../catalog/plan";
import { Order } from "../orders/order";
import { OrderItem } from "../orders/order-item";
import { OrderStatus } from "../orders/order-status";
import { PaymentStatus } from "../payments/payment-status";

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: "CASHFREE" | "INTERNAL" | "MANUAL";
  providerOrderId?: string;
  providerPaymentId?: string;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
  attemptNumber: number;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
}

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findByCode(code: string): Promise<Product | null>;
  findActiveProducts(): Promise<Product[]>;
  save(product: Product): Promise<void>;
}

export interface PlanRepository {
  findById(id: string): Promise<Plan | null>;
  findByCode(code: string): Promise<Plan | null>;
  findActivePlans(): Promise<Plan[]>;
  save(plan: Plan): Promise<void>;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByIdempotencyKey(key: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  createWithItems(order: Order, items: OrderItem[]): Promise<void>;
  updateStatus(id: string, status: OrderStatus, paidAt?: string): Promise<void>;
  getItems(orderId: string): Promise<OrderItem[]>;
}

export interface PaymentRepository {
  findById(id: string): Promise<PaymentRecord | null>;
  findByOrderId(orderId: string): Promise<PaymentRecord[]>;
  findByProviderOrder(provider: string, providerOrderId: string): Promise<PaymentRecord | null>;
  create(payment: PaymentRecord): Promise<void>;
  updateStatus(id: string, status: PaymentStatus, confirmedAt?: string): Promise<void>;
}
