import {
  getNotificationRepository,
  getVehicleRepository,
  getAuthoritativeDatabaseClient,
} from "@vaahansafe/database";
import type {
  NotificationItem,
  NotificationCenterData,
  NotificationCenterCounts,
  NotificationFiltersState,
  NotificationDateGroup,
  NotificationAttentionStatus,
  NotificationContextType,
  NotificationViewType,
} from "./notifications-types";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function determineDateGroup(dateString: string): NotificationDateGroup {
  const date = new Date(dateString);
  const now = new Date();

  // Reset to midnight for day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (itemDay === today) return "TODAY";
  if (today - itemDay === oneDayMs) return "YESTERDAY";
  if (today - itemDay < 7 * oneDayMs) return "THIS_WEEK";
  return "EARLIER";
}

function determineAttentionStatus(
  priority: string,
  category: string,
  eventType: string,
  title: string,
  body: string
): NotificationAttentionStatus {
  const t = title.toLowerCase();
  const b = body.toLowerCase();

  if (
    priority === "CRITICAL" ||
    priority === "HIGH" ||
    eventType === "SUBSCRIPTION_RENEWAL_FAILED" ||
    t.includes("action required") ||
    b.includes("action required") ||
    t.includes("failed") ||
    b.includes("verify your mobile")
  ) {
    return "ACTION_REQUIRED";
  }

  if (category === "SECURITY" || eventType === "EMERGENCY_SCAN_ALERT") {
    return "IMPORTANT";
  }

  return "INFORMATIONAL";
}

function resolveContextAndActions(
  category: string,
  eventType: string,
  actionType: string | null,
  actionTarget: string | null | undefined,
  title: string,
  body: string,
  vehicles: Array<{ id: string; registrationNumber: string; make: string; model: string }>
): {
  contextType: NotificationContextType;
  contextLabel: string;
  contextIdentifier?: string;
  actionHref: string;
  actionLabel: string;
} {
  const t = title.toLowerCase();
  const b = body.toLowerCase();

  // 1. Vehicles
  const matchedVehicle = vehicles.find(
    (v) =>
      b.includes(v.registrationNumber.toLowerCase()) ||
      b.includes(v.model.toLowerCase()) ||
      t.includes(v.model.toLowerCase())
  );

  if (matchedVehicle) {
    if (t.includes("scan") || eventType === "EMERGENCY_SCAN_ALERT") {
      return {
        contextType: "QR",
        contextLabel: `${matchedVehicle.make} ${matchedVehicle.model}`,
        contextIdentifier: matchedVehicle.registrationNumber,
        actionHref: "/scan-history",
        actionLabel: "View Scan →",
      };
    }
    return {
      contextType: "VEHICLE",
      contextLabel: `${matchedVehicle.make} ${matchedVehicle.model}`,
      contextIdentifier: matchedVehicle.registrationNumber,
      actionHref: "/vehicles",
      actionLabel: "View Vehicle →",
    };
  }

  // 2. QR & Scans
  if (
    category === "SAFETY" ||
    eventType === "QR_ACTIVATED" ||
    eventType === "REPLACEMENT_APPROVED" ||
    t.includes("qr") ||
    b.includes("sticker")
  ) {
    return {
      contextType: "QR",
      contextLabel: actionTarget || "QR Safety Identity",
      contextIdentifier: actionTarget || undefined,
      actionHref: "/qr",
      actionLabel: "View QR →",
    };
  }

  // 3. Orders & Shipments
  if (
    category === "FULFILMENT" ||
    eventType === "SHIPMENT_UPDATED" ||
    t.includes("order") ||
    t.includes("shipped") ||
    t.includes("kit")
  ) {
    const orderMatch = b.match(/VS-ORD-[A-Z0-9-]+/i) || b.match(/#([A-Z0-9-]+)/i);
    return {
      contextType: "ORDER",
      contextLabel: orderMatch ? orderMatch[0] : "Order Kit",
      contextIdentifier: orderMatch ? orderMatch[0] : undefined,
      actionHref: "/orders",
      actionLabel: "Track Order →",
    };
  }

  // 4. Payments
  if (category === "COMMERCE" || eventType === "PAYMENT_SUCCEEDED" || t.includes("payment")) {
    return {
      contextType: "PAYMENT",
      contextLabel: "Payment Receipt",
      actionHref: "/payments",
      actionLabel: "View Payment →",
    };
  }

  // 5. Subscription
  if (category === "SUBSCRIPTION" || eventType.includes("SUBSCRIPTION") || t.includes("subscription")) {
    return {
      contextType: "SUBSCRIPTION",
      contextLabel: "Safety Plan",
      actionHref: "/subscription",
      actionLabel: "Review Plan →",
    };
  }

  // 6. Security & Account
  if (category === "SECURITY" || category === "ACCOUNT" || t.includes("security") || b.includes("mobile")) {
    return {
      contextType: "SECURITY",
      contextLabel: "Account Security",
      actionHref: "/profile",
      actionLabel: "Security Settings →",
    };
  }

  // Default fallback
  return {
    contextType: "ACCOUNT",
    contextLabel: "VaahanSafe Identity",
    actionHref: "/dashboard",
    actionLabel: "View Details →",
  };
}

export async function getNotificationCenterData(
  userId: string,
  rawFilters: Partial<NotificationFiltersState> = {}
): Promise<NotificationCenterData> {
  const notifRepo = getNotificationRepository();
  const vehicleRepo = getVehicleRepository();

  // Enforce IDOR protection: only load real data for authenticated userId
  const [rawNotifs, userVehicles] = await Promise.all([
    notifRepo.findByUserId(userId, 200, 0),
    vehicleRepo.findByCustomerId(userId).catch(() => [] as Array<{ id: string; registrationNumber: string; make: string; model: string }>),
  ]);

  const authorizedVehicles = userVehicles.map((v: { id: string; registrationNumber: string; make: string; model: string }) => ({
    id: v.id,
    registrationNumber: v.registrationNumber,
    make: v.make,
    model: v.model,
  }));

  // Map to customer-safe enriched read model
  const allItems: NotificationItem[] = rawNotifs.map((n: import("@vaahansafe/notifications").Notification) => {
    const isRead = Boolean(n.readAt);
    const isArchived = Boolean(n.archivedAt);
    const relativeTime = formatRelativeTime(n.createdAt);
    const dateGroup = determineDateGroup(n.createdAt);
    const attentionStatus = determineAttentionStatus(
      n.priority,
      n.category,
      n.eventType,
      n.title,
      n.bodySafe
    );

    const contextAndActions = resolveContextAndActions(
      n.category,
      n.eventType,
      n.actionType,
      n.actionTarget,
      n.title,
      n.bodySafe,
      authorizedVehicles
    );

    return {
      id: n.id,
      intentId: n.intentId,
      eventType: n.eventType,
      category: n.category,
      priority: n.priority,
      attentionStatus,
      title: n.title,
      bodySafe: n.bodySafe,
      contextType: contextAndActions.contextType,
      contextLabel: contextAndActions.contextLabel,
      contextIdentifier: contextAndActions.contextIdentifier,
      actionType: n.actionType || "NONE",
      actionTarget: n.actionTarget || undefined,
      actionHref: contextAndActions.actionHref,
      actionLabel: contextAndActions.actionLabel,
      isRead,
      readAt: n.readAt || null,
      isArchived,
      archivedAt: n.archivedAt || null,
      createdAt: n.createdAt,
      relativeTime,
      dateGroup,
      relatedResourceState: {
        resourceType: contextAndActions.contextType,
        reference: contextAndActions.contextIdentifier || contextAndActions.contextLabel,
        statusLabel: isRead ? "Read" : "Unread",
      },
    };
  });

  // Calculate real server counts
  const counts: NotificationCenterCounts = {
    inbox: allItems.filter((item) => !item.isArchived).length,
    unread: allItems.filter((item) => !item.isArchived && !item.isRead).length,
    attention: allItems.filter((item) => !item.isArchived && item.attentionStatus === "ACTION_REQUIRED").length,
    archived: allItems.filter((item) => item.isArchived).length,
    today: allItems.filter((item) => !item.isArchived && item.dateGroup === "TODAY").length,
    vehiclesCount: authorizedVehicles.length,
    categories: {
      qr: allItems.filter((item) => !item.isArchived && (item.contextType === "QR" || item.category === "SAFETY")).length,
      vehicles: allItems.filter((item) => !item.isArchived && item.contextType === "VEHICLE").length,
      orders: allItems.filter((item) => !item.isArchived && (item.contextType === "ORDER" || item.category === "FULFILMENT")).length,
      payments: allItems.filter((item) => !item.isArchived && (item.contextType === "PAYMENT" || item.category === "COMMERCE")).length,
      subscription: allItems.filter((item) => !item.isArchived && item.category === "SUBSCRIPTION").length,
      security: allItems.filter((item) => !item.isArchived && item.category === "SECURITY").length,
      account: allItems.filter((item) => !item.isArchived && item.category === "ACCOUNT").length,
    },
  };

  const filters: NotificationFiltersState = {
    view: (rawFilters.view as NotificationViewType) || "inbox",
    status: rawFilters.status || "all",
    category: rawFilters.category || "all",
    vehicleId: rawFilters.vehicleId || "all",
    attention: rawFilters.attention || "all",
    search: (rawFilters.search || "").trim(),
  };

  // Filter items based on active view and filter state
  const filteredItems = allItems.filter((item) => {
    // 1. View filter
    if (filters.view === "inbox") {
      if (item.isArchived) return false;
    } else if (filters.view === "unread") {
      if (item.isArchived || item.isRead) return false;
    } else if (filters.view === "attention") {
      if (item.isArchived || item.attentionStatus !== "ACTION_REQUIRED") return false;
    } else if (filters.view === "archived") {
      if (!item.isArchived) return false;
    } else if (filters.view === "qr") {
      if (item.isArchived || (item.contextType !== "QR" && item.category !== "SAFETY")) return false;
    } else if (filters.view === "vehicles") {
      if (item.isArchived || item.contextType !== "VEHICLE") return false;
    } else if (filters.view === "orders") {
      if (item.isArchived || (item.contextType !== "ORDER" && item.category !== "FULFILMENT" && item.category !== "COMMERCE")) return false;
    } else if (filters.view === "payments") {
      if (item.isArchived || (item.contextType !== "PAYMENT" && item.category !== "COMMERCE")) return false;
    } else if (filters.view === "subscription") {
      if (item.isArchived || item.category !== "SUBSCRIPTION") return false;
    } else if (filters.view === "security") {
      if (item.isArchived || (item.category !== "SECURITY" && item.category !== "ACCOUNT")) return false;
    }

    // 2. Status filter
    if (filters.status === "unread" && item.isRead) return false;
    if (filters.status === "read" && !item.isRead) return false;

    // 3. Category filter
    if (filters.category !== "all" && item.category.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }

    // 4. Vehicle filter
    if (filters.vehicleId !== "all") {
      const selectedVehicle = authorizedVehicles.find((v: { id: string; registrationNumber: string }) => v.id === filters.vehicleId);
      if (selectedVehicle) {
        const matchesPlate = item.contextIdentifier?.toLowerCase() === selectedVehicle.registrationNumber.toLowerCase();
        const matchesBody = item.bodySafe.toLowerCase().includes(selectedVehicle.registrationNumber.toLowerCase());
        if (!matchesPlate && !matchesBody) return false;
      }
    }

    // 5. Attention filter
    if (filters.attention === "action_required" && item.attentionStatus !== "ACTION_REQUIRED") {
      return false;
    }
    if (filters.attention === "informational" && item.attentionStatus !== "INFORMATIONAL") {
      return false;
    }

    // 6. Search keyword
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inBody = item.bodySafe.toLowerCase().includes(q);
      const inContext = item.contextLabel.toLowerCase().includes(q);
      const inIdent = item.contextIdentifier ? item.contextIdentifier.toLowerCase().includes(q) : false;
      if (!inTitle && !inBody && !inContext && !inIdent) return false;
    }

    return true;
  });

  // Group chronologically
  const groupedNotifications: Record<NotificationDateGroup, NotificationItem[]> = {
    TODAY: [],
    YESTERDAY: [],
    THIS_WEEK: [],
    EARLIER: [],
  };

  for (const item of filteredItems) {
    groupedNotifications[item.dateGroup].push(item);
  }

  return {
    notifications: filteredItems,
    groupedNotifications,
    counts,
    filters,
    authorizedVehicles,
  };
}
