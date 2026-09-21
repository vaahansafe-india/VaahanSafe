import { describe, it, expect } from "vitest";
import {
  SHIPPING_REPLACEMENT_META,
  REPLACEMENT_POLICY_CONFIG,
  SHIPPING_JOURNEY_STEPS,
  SHIPPING_SECTIONS,
} from "../apps/web/app/shipping-replacement/shipping-replacement-content";

describe("VaahanSafe Shipping & Replacement Policy Content & Architecture", () => {
  it("defines formal shipping policy metadata with draft review status", () => {
    expect(SHIPPING_REPLACEMENT_META.documentId).toBe("DOCUMENT / 04");
    expect(SHIPPING_REPLACEMENT_META.title).toBe("Shipping & Replacement Policy");
    expect(SHIPPING_REPLACEMENT_META.version).toBe("1.0");
    expect(SHIPPING_REPLACEMENT_META.effectiveDate).toBeDefined();
    expect(SHIPPING_REPLACEMENT_META.status).toBe("DRAFT_PENDING_LEGAL_REVIEW");
  });

  it("configures open replacement fee parameters with null defaults", () => {
    expect(REPLACEMENT_POLICY_CONFIG.fee).toBeNull();
    expect(REPLACEMENT_POLICY_CONFIG.freeReplacementConditions).toBeNull();
    expect(REPLACEMENT_POLICY_CONFIG.shippingFee).toBeNull();
  });

  it("contains all 5 signature journey steps in exact sequence", () => {
    expect(SHIPPING_JOURNEY_STEPS).toHaveLength(5);

    const labels = SHIPPING_JOURNEY_STEPS.map((s) => s.label);
    expect(labels).toEqual(["ORDER", "SHIP", "DELIVER", "PLACE", "VEHICLE IDENTITY"]);
  });

  it("contains all 14 semantic shipping sections in exact sequence", () => {
    expect(SHIPPING_SECTIONS).toHaveLength(14);

    const expectedIds = [
      "orders",
      "shipping-information",
      "processing",
      "delivery",
      "tracking",
      "failed-delivery",
      "missing-incorrect",
      "damaged-delivery",
      "lost-qr",
      "damaged-qr",
      "replacement",
      "replacement-identity",
      "fees",
      "contact",
    ];

    SHIPPING_SECTIONS.forEach((section, index) => {
      expect(section.id).toBe(expectedIds[index]);
      expect(section.index).toBe(String(index + 1).padStart(2, "0"));
      expect(section.shortTitle).toBeTruthy();
      expect(section.heading).toBeTruthy();
      expect(section.summary).toBeTruthy();
      expect(section.subsections.length).toBeGreaterThan(0);
    });
  });

  it("articulates that replacement is distinct from refunds", () => {
    const damagedSection = SHIPPING_SECTIONS.find((s) => s.id === "damaged-delivery");
    expect(damagedSection).toBeDefined();

    const contentStr = JSON.stringify(damagedSection);
    expect(contentStr).toContain("generally non-refundable");
    expect(contentStr).toContain("replacement");
  });

  it("articulates that physical QR replacement preserves vehicle identity", () => {
    const identitySection = SHIPPING_SECTIONS.find((s) => s.id === "replacement-identity");
    expect(identitySection).toBeDefined();

    const contentStr = JSON.stringify(identitySection);
    expect(contentStr).toContain("optical gateway");
    expect(contentStr).toContain("digital VaahanSafe vehicle identity");
    expect(contentStr).toContain("prior QR code is permanently revoked");
  });

  it("strictly avoids unverified delivery times, fake fees, and material exaggerations", () => {
    const fullContent = JSON.stringify(SHIPPING_SECTIONS);

    // Banned phrases from prompt invariants
    expect(fullContent).not.toMatch(/3[–-]5\s*business\s*days/i);
    expect(fullContent).not.toMatch(/5[–-]7\s*days/i);
    expect(fullContent).not.toMatch(/delivery\s*within\s*one\s*week/i);
    expect(fullContent).not.toMatch(/₹99\s*replacement/i);
    expect(fullContent).not.toMatch(/free\s*first\s*replacement/i);
    expect(fullContent).not.toMatch(/unlimited\s*replacements/i);
    expect(fullContent).not.toMatch(/waterproof\s*rating/i);
    expect(fullContent).not.toMatch(/heat\s*resistance/i);
  });

  it("includes legal review notes for unresolved fees and delivery cutoffs", () => {
    const sectionsWithReviewNotes = SHIPPING_SECTIONS.filter((s) =>
      s.subsections.some((sub) => sub.legalReviewNote)
    );
    expect(sectionsWithReviewNotes.length).toBeGreaterThan(0);

    const notes = sectionsWithReviewNotes.flatMap((s) =>
      s.subsections.filter((sub) => sub.legalReviewNote).map((sub) => sub.legalReviewNote)
    );

    const joinedNotes = notes.join(" ");
    expect(joinedNotes).toContain("LEGAL REVIEW REQUIRED");
  });
});
