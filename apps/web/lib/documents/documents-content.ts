export interface OfficialDocument {
  id: string;
  number: string;
  title: string;
  summary: string;
  category: "Product" | "Legal" | "Guides" | "Support";
  documentType: string;
  href: string;
  isExternal?: boolean;
}

export interface DocumentSection {
  index: string;
  title: string;
  description: string;
  documents: readonly OfficialDocument[];
}

export const DOCUMENT_SECTIONS: readonly DocumentSection[] = [
  {
    index: "01",
    title: "Product Architecture",
    description: "Foundational specifications detailing how physical decals connect to digital vehicle identities.",
    documents: [
      {
        id: "how-it-works",
        number: "01",
        title: "How VaahanSafe Works",
        summary: "The complete journey from physical vehicle decal to verified emergency connection.",
        category: "Product",
        documentType: "System Specification",
        href: "/how-it-works",
      },
      {
        id: "safety-privacy-product",
        number: "02",
        title: "Safety & Privacy Architecture",
        summary: "Product privacy model governing private account isolation and public roadside projection.",
        category: "Product",
        documentType: "Architecture Guide",
        href: "/safety",
      },
      {
        id: "plans-services",
        number: "03",
        title: "Plans & Cloud Services",
        summary: "Commercial service tiers, contact relay capabilities, and notification channels.",
        category: "Product",
        documentType: "Service Specification",
        href: "/pricing",
      },
      {
        id: "qr-placement-spec",
        number: "04",
        title: "QR Placement Guide",
        summary: "Geometric guidelines for visible, compliant placement on cars, SUVs, and two-wheelers.",
        category: "Product",
        documentType: "Installation Reference",
        href: "/gallery",
      },
    ],
  },
  {
    index: "02",
    title: "Legal & Commercial Policies",
    description: "Statutory governance, terms of service, commercial replacement rules, and user data policies.",
    documents: [
      {
        id: "privacy-policy",
        number: "05",
        title: "Privacy Policy",
        summary: "How VaahanSafe collects, processes, and protects account, vehicle, and emergency data.",
        category: "Legal",
        documentType: "Statutory Document",
        href: "/privacy",
      },
      {
        id: "terms-of-service",
        number: "06",
        title: "Terms of Service",
        summary: "Legal rules governing account creation, decal ownership, and platform availability.",
        category: "Legal",
        documentType: "Statutory Document",
        href: "/terms",
      },
      {
        id: "refund-policy",
        number: "07",
        title: "Refund Policy",
        summary: "Commercial terms regarding completed purchases, cancellations, and duplicate payments.",
        category: "Legal",
        documentType: "Commercial Policy",
        href: "/refund-policy",
      },
      {
        id: "shipping-replacement",
        number: "08",
        title: "Shipping & Replacement Policy",
        summary: "Decal order dispatch, delivery terms, and structured replacement workflows.",
        category: "Legal",
        documentType: "Commercial Policy",
        href: "/shipping-replacement",
      },
      {
        id: "safety-disclaimer",
        number: "09",
        title: "Safety Disclaimer",
        summary: "Important clarification regarding user-provided medical context and emergency services.",
        category: "Legal",
        documentType: "Advisory Document",
        href: "/safety-disclaimer",
      },
    ],
  },
  {
    index: "03",
    title: "Operational Guides",
    description: "Step-by-step procedural guides for decal placement, retail unboxing, and continuity.",
    documents: [
      {
        id: "retail-activation-guide",
        number: "10",
        title: "Retail Activation Guide",
        summary: "Comprehensive walkthrough for activating pre-packaged store and dealer decal kits.",
        category: "Guides",
        documentType: "Field Guide",
        href: "/help/activation",
      },
      {
        id: "replacement-guide",
        number: "11",
        title: "Decal Replacement Guide",
        summary: "Procedures for re-linking vehicle records after windshield repairs or physical decal damage.",
        category: "Guides",
        documentType: "Field Guide",
        href: "/help/replacement",
      },
      {
        id: "safety-info-guide",
        number: "12",
        title: "Safety Information Management",
        summary: "Best practices for maintaining reachable emergency numbers and relevant medical allergies.",
        category: "Guides",
        documentType: "Field Guide",
        href: "/safety",
      },
    ],
  },
  {
    index: "04",
    title: "Support & Transparency",
    description: "Support resolution engines, operational health monitors, and system status telemetry.",
    documents: [
      {
        id: "help-center-portal",
        number: "13",
        title: "Help Center",
        summary: "Action-oriented resolution engine answering common owner and setup questions.",
        category: "Support",
        documentType: "Support Service",
        href: "/help",
      },
      {
        id: "service-status-portal",
        number: "14",
        title: "Service Status",
        summary: "Real-time edge operational health and emergency QR resolution telemetry.",
        category: "Support",
        documentType: "Operational Telemetry",
        href: "https://status.vaahansafe.com",
        isExternal: true,
      },
    ],
  },
];
