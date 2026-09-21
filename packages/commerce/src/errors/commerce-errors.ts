/**
 * VaahanSafe Commerce Domain Errors
 */

export class CommerceDomainError extends Error {
  constructor(message: string, public readonly code: string = "COMMERCE_DOMAIN_ERROR") {
    super(message);
    this.name = "CommerceDomainError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PriceTamperingError extends CommerceDomainError {
  constructor(clientAmount: number, authoritativeAmount: number) {
    super(
      `Price tampering detected: client sent ${clientAmount} minor units, but server authoritative total is ${authoritativeAmount}`,
      "PRICE_TAMPERING_DETECTED"
    );
    this.name = "PriceTamperingError";
  }
}

export class InvalidOrderStateError extends CommerceDomainError {
  constructor(fromStatus: string, toStatus: string) {
    super(
      `Illegal order status transition from "${fromStatus}" to "${toStatus}"`,
      "INVALID_ORDER_STATE_TRANSITION"
    );
    this.name = "InvalidOrderStateError";
  }
}

export class InvalidPaymentStateError extends CommerceDomainError {
  constructor(fromStatus: string, toStatus: string) {
    super(
      `Illegal payment status transition from "${fromStatus}" to "${toStatus}"`,
      "INVALID_PAYMENT_STATE_TRANSITION"
    );
    this.name = "InvalidPaymentStateError";
  }
}

export class CheckoutNotEligibleError extends CommerceDomainError {
  constructor(reason: string) {
    super(`Checkout eligibility rejected: ${reason}`, "CHECKOUT_NOT_ELIGIBLE");
    this.name = "CheckoutNotEligibleError";
  }
}

export class ProductNotAvailableError extends CommerceDomainError {
  constructor(productCode: string, reason: string = "Product is not active or available") {
    super(`Product "${productCode}" is not available: ${reason}`, "PRODUCT_NOT_AVAILABLE");
    this.name = "ProductNotAvailableError";
  }
}

export class PlanNotAvailableError extends CommerceDomainError {
  constructor(planCode: string, reason: string = "Plan is not active or available") {
    super(`Plan "${planCode}" is not available: ${reason}`, "PLAN_NOT_AVAILABLE");
    this.name = "PlanNotAvailableError";
  }
}

export class UnauthorizedOrderAccessError extends CommerceDomainError {
  constructor(orderId: string, userId?: string) {
    super(
      `Unauthorized order access: order "${orderId}" does not belong to user "${userId ?? "anonymous"}"`,
      "UNAUTHORIZED_ORDER_ACCESS"
    );
    this.name = "UnauthorizedOrderAccessError";
  }
}

export class OrderNotFoundError extends CommerceDomainError {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`, "ORDER_NOT_FOUND");
    this.name = "OrderNotFoundError";
  }
}
