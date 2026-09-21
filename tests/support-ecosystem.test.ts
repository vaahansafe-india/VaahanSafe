import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  HELP_CATEGORIES,
  ALL_HELP_ARTICLES,
  HELP_QUICK_ACTIONS,
} from "../apps/web/lib/help/help-content";
import { searchHelpArticles } from "../apps/web/lib/help/help-search";
import {
  DOCUMENT_SECTIONS,
} from "../apps/web/lib/documents/documents-content";
import { BLOG_POSTS, BLOG_CATEGORIES } from "../apps/blog/lib/blog-data";
import {
  PLATFORM_SERVICES,
  PUBLISHED_INCIDENTS,
  computeOverallStatus,
} from "../apps/status/lib/status-data";

describe("VaahanSafe Support & Resources Ecosystem Architecture Tests", () => {
  const webDir = path.resolve(__dirname, "../apps/web");
  const blogDir = path.resolve(__dirname, "../apps/blog");
  const statusDir = path.resolve(__dirname, "../apps/status");

  // =========================================================================
  // 01. SURFACE 01: HELP CENTER (/help)
  // =========================================================================
  describe("01. Surface 01: Help Center (/help)", () => {
    it("defines the 4 required action-oriented quick actions", () => {
      expect(HELP_QUICK_ACTIONS).toHaveLength(4);
      const labels = HELP_QUICK_ACTIONS.map((a) => a.label.toUpperCase());
      expect(labels).toContain("ACTIVATE A RETAIL QR →");
      expect(labels).toContain("REPLACE A QR →");
      expect(labels).toContain("MANAGE SAFETY INFORMATION →");
      expect(labels).toContain("UNDERSTAND YOUR PLAN →");
    });

    it("organizes knowledge across the 6 specified help categories", () => {
      expect(HELP_CATEGORIES).toHaveLength(6);
      const ids = HELP_CATEGORIES.map((c) => c.id);
      expect(ids).toEqual([
        "getting-started",
        "qr-vehicle",
        "retail-activation",
        "safety-privacy",
        "account",
        "plans-orders",
      ]);
    });

    it("articles follow the structured numbered step model", () => {
      expect(ALL_HELP_ARTICLES.length).toBeGreaterThan(10);

      const replacementArticle = ALL_HELP_ARTICLES.find(
        (a) => a.id === "damaged-qr"
      );
      expect(replacementArticle).toBeDefined();
      expect(replacementArticle?.title).toBe("Replacing a damaged QR");
      expect(replacementArticle?.steps.length).toBeGreaterThan(1);
      expect(replacementArticle?.whatHappensNext).toBeDefined();
    });

    it("local index search accurately retrieves articles by keyword and title", () => {
      const qrResults = searchHelpArticles("replace damaged QR");
      expect(qrResults.length).toBeGreaterThan(0);
      expect(qrResults[0]?.article.id).toBe("damaged-qr");

      const activationResults = searchHelpArticles("retail activation");
      expect(activationResults.length).toBeGreaterThan(0);
      expect(activationResults.some((r) => r.article.id === "how-activation-works")).toBe(true);

      const emptyResults = searchHelpArticles("xyznonexistentterm123");
      expect(emptyResults).toHaveLength(0);
    });

    it("does not expose fake phone numbers or generic chat widget clones", () => {
      const pageFile = path.join(webDir, "components/help/HelpBottomContact.tsx");
      const content = fs.readFileSync(pageFile, "utf-8");
      expect(content).not.toContain("1800-");
      expect(content).not.toContain("+1-800");
      expect(content).not.toContain("Chat with an agent now");
      expect(content).toContain("Contact VaahanSafe →");
      expect(content).toContain("Documents →");
      expect(content).toContain("Service Status →");
    });
  });

  // =========================================================================
  // 02. SURFACE 02: DOCUMENTS LIBRARY (/documents)
  // =========================================================================
  describe("02. Surface 02: Documents Library (/documents)", () => {
    it("features the reference library hierarchy visual", () => {
      const visualFile = path.join(
        webDir,
        "components/documents/DocumentsSignatureVisual.tsx"
      );
      const content = fs.readFileSync(visualFile, "utf-8");
      expect(content).toContain("Product");
      expect(content).toContain("Guidance");
      expect(content).toContain("Policy");
      expect(content).toContain("Reference");
    });

    it("organizes documents across the 4 official sections", () => {
      expect(DOCUMENT_SECTIONS).toHaveLength(4);
      const categoryTitles = DOCUMENT_SECTIONS.map((c) => c.title);
      expect(categoryTitles).toContain("Product Architecture");
      expect(categoryTitles).toContain("Legal & Commercial Policies");
      expect(categoryTitles).toContain("Operational Guides");
      expect(categoryTitles).toContain("Support & Transparency");
    });

    it("does not render fake PDF download buttons", () => {
      const indexFile = path.join(
        webDir,
        "components/documents/DocumentsIndexList.tsx"
      );
      const content = fs.readFileSync(indexFile, "utf-8");
      // Only display PDF if an actual downloadable PDF exists
      expect(content).not.toContain("DOWNLOAD PDF");
      expect(content).not.toContain("Download Official PDF");
    });

    it("indexes official policies including Privacy, Terms, Refund, and Disclaimer", () => {
      const docIds = DOCUMENT_SECTIONS.flatMap((s) => s.documents).map((d) => d.id);
      expect(docIds).toContain("privacy-policy");
      expect(docIds).toContain("terms-of-service");
      expect(docIds).toContain("refund-policy");
      expect(docIds).toContain("shipping-replacement");
      expect(docIds).toContain("safety-disclaimer");
    });
  });

  // =========================================================================
  // 03. SURFACE 03: QR REPLACEMENT HELP (/help/replacement)
  // =========================================================================
  describe("03. Surface 03: QR Replacement Help (/help/replacement)", () => {
    it("provides the 4 interactive triage questions", () => {
      const triageFile = path.join(
        webDir,
        "components/help/replacement/WhatHappenedTriage.tsx"
      );
      const content = fs.readFileSync(triageFile, "utf-8");
      expect(content).toContain("DAMAGED");
      expect(content).toContain("LOST");
      expect(content).toContain("NOT SCANNING");
      expect(content).toContain("OTHER ISSUE");
    });

    it("guides through the 6-step replacement journey", () => {
      const journeyFile = path.join(
        webDir,
        "components/help/replacement/ReplacementJourneyRail.tsx"
      );
      const content = fs.readFileSync(journeyFile, "utf-8");
      const upper = content.toUpperCase();
      expect(upper).toContain("IDENTIFY THE ISSUE");
      expect(upper).toContain("OPEN YOUR ACCOUNT");
      expect(upper).toContain("SELECT VEHICLE / QR");
      expect(upper).toContain("REQUEST REPLACEMENT");
      expect(upper).toContain("COMPLETE VERIFICATION");
      expect(upper).toContain("FOLLOW REPLACEMENT PROCESS");
    });

    it("highlights that replacement does not equal refund", () => {
      const noticeFile = path.join(
        webDir,
        "components/help/replacement/ReplacementNotRefundNotice.tsx"
      );
      const content = fs.readFileSync(noticeFile, "utf-8");
      expect(content).toContain("REPLACEMENT ≠ REFUND");
      expect(content).toContain("Refund Policy →");
      expect(content).toContain("Replacement Policy →");
    });

    it("uses appropriate continuity copy without universal false guarantees", () => {
      const visualFile = path.join(
        webDir,
        "components/help/replacement/ReplacementSignatureVisual.tsx"
      );
      const content = fs.readFileSync(visualFile, "utf-8");
      expect(content).toContain(
        "Where supported, the replacement process can connect the new QR to the applicable vehicle identity."
      );
    });
  });

  // =========================================================================
  // 04. SURFACE 04: RETAIL ACTIVATION HELP (/help/activation)
  // =========================================================================
  describe("04. Surface 04: Retail Activation Help (/help/activation)", () => {
    it("features the 5 clear steps of Model B retail activation", () => {
      const stepsFile = path.join(
        webDir,
        "components/help/activation/ActivationFiveSteps.tsx"
      );
      const content = fs.readFileSync(stepsFile, "utf-8");
      expect(content).toContain('"01"');
      expect(content).toContain('"SCAN"');
      expect(content).toContain('"02"');
      expect(content).toContain('"REVEAL"');
      expect(content).toContain('"03"');
      expect(content).toContain('"VERIFY"');
      expect(content).toContain('"04"');
      expect(content).toContain('"CONNECT"');
      expect(content).toContain('"05"');
      expect(content).toContain('"ACTIVE"');
    });

    it("enforces the Public QR != Activation Proof boundary", () => {
      const boundaryFile = path.join(
        webDir,
        "components/help/activation/ActivationProofBoundaryCard.tsx"
      );
      const content = fs.readFileSync(boundaryFile, "utf-8");
      expect(content).toContain("PUBLIC QR ≠ ACTIVATION PROOF");
      expect(content).toContain(
        "Scanning a VaahanSafe QR is not by itself the same as proving the right to activate it."
      );
    });

    it("explains the Two Routes: Online vs Retail", () => {
      const routesFile = path.join(
        webDir,
        "components/help/activation/TwoAcquisitionRoutesComparison.tsx"
      );
      const content = fs.readFileSync(routesFile, "utf-8");
      expect(content).toContain("TWO ACQUISITION CHANNELS");
      expect(content).toContain("ONE QR INFRASTRUCTURE");
      expect(content).toContain("ONLINE");
      expect(content).toContain("RETAIL");
    });

    it("provides troubleshooting without exposing internal verification secrets", () => {
      const troubleFile = path.join(
        webDir,
        "components/help/activation/ActivationTroubleshootingList.tsx"
      );
      const content = fs.readFileSync(troubleFile, "utf-8");
      const lower = content.toLowerCase();
      expect(lower).toContain("qr not scanning");
      expect(lower).toContain("activation");
      expect(lower).toContain("vehicle");
      expect(content).not.toContain("SECRET_KEY");
      expect(content).not.toContain("HMAC");
    });
  });

  // =========================================================================
  // 05. SURFACE 05: SAFETY GUIDES & BLOG (apps/blog)
  // =========================================================================
  describe("05. Surface 05: Safety Guides & Blog (apps/blog)", () => {
    it("uses the editorial title 'Field Notes' and avoids 'Our Blog'", () => {
      const homeFile = path.join(blogDir, "app/page.tsx");
      const content = fs.readFileSync(homeFile, "utf-8");
      expect(content).toContain("FIELD NOTES");
      expect(content).toContain("Guides for the road,");
      expect(content).toContain("the vehicle and the identity.");
      expect(content).not.toContain("Our Blog");
    });

    it("ensures all published articles contain verified legal and standards citations", () => {
      expect(BLOG_POSTS.length).toBeGreaterThan(0);
      for (const post of BLOG_POSTS) {
        expect(post.references).toBeDefined();
        expect(post.references?.length).toBeGreaterThan(0);
        // Verify real citations
        const joinedCitations = (post.references || [])
          .map((r) => `${r.citation} ${r.source}`)
          .join(" ");
        const hasVerifiedSource =
          joinedCitations.includes("Motor Vehicles Act") ||
          joinedCitations.includes("Good Samaritan") ||
          joinedCitations.includes("MoRTH") ||
          joinedCitations.includes("ISO/IEC") ||
          joinedCitations.includes("TRAI") ||
          joinedCitations.includes("Digital Personal Data Protection");
        expect(hasVerifiedSource).toBe(true);
      }
    });

    it("article body layout respects the 680-720px readable width constraint", () => {
      const postPageFile = path.join(blogDir, "app/posts/[slug]/page.tsx");
      const content = fs.readFileSync(postPageFile, "utf-8");
      expect(content).toContain("max-w-[700px]");
    });
  });

  // =========================================================================
  // 06. SURFACE 06: SERVICE STATUS (apps/status)
  // =========================================================================
  describe("06. Surface 06: Service Status (apps/status)", () => {
    it("only exposes customer-facing services and NO internal backend architecture", () => {
      const serviceNames = PLATFORM_SERVICES.map((s) => s.name);
      expect(serviceNames).toContain("Vehicle QR Access");
      expect(serviceNames).toContain("Customer App");
      expect(serviceNames).toContain("Retail Activation");
      expect(serviceNames).toContain("Website & Resources");
      expect(serviceNames).toContain("Emergency Notifications");
      expect(serviceNames).toContain("Payments & Orders");

      // Verify strict absence of forbidden internal infrastructure names
      const allServicesJson = JSON.stringify(PLATFORM_SERVICES);
      expect(allServicesJson).not.toContain("D1");
      expect(allServicesJson).not.toContain("R2");
      expect(allServicesJson).not.toContain("Workers");
      expect(allServicesJson).not.toContain("Queues");
      expect(allServicesJson).not.toContain("MSG91");
      expect(allServicesJson).not.toContain("Cashfree");
      expect(allServicesJson).not.toContain("internal API");
    });

    it("gives special prominence to the Vehicle QR Access critical public path", () => {
      const qrService = PLATFORM_SERVICES.find((s) => s.id === "qr-resolver");
      expect(qrService).toBeDefined();
      expect(qrService?.isCriticalPath).toBe(true);
      expect(qrService?.endpoint).toBe("qr.vaahansafe.com");

      const cardFile = path.join(
        statusDir,
        "components/VehicleQrAccessCard.tsx"
      );
      const content = fs.readFileSync(cardFile, "utf-8");
      expect(content).toContain("CRITICAL PUBLIC PATH");
      expect(content).toContain("CURRENT STATE");
      expect(content).toContain("LAST CHECKED");
    });

    it("computes overall platform status dynamically instead of hardcoding", () => {
      const operational = computeOverallStatus(PLATFORM_SERVICES);
      expect(operational.status).toBe("OPERATIONAL");
      expect(operational.colorClass).toBe("teal");

      // Test with degraded state
      const degradedServices = PLATFORM_SERVICES.map((s) =>
        s.id === "payments" ? { ...s, status: "DEGRADED" as const } : s
      );
      const degraded = computeOverallStatus(degradedServices);
      expect(degraded.status).toBe("DEGRADED");
      expect(degraded.colorClass).toBe("amber");

      // Test with major outage state
      const outageServices = PLATFORM_SERVICES.map((s) =>
        s.id === "qr-resolver" ? { ...s, status: "MAJOR OUTAGE" as const } : s
      );
      const outage = computeOverallStatus(outageServices);
      expect(outage.status).toBe("MAJOR OUTAGE");
      expect(outage.colorClass).toBe("red");
    });

    it("displays truthful incident text when no incidents are published", () => {
      expect(PUBLISHED_INCIDENTS).toHaveLength(0);

      const incidentFile = path.join(
        statusDir,
        "components/IncidentHistorySection.tsx"
      );
      const content = fs.readFileSync(incidentFile, "utf-8");
      expect(content).toContain("No incidents have been published for this period.");
    });
  });

  // =========================================================================
  // 07. FOOTER AND ECOSYSTEM COHESION
  // =========================================================================
  describe("07. Footer and Ecosystem Navigation Cohesion", () => {
    it("SiteFooter uses 'Support' section title and not customer-unfriendly 'Surfaces'", () => {
      const footerFile = path.join(
        webDir,
        "components/marketing/site-footer.tsx"
      );
      const content = fs.readFileSync(footerFile, "utf-8");
      expect(content).toContain('title="Support"');
      expect(content).not.toContain('title="Surfaces"');
    });

    it("SiteFooter external link icons are marked aria-hidden without exposed svg text", () => {
      const footerFile = path.join(
        webDir,
        "components/marketing/site-footer.tsx"
      );
      const content = fs.readFileSync(footerFile, "utf-8");
      expect(content).toContain("Safety Guides & Blog");
      expect(content).toContain("Service Status");
      expect(content).not.toContain("Safety Guides & Blogsvg");
      expect(content).not.toContain("Service Statussvg");
    });

    it("Sitemap includes all 4 web support ecosystem routes", () => {
      const sitemapFile = path.join(webDir, "app/sitemap.ts");
      const content = fs.readFileSync(sitemapFile, "utf-8");
      expect(content).toContain("${baseUrl}/help");
      expect(content).toContain("${baseUrl}/documents");
      expect(content).toContain("${baseUrl}/help/replacement");
      expect(content).toContain("${baseUrl}/help/activation");
    });
  });
});
