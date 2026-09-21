import { describe, it, expect } from "vitest";
import {
  OFFICIAL_GUIDES,
  getGuideBySlug,
  getAllGuideSlugs,
  calculateReadingTimeMinutes,
} from "../apps/web/lib/documents/official-guides";

describe("Section 15.4 VaahanSafe Documents Reference Library", () => {
  it("defines exactly seven official guide categories in the canonical sequence", () => {
    expect(OFFICIAL_GUIDES).toHaveLength(7);

    const expectedSequence = [
      { number: "01", step: "UNDERSTAND", slug: "product-guide", docId: "DOC / PRODUCT / 01" },
      { number: "02", step: "START", slug: "quick-start", docId: "DOC / START / 02" },
      { number: "03", step: "ACTIVATE", slug: "activation", docId: "DOC / ACTIVATE / 03" },
      { number: "04", step: "PLACE", slug: "qr-placement", docId: "DOC / PLACE / 04" },
      { number: "05", step: "SAFETY", slug: "safety", docId: "DOC / SAFETY / 05" },
      { number: "06", step: "PRIVACY", slug: "privacy", docId: "DOC / PRIVACY / 06" },
      { number: "07", step: "MANAGE", slug: "plans-orders-support", docId: "DOC / SERVICES / 07" },
    ];

    expectedSequence.forEach((expected, idx) => {
      const guide = OFFICIAL_GUIDES[idx];
      expect(guide.number).toBe(expected.number);
      expect(guide.stepName).toBe(expected.step);
      expect(guide.slug).toBe(expected.slug);
      expect(guide.docId).toBe(expected.docId);
    });
  });

  it("ensures all dedicated web route slugs match expectations", () => {
    const slugs = getAllGuideSlugs();
    expect(slugs).toEqual([
      "product-guide",
      "quick-start",
      "activation",
      "qr-placement",
      "safety",
      "privacy",
      "plans-orders-support",
    ]);
  });

  it("forms an unbroken sequential navigation chain (PREVIOUS ← CURRENT ● NEXT →)", () => {
    OFFICIAL_GUIDES.forEach((guide, idx) => {
      if (idx === 0) {
        expect(guide.previousSlug).toBeUndefined();
        expect(guide.nextSlug).toBe(OFFICIAL_GUIDES[idx + 1].slug);
      } else if (idx === OFFICIAL_GUIDES.length - 1) {
        expect(guide.previousSlug).toBe(OFFICIAL_GUIDES[idx - 1].slug);
        expect(guide.nextSlug).toBeUndefined();
      } else {
        expect(guide.previousSlug).toBe(OFFICIAL_GUIDES[idx - 1].slug);
        expect(guide.nextSlug).toBe(OFFICIAL_GUIDES[idx + 1].slug);
      }
    });
  });

  it("verifies Guide 01: Product Guide content and signature diagram", () => {
    const guide = getGuideBySlug("product-guide");
    expect(guide).toBeDefined();
    expect(guide?.title).toBe("VaahanSafe Product Guide");
    expect(guide?.subtitle).toBe("Understand the complete vehicle identity system.");
    expect(guide?.diagram).toContain("PHYSICAL VEHICLE");
    expect(guide?.diagram).toContain("SAFETY VIEW");
    expect(guide?.diagram).toContain("USEFUL CONNECTION");

    const sectionTitles = guide?.sections.map((s) => s.title);
    expect(sectionTitles?.some((t) => t.includes("What is VaahanSafe?"))).toBe(true);
    expect(sectionTitles?.some((t) => t.includes("Vehicle → QR → Identity"))).toBe(true);
    expect(sectionTitles?.some((t) => t.includes("Public Safety View"))).toBe(true);
    expect(sectionTitles?.some((t) => t.includes("Owner Account"))).toBe(true);
    expect(sectionTitles?.some((t) => t.includes("Privacy Controls"))).toBe(true);
    expect(sectionTitles?.some((t) => t.includes("Retail vs Online Acquisition"))).toBe(true);
    expect(sectionTitles?.some((t) => t.includes("Plans and Services"))).toBe(true);
    expect(sectionTitles?.some((t) => t.includes("QR Replacement"))).toBe(true);
    expect(sectionTitles?.some((t) => t.includes("Help and Support"))).toBe(true);
  });

  it("verifies Guide 02: Quick-Start Guide separates Online vs Retail routes", () => {
    const guide = getGuideBySlug("quick-start");
    expect(guide).toBeDefined();
    expect(guide?.title).toBe("VaahanSafe Quick-Start Guide");

    const overviewSection = guide?.sections.find((s) => s.id === "onboarding-overview");
    expect(overviewSection).toBeDefined();
    const subTitles = overviewSection?.subsections?.map((sub) => sub.title);
    expect(subTitles).toContain("Online Acquisition Path");
    expect(subTitles).toContain("Retail Kit Path");
  });

  it("verifies Guide 03: Retail Activation enforces Public QR ≠ Activation Proof", () => {
    const guide = getGuideBySlug("activation");
    expect(guide).toBeDefined();
    expect(guide?.docId).toBe("DOC / ACTIVATE / 03");

    const boundarySection = guide?.sections.find((s) => s.id === "security-boundary");
    expect(boundarySection).toBeDefined();
    expect(boundarySection?.callout?.type).toBe("distinction");
    expect(boundarySection?.callout?.left).toBe("PUBLIC QR");
    expect(boundarySection?.callout?.right).toBe("ACTIVATION PROOF");

    // Must not expose internal crypto / fraud hashes
    const allContent = JSON.stringify(guide);
    expect(allContent).not.toMatch(/bcrypt|sha256|internal_status_transition/i);
  });

  it("verifies Guide 04: QR Placement complies with safety rules without fake ratings", () => {
    const guide = getGuideBySlug("qr-placement");
    expect(guide).toBeDefined();

    const complianceSection = guide?.sections.find((s) => s.id === "safety-compliance");
    expect(complianceSection).toBeDefined();
    expect(complianceSection?.content.some((p) => p.includes("high-security registration plates"))).toBe(true);

    // Assert absence of fake ratings
    const allText = JSON.stringify(guide);
    expect(allText).not.toMatch(/IP68|IP67|100% waterproof guarantee|UV resistant for 10 years/i);
  });

  it("verifies Guide 05: Safety & Emergency Contact establishes crucial medical/dispatch boundaries", () => {
    const guide = getGuideBySlug("safety");
    expect(guide).toBeDefined();

    const distinctionSection = guide?.sections.find((s) => s.id === "vital-distinctions");
    expect(distinctionSection).toBeDefined();
    expect(distinctionSection?.callout?.text).toContain("SAFETY INFORMATION ≠ MEDICAL RECORD");
    expect(distinctionSection?.callout?.text).toContain("CONTACT OPTION ≠ EMERGENCY DISPATCH");

    const boundariesSection = guide?.sections.find((s) => s.id === "no-guarantees");
    expect(boundariesSection).toBeDefined();
    expect(boundariesSection?.content.some((p) => p.includes("hospital or police dispatch"))).toBe(true);
  });

  it("verifies Guide 06: Privacy Guide explains Account ≠ Public Safety View", () => {
    const guide = getGuideBySlug("privacy");
    expect(guide).toBeDefined();

    const accountVsView = guide?.sections.find((s) => s.id === "account-vs-safety-view");
    expect(accountVsView?.callout?.left).toBe("PRIVATE OWNER ACCOUNT");
    expect(accountVsView?.callout?.right).toBe("PUBLIC SAFETY VIEW");

    const alwaysPrivate = guide?.sections.find((s) => s.id === "always-private");
    expect(alwaysPrivate?.content.some((p) => p.includes("residential or commercial home address"))).toBe(true);
    expect(alwaysPrivate?.content.some((p) => p.includes("Aadhaar, PAN"))).toBe(true);
  });

  it("verifies Guide 07: Plans, Orders & Support houses four sub-guides 07A through 07D", () => {
    const guide = getGuideBySlug("plans-orders-support");
    expect(guide).toBeDefined();
    expect(guide?.title).toBe("Plans, Orders & Support");
    expect(guide?.docId).toBe("DOC / SERVICES / 07");

    const sub07a = guide?.sections.find((s) => s.id === "sub-guide-07a");
    expect(sub07a?.title).toContain("07A Plans & Subscriptions");
    expect(sub07a?.callout?.left).toBe("QR IDENTITY");
    expect(sub07a?.callout?.right).toBe("SUBSCRIPTION PLAN");

    const sub07b = guide?.sections.find((s) => s.id === "sub-guide-07b");
    expect(sub07b?.title).toContain("07B Purchase & Refund Guide");
    expect(sub07b?.callout?.text).toContain("NO REFUND DOES NOT MEAN NO SUPPORT");

    const sub07c = guide?.sections.find((s) => s.id === "sub-guide-07c");
    expect(sub07c?.title).toContain("07C Shipping & Courier Guide");

    const sub07d = guide?.sections.find((s) => s.id === "sub-guide-07d");
    expect(sub07d?.title).toContain("07D QR Replacement Guide");
    expect(sub07d?.callout?.left).toBe("DECAL REPLACEMENT");
    expect(sub07d?.callout?.right).toBe("PURCHASE REFUND");
  });

  it("calculates realistic reading times based on real content length", () => {
    OFFICIAL_GUIDES.forEach((guide) => {
      const minutes = calculateReadingTimeMinutes(guide);
      expect(minutes).toBeGreaterThanOrEqual(2);
      expect(minutes).toBeLessThanOrEqual(15);
    });
  });

  it("ensures no fake download buttons or fake PDF urls exist in the guides", () => {
    OFFICIAL_GUIDES.forEach((guide) => {
      const raw = JSON.stringify(guide);
      expect(raw).not.toContain(".pdf");
      expect(raw).not.toMatch(/download\s*pdf/i);
    });
  });
});
