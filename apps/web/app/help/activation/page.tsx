import type { Metadata } from "next";
import { SiteHeader } from "../../../components/marketing/site-header";
import { SiteFooter } from "../../../components/marketing/site-footer";
import { RetailActivationHero } from "../../../components/help/activation/RetailActivationHero";
import { PhysicalRetailSpecimen } from "../../../components/help/activation/PhysicalRetailSpecimen";
import { ActivationFiveSteps } from "../../../components/help/activation/ActivationFiveSteps";
import { ActivationProofBoundaryCard } from "../../../components/help/activation/ActivationProofBoundaryCard";
import { TwoAcquisitionRoutesComparison } from "../../../components/help/activation/TwoAcquisitionRoutesComparison";
import { ActivationTroubleshootingList } from "../../../components/help/activation/ActivationTroubleshootingList";

export const metadata: Metadata = {
  title: "Retail QR Activation Help | VaahanSafe",
  description:
    "Learn how to activate a pre-issued VaahanSafe retail QR kit purchased from a dealership or automotive store. Complete 5-step verification walkthrough.",
  openGraph: {
    title: "Retail QR Activation Help — VaahanSafe",
    description:
      "Learn how to activate a pre-issued VaahanSafe retail QR kit purchased from a dealership or automotive store.",
    url: "https://vaahansafe.com/help/activation",
    type: "website",
  },
  alternates: {
    canonical: "https://vaahansafe.com/help/activation",
  },
};

export default function RetailActivationHelpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "VaahanSafe Retail QR Activation Guide",
    description:
      "Step-by-step guidance for activating pre-issued retail vehicle QR decals.",
    url: "https://vaahansafe.com/help/activation",
    publisher: {
      "@type": "Organization",
      name: "VaahanSafe",
      url: "https://vaahansafe.com",
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* 01 Hero */}
        <RetailActivationHero />

        {/* 02 Pack Inspection Specimen */}
        <PhysicalRetailSpecimen />

        {/* 03 5-Step Process */}
        <ActivationFiveSteps />

        {/* 04 Verification Proof Boundary */}
        <ActivationProofBoundaryCard />

        {/* 05 Two Acquisition Channels Comparison */}
        <TwoAcquisitionRoutesComparison />

        {/* 06 Troubleshooting Diagnostics */}
        <ActivationTroubleshootingList />
      </main>

      <SiteFooter />
    </div>
  );
}
