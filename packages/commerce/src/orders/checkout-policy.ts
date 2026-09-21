/**
 * VaahanSafe Server-Side Checkout Eligibility Policy
 *
 * INVARIANTS:
 * - Never trust client eligibility.
 * - Authenticated user with verified mobile.
 * - Vehicle must belong to the authenticated user and be ACTIVE.
 * - Product and Plan must be ACTIVE.
 * - Physical products REQUIRE a valid shipping address.
 */

import { CheckoutNotEligibleError } from "../errors/commerce-errors";

export interface CheckoutCustomerContext {
  id: string;
  isMobileVerified?: boolean;
}

export interface CheckoutVehicleContext {
  id: string;
  userId: string;
  status: string;
}

export interface CheckoutProductContext {
  id: string;
  code: string;
  status: string;
  requiresShipping: boolean;
}

export interface CheckoutPlanContext {
  id: string;
  code: string;
  isActive: boolean;
}

export interface CheckoutPreconditionsInput {
  customer: CheckoutCustomerContext;
  product: CheckoutProductContext;
  plan?: CheckoutPlanContext;
  vehicle?: CheckoutVehicleContext;
  shippingAddressId?: string;
}

/**
 * Authoritatively validates checkout preconditions on the server boundary.
 */
export function validateCheckoutPreconditions(input: CheckoutPreconditionsInput): void {
  // 1. Customer Verification
  if (!input.customer || !input.customer.id || !input.customer.id.trim()) {
    throw new CheckoutNotEligibleError("Customer authentication required for checkout");
  }

  if (input.customer.isMobileVerified === false) {
    throw new CheckoutNotEligibleError("Verified mobile number is required prior to checkout");
  }

  // 2. Product Availability
  if (!input.product || input.product.status !== "ACTIVE") {
    throw new CheckoutNotEligibleError(`Product "${input.product?.code ?? "unknown"}" is not active or available`);
  }

  // 3. Plan Availability (if attached)
  if (input.plan && !input.plan.isActive) {
    throw new CheckoutNotEligibleError(`Plan "${input.plan.code}" is not currently available for new subscriptions`);
  }

  // 4. Vehicle Ownership Verification
  if (input.vehicle) {
    if (input.vehicle.userId !== input.customer.id) {
      throw new CheckoutNotEligibleError(
        `Vehicle "${input.vehicle.id}" does not belong to customer "${input.customer.id}"`
      );
    }
    if (input.vehicle.status !== "ACTIVE") {
      throw new CheckoutNotEligibleError(
        `Vehicle "${input.vehicle.id}" is not active (status: ${input.vehicle.status})`
      );
    }
  }

  // 5. Physical Shipping Address Requirement
  if (input.product.requiresShipping) {
    if (!input.shippingAddressId || !input.shippingAddressId.trim()) {
      throw new CheckoutNotEligibleError(
        `Physical product "${input.product.code}" requires a valid shipping address`
      );
    }
  }
}
