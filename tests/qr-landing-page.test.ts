import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("VaahanSafe QR Landing Page Architecture & Route Isolation (qr.vaahansafe.com/)", () => {
  const qrAppDir = path.resolve(__dirname, "../apps/qr");
  const landingDir = path.join(qrAppDir, "components/landing");
  const resolverDir = path.join(qrAppDir, "components/resolver");
  const rootPagePath = path.join(qrAppDir, "app/page.tsx");
  const resolverPagePath = path.join(qrAppDir, "app/[publicId]/page.tsx");

  // --------------------------------------------------------------------------
  // 1. Mandatory Route & Bundle Isolation (Rule 46 & 58)
  // --------------------------------------------------------------------------
  describe("Route & Bundle Isolation Invariant", () => {
    it("CRITICAL: /{publicId} resolver MUST NEVER import landing components or marketing modules", () => {
      const resolverContent = fs.readFileSync(resolverPagePath, "utf8");

      expect(resolverContent).not.toContain("components/landing");
      expect(resolverContent).not.toContain("QrLandingHeader");
      expect(resolverContent).not.toContain("IdentityHero");
      expect(resolverContent).not.toContain("QrFaq");
      expect(resolverContent).not.toContain("PrivacyChapter");
      expect(resolverContent).not.toContain("ScanSituations");
    });

    it("Root / page assembles modular landing components", () => {
      const rootContent = fs.readFileSync(rootPagePath, "utf8");
      expect(rootContent).toContain("LandingExperience");

      const experienceContent = fs.readFileSync(
        path.join(landingDir, "LandingExperience.tsx"),
        "utf8",
      );
      expect(experienceContent).toContain("QrLandingHeader");
      expect(experienceContent).toContain("IdentityHero");
      expect(experienceContent).toContain("HowItWorks");
      expect(experienceContent).toContain("PublicViewDemo");
      expect(experienceContent).toContain("PrivacyChapter");
      expect(experienceContent).toContain("QrLifecycleSection");
      expect(experienceContent).toContain("ActivationHandoff");
      expect(experienceContent).toContain("QrFaq");
      expect(experienceContent).toContain("QrLandingFooter");
    });
  });

  // --------------------------------------------------------------------------
  // 2. SEO & Indexing Policy Separation (Rule 53 & 54)
  // --------------------------------------------------------------------------
  describe("SEO & Indexing Policy Separation", () => {
    it("Root / is indexable for public trust and educational discovery", () => {
      const rootContent = fs.readFileSync(rootPagePath, "utf8");
      expect(rootContent).toContain("robots:");
      expect(rootContent).toContain("index: true");
      expect(rootContent).toContain("follow: true");
    });

    it("Resolver /{publicId} is strictly NOINDEX to safeguard personal safety passes", () => {
      const resolverContent = fs.readFileSync(resolverPagePath, "utf8");
      expect(resolverContent).toContain("robots:");
      expect(resolverContent).toContain("index: false");
      expect(resolverContent).toContain("follow: false");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Narrative Copy, Identity Statements & Demo Security
  // --------------------------------------------------------------------------
  describe("Narrative Copy, Identity Statements & Demo Security", () => {
    it("IdentityHero contains the signature editorial statement and system label", () => {
      const heroContent = fs.readFileSync(
        path.join(landingDir, "IdentityHero.tsx"),
        "utf8",
      );
      expect(heroContent).toContain("Your vehicle");
      expect(heroContent).toContain("safety identity");
      expect(heroContent).toContain("No app or account needed");
    });

    it("PhysicalQrArtifact displays explicit DEMO label and registration marks", () => {
      const artifactContent = fs.readFileSync(
        path.join(landingDir, "PhysicalQrArtifact.tsx"),
        "utf8",
      );
      expect(artifactContent).toContain("DEMO / NON-FUNCTIONAL");
      expect(artifactContent).toContain("VS-7F3K-9021");
      expect(artifactContent).toContain("Physical Vehicle");
      expect(artifactContent).toContain("Public Safety View");
    });

    it("Safety view explanation does not contain fictional records or call actions", () => {
      const content = fs.readFileSync(
        path.join(landingDir, "PublicViewDemo.tsx"),
        "utf8",
      );
      expect(content).not.toContain("VS-7F3K-9021");
      expect(content).not.toContain("tel:");
      expect(content).toContain("owner has approved");
    });

    it("ProjectionBoundaryDiagram visualizes private account storage vs public projection", () => {
      const diagramContent = fs.readFileSync(
        path.join(landingDir, "ProjectionBoundaryDiagram.tsx"),
        "utf8",
      );
      expect(diagramContent).toContain("Only the approved public view");
      expect(diagramContent).toContain("is returned to a scan");
      expect(diagramContent).toContain("Approved Safety View");
      expect(diagramContent).toContain("Private Account Storage");
      expect(diagramContent).toContain("Physical Address");
      expect(diagramContent).toContain("BLOCKED");
    });

    it("PrivacyChapter explains controlled sharing with transparent artwork", () => {
      const privacyContent = fs.readFileSync(
        path.join(landingDir, "PrivacyChapter.tsx"),
        "utf8",
      );
      expect(privacyContent).toContain("qr-privacy-concept.webp");
      expect(privacyContent).toContain("Public QR.");
      expect(privacyContent).toContain("Personal boundaries.");
    });

    it("QrLifecycleSection explains the 4 safe public states without internal logistics", () => {
      const lifecycleContent = fs.readFileSync(
        path.join(landingDir, "QrLifecycleSection.tsx"),
        "utf8",
      );
      expect(lifecycleContent).toContain("Ready to activate");
      expect(lifecycleContent).toContain("Safety view enabled");
      expect(lifecycleContent).toContain("Replaced or unavailable");
    });

    it("StickerAnatomy provides 5 clear annotations of the physical sticker", () => {
      const anatomyContent = fs.readFileSync(
        path.join(landingDir, "StickerAnatomy.tsx"),
        "utf8",
      );
      expect(anatomyContent).toContain("Opaque Resolver Matrix");
      expect(anatomyContent).toContain("Visible VaahanSafe ID");
      expect(anatomyContent).toContain("VaahanSafe Identity Emblem");
      expect(anatomyContent).toContain("Scratch-Off Activation Proof");
      expect(anatomyContent).toContain("Clear Roadside Instructions");
      expect(anatomyContent).toContain("DEMO ONLY");
    });

    it("ActivationHandoff links to official activate.vaahansafe.com domain", () => {
      const handoffContent = fs.readFileSync(
        path.join(landingDir, "ActivationHandoff.tsx"),
        "utf8",
      );
      expect(handoffContent).toContain("getActivateUrl");
      expect(handoffContent).toContain("Verify your mobile");
      expect(handoffContent).toContain("activation proof");
    });

    it("QrPrinciples lists all 5 non-negotiable safety principles", () => {
      const principlesContent = fs.readFileSync(
        path.join(landingDir, "QrPrinciples.tsx"),
        "utf8",
      );
      expect(principlesContent).toContain("Scan does not mean ownership");
      expect(principlesContent).toContain(
        "Public ID is not an activation secret",
      );
      expect(principlesContent).toContain(
        "Private data stays behind the projection",
      );
      expect(principlesContent).toContain("An old QR can be cleanly retired");
      expect(principlesContent).toContain(
        "The QR is an information & connection tool",
      );
    });

    it("QrFaq uses native accessible disclosure controls", () => {
      const faqContent = fs.readFileSync(
        path.join(landingDir, "QrFaq.tsx"),
        "utf8",
      );
      expect(faqContent).toContain("<details");
      expect(faqContent).toContain("<summary>");
      expect(faqContent).toContain("questions.map");
      expect(faqContent).toContain("Do I need an account to scan a QR?");
      expect(faqContent).toContain(
        "Does VaahanSafe replace emergency services?",
      );
    });

    it("QrLandingFooter contains the mandatory official 112 / 108 emergency service disclaimer", () => {
      const footerContent = fs.readFileSync(
        path.join(landingDir, "QrLandingFooter.tsx"),
        "utf8",
      );
      expect(footerContent).toContain("Emergency Service Notice");
      expect(footerContent).toContain("112 / 108");
      expect(footerContent).toContain("VaahanSafe Platform");
      expect(footerContent).toContain("Retail Activation");
      expect(footerContent).toContain("System Status");
    });
  });
});
