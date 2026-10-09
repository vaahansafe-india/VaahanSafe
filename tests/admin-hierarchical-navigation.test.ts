import { describe, expect, it } from "vitest";
import {
  ADMIN_NAVIGATION_SECTIONS,
  getPermittedSections,
  inferSectionFromPathname,
  getActiveModuleKey,
} from "../apps/admin/components/navigation";
import { ADMIN_MODULES } from "../apps/admin/lib/modules";

describe("Admin Hierarchical Vercel-Style Navigation", () => {
  it("maps all authoritative modules into navigation sections or root", () => {
    const allMappedModules = new Set<string>();
    // Dashboard and search are root level
    allMappedModules.add("dashboard");
    allMappedModules.add("search");

    for (const section of ADMIN_NAVIGATION_SECTIONS) {
      for (const group of section.groups) {
        for (const modKey of group.modules) {
          allMappedModules.add(modKey);
        }
      }
    }

    for (const mod of ADMIN_MODULES) {
      expect(
        allMappedModules.has(mod.key),
        `Module ${mod.key} should be mapped in navigation architecture`,
      ).toBe(true);
    }
  });

  describe("Permission Filtering & Pruning", () => {
    it("super admin sees all configured sections", () => {
      const permitted = getPermittedSections("SUPER_ADMIN");
      expect(permitted.length).toBe(ADMIN_NAVIGATION_SECTIONS.length);
    });

    it("content editor only sees sections with content modules", () => {
      const permitted = getPermittedSections("CONTENT_EDITOR");
      const sectionIds = permitted.map((s) => s.id);
      expect(sectionIds).toContain("content");
      expect(sectionIds).not.toContain("operations");
      expect(sectionIds).not.toContain("commerce");
      expect(sectionIds).not.toContain("administration");
    });

    it("ops admin sees operations and permitted cross-functional areas", () => {
      const permitted = getPermittedSections("OPS_ADMIN");
      const sectionIds = permitted.map((s) => s.id);
      expect(sectionIds).toContain("operations");
      expect(sectionIds).toContain("commerce");
      expect(sectionIds).toContain("support-safety");
      expect(sectionIds).not.toContain("content"); // Content is restricted to CONTENT_EDITOR
    });

    it("finance admin sees billing and payments but not physical QR operations", () => {
      const permitted = getPermittedSections("FINANCE_ADMIN");
      const sectionIds = permitted.map((s) => s.id);
      expect(sectionIds).toContain("commerce");
      expect(sectionIds).not.toContain("content");

      const commerce = permitted.find((s) => s.id === "commerce");
      const allCommerceModules = commerce?.groups.flatMap((g) => g.modules) || [];
      expect(allCommerceModules).toContain("payments");
      expect(allCommerceModules).toContain("refunds");
      expect(allCommerceModules).toContain("plans");
    });

    it("hides empty groups and empty sections completely", () => {
      const permitted = getPermittedSections("STATUS_MANAGER");
      for (const section of permitted) {
        expect(section.groups.length).toBeGreaterThan(0);
        for (const group of section.groups) {
          expect(group.modules.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("Active Route Intelligence & Inference", () => {
    it("extracts module key correctly from top-level path", () => {
      expect(getActiveModuleKey("/")).toBe("dashboard");
      expect(getActiveModuleKey("/batches")).toBe("batches");
      expect(getActiveModuleKey("/inventory")).toBe("inventory");
      expect(getActiveModuleKey("/orders")).toBe("orders");
      expect(getActiveModuleKey("/search")).toBe("search");
    });

    it("extracts module key correctly from nested paths", () => {
      expect(getActiveModuleKey("/batches/lot-9923")).toBe("batches");
      expect(getActiveModuleKey("/orders/VS-ORD-101/tracking")).toBe("orders");
      expect(getActiveModuleKey("/support/ticket-44")).toBe("support");
    });

    it("infers Operations section for operations routes", () => {
      const permitted = getPermittedSections("SUPER_ADMIN");
      expect(inferSectionFromPathname("/batches", permitted)).toBe("operations");
      expect(inferSectionFromPathname("/inventory", permitted)).toBe("operations");
      expect(inferSectionFromPathname("/distributors", permitted)).toBe("operations");
      expect(inferSectionFromPathname("/reconciliation", permitted)).toBe("operations");
      expect(inferSectionFromPathname("/batches/batch-42/edit", permitted)).toBe("operations");
    });

    it("infers Commerce & Customers section for commerce routes", () => {
      const permitted = getPermittedSections("SUPER_ADMIN");
      expect(inferSectionFromPathname("/orders", permitted)).toBe("commerce");
      expect(inferSectionFromPathname("/customers", permitted)).toBe("commerce");
      expect(inferSectionFromPathname("/vehicles", permitted)).toBe("commerce");
      expect(inferSectionFromPathname("/payments", permitted)).toBe("commerce");
      expect(inferSectionFromPathname("/orders/VS-555", permitted)).toBe("commerce");
    });

    it("infers Support & Safety section for support/analytics routes", () => {
      const permitted = getPermittedSections("SUPER_ADMIN");
      expect(inferSectionFromPathname("/support", permitted)).toBe("support-safety");
      expect(inferSectionFromPathname("/analytics", permitted)).toBe("support-safety");
      expect(inferSectionFromPathname("/notifications", permitted)).toBe("support-safety");
      expect(inferSectionFromPathname("/incidents", permitted)).toBe("support-safety");
    });

    it("infers Content section for blog and media assets", () => {
      const permitted = getPermittedSections("SUPER_ADMIN");
      expect(inferSectionFromPathname("/articles", permitted)).toBe("content");
      expect(inferSectionFromPathname("/documents", permitted)).toBe("content");
      expect(inferSectionFromPathname("/gallery", permitted)).toBe("content");
    });

    it("infers Administration section for audit logs and settings", () => {
      const permitted = getPermittedSections("SUPER_ADMIN");
      expect(inferSectionFromPathname("/audit", permitted)).toBe("administration");
      expect(inferSectionFromPathname("/settings", permitted)).toBe("administration");
    });

    it("returns null for root dashboard and search so Level 1 stays open", () => {
      const permitted = getPermittedSections("SUPER_ADMIN");
      expect(inferSectionFromPathname("/", permitted)).toBeNull();
      expect(inferSectionFromPathname("/search", permitted)).toBeNull();
    });
  });

  describe("AdminSidebarBack Component", () => {
    it("renders back button with icon, label, and accessible semantics", async () => {
      const React = await import("react");
      const { renderToString } = await import("react-dom/server");
      const { AdminSidebarBack } = await import(
        "../apps/admin/components/navigation/AdminSidebarBack"
      );

      const html = renderToString(
        React.createElement(AdminSidebarBack, {
          onBack: () => {},
          sectionLabel: "Operations",
        })
      );

      expect(html).toContain("admin-nav-back-button");
      expect(html).toContain("admin-nav-back-icon");
      expect(html).toContain("admin-nav-back-label");
      expect(html).toContain("Back");
      expect(html).toContain("Operations");
      expect(html).toContain('aria-label="Back to main navigation from Operations"');
    });
  });
});
