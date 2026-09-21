import { describe, it, expect } from "vitest";
import {
  PRIVACY_POLICY_META,
  POLICY_SECTIONS,
  PRIVACY_CHOICES_ITEMS,
} from "../apps/web/app/privacy/privacy-policy-content";

describe("VaahanSafe Privacy Policy Content & Architecture", () => {
  it("defines formal policy metadata with review status", () => {
    expect(PRIVACY_POLICY_META.documentId).toBe("DOCUMENT / 01");
    expect(PRIVACY_POLICY_META.title).toBe("Privacy Policy");
    expect(PRIVACY_POLICY_META.version).toBeDefined();
    expect(PRIVACY_POLICY_META.effectiveDate).toBeDefined();
    expect(PRIVACY_POLICY_META.status).toBe("DRAFT_PENDING_LEGAL_REVIEW");
  });

  it("contains all 13 semantic policy sections in exact sequence", () => {
    expect(POLICY_SECTIONS).toHaveLength(13);

    const expectedIds = [
      "introduction",
      "information-we-collect",
      "how-we-use-information",
      "safety-view-boundary",
      "qr-activation-privacy",
      "when-information-is-shared",
      "data-retention",
      "security-and-protection",
      "your-choices-and-rights",
      "third-party-services",
      "childrens-privacy",
      "changes-to-policy",
      "contact-and-requests",
    ];

    POLICY_SECTIONS.forEach((section, index) => {
      expect(section.id).toBe(expectedIds[index]);
      expect(section.index).toBe(String(index + 1).padStart(2, "0"));
      expect(section.shortTitle).toBeTruthy();
      expect(section.heading).toBeTruthy();
      expect(section.summary).toBeTruthy();
      expect(section.subsections.length).toBeGreaterThan(0);
    });
  });

  it("enforces the privacy boundary between private account and public safety view", () => {
    const safetySection = POLICY_SECTIONS.find((s) => s.id === "safety-view-boundary");
    expect(safetySection).toBeDefined();
    expect(safetySection?.heading).toContain("The public safety view is not your account");

    const contentStr = JSON.stringify(safetySection);
    expect(contentStr).toContain("isolated and never exposed through the QR resolver");
    expect(contentStr).toContain("qr.vaahansafe.com");
  });

  it("distinguishes public QR locator from activation credentials", () => {
    const activationSection = POLICY_SECTIONS.find((s) => s.id === "qr-activation-privacy");
    expect(activationSection).toBeDefined();
    expect(activationSection?.heading).toContain("Public QR identity vs. Activation credentials");

    const contentStr = JSON.stringify(activationSection);
    expect(contentStr).toContain("does not grant the right to claim");
    expect(contentStr).toContain("concealed");
  });

  it("strictly avoids unsupported security guarantees and marketing hype", () => {
    const fullPolicyContent = JSON.stringify(POLICY_SECTIONS);

    // Banned phrases from product invariants
    expect(fullPolicyContent).not.toMatch(/military[-\s]grade/i);
    expect(fullPolicyContent).not.toMatch(/100%\s*secure/i);
    expect(fullPolicyContent).not.toMatch(/unbreakable/i);
    expect(fullPolicyContent).not.toMatch(/zero\s*leakage/i);
    expect(fullPolicyContent).not.toMatch(/impossible\s*to\s*hack/i);
    expect(fullPolicyContent).not.toMatch(/completely\s*anonymous/i);
  });

  it("provides actionable privacy choices shortcuts", () => {
    expect(PRIVACY_CHOICES_ITEMS.length).toBeGreaterThanOrEqual(5);

    const titles = PRIVACY_CHOICES_ITEMS.map((item) => item.title);
    expect(titles).toContain("Account Information");
    expect(titles).toContain("Public Safety View");
    expect(titles).toContain("Emergency Contacts");
    expect(titles).toContain("Communication Preferences");
    expect(titles).toContain("Account Deletion");
  });

  it("includes legal review flags for counsel review", () => {
    const sectionsWithReviewNotes = POLICY_SECTIONS.filter((s) =>
      s.subsections.some((sub) => sub.legalReviewNote)
    );
    expect(sectionsWithReviewNotes.length).toBeGreaterThan(0);
  });
});
