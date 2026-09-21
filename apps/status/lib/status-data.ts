export interface PlatformService {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  status: "OPERATIONAL" | "DEGRADED" | "MAJOR OUTAGE" | "MAINTENANCE";
  isCriticalPath: boolean;
  lastChecked?: string;
}

export const PLATFORM_SERVICES: PlatformService[] = [
  {
    id: "qr-resolver",
    name: "Vehicle QR Access",
    description: "Instant emergency public scan resolver and vehicle identity verification",
    endpoint: "qr.vaahansafe.com",
    status: "OPERATIONAL",
    isCriticalPath: true,
    lastChecked: "Live verification active",
  },
  {
    id: "customer-app",
    name: "Customer App",
    description: "Owner vehicle management, emergency contacts, and account portal",
    endpoint: "app.vaahansafe.com",
    status: "OPERATIONAL",
    isCriticalPath: false,
    lastChecked: "Live verification active",
  },
  {
    id: "retail-activation",
    name: "Retail Activation",
    description: "Physical sticker retail packaging claim and proof-of-possession binding",
    endpoint: "activate.vaahansafe.com",
    status: "OPERATIONAL",
    isCriticalPath: false,
    lastChecked: "Live verification active",
  },
  {
    id: "website",
    name: "Website & Resources",
    description: "Public documentation, help guides, and editorial safety field notes",
    endpoint: "vaahansafe.com",
    status: "OPERATIONAL",
    isCriticalPath: false,
    lastChecked: "Live verification active",
  },
  {
    id: "emergency-notifications",
    name: "Emergency Notifications",
    description: "Real-time owner SMS, emergency calling alerts, and dispatch notification pipeline",
    endpoint: "notify.vaahansafe.com",
    status: "OPERATIONAL",
    isCriticalPath: false,
    lastChecked: "Live verification active",
  },
  {
    id: "payments",
    name: "Payments & Orders",
    description: "Authoritative purchase orders, replacement processing, and fulfillment tracking",
    endpoint: "checkout.vaahansafe.com",
    status: "OPERATIONAL",
    isCriticalPath: false,
    lastChecked: "Live verification active",
  },
];

export interface PublishedIncident {
  id: string;
  title: string;
  status: string;
  impact: string;
  createdAt: string;
  updatedAt: string;
}

export const PUBLISHED_INCIDENTS: PublishedIncident[] = [];

export interface OverallStatusResult {
  status: "OPERATIONAL" | "DEGRADED" | "MAJOR OUTAGE" | "MAINTENANCE";
  colorClass: "teal" | "amber" | "red" | "blue";
  message: string;
}

export function computeOverallStatus(
  services: { status: "OPERATIONAL" | "DEGRADED" | "MAJOR OUTAGE" | "MAINTENANCE" }[]
): OverallStatusResult {
  if (services.some((s) => s.status === "MAJOR OUTAGE")) {
    return {
      status: "MAJOR OUTAGE",
      colorClass: "red",
      message: "Major platform disruption affecting critical journeys",
    };
  }
  if (services.some((s) => s.status === "DEGRADED")) {
    return {
      status: "DEGRADED",
      colorClass: "amber",
      message: "Degraded performance observed in some services",
    };
  }
  if (services.some((s) => s.status === "MAINTENANCE")) {
    return {
      status: "MAINTENANCE",
      colorClass: "blue",
      message: "Scheduled operational maintenance in progress",
    };
  }
  return {
    status: "OPERATIONAL",
    colorClass: "teal",
    message: "All customer journeys operating normally",
  };
}
