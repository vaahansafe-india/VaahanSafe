import type { Metadata } from "next";
import { SiteHeader } from "../../../components/marketing/site-header";
import { SiteFooter } from "../../../components/marketing/site-footer";
import { ReplacementHelpHero } from "../../../components/help/replacement/ReplacementHelpHero";
import { WhatHappenedTriage } from "../../../components/help/replacement/WhatHappenedTriage";
import { ReplacementJourneyRail } from "../../../components/help/replacement/ReplacementJourneyRail";
import { ReplacementSignatureVisual } from "../../../components/help/replacement/ReplacementSignatureVisual";
import { ReplacementNotRefundNotice } from "../../../components/help/replacement/ReplacementNotRefundNotice";
import { ReplacementCtaSection } from "../../../components/help/replacement/ReplacementCtaSection";

export const metadata: Metadata = {
  title: "QR Replacement Help | VaahanSafe",
  description:
    "Find guidance if your VaahanSafe vehicle QR is damaged, lost, or otherwise unusable. Learn how identity continuity and replacement requests work.",
  openGraph: {
    title: "VaahanSafe QR Replacement Help — Identity Continuity",
    description:
      "Find guidance if your VaahanSafe vehicle QR is damaged, lost, or otherwise unusable.",
    url: "https://vaahansafe.com/help/replacement",
    type: "website",
  },
  alternates: {
    canonical: "https://vaahansafe.com/help/replacement",
  },
};

export default function ReplacementHelpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "VaahanSafe QR Replacement Guide",
    description:
      "Task-focused resolution guide for damaged, lost, or unreadable vehicle QR decals.",
    url: "https://vaahansafe.com/help/replacement",
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
        <ReplacementHelpHero />

        {/* 02 Interactive Triage */}
        <WhatHappenedTriage />

        {/* 03 6-Step Journey Rail */}
        <ReplacementJourneyRail />

        {/* 04 Continuity Signature Visual */}
        <ReplacementSignatureVisual />

        {/* 05 Commercial Notice: Replacement != Refund */}
        <ReplacementNotRefundNotice />

        {/* 06 Action CTA Section */}
        <ReplacementCtaSection />
      </main>

      <SiteFooter />
    </div>
  );
}
