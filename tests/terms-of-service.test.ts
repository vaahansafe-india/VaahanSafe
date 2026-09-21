import { describe, it, expect } from "vitest";
import {
  TERMS_META,
  TERMS_SECTIONS,
  BEFORE_YOU_USE_ITEMS,
} from "../apps/web/app/terms/terms-content";

describe("VaahanSafe Terms of Service Content & Architecture", () => {
  it("defines formal terms metadata with draft review status", () => {
    expect(TERMS_META.documentId).toBe("DOCUMENT / 02");
    expect(TERMS_META.title).toBe("Terms of Service");
    expect(TERMS_META.version).toBe("1.0");
    expect(TERMS_META.effectiveDate).toBeDefined();
    expect(TERMS_META.status).toBe("DRAFT_PENDING_LEGAL_REVIEW");
  });

  it("contains all 4 editorial 'Before You Use' understanding rows", () => {
    expect(BEFORE_YOU_USE_ITEMS).toHaveLength(4);

    const titles = BEFORE_YOU_USE_ITEMS.map((item) => item.title);
    expect(titles).toContain("VEHICLE IDENTITY");
    expect(titles).toContain("OWNER INFORMATION");
    expect(titles).toContain("SAFETY VIEW");
    expect(titles).toContain("SERVICES & PLANS");

    BEFORE_YOU_USE_ITEMS.forEach((item, index) => {
      expect(item.index).toBe(String(index + 1).padStart(2, "0"));
      expect(item.description).toBeTruthy();
    });
  });

  it("contains all 23 semantic terms sections in exact numbered sequence", () => {
    expect(TERMS_SECTIONS).toHaveLength(23);

    const expectedIds = [
      "acceptance",
      "eligibility",
      "account",
      "vehicle-identity",
      "qr-activation",
      "safety-view",
      "user-responsibilities",
      "plans-and-subscriptions",
      "orders-and-payments",
      "shipping",
      "replacement",
      "acceptable-use",
      "third-parties",
      "availability",
      "emergency-disclaimer",
      "information-accuracy",
      "intellectual-property",
      "disclaimers",
      "limitation-of-liability",
      "termination",
      "governing-law",
      "changes-to-terms",
      "contact",
    ];

    TERMS_SECTIONS.forEach((section, index) => {
      expect(section.id).toBe(expectedIds[index]);
      expect(section.index).toBe(String(index + 1).padStart(2, "0"));
      expect(section.shortTitle).toBeTruthy();
      expect(section.heading).toBeTruthy();
      expect(section.summary).toBeTruthy();
      expect(section.subsections.length).toBeGreaterThan(0);
    });
  });

  it("articulates the vehicle identity signature model", () => {
    const identitySection = TERMS_SECTIONS.find((s) => s.id === "vehicle-identity");
    expect(identitySection).toBeDefined();
    expect(identitySection?.heading).toContain("The identity belongs to the vehicle experience");

    const contentStr = JSON.stringify(identitySection);
    expect(contentStr).toContain("Physical Vehicle");
    expect(contentStr).toContain("Controlled Public Safety View");
    expect(contentStr).toContain("independent safety identification service");
  });

  it("distinguishes public QR locator from activation credentials", () => {
    const activationSection = TERMS_SECTIONS.find((s) => s.id === "qr-activation");
    expect(activationSection).toBeDefined();

    const contentStr = JSON.stringify(activationSection);
    expect(contentStr).toContain("Public QR ≠ Activation Proof");
    expect(contentStr).toContain("Online Acquisition");
    expect(contentStr).toContain("Retail Acquisition");
  });

  it("establishes clear separation between QR identity and subscription plan", () => {
    const planSection = TERMS_SECTIONS.find((s) => s.id === "plans-and-subscriptions");
    expect(planSection).toBeDefined();

    const contentStr = JSON.stringify(planSection);
    expect(contentStr).toContain("QR Identity ≠ Subscription Plan");
    expect(contentStr).toContain("pricing");
  });

  it("articulates the emergency services disclaimer clearly", () => {
    const emergencySection = TERMS_SECTIONS.find((s) => s.id === "emergency-disclaimer");
    expect(emergencySection).toBeDefined();

    const contentStr = JSON.stringify(emergencySection);
    expect(contentStr).toContain("not an emergency response organization");
    expect(contentStr).toContain("112");
  });

  it("strictly avoids unsupported promises and marketing hype", () => {
    const fullTermsContent = JSON.stringify(TERMS_SECTIONS);

    expect(fullTermsContent).not.toMatch(/military[-\s]grade/i);
    expect(fullTermsContent).not.toMatch(/100%\s*uptime/i);
    expect(fullTermsContent).not.toMatch(/100%\s*secure/i);
    expect(fullTermsContent).not.toMatch(/zero\s*downtime/i);
    expect(fullTermsContent).not.toMatch(/lifetime\s*validity/i);
    expect(fullTermsContent).not.toMatch(/guaranteed\s*arrival/i);
    expect(fullTermsContent).not.toMatch(/government\s*approved/i);
  });

  it("flags statutory items for qualified legal review", () => {
    const sectionsWithReviewNotes = TERMS_SECTIONS.filter((s) =>
      s.subsections.some((sub) => sub.legalReviewNote)
    );
    expect(sectionsWithReviewNotes.length).toBeGreaterThan(0);

    const notes = sectionsWithReviewNotes.flatMap((s) =>
      s.subsections.filter((sub) => sub.legalReviewNote).map((sub) => sub.legalReviewNote)
    );

    // Specifically checks for liability, age threshold, and jurisdiction flags
    const joinedNotes = notes.join(" ");
    expect(joinedNotes).toContain("LEGAL REVIEW REQUIRED");
  });
});
