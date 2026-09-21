import { describe, it, expect } from "vitest";
import { HOMEPAGE_DEMO_DATA } from "../apps/web/lib/demo/homepage-demo";
import {
  getCustomerUrl,
  getActivateUrl,
  getBlogUrl,
  getStatusUrl,
  getWebUrl,
  getQrUrl,
} from "@vaahansafe/config";
import fs from "node:fs";
import path from "node:path";

describe("Phase 15.2 — Homepage Experience Architecture & Invariant Tests", () => {
  const homeComponentsDir = path.resolve(
    __dirname,
    "../apps/web/components/home",
  );
  const homePageFile = path.resolve(__dirname, "../apps/web/app/page.tsx");

  describe("01. Section Order & Station Composition", () => {
    it("page.tsx must assemble all 15 stations in the exact locked narrative order", () => {
      const content = fs.readFileSync(homePageFile, "utf-8");

      const stationOrder = [
        "RouteHero",
        "WhatIsVaahanSafe",
        "QrThreeStepFlow",
        "PhysicalStickerAnatomy",
        "EmergencyScanPreview",
        "CustomerAppShowcase",
        "RetailActivationPreview",
        "PlanPreview",
        "PrivacyProjection",
        "PlacementGalleryPreview",
        "TrustSecurityAvailability",
        "ResourceStation",
        "EvidenceSection",
        "HomepageFaq",
        "FinalCtaStation",
      ];

      let lastIndex = -1;
      for (const station of stationOrder) {
        const currentIndex = content.indexOf(`<${station}`);
        expect(currentIndex).toBeGreaterThan(-1);
        expect(currentIndex).toBeGreaterThan(lastIndex);
        lastIndex = currentIndex;
      }
    });

    it("Footer must immediately follow station 15", () => {
      const content = fs.readFileSync(homePageFile, "utf-8");
      const ctaIndex = content.indexOf("<FinalCtaStation");
      const footerIndex = content.indexOf("<SiteFooter");
      expect(ctaIndex).toBeGreaterThan(-1);
      expect(footerIndex).toBeGreaterThan(ctaIndex);
    });
  });

  describe("02. Station 01 — Route-Based Hero CTAs & Synthetic Identity", () => {
    it("hero primary CTA routes to app.vaahansafe.com", () => {
      const heroContent = fs.readFileSync(
        path.join(homeComponentsDir, "RouteHero.tsx"),
        "utf-8",
      );
      expect(heroContent).toContain("customerUrl");
      expect(heroContent).toContain("Get VaahanSafe");
      expect(getCustomerUrl()).toBeTruthy();
    });

    it("hero retail route provides activate.vaahansafe.com discovery", () => {
      const heroContent = fs.readFileSync(
        path.join(homeComponentsDir, "RouteHero.tsx"),
        "utf-8",
      );
      expect(heroContent).toContain("activateUrl");
      expect(heroContent).toContain("Activate it");
      expect(getActivateUrl()).toBeTruthy();
    });

    it("hero identity object uses strictly synthetic vehicle data", () => {
      expect(HOMEPAGE_DEMO_DATA.vehicle.visibleCode).toBe("VS-7F3K-9021");
      expect(HOMEPAGE_DEMO_DATA.vehicle.vehicleDisplay).toBe(
        "Honda — Demo Vehicle",
      );
      expect(HOMEPAGE_DEMO_DATA.vehicle.plateMasked).toContain("••••");
      expect(HOMEPAGE_DEMO_DATA.vehicle.status).toBe("ACTIVE");
    });
  });

  describe("03. Station 03 — QR Three-Step Flow", () => {
    it("must explain the core lifecycle in exactly 3 concise steps: PLACE, SCAN, CONNECT", () => {
      const stepContent = fs.readFileSync(
        path.join(homeComponentsDir, "QrThreeStepFlow.tsx"),
        "utf-8",
      );
      expect(stepContent).toContain("PLACE");
      expect(stepContent).toContain("SCAN");
      expect(stepContent).toContain("CONNECT");
    });
  });

  describe("04. Station 04 — Physical Sticker Anatomy & Security Separation", () => {
    it("physical sticker must never contain a functional scratch secret", () => {
      const stickerContent = fs.readFileSync(
        path.join(homeComponentsDir, "PhysicalStickerAnatomy.tsx"),
        "utf-8",
      );
      expect(stickerContent).toContain("Scratch to activate");
      expect(stickerContent).not.toMatch(/[A-Z0-9]{8,16}\s*\(SECRET\)/i);
    });

    it("must explain public QR vs private scratch activation proof", () => {
      const stickerContent = fs.readFileSync(
        path.join(homeComponentsDir, "PhysicalStickerAnatomy.tsx"),
        "utf-8",
      );
      expect(stickerContent).toContain("Public identity");
      expect(stickerContent).toContain("Activation proof");
    });
  });

  describe("05. Station 05 — Emergency Scan Preview (Finder View)", () => {
    it("finder preview uses synthetic emergency info and requires zero auth", () => {
      const emergencyContent = fs.readFileSync(
        path.join(homeComponentsDir, "EmergencyScanPreview.tsx"),
        "utf-8",
      );
      expect(emergencyContent).toContain("No account");
      expect(emergencyContent).toContain("No app");
      expect(emergencyContent).toContain("Finder experience");
      expect(HOMEPAGE_DEMO_DATA.emergency.maskedPhone).toContain("••••");
    });
  });

  describe("06. Station 06 & 07 — Customer App & Retail Activation Preview", () => {
    it("customer app showcase previews owner governance without live customer mutations", () => {
      const appContent = fs.readFileSync(
        path.join(homeComponentsDir, "CustomerAppShowcase.tsx"),
        "utf-8",
      );
      expect(appContent).toContain("Overview");
      expect(appContent).toContain("My Vehicle");
      expect(appContent).toContain("Emergency Contacts");
      expect(appContent).toContain("Your VaahanSafe");
    });

    it("retail activation preview routes to activate.vaahansafe.com without accepting codes on web", () => {
      const retailContent = fs.readFileSync(
        path.join(homeComponentsDir, "RetailActivationPreview.tsx"),
        "utf-8",
      );
      expect(retailContent).toContain("Activate Retail QR");
      expect(retailContent).not.toContain("<form");
      expect(retailContent).not.toContain("handleSubmit");
    });
  });

  describe("07. Station 08 — Plan Preview & Commercial Boundary", () => {
    it("plan preview separates Identity Asset from Service Entitlements and does not invent price", () => {
      const planContent = fs.readFileSync(
        path.join(homeComponentsDir, "PlanPreview.tsx"),
        "utf-8",
      );
      expect(planContent).toContain("Identity ≠ Plan");
      expect(planContent).toContain("Your VaahanSafe QR");
      expect(planContent).not.toContain("₹499");
      expect(planContent).not.toContain("₹999");
      expect(planContent).not.toContain("₹1499");
    });
  });

  describe("08. Station 09 — Privacy Controls & Never-Public Rules", () => {
    it("explicitly states residential address and email are NEVER public", () => {
      const privacyContent = fs.readFileSync(
        path.join(homeComponentsDir, "PrivacyProjection.tsx"),
        "utf-8",
      );
      expect(privacyContent).toContain("Residential address");
      expect(privacyContent).toContain("Account email");
      expect(privacyContent).toContain("Private");
    });
  });

  describe("09. Station 10 & 11 — Placement Gallery & Factual Trust", () => {
    it("gallery covers car, bike, helmet, and retail placement", () => {
      const galleryContent = fs.readFileSync(
        path.join(homeComponentsDir, "PlacementGalleryPreview.tsx"),
        "utf-8",
      );
      expect(galleryContent).toContain("Passenger car glass");
      expect(galleryContent).toContain("Bike or scooter");
      expect(galleryContent).toContain("Helmet placement");
      expect(galleryContent).toContain("Before placement");
    });

    it("trust section makes no unsupported claims (no fake 99.99% or military-grade)", () => {
      const trustContent = fs.readFileSync(
        path.join(homeComponentsDir, "TrustSecurityAvailability.tsx"),
        "utf-8",
      );
      expect(trustContent).not.toContain("99.99%");
      expect(trustContent).not.toContain("military-grade");
      expect(trustContent).not.toContain("government approved");
      expect(trustContent).not.toContain("hospital integrated");
      expect(trustContent).toContain("You control the safety view.");
      expect(trustContent).toContain("Scanning is not ownership.");
    });
  });

  describe("10. Station 12, 13 & 14 — Resources, Conditional Evidence & FAQ", () => {
    it("resources station links to /documents and /help", () => {
      const resContent = fs.readFileSync(
        path.join(homeComponentsDir, "ResourceStation.tsx"),
        "utf-8",
      );
      expect(resContent).toContain("/documents");
      expect(resContent).toContain("/help");
    });

    it("evidence section collapses completely when hasPublishedEvidence is false", () => {
      expect(HOMEPAGE_DEMO_DATA.evidenceConfig.hasPublishedEvidence).toBe(
        false,
      );
      const evidenceContent = fs.readFileSync(
        path.join(homeComponentsDir, "EvidenceSection.tsx"),
        "utf-8",
      );
      expect(evidenceContent).toContain(
        "!evidenceConfig.hasPublishedEvidence",
      );
      expect(evidenceContent).toContain("return null;");
    });

    it("FAQ addresses major pre-purchase concerns", () => {
      const faqContent = fs.readFileSync(
        path.join(homeComponentsDir, "HomepageFaq.tsx"),
        "utf-8",
      );
      expect(faqContent).toContain("What is VaahanSafe?");
      expect(faqContent).toContain("Does the finder need a VaahanSafe account?");
      expect(faqContent).toContain("Is my home address shown publicly?");
      expect(faqContent).toContain("What is the scratch area for?");
    });
  });

  describe("11. Station 15 — Final CTA Station", () => {
    it("contains distinctive headline and dual CTAs", () => {
      const ctaContent = fs.readFileSync(
        path.join(homeComponentsDir, "FinalCtaStation.tsx"),
        "utf-8",
      );
      expect(ctaContent.toLowerCase()).toContain(
        "your vehicle deserves an identity that can help when it matters",
      );
      expect(ctaContent).toContain("Get VaahanSafe");
      expect(ctaContent).toContain("Activate Retail QR");
    });
  });

  describe("12. Design System & Icon Policy Invariants", () => {
    it("only Hugeicons (<VaahanIcon />) is used in home components; no Lucide, Heroicons, or Material", () => {
      const files = fs.readdirSync(homeComponentsDir);
      for (const file of files) {
        if (!file.endsWith(".tsx")) continue;
        const code = fs.readFileSync(
          path.join(homeComponentsDir, file),
          "utf-8",
        );
        expect(code).not.toContain("lucide-react");
        expect(code).not.toContain("@heroicons");
        expect(code).not.toContain("@mui");
        expect(code).not.toContain("font-awesome");
      }
    });

    it("does not use legacy VRS/VSI tokens", () => {
      const files = fs.readdirSync(homeComponentsDir);
      for (const file of files) {
        if (!file.endsWith(".tsx")) continue;
        const code = fs.readFileSync(
          path.join(homeComponentsDir, file),
          "utf-8",
        );
        expect(code).not.toContain("vrs-");
        expect(code).not.toContain("vsi-");
      }
    });
  });
});
