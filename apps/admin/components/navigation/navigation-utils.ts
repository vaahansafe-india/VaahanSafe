import { canReadModule, type AdminRole } from "../../lib/modules";
import {
  ADMIN_NAVIGATION_SECTIONS,
  type AdminNavigationSection,
} from "./navigation-model";

/**
 * Filter sections and groups by RBAC.
 * Empty groups are dropped; sections with zero accessible modules are completely hidden.
 */
export function getPermittedSections(role: AdminRole): AdminNavigationSection[] {
  return ADMIN_NAVIGATION_SECTIONS.map((section) => {
    const permittedGroups = section.groups
      .map((group) => ({
        ...group,
        modules: group.modules.filter((modKey) => canReadModule(role, modKey)),
      }))
      .filter((group) => group.modules.length > 0);

    return {
      ...section,
      groups: permittedGroups,
    };
  }).filter((section) => section.groups.length > 0);
}

/**
 * Derives the active module key from the current URL pathname.
 * Handles nested routes such as `/batches/123` -> `batches`.
 */
export function getActiveModuleKey(pathname: string): string {
  if (!pathname || pathname === "/") return "dashboard";
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment || "dashboard";
}

/**
 * Automatically infers which navigation section owns the current route.
 * Root routes like `/` (dashboard) and `/search` return null (stay on Level 1).
 */
export function inferSectionFromPathname(
  pathname: string,
  sections: AdminNavigationSection[],
): string | null {
  const activeKey = getActiveModuleKey(pathname);
  if (activeKey === "dashboard" || activeKey === "search") {
    return null;
  }
  for (const section of sections) {
    for (const group of section.groups) {
      if (group.modules.includes(activeKey)) {
        return section.id;
      }
    }
  }
  return null;
}

/**
 * Finds a navigation section by ID from the permitted sections list.
 */
export function findSectionById(
  sectionId: string,
  sections: AdminNavigationSection[],
): AdminNavigationSection | undefined {
  return sections.find((s) => s.id === sectionId);
}
