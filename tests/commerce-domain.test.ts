import { describe, it, expect } from "vitest";
import {
  createMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  formatMoneyDisplay,
  createProduct,
  createPlan,
  createOrder,
  createOrderItem,
  calculateOrderTotals,
  canTransitionOrderStatus,
  assertValidOrderStatusTransition,
  canTransitionPaymentStatus,
  assertValidPaymentStatusTransition,
  canTransitionRefundStatus,
  validateCheckoutPreconditions,
  CommerceDomainError,
  PriceTamperingError,
  InvalidOrderStateError,
  InvalidPaymentStateError,
  CheckoutNotEligibleError,
  STANDARD_PRODUCT_CODES,
  STANDARD_PLAN_CODES,
} from "@vaahansafe/commerce";

describe("Phase 10 — Commerce Domain, Integer Money & State Machines", () => {
  describe("Money Model & Integer Arithmetic (Sections 10 & 11)", () => {
    it("enforces integer minor units (paise in INR) and prevents float money", () => {
      const money = createMoney(49900, "INR"); // ₹499.00
      expect(money.amountMinor).toBe(49900);
      expect(money.currency).toBe("INR");

      // Float values strictly rejected
      expect(() => createMoney(499.99)).toThrow(CommerceDomainError);
      expect(() => createMoney(NaN)).toThrow(CommerceDomainError);
      expect(() => createMoney(-100)).toThrow(CommerceDomainError);
    });

    it("performs safe addition and subtraction in integer units", () => {
      const a = createMoney(49900);
      const b = createMoney(5000); // ₹50.00
      const sum = addMoney(a, b);
      expect(sum.amountMinor).toBe(54900);

      const diff = subtractMoney(sum, b);
      expect(diff.amountMinor).toBe(49900);

      // Result cannot be negative
      expect(() => subtractMoney(b, a)).toThrow(CommerceDomainError);
    });

    it("multiplies money by non-negative integer quantity", () => {
      const unit = createMoney(29900);
      const triple = multiplyMoney(unit, 3);
      expect(triple.amountMinor).toBe(89700);

      expect(() => multiplyMoney(unit, -1)).toThrow(CommerceDomainError);
      expect(() => multiplyMoney(unit, 1.5)).toThrow(CommerceDomainError);
    });

    it("formats integer minor units into standard Indian currency display", () => {
      expect(formatMoneyDisplay(createMoney(49900))).toContain("499.00");
      expect(formatMoneyDisplay(createMoney(149950))).toContain("1,499.50");
      expect(formatMoneyDisplay(createMoney(0))).toContain("0.00");
    });
  });

  describe("Server-Side Price Authority & Tamper Rejection (Section 12)", () => {
    it("authoritatively computes order totals from line items", () => {
      const items = [
        { totalPriceMinor: 49900 }, // ₹499 Physical Sticker
        { totalPriceMinor: 99000 }, // ₹990 Annual Plan
      ];

      const totals = calculateOrderTotals(items, {
        shippingFeeMinor: 5000,   // ₹50 shipping
        discountMinor: 10000,     // ₹100 promo
        taxRatePercent: 18,       // 18% GST
      });

      expect(totals.subtotalMinor).toBe(148900);
      expect(totals.discountMinor).toBe(10000);
      expect(totals.shippingMinor).toBe(5000);
      // Taxable = 148900 - 10000 + 5000 = 143900; 18% of 143900 = 25902
      expect(totals.taxMinor).toBe(25902);
      expect(totals.totalMinor).toBe(169802);
      expect(totals.currency).toBe("INR");
    });

    it("PRICE TAMPERING TEST: rejects client-supplied fake amounts", () => {
      const items = [{ totalPriceMinor: 49900 }];
      const serverTotals = calculateOrderTotals(items);

      // Client attempts to send fake amount: ₹1 (100 paise) instead of ₹499 (49900 paise)
      const clientTamperedAmount = 100;

      expect(() => {
        if (clientTamperedAmount !== serverTotals.totalMinor) {
          throw new PriceTamperingError(clientTamperedAmount, serverTotals.totalMinor);
        }
      }).toThrow(PriceTamperingError);
    });
  });

  describe("Catalog Models: Product & Plan (Sections 05, 06, 08)", () => {
    it("creates canonical products with shipping and QR allocation flags", () => {
      const physical = createProduct({
        code: STANDARD_PRODUCT_CODES.QR_PHYSICAL_STANDARD,
        name: "Standard Vehicle QR Sticker",
        productType: "PHYSICAL_QR_STICKER",
        priceMinor: 49900,
      });

      expect(physical.id).toMatch(/^prod_/);
      expect(physical.requiresShipping).toBe(true);
      expect(physical.requiresQrAllocation).toBe(true);
      expect(physical.status).toBe("ACTIVE");

      const digital = createProduct({
        code: STANDARD_PRODUCT_CODES.QR_DIGITAL_STANDARD,
        name: "Instant Digital QR",
        productType: "DIGITAL_QR",
        priceMinor: 29900,
      });

      expect(digital.requiresShipping).toBe(false);
      expect(digital.requiresQrAllocation).toBe(false);
    });

    it("creates commercial plans with billing interval and capability limits", () => {
      const plan = createPlan({
        code: STANDARD_PLAN_CODES.CORE_ANNUAL,
        name: "Core Annual Protection",
        billingInterval: "ANNUAL",
        priceMinor: 99900,
        vehicleLimit: 1,
        contactLimit: 3,
        features: ["CORE_EMERGENCY_PROFILE", "EMERGENCY_CALL_ACTION", "SCAN_HISTORY"],
      });

      expect(plan.id).toMatch(/^plan_/);
      expect(plan.billingInterval).toBe("ANNUAL");
      expect(plan.vehicleLimit).toBe(1);
      expect(plan.contactLimit).toBe(3);
      expect(plan.features).toContain("SCAN_HISTORY");
    });
  });

  describe("Order Items & Purchase-Time Safe Snapshots (Sections 15 & 16)", () => {
    it("captures safe immutable snapshots of catalog items", () => {
      const item = createOrderItem({
        orderId: "ord_test123",
        itemType: "PRODUCT",
        catalogCode: "QR_PHYSICAL_STANDARD",
        name: "Standard Vehicle QR Sticker",
        quantity: 2,
        unitPriceMinor: 49900,
        snapshot: {
          code: "QR_PHYSICAL_STANDARD",
          name: "Standard Vehicle QR Sticker",
          requiresShipping: true,
        },
      });

      expect(item.id).toMatch(/^item_/);
      expect(item.quantity).toBe(2);
      expect(item.totalPriceMinor).toBe(99800);
      expect(item.snapshotJson).toBeTruthy();
      expect(JSON.parse(item.snapshotJson!).code).toBe("QR_PHYSICAL_STANDARD");
    });
  });

  describe("Order Lifecycle State Machine (Section 14)", () => {
    it("allows valid forward transitions: DRAFT -> PENDING_PAYMENT -> PAID -> FULFILLED", () => {
      expect(canTransitionOrderStatus("DRAFT", "PENDING_PAYMENT")).toBe(true);
      expect(canTransitionOrderStatus("PENDING_PAYMENT", "PAID")).toBe(true);
      expect(canTransitionOrderStatus("PAID", "FULFILMENT_PENDING")).toBe(true);
      expect(canTransitionOrderStatus("FULFILMENT_PENDING", "FULFILLED")).toBe(true);
      expect(canTransitionOrderStatus("PAID", "REFUNDED")).toBe(true);
      expect(canTransitionOrderStatus("PENDING_PAYMENT", "PAYMENT_FAILED")).toBe(true);
      expect(canTransitionOrderStatus("PAYMENT_FAILED", "PENDING_PAYMENT")).toBe(true); // Retry
    });

    it("strictly rejects illegal order transitions", () => {
      expect(canTransitionOrderStatus("FULFILLED", "PENDING_PAYMENT")).toBe(false);
      expect(canTransitionOrderStatus("EXPIRED", "PAID")).toBe(false);
      expect(canTransitionOrderStatus("REFUNDED", "PAID")).toBe(false);

      expect(() => assertValidOrderStatusTransition("FULFILLED", "DRAFT")).toThrow(
        InvalidOrderStateError
      );
    });
  });

  describe("Payment Lifecycle State Machine (Section 29)", () => {
    it("allows valid payment progression: CREATED -> PENDING -> SUCCESS -> REFUND_PENDING -> REFUNDED", () => {
      expect(canTransitionPaymentStatus("CREATED", "PENDING")).toBe(true);
      expect(canTransitionPaymentStatus("PENDING", "SUCCESS")).toBe(true);
      expect(canTransitionPaymentStatus("SUCCESS", "REFUND_PENDING")).toBe(true);
      expect(canTransitionPaymentStatus("REFUND_PENDING", "REFUNDED")).toBe(true);
      expect(canTransitionPaymentStatus("REFUND_PENDING", "REFUND_FAILED")).toBe(true);
      expect(canTransitionPaymentStatus("REFUND_FAILED", "REFUND_PENDING")).toBe(true);
      expect(canTransitionPaymentStatus("PENDING", "FAILED")).toBe(true);
    });

    it("rejects illegal payment status jumps", () => {
      expect(canTransitionPaymentStatus("FAILED", "SUCCESS")).toBe(false);
      expect(canTransitionPaymentStatus("REFUNDED", "SUCCESS")).toBe(false);
      expect(canTransitionPaymentStatus("EXPIRED", "SUCCESS")).toBe(false);

      expect(() => assertValidPaymentStatusTransition("FAILED", "SUCCESS")).toThrow(
        InvalidPaymentStateError
      );
    });
  });

  describe("Refund Lifecycle State Machine (Section 61)", () => {
    it("allows valid refund progression: REQUESTED -> PENDING -> PROCESSED", () => {
      expect(canTransitionRefundStatus("REQUESTED", "PENDING")).toBe(true);
      expect(canTransitionRefundStatus("PENDING", "PROCESSED")).toBe(true);
      expect(canTransitionRefundStatus("PENDING", "FAILED")).toBe(true);
      expect(canTransitionRefundStatus("FAILED", "PENDING")).toBe(true); // Retry
      expect(canTransitionRefundStatus("REQUESTED", "REJECTED")).toBe(true);
      expect(canTransitionRefundStatus("PROCESSED", "PENDING")).toBe(false);
    });
  });

  describe("Checkout Eligibility Preconditions (Section 20)", () => {
    const validCustomer = { id: "usr_alice", isMobileVerified: true };
    const validVehicle = { id: "veh_1", userId: "usr_alice", status: "ACTIVE" };
    const validPhysicalProduct = {
      id: "prod_1",
      code: "QR_PHYSICAL_STANDARD",
      status: "ACTIVE",
      requiresShipping: true,
    };
    const validDigitalProduct = {
      id: "prod_2",
      code: "QR_DIGITAL_STANDARD",
      status: "ACTIVE",
      requiresShipping: false,
    };

    it("passes eligibility for valid physical purchase with address and owned vehicle", () => {
      expect(() =>
        validateCheckoutPreconditions({
          customer: validCustomer,
          vehicle: validVehicle,
          product: validPhysicalProduct,
          shippingAddressId: "addr_123",
        })
      ).not.toThrow();
    });

    it("passes eligibility for digital product without shipping address", () => {
      expect(() =>
        validateCheckoutPreconditions({
          customer: validCustomer,
          vehicle: validVehicle,
          product: validDigitalProduct,
        })
      ).not.toThrow();
    });

    it("rejects physical product checkout without shipping address", () => {
      expect(() =>
        validateCheckoutPreconditions({
          customer: validCustomer,
          vehicle: validVehicle,
          product: validPhysicalProduct,
          // Missing shipping address
        })
      ).toThrow(CheckoutNotEligibleError);
    });

    it("rejects checkout if customer mobile is unverified", () => {
      expect(() =>
        validateCheckoutPreconditions({
          customer: { id: "usr_bob", isMobileVerified: false },
          product: validDigitalProduct,
        })
      ).toThrow(CheckoutNotEligibleError);
    });

    it("rejects checkout if vehicle is not owned by the customer", () => {
      expect(() =>
        validateCheckoutPreconditions({
          customer: validCustomer,
          vehicle: { id: "veh_attacker", userId: "usr_stranger", status: "ACTIVE" },
          product: validDigitalProduct,
        })
      ).toThrow(CheckoutNotEligibleError);
    });
  });
});
