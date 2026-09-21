export type JourneyStage =
  | "DISCOVER"
  | "ACCOUNT"
  | "ACQUIRE"
  | "ACTIVATE"
  | "SCAN"
  | "CONNECT";

export interface JourneyStageMeta {
  stage: JourneyStage;
  label: string;
  serviceSlug: string;
  defaultServiceName: string;
  description: string;
  customerAction: string;
}

export const JOURNEY_STAGES: readonly JourneyStageMeta[] = [
  {
    stage: "DISCOVER",
    label: "Website",
    serviceSlug: "website",
    defaultServiceName: "Website & Documentation",
    description: "Public safety portal, hardware specifications, and replacement ordering.",
    customerAction: "Bystanders and vehicle owners discover VaahanSafe.",
  },
  {
    stage: "ACCOUNT",
    label: "Customer App",
    serviceSlug: "customer-app",
    defaultServiceName: "Customer App",
    description: "Vehicle profile management, emergency contact setup, and digital identity access.",
    customerAction: "Owners manage vehicles and configure emergency protocols.",
  },
  {
    stage: "ACQUIRE",
    label: "Payments",
    serviceSlug: "payments",
    defaultServiceName: "Purchase & Payments",
    description: "Authoritative order processing, Cashfree gateway checkout, and fulfillment tracking.",
    customerAction: "Owners purchase kits, replace damaged stickers, or renew plans.",
  },
  {
    stage: "ACTIVATE",
    label: "Retail Activation",
    serviceSlug: "retail-activation",
    defaultServiceName: "Retail Activation",
    description: "Secure retail sticker claim, scratch PIN verification, and vehicle binding.",
    customerAction: "Dealers or vehicle owners link a physical sticker to a verified vehicle.",
  },
  {
    stage: "SCAN",
    label: "Vehicle QR Access",
    serviceSlug: "vehicle-qr-access",
    defaultServiceName: "Vehicle QR Access",
    description: "Instant roadside bystander scan resolution, safety profile exposure, and relay dispatch.",
    customerAction: "First responders or bystanders scan the decal during an emergency.",
  },
  {
    stage: "CONNECT",
    label: "Notifications",
    serviceSlug: "notifications",
    defaultServiceName: "Emergency Notifications",
    description: "Multi-channel SMS, WhatsApp, and call relay alerts during roadside vehicle incidents.",
    customerAction: "Emergency contacts receive verified alerts and coordinate assistance.",
  },
] as const;
