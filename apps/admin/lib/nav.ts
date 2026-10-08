import { ADMIN_MODULES } from "./modules";
export const ADMIN_NAV_ITEMS = ADMIN_MODULES.map((module) => ({
  label: module.label,
  href: module.key === "dashboard" ? "/" : `/${module.key}`,
  icon: module.icon,
}));
