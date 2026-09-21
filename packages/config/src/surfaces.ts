/**
 * VaahanSafe Centralized Surface Architecture Registry
 * Defines surface classifications, ownership, indexing policies, and authentication boundaries.
 */

export type SurfaceId =
  | "web"
  | "customer"
  | "activate"
  | "qr"
  | "admin"
  | "api"
  | "blog"
  | "status";

export type SurfaceClass =
  | "DISCOVERY"    // Class A: web, blog (SEO, education, conversion)
  | "TRANSACTION"  // Class B: customer, activate (identity, commerce, onboarding)
  | "SAFETY"       // Class C: qr (emergency availability, ultra-lightweight, speed)
  | "OPERATIONS";  // Class D: admin, api, status (management, contracts, transparency)

export type IndexingPolicy = "INDEX" | "NOINDEX";

export type AuthenticationPolicy =
  | "PUBLIC"            // Publicly accessible without session
  | "PUBLIC_READ"       // Publicly viewable content, editing restricted
  | "PUBLIC_RESOLVER"   // Emergency resolver, zero login needed for finder
  | "PROGRESSIVE"       // Public entry/identification, authentication required for claim
  | "PROTECTED"         // Requires verified customer authentication
  | "ADMIN_RBAC"        // Protected by administrative role-based access control
  | "ENDPOINT_SPECIFIC";// API: depends on endpoint (session, API key, signature, public health)

export interface SurfaceDefinition {
  id: SurfaceId;
  name: string;
  shortName: string;
  surfaceClass: SurfaceClass;
  productionHostname: string;
  productionOrigin: string;
  localPort: number;
  localOrigin: string;
  indexingPolicy: IndexingPolicy;
  authPolicy: AuthenticationPolicy;
  description: string;
  responsibilities: readonly string[];
}

export const SURFACES: Record<SurfaceId, SurfaceDefinition> = {
  web: {
    id: "web",
    name: "VaahanSafe Web",
    shortName: "Public Product",
    surfaceClass: "DISCOVERY",
    productionHostname: "vaahansafe.com",
    productionOrigin: "https://vaahansafe.com",
    localPort: 3000,
    localOrigin: "http://localhost:3000",
    indexingPolicy: "INDEX",
    authPolicy: "PUBLIC",
    description: "Public brand, product storytelling, safety mechanics, pricing, and company information.",
    responsibilities: [
      "brand",
      "product",
      "how it works",
      "safety",
      "pricing",
      "gallery",
      "documents",
      "help",
      "company",
      "legal",
      "design-system preview",
    ],
  },
  customer: {
    id: "customer",
    name: "VaahanSafe App",
    shortName: "Customer Portal",
    surfaceClass: "TRANSACTION",
    productionHostname: "app.vaahansafe.com",
    productionOrigin: "https://app.vaahansafe.com",
    localPort: 3001,
    localOrigin: "http://localhost:3001",
    indexingPolicy: "NOINDEX",
    authPolicy: "PROTECTED",
    description: "Customer account, vehicle registry, emergency contact management, and orders.",
    responsibilities: [
      "customer account",
      "onboarding",
      "vehicles",
      "QR management",
      "commerce",
      "subscriptions",
      "orders",
      "payments",
      "emergency contacts",
      "scan history",
      "notifications",
      "settings",
    ],
  },
  activate: {
    id: "activate",
    name: "VaahanSafe Activate",
    shortName: "QR Activation",
    surfaceClass: "TRANSACTION",
    productionHostname: "activate.vaahansafe.com",
    productionOrigin: "https://activate.vaahansafe.com",
    localPort: 3002,
    localOrigin: "http://localhost:3002",
    indexingPolicy: "NOINDEX",
    authPolicy: "PROGRESSIVE",
    description: "Retail physical sticker activation workflow with scratch verification.",
    responsibilities: [
      "retail physical QR activation",
      "scratch code verification",
      "customer vehicle linking",
      "instant activation confirmation",
    ],
  },
  qr: {
    id: "qr",
    name: "VaahanSafe QR",
    shortName: "Emergency Resolver",
    surfaceClass: "SAFETY",
    productionHostname: "qr.vaahansafe.com",
    productionOrigin: "https://qr.vaahansafe.com",
    localPort: 3003,
    localOrigin: "http://localhost:3003",
    indexingPolicy: "NOINDEX",
    authPolicy: "PUBLIC_RESOLVER",
    description: "Permanent emergency QR resolver. Ultra-lightweight, zero-login, instant emergency access.",
    responsibilities: [
      "permanent QR resolution",
      "public emergency profile",
      "emergency contact relays",
      "QR state recovery",
    ],
  },
  admin: {
    id: "admin",
    name: "VaahanSafe Operations",
    shortName: "Operations Console",
    surfaceClass: "OPERATIONS",
    productionHostname: "admin.vaahansafe.com",
    productionOrigin: "https://admin.vaahansafe.com",
    localPort: 3004,
    localOrigin: "http://localhost:3004",
    indexingPolicy: "NOINDEX",
    authPolicy: "ADMIN_RBAC",
    description: "Internal operations, inventory, batch printing, retailer registry, and audit.",
    responsibilities: [
      "internal VaahanSafe operations",
      "inventory",
      "batch management",
      "distributor/retailer records",
      "customers & vehicles",
      "support & audit",
      "security",
    ],
  },
  api: {
    id: "api",
    name: "VaahanSafe API",
    shortName: "Central API",
    surfaceClass: "OPERATIONS",
    productionHostname: "api.vaahansafe.com",
    productionOrigin: "https://api.vaahansafe.com",
    localPort: 3005,
    localOrigin: "http://localhost:3005",
    indexingPolicy: "NOINDEX",
    authPolicy: "ENDPOINT_SPECIFIC",
    description: "Versioned system endpoints, provider webhooks, and secure mobile/edge RPC.",
    responsibilities: [
      "versioned API (/v1/)",
      "provider webhooks (/webhooks/)",
      "server integrations",
      "health endpoints (/health)",
    ],
  },
  blog: {
    id: "blog",
    name: "VaahanSafe Blog",
    shortName: "Editorial & Safety",
    surfaceClass: "DISCOVERY",
    productionHostname: "blog.vaahansafe.com",
    productionOrigin: "https://blog.vaahansafe.com",
    localPort: 3006,
    localOrigin: "http://localhost:3006",
    indexingPolicy: "INDEX",
    authPolicy: "PUBLIC_READ",
    description: "Editorial road safety articles, emergency awareness, and company updates.",
    responsibilities: [
      "editorial content",
      "road safety guides",
      "product education",
      "company updates",
    ],
  },
  status: {
    id: "status",
    name: "VaahanSafe Status",
    shortName: "System Status",
    surfaceClass: "OPERATIONS",
    productionHostname: "status.vaahansafe.com",
    productionOrigin: "https://status.vaahansafe.com",
    localPort: 3007,
    localOrigin: "http://localhost:3007",
    indexingPolicy: "INDEX",
    authPolicy: "PUBLIC_READ",
    description: "Independent service health, real-time incident reports, and maintenance transparency.",
    responsibilities: [
      "service health",
      "incidents",
      "maintenance",
      "historical uptime",
    ],
  },
} as const;

export const ALL_SURFACE_IDS = Object.keys(SURFACES) as SurfaceId[];
