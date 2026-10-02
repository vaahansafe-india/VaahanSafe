import {
  getVehicleRepository,
  getNotificationRepository,
} from "@vaahansafe/database";
import type { AuthenticatedCustomerSession } from "./session";
import type { CustomerResource } from "./customer-query-contract";

function choice<const T extends string>(
  value: string | null,
  values: readonly T[],
  fallback: T,
): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

/** Only the authenticated server account is used for ownership scoping. */
export async function getCustomerData(
  resource: CustomerResource,
  auth: AuthenticatedCustomerSession,
  params: URLSearchParams,
) {
  const userId = auth.user.id;
  switch (resource) {
    case "shell": {
      const [vehicles, unreadNotificationCount] = await Promise.all([
        getVehicleRepository().findByCustomerId(userId),
        getNotificationRepository().countUnreadByUserId(userId),
      ]);
      return {
        vehicles: vehicles.map(({ id, registrationNumber, make, model }) => ({
          id,
          registrationNumber,
          make,
          model,
        })),
        unreadNotificationCount,
      };
    }
    case "dashboard":
      return (await import("./dashboard-service")).getDashboardOverview(
        auth.user,
        params.get("vehicle") || undefined,
        {
          range: choice(
            params.get("range"),
            ["today", "7d", "30d", "all"],
            "30d",
          ),
          qrId: params.get("qr") || undefined,
          eventType: params.get("type")
            ? choice(params.get("type"), ["all", "scan", "emergency"], "all")
            : undefined,
        },
      );
    case "vehicles":
      return (await import("./vehicle-service")).getVehicleRegistry(userId);
    case "orders":
      return (await import("./orders-service")).getCustomerOrders(userId);
    case "payments":
      return (await import("./payments-service")).getCustomerPayments(userId);
    case "emergency-contacts":
      return (await import("./contacts-service")).getSafetyContactNetwork(
        userId,
      );
    case "scan-history":
      return (await import("./scan-history-service")).getScanHistoryOverview(
        userId,
        {
          period: choice(
            params.get("period"),
            ["24H", "7D", "30D", "90D", "ALL"],
            "30D",
          ),
          vehicleId: params.get("vehicle") || "all",
          qrPublicId: params.get("qr") || "all",
          eventType: choice(
            params.get("type"),
            ["all", "PUBLIC_RESOLVE", "EMERGENCY_TRIGGER", "ADMIN_INSPECT"],
            "all",
          ),
          deviceCategory: choice(
            params.get("device"),
            ["all", "Mobile", "Desktop", "Tablet", "Undisclosed"],
            "all",
          ),
          search: params.get("search") || "",
        },
      );
    case "notifications":
      return (
        await import("./notifications-service")
      ).getNotificationCenterData(userId, {
        view: choice(
          params.get("view"),
          [
            "inbox",
            "unread",
            "attention",
            "archived",
            "qr",
            "vehicles",
            "orders",
            "payments",
            "subscription",
            "security",
          ],
          "inbox",
        ),
        status: choice(params.get("status"), ["all", "unread", "read"], "all"),
        category: params.get("category") || "all",
        vehicleId: params.get("vehicle") || "all",
        attention: choice(
          params.get("attention"),
          ["all", "action_required", "informational"],
          "all",
        ),
        search: params.get("q") || "",
      });
    case "subscription":
      return (
        await import("./subscription-service")
      ).getSubscriptionServiceOverview(
        userId,
        auth.user,
        params.get("vehicle") || undefined,
      );
    case "settings":
      return (await import("./settings-service")).getSettingsData(
        userId,
        auth.session.id,
      );
    case "qr":
      return (await import("./qr-service")).getQrOverview(userId);
    case "qr-codes":
      return (await import("./qr-service")).getQrCodesRegistry(userId);
    case "qr-buy":
      return (await import("./qr-service")).getBuyQrData(userId);
    case "qr-activate":
      return (await import("./qr-service")).getActivateQrData(userId);
    case "qr-replace":
      return (await import("./qr-service")).getReplaceQrData(userId);
  }
}
