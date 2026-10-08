import type { AdminRole } from "./modules";
export interface AdminIdentity {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  sessionId: string;
  phoneVerified: boolean;
  stepUpAt: string | null;
}
export type AdminRow = Record<string, string | number | boolean | null>;
export interface AdminList {
  rows: AdminRow[];
  total: number;
  page: number;
  pageSize: number;
}
export interface AdminMetric {
  label: string;
  value: number | null;
  detail: string;
  href: string;
}
export interface ConnectionCheck {
  name: string;
  state: "connected" | "unavailable" | "unconfigured";
  checkedAt: string;
}
