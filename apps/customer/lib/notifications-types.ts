import type {
  NotificationCategory,
  NotificationPriority,
  NotificationEventType,
} from "@vaahansafe/notifications";

export type NotificationViewType =
  | "inbox"
  | "unread"
  | "attention"
  | "archived"
  | "qr"
  | "vehicles"
  | "orders"
  | "payments"
  | "subscription"
  | "security";

export type NotificationAttentionStatus =
  | "INFORMATIONAL"
  | "ACTION_REQUIRED"
  | "IMPORTANT";

export type NotificationContextType =
  | "VEHICLE"
  | "QR"
  | "ORDER"
  | "PAYMENT"
  | "SUBSCRIPTION"
  | "SECURITY"
  | "ACCOUNT"
  | "SUPPORT";

export type NotificationDateGroup = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "EARLIER";

export interface NotificationItem {
  id: string;
  intentId: string;
  eventType: NotificationEventType | string;
  category: NotificationCategory;
  priority: NotificationPriority;
  attentionStatus: NotificationAttentionStatus;
  title: string;
  bodySafe: string;
  contextType: NotificationContextType;
  contextLabel: string;
  contextIdentifier?: string;
  actionType: string;
  actionTarget?: string;
  actionHref: string;
  actionLabel: string;
  isRead: boolean;
  readAt: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  relativeTime: string;
  dateGroup: NotificationDateGroup;
  // Domain specifics for the detail sheet
  relatedResourceState?: {
    resourceType: NotificationContextType;
    reference: string;
    statusLabel?: string;
    details?: Record<string, string>;
  };
}

export interface NotificationCenterCounts {
  inbox: number;
  unread: number;
  attention: number;
  archived: number;
  today: number;
  vehiclesCount: number;
  categories: {
    qr: number;
    vehicles: number;
    orders: number;
    payments: number;
    subscription: number;
    security: number;
    account: number;
  };
}

export interface NotificationFiltersState {
  view: NotificationViewType;
  status: "all" | "unread" | "read";
  category: string;
  vehicleId: string;
  attention: "all" | "action_required" | "informational";
  search: string;
}

export interface NotificationCenterData {
  notifications: NotificationItem[];
  groupedNotifications: Record<NotificationDateGroup, NotificationItem[]>;
  counts: NotificationCenterCounts;
  filters: NotificationFiltersState;
  authorizedVehicles: Array<{
    id: string;
    registrationNumber: string;
    make: string;
    model: string;
  }>;
}
