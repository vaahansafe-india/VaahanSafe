/**
 * VAAHANSAFE SHIPPING & REPLACEMENT POLICY CONTENT ARCHITECTURE
 *
 * This structured content module decouples shipping policies, decal replacement
 * lifecycles, and regulatory taxonomy from UI rendering components.
 *
 * CORE CONCEPTUAL MODEL:
 * ORDER → SHIP → DELIVER → PLACE → VEHICLE IDENTITY
 *
 * SIGNATURE HARDWARE/IDENTITY CONTINUITY:
 * CURRENT QR → REPLACEMENT PROCESS → NEW QR → VEHICLE IDENTITY
 *
 * COMMERCIAL PRINCIPLE:
 * REFUND ≠ REPLACEMENT
 *
 * IMPORTANT LEGAL NOTE:
 * Text contained herein reflects product architecture and vehicle safety identity design.
 * Specific delivery estimates, replacement fees, and cancellation cutoff points
 * must be formally confirmed by qualified product leadership and legal counsel
 * prior to final regulatory publication.
 */

export interface ShippingReplacementMetadata {
  readonly title: string;
  readonly subtitle: string;
  readonly documentId: string;
  readonly effectiveDate: string;
  readonly lastUpdated: string;
  readonly version: string;
  readonly status: "DRAFT_PENDING_LEGAL_REVIEW" | "ACTIVE";
}

// LEGAL REVIEW REQUIRED:
// Confirm exact policy effective date and version numbers prior to formal publication.
export const SHIPPING_REPLACEMENT_META: ShippingReplacementMetadata = {
  title: "Shipping & Replacement Policy",
  subtitle: "Vehicle Safety Identity Platform for India",
  documentId: "DOCUMENT / 04",
  effectiveDate: "March 15, 2026",
  lastUpdated: "March 15, 2026",
  version: "1.0",
  status: "DRAFT_PENDING_LEGAL_REVIEW",
} as const;

export interface ReplacementPolicyConfig {
  readonly fee: string | null;
  readonly freeReplacementConditions: string | null;
  readonly shippingFee: string | null;
}

// PRODUCT POLICY CONFIRMATION REQUIRED:
// Leadership must formally establish replacement pricing and fee waiver conditions.
export const REPLACEMENT_POLICY_CONFIG: ReplacementPolicyConfig = {
  fee: null,
  freeReplacementConditions: null,
  shippingFee: null,
};

export interface JourneyStep {
  readonly index: string;
  readonly label: string;
  readonly description: string;
  readonly isAnchor?: boolean;
}

export const SHIPPING_JOURNEY_STEPS: readonly JourneyStep[] = [
  {
    index: "01",
    label: "ORDER",
    description: "Order placed online or kit acquired via retail distribution",
  },
  {
    index: "02",
    label: "SHIP",
    description: "Physical decal kit prepared, packaged, and transferred to logistics carrier",
  },
  {
    index: "03",
    label: "DELIVER",
    description: "Secure delivery to customer's designated postal address across India",
  },
  {
    index: "04",
    label: "PLACE",
    description: "Decal affixed to vehicle in accordance with placement instructions",
  },
  {
    index: "05",
    label: "VEHICLE IDENTITY",
    description: "Physical QR establishes public access point for the vehicle safety view",
    isAnchor: true,
  },
] as const;

export interface ShippingSubsection {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly bulletPoints?: readonly string[];
  readonly legalReviewNote?: string;
}

export interface ShippingSection {
  readonly index: string;
  readonly id: string;
  readonly shortTitle: string;
  readonly heading: string;
  readonly summary: string;
  readonly subsections: readonly ShippingSubsection[];
}

export const SHIPPING_SECTIONS: readonly ShippingSection[] = [
  {
    index: "01",
    id: "orders",
    shortTitle: "Orders",
    heading: "Physical sticker orders and fulfillment",
    summary:
      "Physical VaahanSafe stickers are customized vehicle identification products dispatched following order verification.",
    subsections: [
      {
        id: "orders-scope",
        title: "Fulfillment Allocation",
        paragraphs: [
          "When you order a VaahanSafe physical decal kit via vaahansafe.com, each decal incorporates a unique, cryptographically isolated locator token assigned to the vehicle specified during registration.",
          "Orders are verified for address completeness and payment confirmation prior to dispatch queue scheduling.",
        ],
      },
    ],
  },
  {
    index: "02",
    id: "shipping-information",
    shortTitle: "Shipping Info",
    heading: "Customer responsibility for delivery details",
    summary:
      "Customers must supply accurate postal details, complete PIN codes, and reachable recipient contact numbers.",
    subsections: [
      {
        id: "address-accuracy",
        title: "Postal Information Verification",
        paragraphs: [
          "You are solely responsible for ensuring that all shipping information supplied during checkout—including house or plot numbers, street addresses, landmark references, postal PIN codes, and recipient mobile numbers—is complete and accurate.",
          "If an address error is discovered after order submission, contact support immediately. Address modifications may only be processed prior to packaging and handoff to our logistics partners.",
        ],
        legalReviewNote:
          "PRODUCT POLICY + LEGAL REVIEW REQUIRED: Establish exact fulfillment cutoff for customer address modifications.",
      },
    ],
  },
  {
    index: "03",
    id: "processing",
    shortTitle: "Processing",
    heading: "Order processing and packaging",
    summary:
      "Physical kits undergo quality verification, protective packaging, and carrier handover.",
    subsections: [
      {
        id: "processing-packaging",
        title: "Quality Inspection & Secure Packaging",
        paragraphs: [
          "Prior to dispatch, every VaahanSafe sticker kit undergoes optical scannability verification and cryptographic locator pairing.",
          "Stickers are enclosed in protective, weather-resistant packaging to prevent mechanical abrasion, moisture exposure, or adhesive contamination during transit.",
        ],
      },
    ],
  },
  {
    index: "04",
    id: "delivery",
    shortTitle: "Delivery",
    heading: "Delivery expectations and regional coverage",
    summary:
      "Sticker packages are delivered across India subject to regional carrier operations and transit circumstances.",
    subsections: [
      {
        id: "delivery-estimates",
        title: "Estimated Delivery Circumstances",
        paragraphs: [
          "Delivery estimates presented during checkout or order tracking are operational estimates and are not binding delivery date guarantees. Transit timelines may vary based on destination PIN code accessibility, interstate logistics, local holidays, severe weather, or regional transport disruptions.",
          "VaahanSafe partners with recognized courier and postal carriers across India, but does not warrant fixed-hour, same-day, or overnight arrival unless explicitly contracted under a priority business agreement.",
        ],
        legalReviewNote:
          "LEGAL REVIEW REQUIRED: Strictly avoid fixed delivery day promises unless backed by formal logistics SLAs.",
      },
    ],
  },
  {
    index: "05",
    id: "tracking",
    shortTitle: "Tracking",
    heading: "Tracking updates and carrier notifications",
    summary:
      "Shipment status updates are provided via email or SMS upon carrier dispatch.",
    subsections: [
      {
        id: "tracking-notifications",
        title: "Dispatch Confirmation & Waybill Details",
        paragraphs: [
          "Upon package handover to the logistics partner, you will receive a dispatch confirmation containing the carrier name and shipment tracking number.",
          "Real-time tracking updates depend on third-party courier scanning checkpoints and network synchronization.",
        ],
      },
    ],
  },
  {
    index: "06",
    id: "failed-delivery",
    shortTitle: "Failed Delivery",
    heading: "Failed delivery attempts and returned parcels",
    summary:
      "Procedures when delivery attempts are unsuccessful due to address ambiguity or recipient unavailability.",
    subsections: [
      {
        id: "failed-delivery-protocols",
        title: "Recipient Unavailability & Address Issues",
        paragraphs: [
          "If a delivery attempt fails because the recipient was unavailable or the address could not be located, courier partners typically attempt re-delivery in accordance with their standard operational policies.",
          "If a package is returned to origin (RTO) due to an incorrect or incomplete address provided by the customer, our operations team will reach out to obtain corrected delivery details. Re-dispatch of returned parcels may be subject to logistics re-shipping charges.",
        ],
      },
    ],
  },
  {
    index: "07",
    id: "missing-incorrect",
    shortTitle: "Missing / Wrong Item",
    heading: "Missing, incomplete, or incorrect orders",
    summary:
      "Reporting procedures if your delivery arrives incomplete or contains mismatched vehicle decals.",
    subsections: [
      {
        id: "missing-items-support",
        title: "Incomplete Delivery Support Workflow",
        paragraphs: [
          "If your delivered parcel is missing ordered components or contains a decal mismatched with your vehicle record, notify VaahanSafe support within 48 hours of delivery receipt.",
          "Our operations desk will inspect dispatch photographs and carrier logs. Once verified, VaahanSafe will arrange prompt dispatch of the missing or corrected items without additional charge.",
        ],
      },
    ],
  },
  {
    index: "08",
    id: "damaged-delivery",
    shortTitle: "Damaged Delivery",
    heading: "Your order arrived damaged in transit?",
    summary:
      "Physical decals damaged during shipping are addressed through prompt replacement rather than cash refunds.",
    subsections: [
      {
        id: "damaged-in-transit",
        title: "Transit Damage Replacement Protocol",
        paragraphs: [
          "If a physical decal arrives with severe creases, torn backing, or surface damage that renders the QR code unreadable, contact support immediately with clear photographs of the packaging and damaged item.",
          "Because VaahanSafe operates a generally non-refundable commercial policy, verified shipping damage is resolved through free decal replacement and priority re-dispatch under our warranty procedures, rather than automatic cash refunds.",
        ],
      },
    ],
  },
  {
    index: "09",
    id: "lost-qr",
    shortTitle: "Lost QR",
    heading: "Lost your VaahanSafe QR decal?",
    summary:
      "Decals lost after delivery are eligible for replacement hardware linked to your existing vehicle record.",
    subsections: [
      {
        id: "lost-qr-replacement",
        title: "Hardware Re-Issuance for Misplaced Stickers",
        paragraphs: [
          "Losing a physical QR sticker after successful delivery does not entitle the owner to a cash refund. However, you do not need to forfeit your vehicle's safety identity or service plan history.",
          "You can request a replacement decal through your customer dashboard. Once verified, a new physical sticker is paired to your vehicle profile.",
        ],
      },
    ],
  },
  {
    index: "10",
    id: "damaged-qr",
    shortTitle: "Damaged QR",
    heading: "Decal weathering, glass repair, or mechanical wear",
    summary:
      "Physical stickers that become scratched, sun-damaged, or removed during vehicle repainting.",
    subsections: [
      {
        id: "damaged-qr-process",
        title: "Replacing Weathered or Scratched Hardware",
        paragraphs: [
          "Automotive surfaces endure harsh outdoor environments, pressure washing, stone chips, and windshield replacements. When a sticker becomes worn or scannability degrades, owners may request a fresh replacement decal.",
          "A replacement decal preserves your emergency contacts, blood group markers, and vehicle configuration while renewing the physical optical surface.",
        ],
      },
    ],
  },
  {
    index: "11",
    id: "replacement",
    shortTitle: "Replacement",
    heading: "Decal replacement eligibility and process",
    summary:
      "A structured 4-step workflow to verify identity and dispatch replacement hardware.",
    subsections: [
      {
        id: "replacement-eligibility",
        title: "Ownership Verification & Eligibility",
        paragraphs: [
          "To protect against unauthorized sticker re-assignment, replacement requests require authentication using the registered account phone number.",
          "VaahanSafe reserves the right to review vehicle ownership records before issuing replacement hardware for an active vehicle identity.",
        ],
      },
    ],
  },
  {
    index: "12",
    id: "replacement-identity",
    shortTitle: "Identity Continuity",
    heading: "The physical QR can change. The vehicle identity is the important part.",
    summary:
      "How digital vehicle records persist even when physical decal hardware is replaced.",
    subsections: [
      {
        id: "continuity-architecture",
        title: "Physical QR vs. Digital Identity",
        paragraphs: [
          "The physical QR sticker is merely the optical gateway. The core asset is your digital VaahanSafe vehicle identity.",
          "Where supported by the applicable replacement workflow, pairing a replacement decal transfers the public resolution point to the new QR code while preserving your vehicle history, emergency contacts, and active subscription entitlements.",
          "Upon pairing a replacement sticker, the prior QR code is permanently revoked from the resolver to prevent duplicate identity ambiguity.",
        ],
      },
    ],
  },
  {
    index: "13",
    id: "fees",
    shortTitle: "Fees",
    heading: "Replacement and logistics processing fees",
    summary:
      "Fee structures for transit damage warranty claims versus owner-requested decal replacements.",
    subsections: [
      {
        id: "replacement-fee-structure",
        title: "Warranty vs. Standard Replacement Charges",
        paragraphs: [
          "Decals damaged upon delivery due to transit failures are replaced free of charge when reported within the initial inspection window.",
          "Subsequent replacement decals requested due to vehicle repainting, glass replacement, or loss after delivery may be subject to subsidized material and logistics processing fees.",
        ],
        legalReviewNote:
          "PRODUCT POLICY CONFIRMATION REQUIRED: Publish verified replacement fees and fee waiver thresholds once finalized by leadership.",
      },
    ],
  },
  {
    index: "14",
    id: "contact",
    shortTitle: "Order Support",
    heading: "Need help with a delivery or replacement?",
    summary:
      "Official channels for logistics inquiries, tracking support, and replacement requests.",
    subsections: [
      {
        id: "contact-logistics-desk",
        title: "Dedicated Logistics & Hardware Desk",
        paragraphs: [
          "For tracking inquiries, delivery exceptions, or replacement requests, contact our support team at support@vaahansafe.com.",
          "We aim to investigate and respond to logistics inquiries within 72 business hours.",
        ],
      },
    ],
  },
] as const;
