import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PLANS_CONFIG, COMPARISON_ROWS, PLANS_FAQ } from "../apps/web/app/pricing/plans-config";

describe("VaahanSafe Public Product Pages Architecture & Invariant Tests", () => {
  const webAppDir = path.resolve(__dirname, "../apps/web");
  const componentsDir = path.join(webAppDir, "components");

  describe("01. Site Navigation & Public Information Architecture", () => {
    it("SiteHeader defines the exact 5 locked navigation routes", () => {
      const headerContent = fs.readFileSync(
        path.join(componentsDir, "marketing/site-header.tsx"),
        "utf-8"
      );

      expect(headerContent).toContain('"01"');
      expect(headerContent).toContain('"Product"');
      expect(headerContent).toContain('"/#what-is-vaahansafe"');

      expect(headerContent).toContain('"02"');
      expect(headerContent).toContain('"How it works"');
      expect(headerContent).toContain('"/how-it-works"');

      expect(headerContent).toContain('"03"');
      expect(headerContent).toContain('"Safety & Privacy"');
      expect(headerContent).toContain('"/safety"');

      expect(headerContent).toContain('"04"');
      expect(headerContent).toContain('"Plans"');
      expect(headerContent).toContain('"/pricing"');

      expect(headerContent).toContain('"05"');
      expect(headerContent).toContain('"QR Placement"');
      expect(headerContent).toContain('"/gallery"');
    });

    it("WhatIsVaahanSafe section on homepage links to /how-it-works", () => {
      const whatIsContent = fs.readFileSync(
        path.join(componentsDir, "home/WhatIsVaahanSafe.tsx"),
        "utf-8"
      );
      expect(whatIsContent).toContain('href="/how-it-works"');
      expect(whatIsContent).toContain("Explore how VaahanSafe works");
    });

    it("Sitemap indexes all four dedicated product pages", () => {
      const sitemapContent = fs.readFileSync(
        path.join(webAppDir, "app/sitemap.ts"),
        "utf-8"
      );
      expect(sitemapContent).toContain("${baseUrl}/how-it-works");
      expect(sitemapContent).toContain("${baseUrl}/safety");
      expect(sitemapContent).toContain("${baseUrl}/pricing");
      expect(sitemapContent).toContain("${baseUrl}/gallery");
    });
  });

  describe("02. Route 01: /how-it-works (How It Works Journey)", () => {
    const pageFile = path.join(webAppDir, "app/how-it-works/page.tsx");
    const hiwComponentsDir = path.join(componentsDir, "how-it-works");

    it("assembles all 12 sections in the exact product journey sequence", () => {
      const content = fs.readFileSync(pageFile, "utf-8");
      const sectionOrder = [
        "HowItWorksHero",
        "VehiclePhysicalStart",
        "StickerDoorwaySection",
        "ScanMomentSection",
        "IdentityUsefulSection",
        "SafetyViewPresentation",
        "PrivacyBoundaryFlow",
        "TwoWaysToBegin",
        "OwnerExperienceArtifact",
        "QrVsPlanDistinction",
        "ReplacementContinuityFlow",
        "HowItWorksFinalCta",
      ];

      let lastIndex = -1;
      for (const section of sectionOrder) {
        const currentIndex = content.indexOf(`<${section}`);
        expect(currentIndex).toBeGreaterThan(-1);
        expect(currentIndex).toBeGreaterThan(lastIndex);
        lastIndex = currentIndex;
      }
    });

    it("embodies the central product journey and action sequence", () => {
      const heroContent = fs.readFileSync(
        path.join(hiwComponentsDir, "HowItWorksHero.tsx"),
        "utf-8"
      );
      expect(heroContent).toContain("From your vehicle");
      expect(heroContent).toContain("useful connection.");
      expect(heroContent).toContain('"Vehicle"');
      expect(heroContent).toContain('"QR"');
      expect(heroContent).toContain('"Identity"');
      expect(heroContent).toContain('"Safety View"');
      expect(heroContent).toContain('"Connection"');
    });

    it("enforces privacy boundary and explains scanning is not account ownership", () => {
      const privacyContent = fs.readFileSync(
        path.join(hiwComponentsDir, "PrivacyBoundaryFlow.tsx"),
        "utf-8"
      );
      expect(privacyContent).toContain("Private Account");
      expect(privacyContent).toContain("Your Controls");
      expect(privacyContent).toContain("Public Safety View");
      expect(privacyContent).toContain("Explore Safety");
    });

    it("explains online and retail acquisition routes converging on one infrastructure", () => {
      const twoWaysContent = fs.readFileSync(
        path.join(hiwComponentsDir, "TwoWaysToBegin.tsx"),
        "utf-8"
      );
      expect(twoWaysContent).toContain("TWO ACQUISITION CHANNELS");
      expect(twoWaysContent).toContain("ONE UNIFIED VEHICLE IDENTITY INFRASTRUCTURE");
    });
  });

  describe("03. Route 02: /safety (Safety & Privacy Product Architecture)", () => {
    const pageFile = path.join(webAppDir, "app/safety/page.tsx");
    const safetyComponentsDir = path.join(componentsDir, "safety");

    it("assembles all safety sections in locked editorial order", () => {
      const content = fs.readFileSync(pageFile, "utf-8");
      const sectionOrder = [
        "SafetyProductHero",
        "ScanBoundarySignature",
        "PrivateInformationSection",
        "ControlledInformationSection",
        "PublicSafetyViewDemo",
        "ThreeEntitiesDistinction",
        "ActivationProofBoundary",
        "UserProvidedAdvisoryCard",
        "OwnerControlsFlow",
        "SafetyTrustPrinciples",
        "SafetyLegalLinksStation",
        "SafetyProductFinalCta",
      ];

      let lastIndex = -1;
      for (const section of sectionOrder) {
        const currentIndex = content.indexOf(`<${section}`);
        expect(currentIndex).toBeGreaterThan(-1);
        expect(currentIndex).toBeGreaterThan(lastIndex);
        lastIndex = currentIndex;
      }
    });

    it("embodies signature equation: PRIVATE → CONTROL → SELECT → PUBLIC SAFETY VIEW", () => {
      const boundaryContent = fs.readFileSync(
        path.join(safetyComponentsDir, "ScanBoundarySignature.tsx"),
        "utf-8"
      );
      expect(boundaryContent).toContain("Private Account");
      expect(boundaryContent).toContain("Protected Boundary");
      expect(boundaryContent).toContain("Your Controls");
      expect(boundaryContent).toContain("Selected Safety View");
    });

    it("articulates distinction: ACCOUNT ≠ VEHICLE IDENTITY ≠ PUBLIC SAFETY VIEW", () => {
      const threeContent = fs.readFileSync(
        path.join(safetyComponentsDir, "ThreeEntitiesDistinction.tsx"),
        "utf-8"
      );
      expect(threeContent).toContain("The Account");
      expect(threeContent).toContain("The Identity");
      expect(threeContent).toContain("Safety View");
      expect(threeContent).toContain("ACCOUNT &ne; VEHICLE IDENTITY &ne; PUBLIC SAFETY VIEW");
    });

    it("contains user-provided medical advisory without unverified medical certification claims", () => {
      const advContent = fs.readFileSync(
        path.join(safetyComponentsDir, "UserProvidedAdvisoryCard.tsx"),
        "utf-8"
      );
      expect(advContent).toContain("user-provided");
      expect(advContent).toContain("Safety Disclaimer");
      expect(advContent).not.toContain("100% medically certified");
      expect(advContent).not.toContain("hospital guaranteed");
    });
  });

  describe("04. Route 03: /pricing (Plans & Entitlements)", () => {
    const pageFile = path.join(webAppDir, "app/pricing/page.tsx");
    const pricingComponentsDir = path.join(componentsDir, "pricing");

    it("assembles all plans components in sequence", () => {
      const content = fs.readFileSync(pageFile, "utf-8");
      const sectionOrder = [
        "PlansHero",
        "ProductModelVisual",
        "DecalIncludedBaseline",
        "PlanSelectionGrid",
        "PlanComparisonTable",
        "PhysicalQrRelationship",
        "RetailPlanRelationship",
        "RenewalAndExpiryPolicy",
        "PlansFaqSection",
        "PlansFinalCta",
      ];

      let lastIndex = -1;
      for (const section of sectionOrder) {
        const currentIndex = content.indexOf(`<${section}`);
        expect(currentIndex).toBeGreaterThan(-1);
        expect(currentIndex).toBeGreaterThan(lastIndex);
        lastIndex = currentIndex;
      }
    });

    it("establishes model: QR IDENTITY ≠ PLAN", () => {
      const heroContent = fs.readFileSync(
        path.join(pricingComponentsDir, "PlansHero.tsx"),
        "utf-8"
      );
      expect(heroContent).toContain("The identity is the QR.");
      expect(heroContent).toContain("The plan is what surrounds it.");
      expect(heroContent).toContain("Identity Asset &ne; Software Plan");
    });

    it("configures plan tiers without inventing arbitrary SaaS prices", () => {
      expect(PLANS_CONFIG).toHaveLength(3);
      const ids = PLANS_CONFIG.map((p) => p.id);
      expect(ids).toEqual(["essential", "active", "fleet"]);

      // Verify no invented prices like ₹199, ₹499, ₹999
      const allPrices = PLANS_CONFIG.map((p) => p.priceDisplay).join(" ");
      expect(allPrices).not.toMatch(/₹199|₹499|₹999/);
    });

    it("includes comparison rows across three categories and 5 FAQs", () => {
      expect(COMPARISON_ROWS.length).toBeGreaterThanOrEqual(6);
      expect(PLANS_FAQ).toHaveLength(5);
      expect(PLANS_FAQ[0].q).toBe("Is the QR the same as the plan?");
    });
  });

  describe("05. Route 04: /gallery (QR Placement Visual Guide)", () => {
    const pageFile = path.join(webAppDir, "app/gallery/page.tsx");
    const galleryComponentsDir = path.join(componentsDir, "gallery");

    it("assembles all placement guide sections in sequence", () => {
      const content = fs.readFileSync(pageFile, "utf-8");
      const sectionOrder = [
        "PlacementHero",
        "PlacementPrincipleVisual",
        "CarPlacementGuide",
        "TwoWheelerPlacementGuide",
        "PrePlacementChecklist",
        "DecalAnatomyGuide",
        "PlacementWhatNotToDo",
        "PlacementToConnectionFlow",
        "IllustrativePlacementGallery",
        "InstallationHelpStation",
        "PlacementFinalCta",
      ];

      let lastIndex = -1;
      for (const section of sectionOrder) {
        const currentIndex = content.indexOf(`<${section}`);
        expect(currentIndex).toBeGreaterThan(-1);
        expect(currentIndex).toBeGreaterThan(lastIndex);
        lastIndex = currentIndex;
      }
    });

    it("embodies headline: Made to belong on the vehicle", () => {
      const heroContent = fs.readFileSync(
        path.join(galleryComponentsDir, "PlacementHero.tsx"),
        "utf-8"
      );
      expect(heroContent).toContain("Made to belong");
      expect(heroContent).toContain("on the vehicle.");
      expect(heroContent).not.toContain("guaranteed scan");
      expect(heroContent).not.toContain("approved placement");
    });

    it("includes cautious helmet placement advisory", () => {
      const bikeContent = fs.readFileSync(
        path.join(galleryComponentsDir, "TwoWheelerPlacementGuide.tsx"),
        "utf-8"
      );
      expect(bikeContent).toContain("Important Helmet Placement Notice");
      expect(bikeContent).toContain("recommend placing vehicle identity decals on rider helmets");
    });

    it("includes pre-placement checklist and misplacement cautions", () => {
      const checklistContent = fs.readFileSync(
        path.join(galleryComponentsDir, "PrePlacementChecklist.tsx"),
        "utf-8"
      );
      expect(checklistContent).toContain("Choose a Visible Location");
      expect(checklistContent).toContain("Check Required Information");
      expect(checklistContent).toContain("Avoid Lights & Controls");
      expect(checklistContent).toContain("Clean & Prepare Substrate");

      const cautionsContent = fs.readFileSync(
        path.join(galleryComponentsDir, "PlacementWhatNotToDo.tsx"),
        "utf-8"
      );
      expect(cautionsContent).toContain("Covered by Heavy Tint");
      expect(cautionsContent).toContain("Over Mandatory Plates");
      expect(cautionsContent).toContain("Over Lighting Elements");
    });

    it("labels placement specimens strictly as illustrative examples", () => {
      const galleryContent = fs.readFileSync(
        path.join(galleryComponentsDir, "IllustrativePlacementGallery.tsx"),
        "utf-8"
      );
      expect(galleryContent).toContain("Illustrative placement examples");
      expect(galleryContent).not.toContain("Certified Installation");
    });
  });

  describe("06. Design System Invariants across All Product Components", () => {
    it("uses only @vaahansafe/icons (VaahanIcon); no unapproved icon libraries", () => {
      const checkDirs = [
        path.join(componentsDir, "how-it-works"),
        path.join(componentsDir, "safety"),
        path.join(componentsDir, "pricing"),
        path.join(componentsDir, "gallery"),
      ];

      for (const dir of checkDirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (!file.endsWith(".tsx")) continue;
          const code = fs.readFileSync(path.join(dir, file), "utf-8");
          expect(code).not.toContain("lucide-react");
          expect(code).not.toContain("@heroicons");
          expect(code).not.toContain("@mui");
          expect(code).not.toContain("font-awesome");
        }
      }
    });

    it("strictly avoids forbidden marketing exaggerations", () => {
      const checkDirs = [
        path.join(componentsDir, "how-it-works"),
        path.join(componentsDir, "safety"),
        path.join(componentsDir, "pricing"),
        path.join(componentsDir, "gallery"),
      ];

      for (const dir of checkDirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (!file.endsWith(".tsx")) continue;
          const code = fs.readFileSync(path.join(dir, file), "utf-8");
          expect(code).not.toContain("military-grade");
          expect(code).not.toContain("unbreakable encryption");
          expect(code).not.toContain("government certified");
          expect(code).not.toContain("100% waterproof guaranteed");
        }
      }
    });
  });
});
