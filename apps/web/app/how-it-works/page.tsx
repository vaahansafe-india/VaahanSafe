import type { Metadata } from "next";
import * as React from "react";

import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { HowItWorksHero } from "../../components/how-it-works/HowItWorksHero";
import { VehiclePhysicalStart } from "../../components/how-it-works/VehiclePhysicalStart";
import { StickerDoorwaySection } from "../../components/how-it-works/StickerDoorwaySection";
import { ScanMomentSection } from "../../components/how-it-works/ScanMomentSection";
import { IdentityUsefulSection } from "../../components/how-it-works/IdentityUsefulSection";
import { SafetyViewPresentation } from "../../components/how-it-works/SafetyViewPresentation";
import { PrivacyBoundaryFlow } from "../../components/how-it-works/PrivacyBoundaryFlow";
import { TwoWaysToBegin } from "../../components/how-it-works/TwoWaysToBegin";
import { OwnerExperienceArtifact } from "../../components/how-it-works/OwnerExperienceArtifact";
import { QrVsPlanDistinction } from "../../components/how-it-works/QrVsPlanDistinction";
import { ReplacementContinuityFlow } from "../../components/how-it-works/ReplacementContinuityFlow";
import { HowItWorksFinalCta } from "../../components/how-it-works/HowItWorksFinalCta";

export const metadata: Metadata = {
  title: "How It Works | VaahanSafe",
  description:
    "Explore the complete VaahanSafe product journey from vehicle decal placement to scannable roadside emergency connection.",
  alternates: {
    canonical: "https://vaahansafe.com/how-it-works",
  },
  openGraph: {
    title: "How It Works | VaahanSafe",
    description:
      "Explore the complete VaahanSafe product journey from vehicle decal placement to scannable roadside emergency connection.",
    url: "https://vaahansafe.com/how-it-works",
    siteName: "VaahanSafe",
    locale: "en_IN",
    type: "website",
  },
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* 01 Site Navigation Rail */}
      <SiteHeader />

      <main id="main-content">
        {/* 02 Hero & Master Sequence Rail */}
        <HowItWorksHero />

        {/* 03 Section 02 — Start with the Physical Vehicle */}
        <VehiclePhysicalStart />

        {/* 04 Section 03 — The QR Decal Specimen */}
        <StickerDoorwaySection />

        {/* 05 Section 04 — The Roadside Scan Moment */}
        <ScanMomentSection />

        {/* 06 Section 05 — The Persistent Identity Record */}
        <IdentityUsefulSection />

        {/* 07 Section 06 — Controlled Safety View Presentation */}
        <SafetyViewPresentation />

        {/* 08 Section 07 — Privacy Boundary & Controls */}
        <PrivacyBoundaryFlow />

        {/* 09 Section 08 — Two Ways to Begin (Online & Retail) */}
        <TwoWaysToBegin />

        {/* 10 Section 09 — Customer Portal Governance */}
        <OwnerExperienceArtifact />

        {/* 11 Section 10 — QR Identity vs Subscription Plan */}
        <QrVsPlanDistinction />

        {/* 12 Section 11 — Physical Decal Replacement & Identity Continuity */}
        <ReplacementContinuityFlow />

        {/* 13 Final CTA Station */}
        <HowItWorksFinalCta />
      </main>

      {/* 14 Unified Site Footer */}
      <SiteFooter />
    </div>
  );
}
