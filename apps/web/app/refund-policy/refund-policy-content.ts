/**
 * VAAHANSAFE REFUND POLICY CONTENT ARCHITECTURE
 *
 * This structured content module decouples formal commercial refund policy,
 * order review flows, and regulatory taxonomy from UI rendering components.
 *
 * CORE CONCEPTUAL MODEL:
 * PURCHASE → CONFIRM → FULFILL → NON-REFUNDABLE
 *
 * CLOSING EDITORIAL PRINCIPLE:
 * “NO REFUND DOES NOT MEAN NO SUPPORT.”
 *
 * IMPORTANT LEGAL NOTE:
 * Completed purchases are generally non-refundable once the non-refundable stage is reached.
 * Specific statutory references, exact cancellation cutoff points, banking reconciliation
 * windows, and replacement fee tiers must be formally validated by qualified legal counsel
 * and product leadership prior to final regulatory publication.
 */

export interface RefundMetadata {
  readonly title: string;
  readonly subtitle: string;
  readonly documentId: string;
  readonly effectiveDate: string;
  readonly lastUpdated: string;
  readonly version: string;
  readonly status: "DRAFT_PENDING_LEGAL_REVIEW" | "ACTIVE";
}

// LEGAL REVIEW REQUIRED:
// Confirm exact refund policy effective date and version numbers prior to formal publication.
export const REFUND_POLICY_META: RefundMetadata = {
  title: "Refund Policy",
  subtitle: "Vehicle Safety Identity Platform for India",
  documentId: "DOCUMENT / 03",
  effectiveDate: "March 15, 2026",
  lastUpdated: "March 15, 2026",
  version: "1.0",
  status: "DRAFT_PENDING_LEGAL_REVIEW",
} as const;

export interface RefundPolicyConfig {
  readonly generalRule: {
    readonly refundable: boolean;
    readonly copy: string;
    readonly qualifier: string;
  };
  readonly nonRefundableTrigger: string | null;
  readonly cancellation: {
    readonly supported: boolean | null;
    readonly cutoff: string | null;
  };
  readonly subscriptions: {
    readonly refundable: boolean | null;
    readonly proratedRefunds: boolean | null;
  };
  readonly replacement: {
    readonly handledSeparately: boolean;
  };
}

export const REFUND_POLICY_CONFIG: RefundPolicyConfig = {
  generalRule: {
    refundable: false,
    copy: "Completed VaahanSafe purchases are generally non-refundable once the applicable purchase or order has reached the final purchase stage.",
    qualifier: "Exceptions may apply where a refund or other remedy is required under applicable law.",
  },
  // PRODUCT POLICY + LEGAL REVIEW REQUIRED:
  // Product leadership must confirm the precise non-refundable stage (e.g., payment success vs. sticker dispatch).
  nonRefundableTrigger: null,
  cancellation: {
    supported: null,
    cutoff: null,
  },
  subscriptions: {
    refundable: null,
    proratedRefunds: null,
  },
  replacement: {
    handledSeparately: true,
  },
};

export interface EditorialRowItem {
  readonly index: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
}

export const BEFORE_YOU_PURCHASE_ITEMS: readonly EditorialRowItem[] = [
  {
    index: "01",
    title: "PURCHASES",
    summary: "Generally non-refundable.",
    description:
      "Completed VaahanSafe purchases are generally non-refundable after reaching the applicable final purchase stage. Once customized hardware or digital identities are assigned, transactions are treated as final.",
  },
  {
    index: "02",
    title: "CHECK YOUR ORDER",
    summary: "Review before paying.",
    description:
      "Confirm the vehicle registration number, product quantity, delivery address, emergency contacts, and selected service plan carefully before completing checkout.",
  },
  {
    index: "03",
    title: "ORDER PROBLEM",
    summary: "Contact VaahanSafe.",
    description:
      "If there is a payment discrepancy, duplicate charge, logistics disruption, or damaged sticker upon arrival, contact VaahanSafe support so the issue can be formally reviewed.",
  },
  {
    index: "04",
    title: "LEGAL RIGHTS",
    summary: "Applicable rights remain.",
    description:
      "Nothing in this commercial policy is intended to exclude, restrict, or modify remedies that cannot lawfully be limited under applicable Indian consumer protection laws.",
  },
] as const;

export interface ComparisonItem {
  readonly category: string;
  readonly situation: string;
  readonly policyOutcome: string;
  readonly note: string;
}

export const COMPARISON_ITEMS: readonly ComparisonItem[] = [
  {
    category: "Change of Mind",
    situation: "Deciding not to use the sticker or service after completing the purchase.",
    policyOutcome: "Generally Not Refundable",
    note: "Commercial purchases are final once completed.",
  },
  {
    category: "Duplicate Payment",
    situation: "Account charged multiple times for the identical transaction.",
    policyOutcome: "Transaction Review Required",
    note: "Verified duplicate debits are investigated for reconciliation.",
  },
  {
    category: "Payment Failed",
    situation: "Money debited from bank account but order was not confirmed.",
    policyOutcome: "Gateway Reconciliation",
    note: "Unreconciled amounts are traced with payment processing partners.",
  },
  {
    category: "Delivery Problem",
    situation: "Physical sticker package delayed, returned to origin, or misdelivered.",
    policyOutcome: "Order Support / Logistics Review",
    note: "Addressed through logistics re-dispatch or tracking inquiry.",
  },
  {
    category: "Damaged QR in Transit",
    situation: "Physical sticker arrives with mechanical damage or unreadable print.",
    policyOutcome: "Replacement Process",
    note: "Covered under physical sticker replacement, not normal cash refunds.",
  },
  {
    category: "Lost QR After Receipt",
    situation: "Sticker misplaced or discarded after successful physical delivery.",
    policyOutcome: "Replacement Policy",
    note: "Eligible for hardware re-issuance under replacement terms.",
  },
  {
    category: "Statutory Requirement",
    situation: "Remedy mandated by applicable Indian consumer protection statutes.",
    policyOutcome: "Applicable Law Remedy",
    note: "Statutory rights cannot be waived or overridden.",
  },
] as const;

export interface RefundSubsection {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly bulletPoints?: readonly string[];
  readonly legalReviewNote?: string;
}

export interface RefundSection {
  readonly index: string;
  readonly id: string;
  readonly shortTitle: string;
  readonly heading: string;
  readonly summary: string;
  readonly subsections: readonly RefundSubsection[];
}

export const REFUND_SECTIONS: readonly RefundSection[] = [
  {
    index: "01",
    id: "non-refundable-purchases",
    shortTitle: "Non-Refundable Purchases",
    heading: "When a purchase is final",
    summary:
      "VaahanSafe products involve customized physical safety hardware and dedicated cloud identity allocation, making completed orders generally non-refundable.",
    subsections: [
      {
        id: "final-purchase-rule",
        title: "General Non-Refundable Rule",
        paragraphs: [
          "VaahanSafe purchases—including physical QR vehicle stickers, decal packs, initial activation services, and associated subscription plans—are generally non-refundable once the applicable purchase or order has been completed.",
          "Because each physical decal incorporates a unique, cryptographically isolated locator token assigned to a specific vehicle identity, inventory and system allocations cannot simply be returned to general circulation once processed.",
        ],
      },
      {
        id: "final-purchase-trigger",
        title: "Non-Refundable Threshold",
        paragraphs: [
          "Orders become final upon reaching the applicable fulfillment or assignment stage. Please ensure all vehicle and delivery details are accurate before submitting payment authorization.",
        ],
        legalReviewNote:
          "PRODUCT POLICY + LEGAL REVIEW REQUIRED: Define the exact non-refundable point (e.g. payment authorization vs. unique QR pairing vs. postal dispatch).",
      },
    ],
  },
  {
    index: "02",
    id: "change-of-mind",
    shortTitle: "Change of Mind",
    heading: "Change of mind after purchase",
    summary:
      "We do not provide discretionary refunds if you decide you no longer wish to use the service after completing an order.",
    subsections: [
      {
        id: "change-of-mind-policy",
        title: "No Discretionary Returns",
        paragraphs: [
          "VaahanSafe does not provide refunds simply because a customer changes their mind, decides not to affix the sticker, or chooses not to use the safety profile after an order has reached the non-refundable stage.",
          "We encourage prospective users to review our product guides, privacy architecture, and safety view demonstrations prior to purchasing.",
        ],
      },
    ],
  },
  {
    index: "03",
    id: "order-information",
    shortTitle: "Order Information",
    heading: "Incorrect vehicle or contact details",
    summary:
      "Entering mistaken vehicle or registration details does not automatically entitle an order to a cash refund.",
    subsections: [
      {
        id: "info-correction-vs-refund",
        title: "Correcting Information vs. Refund Eligibility",
        paragraphs: [
          "Users must verify vehicle registration marks, owner designations, emergency phone numbers, and delivery addresses prior to authorizing transactions.",
          "If an error is made during checkout, our customer management platform allows you to update discretionary safety records and vehicle details within your account. However, the need to correct information does not create an entitlement to cancel a completed purchase or receive a refund.",
        ],
      },
    ],
  },
  {
    index: "04",
    id: "duplicate-payment",
    shortTitle: "Duplicate Payment",
    heading: "Charged more than once?",
    summary:
      "Procedures for reporting and investigating duplicate payment debits for the identical order.",
    subsections: [
      {
        id: "duplicate-investigation",
        title: "Reporting Duplicate Debits",
        paragraphs: [
          "If you believe your bank account or card was charged more than once for the same order, please contact VaahanSafe support with your payment transaction IDs and bank statement references.",
          "VaahanSafe will review transaction ledgers with our PCI-DSS certified payment gateway. Verified duplicate charges resulting from network retries or gateway race conditions will be reconciled and resolved in accordance with banking standards.",
        ],
      },
    ],
  },
  {
    index: "05",
    id: "failed-payment",
    shortTitle: "Failed Payment",
    heading: "Payment failed but money was debited?",
    summary:
      "Understanding gateway reconciliation when amounts are deducted without order confirmation.",
    subsections: [
      {
        id: "failed-transaction-reconciliation",
        title: "Unreconciled Bank Deductions",
        paragraphs: [
          "Occasionally, banking networks experience communication timeouts where funds are deducted from a customer's account but the transaction fails to complete at the payment gateway.",
          "Such instances are not refund requests; they are uncompleted banking transactions. In most cases, the issuing bank automatically rolls back the deducted amount within standard banking clearing windows.",
          "If an unreconciled deduction is not reversed by your bank within standard timelines, contact our support team with the transaction reference so we can check the status with our payment provider.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Avoid promising specific reversal days (e.g. 5-7 days) unless mandated by RBI auto-reversal guidelines.",
      },
    ],
  },
  {
    index: "06",
    id: "cancellation",
    shortTitle: "Cancellation",
    heading: "Order cancellation policy",
    summary:
      "Physical orders undergo rapid fulfillment and can only be cancelled prior to decal preparation and assignment.",
    subsections: [
      {
        id: "cancellation-scope",
        title: "Cancellation Cutoff Conditions",
        paragraphs: [
          "Because physical stickers are customized and paired with digital identity records, cancellation requests can only be entertained prior to decal assignment and packaging.",
          "Once an order has been prepared, paired with a locator token, or transferred to logistics carriers, the purchase cannot be cancelled.",
        ],
        legalReviewNote:
          "PRODUCT POLICY + LEGAL REVIEW REQUIRED: Establish formal cancellation cutoff rules and customer self-serve cancellation windows.",
      },
    ],
  },
  {
    index: "07",
    id: "delivery-issues",
    shortTitle: "Delivery Issues",
    heading: "Shipping and delivery problem support",
    summary:
      "Logistics issues are addressed through courier investigation and re-dispatch rather than automatic refunds.",
    subsections: [
      {
        id: "delivery-order-support",
        title: "Order Support for Delayed or Lost Parcels",
        paragraphs: [
          "If your physical sticker kit is delayed in transit, returned to origin due to address ambiguity, or marked as delivered without physical receipt, contact our support team.",
          "VaahanSafe coordinates with logistics partners to track and rectify transit failures. Where a shipment is confirmed lost by the carrier, we provide order support and re-dispatch under our Shipping & Replacement Policy at vaahansafe.com/shipping-replacement.",
        ],
      },
    ],
  },
  {
    index: "08",
    id: "damaged-lost-qr",
    shortTitle: "Damaged / Lost QR",
    heading: "Damaged or lost QR sticker handling",
    summary:
      "Physical decal damage or loss is resolved through hardware replacement rather than cash refunds.",
    subsections: [
      {
        id: "damaged-qr-rule",
        title: "Damaged QR ≠ Automatic Cash Refund",
        paragraphs: [
          "If a physical decal arrives damaged in transit or suffers mechanical wear after application to your vehicle, the issue is handled through our dedicated decal replacement process.",
          "A damaged or unusable sticker does not entitle the owner to a cash refund for the original purchase or service subscription.",
        ],
      },
      {
        id: "lost-qr-rule",
        title: "Lost Stickers After Delivery",
        paragraphs: [
          "Stickers lost or misplaced after successful physical delivery are not eligible for refunds. Owners may request a replacement decal linked to their existing vehicle identity subject to replacement verification and applicable processing fees.",
        ],
      },
    ],
  },
  {
    index: "09",
    id: "plans-and-services",
    shortTitle: "Plans & Services",
    heading: "Subscription and service purchases",
    summary:
      "Digital service entitlements, automated relay features, and subscription renewals.",
    subsections: [
      {
        id: "plan-purchase-policy",
        title: "Software Subscriptions & Plan Fees",
        paragraphs: [
          "Paid subscription plans unlock digital capabilities such as automated emergency relay calls, SMS notifications, and multi-contact escalation. Once a subscription period begins or renewal is processed, subscription fees are generally non-refundable.",
          "Cancelling an active subscription prevents future recurring renewals from being billed, but does not trigger a retroactive or prorated refund for the elapsed billing period unless required by applicable law.",
        ],
        legalReviewNote:
          "PRODUCT + LEGAL CONFIRMATION REQUIRED: Explicitly validate policy regarding no-prorated-refunds for subscription cancellations.",
      },
    ],
  },
  {
    index: "10",
    id: "order-review",
    shortTitle: "Order Review",
    heading: "The order review process",
    summary:
      "A structured 4-step workflow for reporting and resolving verified order or payment problems.",
    subsections: [
      {
        id: "review-workflow-steps",
        title: "4-Stage Issue Resolution",
        paragraphs: [
          "When an order problem arises, we follow a systematic review procedure to ensure fair and accurate resolution:",
        ],
        bulletPoints: [
          "01 Contact: Submit an inquiry through official support channels with your registered account details.",
          "02 Identify: Provide your order ID, transaction reference number, and clear description of the issue.",
          "03 Review: Our operations team investigates gateway records, logistics logs, and decal status.",
          "04 Resolution: We provide the appropriate remedy—such as re-dispatch, gateway reconciliation, or technical rectification—in accordance with policy and statutory requirements.",
        ],
      },
      {
        id: "review-no-automatic-refund",
        title: "Inquiry Submission Does Not Guarantee Cash Refund",
        paragraphs: [
          "Submitting an order review request does not itself guarantee a cash refund. Remedies are determined based on transaction authenticity, delivery verification, and applicable legal standards.",
        ],
      },
    ],
  },
  {
    index: "11",
    id: "legal-rights",
    shortTitle: "Legal Rights",
    heading: "Applicable statutory consumer rights",
    summary:
      "Nothing in this commercial policy limits mandatory rights or non-excludable remedies under Indian law.",
    subsections: [
      {
        id: "statutory-rights-preservation",
        title: "Preservation of Statutory Remedies",
        paragraphs: [
          "Nothing in this Refund Policy is intended to limit, exclude, or restrict any consumer rights or statutory remedies that cannot lawfully be limited or excluded under the Consumer Protection Act, 2019, or other applicable laws of the Republic of India.",
          "Where applicable consumer legislation mandates a specific refund or statutory remedy for verified service deficiency or non-delivery, VaahanSafe will honor those statutory obligations.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Formal counsel confirmation of non-excludable statutory warranty and remedy language.",
      },
    ],
  },
  {
    index: "12",
    id: "contact",
    shortTitle: "Order Support",
    heading: "Questions about your purchase or order?",
    summary:
      "Official communication channels for payment inquiries and order support.",
    subsections: [
      {
        id: "contact-support-desk",
        title: "Official Support Channel",
        paragraphs: [
          "Although completed purchases are generally non-refundable, our operations team is ready to investigate payment discrepancies, shipping delays, and damaged hardware.",
          "Contact our order support desk at support@vaahansafe.com. We aim to respond to verified order inquiries within 72 business hours.",
        ],
      },
    ],
  },
] as const;
