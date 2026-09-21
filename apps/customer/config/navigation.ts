import type { VaahanIconName } from "@vaahansafe/icons";

export interface AppNavigationItem {
  id: string;
  label: string;
  href: string;
  icon: VaahanIconName;
  badge?: string;
  description?: string;
  children?: readonly AppNavigationItem[];
}

export interface AppNavigationGroup {
  id: string;
  label: string;
  items: readonly AppNavigationItem[];
}

/**
 * Single source of truth for Customer Application Navigation
 * Grouped into 5 distinct architectural tiers:
 * OVERVIEW → VEHICLE IDENTITY → SERVICES → ACTIVITY → ACCOUNT
 */
export const CUSTOMER_NAVIGATION: readonly AppNavigationGroup[] = [
  {
    id: "overview",
    label: "OVERVIEW",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: "dashboard",
        description: "Vehicle identity at a glance",
      },
    ],
  },
  {
    id: "vehicle-identity",
    label: "VEHICLE IDENTITY",
    items: [
      {
        id: "vehicles",
        label: "Vehicles",
        href: "/vehicles",
        icon: "vehicle",
        description: "Registered vehicle identities",
      },
      {
        id: "qr",
        label: "My QR",
        href: "/qr",
        icon: "qr",
        description: "QR safety identity center",
        children: [
          {
            id: "qr-buy",
            label: "Buy QR",
            href: "/qr/buy",
            icon: "cart",
            description: "Order physical QR safety stickers",
          },
          {
            id: "qr-activate",
            label: "Activate Retail QR",
            href: "/qr/activate",
            icon: "qr-scan",
            description: "Activate purchased retail sticker",
          },
          {
            id: "qr-codes",
            label: "QR Codes",
            href: "/qr/codes",
            icon: "qr",
            description: "View active QR code identities",
          },
          {
            id: "qr-digital",
            label: "Digital QR",
            href: "/qr/digital",
            icon: "phone",
            description: "Digital vehicle identity pass",
          },
          {
            id: "qr-replace",
            label: "Replace QR",
            href: "/qr/replace",
            icon: "refresh",
            description: "Request replacement for lost/damaged sticker",
          },
        ],
      },
    ],
  },
  {
    id: "services",
    label: "SERVICES",
    items: [
      {
        id: "subscription",
        label: "Subscription",
        href: "/subscription",
        icon: "receipt",
        description: "Plan details & renewals",
      },
      {
        id: "orders",
        label: "Orders",
        href: "/orders",
        icon: "package",
        description: "Courier tracking & shipments",
      },
      {
        id: "payments",
        label: "Payments",
        href: "/payments",
        icon: "payment",
        description: "Receipts & payment history",
      },
      {
        id: "emergency-contacts",
        label: "Emergency Contacts",
        href: "/emergency-contacts",
        icon: "phone",
        description: "Priority emergency alert network",
      },
    ],
  },
  {
    id: "activity",
    label: "ACTIVITY",
    items: [
      {
        id: "scan-history",
        label: "Scan History",
        href: "/scan-history",
        icon: "activity",
        description: "Audit trail of QR scans & safety events",
      },
      {
        id: "notifications",
        label: "Notifications",
        href: "/notifications",
        icon: "notification",
        description: "System & emergency alerts",
      },
    ],
  },
  {
    id: "account",
    label: "ACCOUNT",
    items: [
      {
        id: "settings",
        label: "Profile & Settings",
        href: "/settings",
        icon: "settings",
        description: "Account, mobile & session security",
      },
    ],
  },
] as const;

/**
 * Determines whether a navigation item or sub-item is active
 */
export function isNavActive(pathname: string, item: AppNavigationItem): boolean {
  if (item.href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }

  if (item.children && item.children.length > 0) {
    if (pathname === item.href) return true;
    return item.children.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`));
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
