import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const customerAppDir = path.resolve(__dirname, "../apps/customer");
const shellComponentsDir = path.resolve(customerAppDir, "components/shell");

describe("Customer Application Shell Layout & Accessibility (Section 07-13, 29-33, 42-45)", () => {
  describe("01. Desktop Sidebar Geometry & Visual Language", () => {
    it("sidebar uses 272px width and bg-sidebar surface", () => {
      const sidebarContent = fs.readFileSync(
        path.join(shellComponentsDir, "CustomerSidebar.tsx"),
        "utf-8"
      );
      expect(sidebarContent).toContain("w-[272px]");
      expect(sidebarContent).toContain("bg-sidebar");
    });

    it("displays the vehicle identity rail with mono metadata and coral accent point", () => {
      const sidebarContent = fs.readFileSync(
        path.join(shellComponentsDir, "CustomerSidebar.tsx"),
        "utf-8"
      );
      expect(sidebarContent).toContain("VEHICLE IDENTITY");
      expect(sidebarContent).toContain("font-mono");
      expect(sidebarContent).toContain("text-[#cc785c]"); // Coral identity point
      expect(sidebarContent).not.toContain("ADMIN PANEL");
      expect(sidebarContent).not.toContain("CUSTOMER PORTAL");
    });

    it("uses a precision coral left rail indicator for active navigation items", () => {
      const sidebarContent = fs.readFileSync(
        path.join(shellComponentsDir, "CustomerSidebar.tsx"),
        "utf-8"
      );
      expect(sidebarContent).toContain("border-[#cc785c]");
      expect(sidebarContent).toContain("bg-sidebar-accent");
    });

    it("implements expandable 'My QR' submenu with relationship rail", () => {
      const sidebarContent = fs.readFileSync(
        path.join(shellComponentsDir, "CustomerSidebar.tsx"),
        "utf-8"
      );
      expect(sidebarContent).toContain("isQrExpanded");
      expect(sidebarContent).toContain("border-l");
      expect(sidebarContent).toContain("border-sidebar-border");
    });

    it("includes user identity footer with mobile verification pill and sign-out form", () => {
      const sidebarContent = fs.readFileSync(
        path.join(shellComponentsDir, "CustomerSidebar.tsx"),
        "utf-8"
      );
      expect(sidebarContent).toContain("VERIFIED");
      expect(sidebarContent).toContain("/api/auth/logout");
      expect(sidebarContent).toContain("Sign out");
    });
  });

  describe("02. Contextual Top Bar & Vehicle Context", () => {
    it("provides contextual breadcrumb and vehicle identity selector", () => {
      const topBarContent = fs.readFileSync(
        path.join(shellComponentsDir, "CustomerTopBar.tsx"),
        "utf-8"
      );
      expect(topBarContent).toContain("VEHICLE CONTEXT");
      expect(topBarContent).toContain("Link Vehicle");
      expect(topBarContent).toContain("/notifications");
    });

    it("displays unread notification indicator when count > 0", () => {
      const topBarContent = fs.readFileSync(
        path.join(shellComponentsDir, "CustomerTopBar.tsx"),
        "utf-8"
      );
      expect(topBarContent).toContain("unreadNotificationCount");
      expect(topBarContent).toContain("bg-[#cc785c]");
    });
  });

  describe("03. Master Shell Layout Architecture", () => {
    it("coordinates desktop fixed sidebar, top bar, and main canvas", () => {
      const shellContent = fs.readFileSync(
        path.join(shellComponentsDir, "CustomerAppShell.tsx"),
        "utf-8"
      );
      expect(shellContent).toContain("SidebarProvider");
      expect(shellContent).toContain("AppSidebar");
      expect(shellContent).toContain("SidebarInset");
      expect(shellContent).toContain("bg-background"); // Zinc canvas
    });
  });

  describe("04. Responsive Mobile Navigation & Mobile My QR Sheet", () => {
    it("CustomerMobileNav provides accessible touch targets and mobile bottom bar", () => {
      const mobileNavContent = fs.readFileSync(
        path.join(shellComponentsDir, "CustomerMobileNav.tsx"),
        "utf-8"
      );
      expect(mobileNavContent).toContain("Overview");
      expect(mobileNavContent).toContain("Vehicles");
      expect(mobileNavContent).toContain("My QR");
      expect(mobileNavContent).toContain("Activity");
      expect(mobileNavContent).toContain("Account");
      expect(mobileNavContent).toContain("min-h-[44px]"); // Touch target accessibility
    });

    it("MobileMyQrSheet presents dedicated lifecycle actions with icons, titles, and descriptions", () => {
      const sheetContent = fs.readFileSync(
        path.join(shellComponentsDir, "MobileMyQrSheet.tsx"),
        "utf-8"
      );
      expect(sheetContent).toContain("MY VEHICLE QR");
      expect(sheetContent).toContain("CUSTOMER_NAVIGATION");
      expect(sheetContent).toContain("qrChildren");
      expect(sheetContent).toContain("option.label");
      expect(sheetContent).toContain("option.description");
    });
  });

  describe("05. Hard Invariant — Zero Dummy Data & Zero Local Storage", () => {
    it("shell components never import or invoke localStorage, sessionStorage, or IndexedDB", () => {
      const shellFiles = fs.readdirSync(shellComponentsDir);
      for (const file of shellFiles) {
        if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue;
        const fileContent = fs.readFileSync(
          path.join(shellComponentsDir, file),
          "utf-8"
        );
        expect(fileContent).not.toContain("localStorage");
        expect(fileContent).not.toContain("sessionStorage");
        expect(fileContent).not.toContain("indexedDB");
        expect(fileContent).not.toContain("better-sqlite3");
      }
    });

    it("EmptyState components provide truthful messaging without fake cards", () => {
      const emptyStateContent = fs.readFileSync(
        path.join(shellComponentsDir, "EmptyState.tsx"),
        "utf-8"
      );
      expect(emptyStateContent).toContain("EmptyVehiclesState");
      expect(emptyStateContent).toContain("EmptyQrState");
      expect(emptyStateContent).toContain("EmptyScansState");
      expect(emptyStateContent).toContain("EmptyOrdersState");
      expect(emptyStateContent).toContain("EmptyContactsState");
      expect(emptyStateContent).toContain("EmptyNotificationsState");
      expect(emptyStateContent).toContain("No vehicle has been added yet");
    });
  });

  describe("06. Mobile Navigation Sheet Solid Background & Collapsible Geometry", () => {
    it("ensures mobile SheetContent has an opaque, solid background to prevent transparency bleed-through", () => {
      const sidebarUiPath = path.resolve(customerAppDir, "components/ui/sidebar.tsx");
      const content = fs.readFileSync(sidebarUiPath, "utf-8");
      expect(content).toContain("bg-sidebar");
      expect(content).toContain("bg-[hsl(var(--sidebar-background))]");
      expect(content).toContain("dark:bg-[#09090b]");
    });

    it("ensures NavMain uses canonical CollapsibleTrigger and does not have unconstrained h-full stretch", () => {
      const navMainPath = path.resolve(customerAppDir, "components/nav-main.tsx");
      const content = fs.readFileSync(navMainPath, "utf-8");
      expect(content).toContain("CollapsibleTrigger asChild");
      expect(content).toContain("group-data-[state=open]/collapsible:rotate-90");
      expect(content).not.toContain("h-full group-data-[collapsible=icon]");
    });

    it("ensures tailwind.preset.js exports first-class sidebar tokens", () => {
      const presetPath = path.resolve(__dirname, "../packages/ui/tailwind.preset.js");
      const content = fs.readFileSync(presetPath, "utf-8");
      expect(content).toContain("sidebar: {");
      expect(content).toContain("--sidebar-background");
      expect(content).toContain("--sidebar-foreground");
      expect(content).toContain("--sidebar-border");
    });
  });
});

