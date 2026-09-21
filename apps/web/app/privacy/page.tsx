import type { Metadata } from "next";
import * as React from "react";

import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { PrivacyHero } from "../../components/privacy/PrivacyHero";
import { PrivacyBoundaryVisual } from "../../components/privacy/PrivacyBoundaryVisual";
import { PolicyNavigation } from "../../components/privacy/PolicyNavigation";
import { MobilePolicyNavigation } from "../../components/privacy/MobilePolicyNavigation";
import { PolicySectionView } from "../../components/privacy/PolicySectionView";
import { PublicSafetyViewCallout } from "../../components/privacy/PublicSafetyViewCallout";
import { ActivationPrivacyCard } from "../../components/privacy/ActivationPrivacyCard";
import { PrivacyChoicesIndex } from "../../components/privacy/PrivacyChoicesIndex";
import { PrivacyContactStation } from "../../components/privacy/PrivacyContactStation";
import { LegalDocumentMetaView } from "../../components/privacy/LegalDocumentMetaView";
import { POLICY_SECTIONS } from "./privacy-policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy | VaahanSafe",
  description:
    "Learn how VaahanSafe handles information across vehicle identities, accounts, QR activation and public safety views.",
  alternates: {
    canonical: "https://vaahansafe.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy | VaahanSafe",
    description:
      "Learn how VaahanSafe handles information across vehicle identities, accounts, QR activation and public safety views.",
    url: "https://vaahansafe.com/privacy",
    siteName: "VaahanSafe",
    locale: "en_IN",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* 01 Site Header (Reusable thin identity rail) */}
      <SiteHeader />

      <main id="main-content">
        {/* 02 Privacy Hero with Identity Field registration geometry */}
        <PrivacyHero />

        {/* 03 Privacy Boundary: Private Account → Owner Control → Public Safety View */}
        <PrivacyBoundaryVisual />

        {/* 04 Mobile Policy Quick-Jump Sheet */}
        <MobilePolicyNavigation sections={POLICY_SECTIONS} />

        {/* 05 Main Legal Document Layout: Sticky Sidebar + Structured Policy Content */}
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="flex items-start gap-12 lg:gap-16">
            {/* Desktop Sticky Index */}
            <PolicyNavigation sections={POLICY_SECTIONS} />

            {/* Document Content Column */}
            <div className="min-w-0 max-w-[760px] flex-1">
              {POLICY_SECTIONS.map((section) => (
                <React.Fragment key={section.id}>
                  <PolicySectionView section={section} />

                  {/* Contextual signature callout for Section 04: Public Safety View */}
                  {section.id === "safety-view-boundary" && <PublicSafetyViewCallout />}

                  {/* Contextual signature callout for Section 05: Activation Privacy */}
                  {section.id === "qr-activation-privacy" && <ActivationPrivacyCard />}

                  {/* Contextual actionable index for Section 09: User Choices */}
                  {section.id === "your-choices-and-rights" && <PrivacyChoicesIndex />}
                </React.Fragment>
              ))}

              {/* 06 Privacy Contact & Grievance Station */}
              <PrivacyContactStation />

              {/* 07 Document Metadata & Version Record */}
              <LegalDocumentMetaView />
            </div>
          </div>
        </div>
      </main>

      {/* 08 Site Footer (Reusable persistent dark anchor) */}
      <SiteFooter />
    </div>
  );
}
