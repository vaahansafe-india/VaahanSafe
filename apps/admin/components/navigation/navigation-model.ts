import type { VaahanIconName } from "@vaahansafe/icons";

export interface AdminNavigationGroup {
  label: string;
  modules: string[];
}

export interface AdminNavigationSection {
  id: string;
  label: string;
  icon: VaahanIconName;
  description?: string;
  groups: AdminNavigationGroup[];
}

export type SidebarView =
  | { type: "root" }
  | { type: "section"; sectionId: string };

/**
 * Hierarchical navigation sections mapping authoritative modules from ADMIN_MODULES.
 * The Level 1 navigation exposes these domain areas.
 * Clicking a section transitions the sidebar into its Level 2 drill-down sub-navigation.
 */
export const ADMIN_NAVIGATION_SECTIONS: AdminNavigationSection[] = [
  {
    id: "operations",
    label: "Operations",
    icon: "layers",
    description: "QR sticker fleet, logistics, and partner custody",
    groups: [
      {
        label: "QR Operations",
        modules: ["inventory", "batches"],
      },
      {
        label: "Supply Chain",
        modules: ["distributors", "retailers", "transfers", "reconciliation"],
      },
      {
        label: "Safety Operations",
        modules: ["replacements", "fraud"],
      },
    ],
  },
  {
    id: "commerce",
    label: "Commerce & Customers",
    icon: "payment",
    description: "Accounts, vehicle identities, orders and billing",
    groups: [
      {
        label: "Customers & Fleet",
        modules: ["customers", "vehicles", "activations"],
      },
      {
        label: "Orders & Delivery",
        modules: ["orders", "shipping"],
      },
      {
        label: "Billing & Subscriptions",
        modules: ["plans", "subscriptions", "payments", "refunds"],
      },
    ],
  },
  {
    id: "support-safety",
    label: "Support & Safety",
    icon: "shield",
    description: "Case resolution, scan analytics, and emergency alerts",
    groups: [
      {
        label: "Customer Support",
        modules: ["support"],
      },
      {
        label: "Safety & Monitoring",
        modules: ["analytics", "notifications", "incidents"],
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    icon: "chart",
    description: "Export reports, runtime toggles and operational telemetry",
    groups: [
      {
        label: "System Controls",
        modules: ["reports", "flags"],
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: "file",
    description: "VaahanSafe Journal, document repository, and media assets",
    groups: [
      {
        label: "Editorial & Media",
        modules: ["articles", "documents", "gallery"],
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    icon: "settings",
    description: "Governance, audit trail, and system configuration",
    groups: [
      {
        label: "Governance",
        modules: ["audit", "settings"],
      },
    ],
  },
];
