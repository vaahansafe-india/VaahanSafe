import type { AdminRole } from "../../lib/modules";
export const canManageDistributors = (role: AdminRole) =>
  role === "SUPER_ADMIN" || role === "OPS_ADMIN";
export const canReadDistributorContacts = canManageDistributors;
