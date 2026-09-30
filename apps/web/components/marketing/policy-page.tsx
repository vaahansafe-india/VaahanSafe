import { publicPolicies } from "../../lib/policy-content";
import { LegalDocument } from "./legal-document";

export function PolicyPage({ policy }: { policy: keyof typeof publicPolicies }) {
  const content = publicPolicies[policy];
  const sections = content.sections.map((section, index) => ({
    index: String(index + 1).padStart(2, "0"),
    id: section.id,
    shortTitle: section.title,
    heading: section.title,
    summary: section.summary,
    subsections: [{ id: `${section.id}-detail`, title: "", paragraphs: section.paragraphs, bulletPoints: "points" in section ? section.points : undefined }],
  }));
  return <LegalDocument title={content.title} subtitle={content.description} status="DRAFT_PENDING_LEGAL_REVIEW" updated="September 30, 2026" sections={sections} overview={{ text: content.overview, points: content.highlights }} />;
}
