/**
 * VaahanSafe Subscription Domain Errors
 */

export class SubscriptionDomainError extends Error {
  constructor(message: string, public readonly code: string = "SUBSCRIPTION_DOMAIN_ERROR") {
    super(message);
    this.name = "SubscriptionDomainError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidSubscriptionStateError extends SubscriptionDomainError {
  constructor(fromStatus: string, toStatus: string) {
    super(
      `Illegal subscription status transition from "${fromStatus}" to "${toStatus}"`,
      "INVALID_SUBSCRIPTION_STATE_TRANSITION"
    );
    this.name = "InvalidSubscriptionStateError";
  }
}

export class SubscriptionNotFoundError extends SubscriptionDomainError {
  constructor(subscriptionId: string) {
    super(`Subscription not found: ${subscriptionId}`, "SUBSCRIPTION_NOT_FOUND");
    this.name = "SubscriptionNotFoundError";
  }
}

export class UnauthorizedSubscriptionAccessError extends SubscriptionDomainError {
  constructor(subscriptionId: string, userId?: string) {
    super(
      `Unauthorized subscription access: subscription "${subscriptionId}" does not belong to user "${userId ?? "anonymous"}"`,
      "UNAUTHORIZED_SUBSCRIPTION_ACCESS"
    );
    this.name = "UnauthorizedSubscriptionAccessError";
  }
}
