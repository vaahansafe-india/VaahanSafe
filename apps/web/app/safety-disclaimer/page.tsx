import type { Metadata } from "next";
import * as React from "react";

import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { SafetyDisclaimerHero } from "../../components/safety-disclaimer/SafetyDisclaimerHero";
import { SafetyJourneyVisual } from "../../components/safety-disclaimer/SafetyJourneyVisual";
import { SafetyNavigation } from "../../components/safety-disclaimer/SafetyNavigation";
import { MobileSafetyNavigation } from "../../components/safety-disclaimer/MobileSafetyNavigation";
import { SafetySectionView } from "../../components/safety-disclaimer/SafetySectionView";
import { PrimaryDisclaimerCallout } from "../../components/safety-disclaimer/PrimaryDisclaimerCallout";
import { NotReplacementCard } from "../../components/safety-disclaimer/NotReplacementCard";
import { BoundariesTrioCard } from "../../components/safety-disclaimer/BoundariesTrioCard";
import { EmergencyActionStation } from "../../components/safety-disclaimer/EmergencyActionStation";
import { SafetyRelatedDocsStation } from "../../components/safety-disclaimer/SafetyRelatedDocsStation";
import { SafetyDocumentMetaView } from "../../components/safety-disclaimer/SafetyDocumentMetaView";
import { SAFETY_SECTIONS } from "./safety-disclaimer-content";

export const metadata: Metadata = {
  title: "Safety Disclaimer | VaahanSafe",
  description:
    "Learn about the role and limitations of VaahanSafe vehicle QR decals, emergency contact relays, and safety profiles.",
  alternates: {
    canonical: "https://vaahansafe.com/safety-disclaimer",
  },
  openGraph: {
    title: "Safety Disclaimer | VaahanSafe",
    description:
      "Learn about the role and limitations of VaahanSafe vehicle QR decals, emergency contact relays, and safety profiles.",
    url: "https://vaahansafe.com/safety-disclaimer",
    siteName: "VaahanSafe",
    locale: "en_IN",
    type: "website",
  },
};

export default function SafetyDisclaimerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* 01 Site Header */}
      <SiteHeader />

      <main id="main-content">
        {/* 02 Hero */}
        <SafetyDisclaimerHero />

        {/* 03 Signature Journey: SCAN → IDENTIFY → VIEW → CONNECT vs EMERGENCY SERVICES */}
        <SafetyJourneyVisual />

        {/* 04 Mobile Navigation Sheet */}
        <MobileSafetyNavigation sections={SAFETY_SECTIONS} />

        {/* 05 Main Legal Document Layout: Sticky Sidebar + Structured Policy Content */}
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="flex items-start gap-12 lg:gap-16">
            {/* Desktop Sticky Index */}
            <SafetyNavigation sections={SAFETY_SECTIONS} />

            {/* Document Content Column */}
            <div className="min-w-0 max-w-[760px] flex-1">
              {SAFETY_SECTIONS.map((section) => (
                <React.Fragment key={section.id}>
                  <SafetySectionView section={section} />

                  {/* Contextual signature callout for Section 01: Core Role */}
                  {section.id === "core-disclaimer" && <PrimaryDisclaimerCallout />}

                  {/* Contextual signature card for Section 03: 10 Non-Replacements */}
                  {section.id === "what-vaahan-does-not-do" && <NotReplacementCard />}

                  {/* Contextual signature card for Section 10: Three Key Boundaries */}
                  {section.id === "boundaries-matrix" && <BoundariesTrioCard />}
                </React.Fragment>
              ))}

              {/* 06 Primary Emergency Action Station */}
              <EmergencyActionStation />

              {/* 07 Related Legal Architecture Station */}
              <SafetyRelatedDocsStation />

              {/* 08 Document Record & Legal Review Notice */}
              <SafetyDocumentMetaView />
            </div>
          </div>
        </div>
      </main>

      {/* 09 Site Footer */}
      <SiteFooter />
    </div>
  );
}
