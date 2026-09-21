import { describe, it, expect } from "vitest";
import {
  REFUND_POLICY_META,
  REFUND_POLICY_CONFIG,
  BEFORE_YOU_PURCHASE_ITEMS,
  REFUND_SECTIONS,
  COMPARISON_ITEMS,
} from "../apps/web/app/refund-policy/refund-policy-content";

describe("VaahanSafe Refund Policy Content & Architecture", () => {
  it("defines formal refund policy metadata with draft review status", () => {
    expect(REFUND_POLICY_META.documentId).toBe("DOCUMENT / 03");
    expect(REFUND_POLICY_META.title).toBe("Refund Policy");
    expect(REFUND_POLICY_META.version).toBe("1.0");
    expect(REFUND_POLICY_META.effectiveDate).toBeDefined();
    expect(REFUND_POLICY_META.status).toBe("DRAFT_PENDING_LEGAL_REVIEW");
  });

  it("configures the non-refundable general rule with open trigger flags", () => {
    expect(REFUND_POLICY_CONFIG.generalRule.refundable).toBe(false);
    expect(REFUND_POLICY_CONFIG.generalRule.copy).toContain(
      "Completed VaahanSafe purchases are generally non-refundable"
    );
    expect(REFUND_POLICY_CONFIG.nonRefundableTrigger).toBeNull();
    expect(REFUND_POLICY_CONFIG.replacement.handledSeparately).toBe(true);
  });

  it("contains all 4 editorial 'Before You Purchase' understanding rows", () => {
    expect(BEFORE_YOU_PURCHASE_ITEMS).toHaveLength(4);

    const titles = BEFORE_YOU_PURCHASE_ITEMS.map((item) => item.title);
    expect(titles).toContain("PURCHASES");
    expect(titles).toContain("CHECK YOUR ORDER");
    expect(titles).toContain("ORDER PROBLEM");
    expect(titles).toContain("LEGAL RIGHTS");

    BEFORE_YOU_PURCHASE_ITEMS.forEach((item, index) => {
      expect(item.index).toBe(String(index + 1).padStart(2, "0"));
      expect(item.description).toBeTruthy();
    });
  });

  it("contains all 12 semantic refund policy sections in exact sequence", () => {
    expect(REFUND_SECTIONS).toHaveLength(12);

    const expectedIds = [
      "non-refundable-purchases",
      "change-of-mind",
      "order-information",
      "duplicate-payment",
      "failed-payment",
      "cancellation",
      "delivery-issues",
      "damaged-lost-qr",
      "plans-and-services",
      "order-review",
      "legal-rights",
      "contact",
    ];

    REFUND_SECTIONS.forEach((section, index) => {
      expect(section.id).toBe(expectedIds[index]);
      expect(section.index).toBe(String(index + 1).padStart(2, "0"));
      expect(section.shortTitle).toBeTruthy();
      expect(section.heading).toBeTruthy();
      expect(section.summary).toBeTruthy();
      expect(section.subsections.length).toBeGreaterThan(0);
    });
  });

  it("articulates that completed purchases are generally non-refundable", () => {
    const finalSection = REFUND_SECTIONS.find((s) => s.id === "non-refundable-purchases");
    expect(finalSection).toBeDefined();

    const contentStr = JSON.stringify(finalSection);
    expect(contentStr).toContain("generally non-refundable");
    expect(contentStr).toContain("unique, cryptographically isolated locator token");
  });

  it("distinguishes damaged/lost QR decals from cash refunds", () => {
    const damagedSection = REFUND_SECTIONS.find((s) => s.id === "damaged-lost-qr");
    expect(damagedSection).toBeDefined();

    const contentStr = JSON.stringify(damagedSection);
    expect(contentStr).toContain("Damaged QR ≠ Automatic Cash Refund");
    expect(contentStr).toContain("replacement process");
  });

  it("provides a structured 7-item comparison between refund requests and order support", () => {
    expect(COMPARISON_ITEMS).toHaveLength(7);

    const categories = COMPARISON_ITEMS.map((item) => item.category);
    expect(categories).toContain("Change of Mind");
    expect(categories).toContain("Duplicate Payment");
    expect(categories).toContain("Payment Failed");
    expect(categories).toContain("Delivery Problem");
    expect(categories).toContain("Damaged QR in Transit");
    expect(categories).toContain("Lost QR After Receipt");
    expect(categories).toContain("Statutory Requirement");
  });

  it("strictly avoids absolute aggressive phrases and unverified promises", () => {
    const fullContent = JSON.stringify(REFUND_SECTIONS);

    // Banned aggressive phrasing
    expect(fullContent).not.toMatch(/no\s*refunds\s*under\s*any\s*circumstances/i);
    expect(fullContent).not.toMatch(/will\s*never\s*issue\s*a\s*refund/i);
    expect(fullContent).not.toMatch(/money\s*will\s*return\s*in\s*5[–-]7\s*days/i);
    expect(fullContent).not.toMatch(/instant\s*refund/i);
    expect(fullContent).not.toMatch(/100%\s*guaranteed/i);
  });

  it("includes legal review notes for unresolved statutory points", () => {
    const sectionsWithReviewNotes = REFUND_SECTIONS.filter((s) =>
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
