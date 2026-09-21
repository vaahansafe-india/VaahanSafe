import type { Metadata } from "next";
import * as React from "react";

import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { SafetyProductHero } from "../../components/safety/SafetyProductHero";
import { ScanBoundarySignature } from "../../components/safety/ScanBoundarySignature";
import { PrivateInformationSection } from "../../components/safety/PrivateInformationSection";
import { ControlledInformationSection } from "../../components/safety/ControlledInformationSection";
import { PublicSafetyViewDemo } from "../../components/safety/PublicSafetyViewDemo";
import { ThreeEntitiesDistinction } from "../../components/safety/ThreeEntitiesDistinction";
import { ActivationProofBoundary } from "../../components/safety/ActivationProofBoundary";
import { UserProvidedAdvisoryCard } from "../../components/safety/UserProvidedAdvisoryCard";
import { OwnerControlsFlow } from "../../components/safety/OwnerControlsFlow";
import { SafetyTrustPrinciples } from "../../components/safety/SafetyTrustPrinciples";
import { SafetyLegalLinksStation } from "../../components/safety/SafetyLegalLinksStation";
import { SafetyProductFinalCta } from "../../components/safety/SafetyProductFinalCta";

export const metadata: Metadata = {
  title: "Safety & Privacy | VaahanSafe",
  description:
    "Learn how VaahanSafe protects personal vehicle data through owner-controlled projection and strict privacy boundaries.",
  alternates: {
    canonical: "https://vaahansafe.com/safety",
  },
  openGraph: {
    title: "Safety & Privacy | VaahanSafe",
    description:
      "Learn how VaahanSafe protects personal vehicle data through owner-controlled projection and strict privacy boundaries.",
    url: "https://vaahansafe.com/safety",
    siteName: "VaahanSafe",
    locale: "en_IN",
    type: "website",
  },
};

export default function SafetyProductPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* 01 Site Navigation Rail */}
      <SiteHeader />

      <main id="main-content">
        {/* 02 Hero Section */}
        <SafetyProductHero />

        {/* 03 Section 02 — Signature Boundary */}
        <ScanBoundarySignature />

        {/* 04 Section 03 — Private Information Tier */}
        <PrivateInformationSection />

        {/* 05 Section 04 — Controlled Information Tier */}
        <ControlledInformationSection />

        {/* 06 Section 05 — Public Safety View Projection */}
        <PublicSafetyViewDemo />

        {/* 07 Section 06 — Three Distinct Entities */}
        <ThreeEntitiesDistinction />

        {/* 08 Section 07 — Public QR ≠ Activation Proof */}
        <ActivationProofBoundary />

        {/* 09 Section 08 — User-Provided Advisory */}
        <UserProvidedAdvisoryCard />

        {/* 10 Section 09 — Owner Controls Workflow */}
        <OwnerControlsFlow />

        {/* 11 Section 10 — Four Trust Principles */}
        <SafetyTrustPrinciples />

        {/* 12 Section 11 — Legal Bridges */}
        <SafetyLegalLinksStation />

        {/* 13 Section 12 — Final CTA */}
        <SafetyProductFinalCta />
      </main>

      {/* 14 Unified Site Footer */}
      <SiteFooter />
    </div>
  );
}
