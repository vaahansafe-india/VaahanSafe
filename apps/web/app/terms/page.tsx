import type { Metadata } from "next";
import * as React from "react";

import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { TermsHero } from "../../components/terms/TermsHero";
import { TermsRelationshipModel } from "../../components/terms/TermsRelationshipModel";
import { ImportantUnderstandingCard } from "../../components/terms/ImportantUnderstandingCard";
import { TermsNavigation } from "../../components/terms/TermsNavigation";
import { MobileTermsNavigation } from "../../components/terms/MobileTermsNavigation";
import { TermsSectionView } from "../../components/terms/TermsSectionView";
import { IdentityTermsCallout } from "../../components/terms/IdentityTermsCallout";
import { ActivationTermsCallout } from "../../components/terms/ActivationTermsCallout";
import { SafetyViewTermsCallout } from "../../components/terms/SafetyViewTermsCallout";
import { PlanRelationshipCard } from "../../components/terms/PlanRelationshipCard";
import { ReplacementLifecycleCard } from "../../components/terms/ReplacementLifecycleCard";
import { SafetyDisclaimerNotice } from "../../components/terms/SafetyDisclaimerNotice";
import { TermsContactStation } from "../../components/terms/TermsContactStation";
import { TermsDocumentMetaView } from "../../components/terms/TermsDocumentMetaView";
import { TERMS_SECTIONS } from "./terms-content";

export const metadata: Metadata = {
  title: "Terms of Service | VaahanSafe",
  description:
    "Read the terms that apply to VaahanSafe accounts, vehicle identities, QR activation, services and related purchases.",
  alternates: {
    canonical: "https://vaahansafe.com/terms",
  },
  openGraph: {
    title: "Terms of Service | VaahanSafe",
    description:
      "Read the terms that apply to VaahanSafe accounts, vehicle identities, QR activation, services and related purchases.",
    url: "https://vaahansafe.com/terms",
    siteName: "VaahanSafe",
    locale: "en_IN",
    type: "website",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* 01 Site Header (Reusable thin identity rail) */}
      <SiteHeader />

      <main id="main-content">
        {/* 02 Terms Hero with Identity Field registration geometry */}
        <TermsHero />

        {/* 03 Signature Terms Relationship Model: USER → ACCOUNT → VEHICLE → IDENTITY → SERVICES */}
        <TermsRelationshipModel />

        {/* 04 Editorial Overview: A few things to understand first */}
        <ImportantUnderstandingCard />

        {/* 05 Mobile Terms Quick-Jump Sheet */}
        <MobileTermsNavigation sections={TERMS_SECTIONS} />

        {/* 06 Main Legal Document Layout: Sticky Sidebar + Structured Terms Content */}
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="flex items-start gap-12 lg:gap-16">
            {/* Desktop Sticky Index */}
            <TermsNavigation sections={TERMS_SECTIONS} />

            {/* Document Content Column */}
            <div className="min-w-0 max-w-[760px] flex-1">
              {TERMS_SECTIONS.map((section) => (
                <React.Fragment key={section.id}>
                  <TermsSectionView section={section} />

                  {/* Contextual signature callout for Section 04: Vehicle Identity */}
                  {section.id === "vehicle-identity" && <IdentityTermsCallout />}

                  {/* Contextual signature callout for Section 05: QR Activation */}
                  {section.id === "qr-activation" && <ActivationTermsCallout />}

                  {/* Contextual signature callout for Section 06: Safety View */}
                  {section.id === "safety-view" && <SafetyViewTermsCallout />}

                  {/* Contextual signature callout for Section 08: Plans & Subscriptions */}
                  {section.id === "plans-and-subscriptions" && <PlanRelationshipCard />}

                  {/* Contextual signature callout for Section 11: Decal Replacement */}
                  {section.id === "replacement" && <ReplacementLifecycleCard />}

                  {/* Contextual signature notice for Section 15: Emergency Disclaimer */}
                  {section.id === "emergency-disclaimer" && <SafetyDisclaimerNotice />}
                </React.Fragment>
              ))}

              {/* 07 Terms Contact & Grievance Station */}
              <TermsContactStation />

              {/* 08 Document Record & Legal Review Notice */}
              <TermsDocumentMetaView />
            </div>
          </div>
        </div>
      </main>

      {/* 09 Site Footer (Reusable persistent dark anchor) */}
      <SiteFooter />
    </div>
  );
}
