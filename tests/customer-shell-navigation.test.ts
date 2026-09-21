import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  CUSTOMER_NAVIGATION,
  isNavActive,
  type AppNavigationGroup,
  type AppNavigationItem,
} from "../apps/customer/config/navigation";
import { ICON_REGISTRY } from "../packages/icons/src/registry";

const customerAppDir = path.resolve(__dirname, "../apps/customer");
const appRoutesDir = path.resolve(customerAppDir, "app/(app)");

describe("Customer Application Navigation Hierarchy (Section 04, 05 & 41)", () => {
  describe("01. Architectural Hierarchy (5 Groups, 10 Primary Destinations)", () => {
    it("defines exactly 5 top-level architectural navigation groups in order", () => {
      expect(CUSTOMER_NAVIGATION).toHaveLength(5);
      const groupLabels = CUSTOMER_NAVIGATION.map((g) => g.label);
      expect(groupLabels).toEqual([
        "OVERVIEW",
        "VEHICLE IDENTITY",
        "SERVICES",
        "ACTIVITY",
        "ACCOUNT",
      ]);
    });

    it("maps all 10 primary destinations under the 5 groups", () => {
      const allPrimaryItems = CUSTOMER_NAVIGATION.flatMap((g) => g.items);
      expect(allPrimaryItems).toHaveLength(10);

      const itemIds = allPrimaryItems.map((item) => item.id);
      expect(itemIds).toEqual([
        "dashboard",
        "vehicles",
        "qr",
        "subscription",
        "orders",
        "payments",
        "emergency-contacts",
        "scan-history",
        "notifications",
        "settings",
      ]);

      const itemHrefs = allPrimaryItems.map((item) => item.href);
      expect(itemHrefs).toEqual([
        "/dashboard",
        "/vehicles",
        "/qr",
        "/subscription",
        "/orders",
        "/payments",
        "/emergency-contacts",
        "/scan-history",
        "/notifications",
        "/settings",
      ]);
    });
  });

  describe("02. 'My QR' Hub & 5 Lifecycle Sub-Destinations", () => {
    const qrGroup = CUSTOMER_NAVIGATION.find((g) => g.id === "vehicle-identity");
    const myQrItem = qrGroup?.items.find((item) => item.id === "qr");

    it("defines My QR as an expandable group with exactly 5 child destinations", () => {
      expect(myQrItem).toBeDefined();
      expect(myQrItem?.children).toBeDefined();
      expect(myQrItem?.children).toHaveLength(5);

      const childLabels = myQrItem?.children?.map((c) => c.label);
      expect(childLabels).toEqual([
        "Buy QR",
        "Activate Retail QR",
        "QR Codes",
        "Digital QR",
        "Replace QR",
      ]);

      const childHrefs = myQrItem?.children?.map((c) => c.href);
      expect(childHrefs).toEqual([
        "/qr/buy",
        "/qr/activate",
        "/qr/codes",
        "/qr/digital",
        "/qr/replace",
      ]);
    });
  });

  describe("03. Icon Registry Integrity", () => {
    it("ensures every navigation item references an existing icon in @vaahansafe/icons", () => {
      const validNames = new Set(Object.keys(ICON_REGISTRY));

      function checkItems(items: readonly AppNavigationItem[]) {
        for (const item of items) {
          expect(
            validNames.has(item.icon),
            `Icon '${item.icon}' on nav item '${item.label}' must exist in ICON_REGISTRY`
          ).toBe(true);

          if (item.children) {
            checkItems(item.children);
          }
        }
      }

      for (const group of CUSTOMER_NAVIGATION) {
        checkItems(group.items);
      }
    });
  });

  describe("04. Route Files Existence", () => {
    it("has page entrypoints for all 10 primary destinations", () => {
      const expectedPages = [
        "dashboard/page.tsx",
        "vehicles/page.tsx",
        "qr/page.tsx",
        "subscription/page.tsx",
        "orders/page.tsx",
        "payments/page.tsx",
        "emergency-contacts/page.tsx",
        "scan-history/page.tsx",
        "notifications/page.tsx",
        "settings/page.tsx",
      ];

      for (const pageRel of expectedPages) {
        const fullPath = path.join(appRoutesDir, pageRel);
        expect(
          fs.existsSync(fullPath),
          `Expected route file ${pageRel} to exist at ${fullPath}`
        ).toBe(true);
      }
    });

    it("has page entrypoints for all 5 My QR child destinations", () => {
      const expectedQrPages = [
        "qr/buy/page.tsx",
        "qr/activate/page.tsx",
        "qr/codes/page.tsx",
        "qr/digital/page.tsx",
        "qr/replace/page.tsx",
      ];

      for (const pageRel of expectedQrPages) {
        const fullPath = path.join(appRoutesDir, pageRel);
        expect(
          fs.existsSync(fullPath),
          `Expected QR sub-route file ${pageRel} to exist at ${fullPath}`
        ).toBe(true);
      }
    });

    it("has vehicle and settings sub-routes", () => {
      const expectedSubPages = [
        "vehicles/new/page.tsx",
        "vehicles/[vehicleId]/page.tsx",
        "settings/profile/page.tsx",
        "settings/security/page.tsx",
      ];

      for (const pageRel of expectedSubPages) {
        const fullPath = path.join(appRoutesDir, pageRel);
        expect(
          fs.existsSync(fullPath),
          `Expected sub-route file ${pageRel} to exist at ${fullPath}`
        ).toBe(true);
      }
    });
  });

  describe("05. Navigation Active State Resolver (isNavActive)", () => {
    const dashboardItem: AppNavigationItem = {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
    };

    const qrItem = CUSTOMER_NAVIGATION[1].items.find((i) => i.id === "qr")!;

    it("identifies /dashboard and / as active for Dashboard item", () => {
      expect(isNavActive("/dashboard", dashboardItem)).toBe(true);
      expect(isNavActive("/", dashboardItem)).toBe(true);
      expect(isNavActive("/vehicles", dashboardItem)).toBe(false);
    });

    it("identifies /qr and all /qr/* child routes as active for My QR parent item", () => {
      expect(isNavActive("/qr", qrItem)).toBe(true);
      expect(isNavActive("/qr/buy", qrItem)).toBe(true);
      expect(isNavActive("/qr/activate", qrItem)).toBe(true);
      expect(isNavActive("/qr/codes", qrItem)).toBe(true);
      expect(isNavActive("/qr/digital", qrItem)).toBe(true);
      expect(isNavActive("/qr/replace", qrItem)).toBe(true);
      expect(isNavActive("/vehicles", qrItem)).toBe(false);
    });
  });

  describe("06. Product Tone & Semantic Constraints", () => {
    it("does not use generic admin/saas labels in navigation", () => {
      const allText = JSON.stringify(CUSTOMER_NAVIGATION).toLowerCase();
      expect(allText).not.toContain("admin panel");
      expect(allText).not.toContain("control panel");
      expect(allText).not.toContain("customer portal");
      expect(allText).not.toContain("workspace");
    });
  });
});
