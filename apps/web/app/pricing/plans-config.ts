/**
 * VAAHANSAFE PLANS & ENTITLEMENTS CONFIGURATION
 *
 * Defines the plan tiers, feature capabilities, and commercial policy flags.
 * Prices and final operational parameters require formal commercial confirmation.
 */

export interface PlanFeature {
  name: string;
  included: boolean;
  note?: string;
}

export interface PlanTier {
  id: string;
  name: string;
  badge?: string;
  description: string;
  priceDisplay: string;
  periodDisplay: string;
  isPriceProvisional: boolean;
  bestFor: string;
  features: readonly string[];
  ctaLabel: string;
  isRecommended?: boolean;
}

export const PLANS_CONFIG: readonly PlanTier[] = [
  {
    id: "essential",
    name: "Essential Safety",
    description: "Core roadside identity and emergency contact connection for individual vehicle owners.",
    priceDisplay: "Standard Decal + Baseline",
    periodDisplay: "Included with QR asset",
    isPriceProvisional: false,
    bestFor: "Single vehicle owners wanting essential roadside identification & contact relay.",
    features: [
      "1 Verified Vehicle Safety Identity",
      "1 Primary Emergency Contact Relay",
      "Public Safety View with Medical Context",
      "Concealed Scratch / QR Activation",
      "Unlimited Public Roadside Scans",
      "Standard Decal Replacement Support",
    ],
    ctaLabel: "Get VaahanSafe",
  },
  {
    id: "active",
    name: "Active Protection",
    badge: "MOST POPULAR",
    isRecommended: true,
    description: "Multi-contact relays, instant scan notifications, and priority roadside assistance coordination.",
    priceDisplay: "Commercial Plan",
    periodDisplay: "Annual subscription",
    isPriceProvisional: true, // Marked for commercial policy confirmation
    bestFor: "Daily commuters, family cars, and riders wanting multi-contact backup.",
    features: [
      "Everything in Essential Safety",
      "Up to 3 Cascading Emergency Contacts",
      "Instant SMS / App Scan Alerts to Owner",
      "Verified Scan Activity Timeline",
      "Priority Decal Replacement Dispatch",
      "Multi-Vehicle Family Portal Access",
    ],
    ctaLabel: "Choose Active Protection",
  },
  {
    id: "fleet",
    name: "Fleet & Commercial",
    description: "Centralized governance for transport operators, commercial fleets, and dealer networks.",
    priceDisplay: "Operator Tier",
    periodDisplay: "Per-vehicle / Customized",
    isPriceProvisional: true,
    bestFor: "Taxi fleets, logistics operators, dealerships, and enterprise vehicles.",
    features: [
      "Bulk Vehicle Identity Provisioning",
      "Corporate Dispatch / Depot Contacts",
      "Fleet Incident & Scan Analytics",
      "Dedicated Enterprise Account Manager",
      "Batch Decal Ordering & Fulfillment",
      "Custom API Webhooks for Transport Systems",
    ],
    ctaLabel: "Contact Fleet Sales",
  },
];

export const COMPARISON_ROWS = [
  {
    category: "Identity & Physical Asset",
    name: "Physical Decal Pairing",
    essential: "1 Vehicle Decal",
    active: "1 Vehicle Decal",
    fleet: "Bulk Decal Kits",
  },
  {
    category: "Identity & Physical Asset",
    name: "Public Safety View",
    essential: "Standard View",
    active: "Enhanced Context View",
    fleet: "Fleet Brand Customized",
  },
  {
    category: "Emergency Connection",
    name: "Emergency Contacts",
    essential: "1 Primary Contact",
    active: "Up to 3 Contacts",
    fleet: "Central Depot + Primary",
  },
  {
    category: "Emergency Connection",
    name: "Instant Scan Alerts",
    essential: "Email / In-App",
    active: "Instant SMS + App Relay",
    fleet: "Webhook + Fleet SMS",
  },
  {
    category: "Governance & Support",
    name: "Scan History Logs",
    essential: "Recent Scans",
    active: "Full Activity Timeline",
    fleet: "Exportable Audit Trail",
  },
  {
    category: "Governance & Support",
    name: "Decal Replacement Support",
    essential: "Standard Review",
    active: "Priority Express Dispatch",
    fleet: "Bulk Buffer Stocking",
  },
] as const;

export const PLANS_FAQ = [
  {
    q: "Is the QR the same as the plan?",
    a: "No. The QR represents the vehicle's physical VaahanSafe identity asset, while the plan determines the cloud service capabilities, multi-contact relays, and notification channels available around that identity.",
  },
  {
    q: "Can I change or upgrade plans later?",
    a: "Yes. You can switch between supported service tiers at any time inside your customer dashboard. Your vehicle's QR decal and registered identity code remain completely unchanged.",
  },
  {
    q: "What happens if my physical QR is damaged?",
    a: "You can request a replacement decal through our structured replacement process. Where eligible, a replacement QR is safely linked to your existing vehicle identity without resetting your safety history.",
  },
  {
    q: "Can I activate a retail QR on these plans?",
    a: "Yes. Authorized retail kits include the initial decal hardware and can be enrolled directly into any supported plan during setup.",
  },
  {
    q: "What happens when a subscription plan ends?",
    a: "Core vehicle identification and essential emergency contact capability remain active on your decal. Extended features such as multi-contact cascading relays or automated fleet alerts simply pause until renewed.",
  },
] as const;
