import type { getDashboardOverview } from "./dashboard-service";
import type { getVehicleRegistry } from "./vehicle-service";
import type { getCustomerOrders } from "./orders-service";
import type { getCustomerPayments } from "./payments-service";
import type { getScanHistoryOverview } from "./scan-history-service";
import type { getNotificationCenterData } from "./notifications-service";
import type { getSafetyContactNetwork } from "./contacts-service";
import type { getSubscriptionServiceOverview } from "./subscription-service";
import type { getSettingsData } from "./settings-service";
import type {
  getQrOverview,
  getQrCodesRegistry,
  getBuyQrData,
  getActivateQrData,
  getReplaceQrData,
} from "./qr-service";

export interface CustomerQueryData {
  shell: {
    vehicles: Array<{
      id: string;
      registrationNumber: string;
      make: string;
      model: string;
    }>;
    unreadNotificationCount: number;
  };
  dashboard: Awaited<ReturnType<typeof getDashboardOverview>>;
  vehicles: Awaited<ReturnType<typeof getVehicleRegistry>>;
  orders: Awaited<ReturnType<typeof getCustomerOrders>>;
  payments: Awaited<ReturnType<typeof getCustomerPayments>>;
  "scan-history": Awaited<ReturnType<typeof getScanHistoryOverview>>;
  notifications: Awaited<ReturnType<typeof getNotificationCenterData>>;
  "emergency-contacts": Awaited<ReturnType<typeof getSafetyContactNetwork>>;
  subscription: Awaited<ReturnType<typeof getSubscriptionServiceOverview>>;
  settings: Awaited<ReturnType<typeof getSettingsData>>;
  qr: Awaited<ReturnType<typeof getQrOverview>>;
  "qr-codes": Awaited<ReturnType<typeof getQrCodesRegistry>>;
  "qr-buy": Awaited<ReturnType<typeof getBuyQrData>>;
  "qr-activate": Awaited<ReturnType<typeof getActivateQrData>>;
  "qr-replace": Awaited<ReturnType<typeof getReplaceQrData>>;
}

export type CustomerResource = keyof CustomerQueryData;

export const CUSTOMER_QUERY_PARAMS: Record<
  CustomerResource,
  readonly string[]
> = {
  shell: [],
  dashboard: ["vehicle", "range", "qr", "type"],
  vehicles: [],
  orders: [],
  payments: [],
  "scan-history": ["period", "vehicle", "qr", "type", "device", "search"],
  notifications: ["view", "status", "category", "vehicle", "attention", "q"],
  "emergency-contacts": [],
  subscription: ["vehicle"],
  settings: [],
  qr: [],
  "qr-codes": [],
  "qr-buy": [],
  "qr-activate": [],
  "qr-replace": [],
};

// UI-only filters do not cause duplicate server reads; data filters are canonicalized.
export function customerQuerySearch(
  resource: CustomerResource,
  search: string,
): string {
  const input = new URLSearchParams(search);
  const output = new URLSearchParams();
  for (const name of CUSTOMER_QUERY_PARAMS[resource]) {
    const value = input.get(name)?.trim().slice(0, 200);
    if (value) output.set(name, value);
  }
  output.sort();
  return output.toString();
}

export const CUSTOMER_ROUTES: Record<string, CustomerResource> = {
  "/dashboard": "dashboard",
  "/vehicles": "vehicles",
  "/orders": "orders",
  "/payments": "payments",
  "/scan-history": "scan-history",
  "/notifications": "notifications",
  "/emergency-contacts": "emergency-contacts",
  "/subscription": "subscription",
  "/settings": "settings",
  "/qr": "qr",
  "/qr/codes": "qr-codes",
  "/qr/buy": "qr-buy",
  "/qr/activate": "qr-activate",
  "/qr/replace": "qr-replace",
};
