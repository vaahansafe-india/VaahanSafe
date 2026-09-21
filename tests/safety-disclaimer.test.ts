import { describe, it, expect } from "vitest";
import {
  SAFETY_DISCLAIMER_META,
  SAFETY_JOURNEY_STEPS,
  WHAT_VAAHANSAFE_DOES,
  NON_REPLACEMENT_ENTITIES,
  SAFETY_SECTIONS,
} from "../apps/web/app/safety-disclaimer/safety-disclaimer-content";

describe("VaahanSafe Safety Disclaimer Content & Architecture", () => {
  it("defines formal safety disclaimer metadata with draft review status", () => {
    expect(SAFETY_DISCLAIMER_META.documentId).toBe("DOCUMENT / 05");
    expect(SAFETY_DISCLAIMER_META.title).toBe("Safety Disclaimer");
    expect(SAFETY_DISCLAIMER_META.version).toBe("1.0");
    expect(SAFETY_DISCLAIMER_META.effectiveDate).toBeDefined();
    expect(SAFETY_DISCLAIMER_META.status).toBe("DRAFT_PENDING_LEGAL_REVIEW");
  });

  it("contains all 4 signature journey steps in exact sequence", () => {
    expect(SAFETY_JOURNEY_STEPS).toHaveLength(4);

    const labels = SAFETY_JOURNEY_STEPS.map((s) => s.label);
    expect(labels).toEqual(["SCAN", "IDENTIFY", "VIEW", "CONNECT"]);
  });

  it("defines 4 core capabilities and 10 non-replacement entities", () => {
    expect(WHAT_VAAHANSAFE_DOES).toHaveLength(4);
    const capabilityTitles = WHAT_VAAHANSAFE_DOES.map((c) => c.title);
    expect(capabilityTitles).toEqual(["IDENTIFY", "INFORM", "CONNECT", "CONTROL"]);

    expect(NON_REPLACEMENT_ENTITIES).toHaveLength(10);
    expect(NON_REPLACEMENT_ENTITIES).toContain("Police or Law Enforcement Authorities");
    expect(NON_REPLACEMENT_ENTITIES).toContain("Ambulance Services & Paramedic Responders");
    expect(NON_REPLACEMENT_ENTITIES).toContain("Fire and Rescue Emergency Units");
    expect(NON_REPLACEMENT_ENTITIES).toContain("Hospitals & Urgent Care Facilities");
    expect(NON_REPLACEMENT_ENTITIES).toContain("Doctors & Qualified Medical Professionals");
  });

  it("contains all 12 semantic disclaimer sections in exact sequence", () => {
    expect(SAFETY_SECTIONS).toHaveLength(12);

    const expectedIds = [
      "core-disclaimer",
      "what-vaahan-does",
      "what-vaahan-does-not-do",
      "information-accuracy",
      "blood-group-medical",
      "emergency-contacts",
      "qr-scanning-dependencies",
      "service-availability",
      "placement-condition",
      "boundaries-matrix",
      "user-responsibilities",
      "emergency-action",
    ];

    SAFETY_SECTIONS.forEach((section, index) => {
      expect(section.id).toBe(expectedIds[index]);
      expect(section.index).toBe(String(index + 1).padStart(2, "0"));
      expect(section.shortTitle).toBeTruthy();
      expect(section.heading).toBeTruthy();
      expect(section.summary).toBeTruthy();
      expect(section.subsections.length).toBeGreaterThan(0);
    });
  });

  it("articulates that VaahanSafe is not an emergency response service", () => {
    const coreSection = SAFETY_SECTIONS.find((s) => s.id === "core-disclaimer");
    expect(coreSection).toBeDefined();

    const contentStr = JSON.stringify(coreSection);
    expect(contentStr).toContain("connection tool, not an emergency response service");
    expect(contentStr).toContain("112");
  });

  it("establishes the three structural boundaries", () => {
    const boundarySection = SAFETY_SECTIONS.find((s) => s.id === "boundaries-matrix");
    expect(boundarySection).toBeDefined();

    const contentStr = JSON.stringify(boundarySection);
    expect(contentStr).toContain("Safety Information ≠ Medical Record");
    expect(contentStr).toContain("VaahanSafe Identity ≠ Government Identity");
    expect(contentStr).toContain("Contact Option ≠ Emergency Dispatch");
  });

  it("strictly avoids unsupported life-saving claims and emergency integrations", () => {
    const fullContent = JSON.stringify(SAFETY_SECTIONS);

    // Banned claims from prompt invariants
    expect(fullContent).not.toMatch(/prevents\s*accidents/i);
    expect(fullContent).not.toMatch(/saves\s*lives/i);
    expect(fullContent).not.toMatch(/guaranteed\s*emergency\s*response/i);
    expect(fullContent).not.toMatch(/ambulance\s*integration/i);
    expect(fullContent).not.toMatch(/police\s*integration/i);
    expect(fullContent).not.toMatch(/100%\s*availability/i);
    expect(fullContent).not.toMatch(/every\s*qr\s*always\s*scans/i);
  });

  it("includes legal review notes for medical standards compliance", () => {
    const sectionsWithReviewNotes = SAFETY_SECTIONS.filter((s) =>
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
