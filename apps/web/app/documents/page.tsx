import type { Metadata } from "next";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { DocumentsHero } from "../../components/documents/DocumentsHero";
import { LibraryJourneyRail } from "../../components/documents/LibraryJourneyRail";
import { DocumentsCatalogue } from "../../components/documents/DocumentsCatalogue";
import { DocumentsCrossLinkStation } from "../../components/documents/DocumentsCrossLinkStation";

export const metadata: Metadata = {
  title: "Documents | VaahanSafe",
  description:
    "Explore official VaahanSafe product, activation, QR placement, safety, privacy and service guides.",
  openGraph: {
    title: "VaahanSafe Documents — Official Product Library",
    description:
      "Explore official VaahanSafe product, activation, QR placement, safety, privacy and service guides.",
    url: "https://vaahansafe.com/documents",
    type: "website",
  },
  alternates: {
    canonical: "https://vaahansafe.com/documents",
  },
};

export default function DocumentsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "VaahanSafe Product Library",
    description:
      "Official reference library and documentation for VaahanSafe vehicle safety identities.",
    url: "https://vaahansafe.com/documents",
    publisher: {
      "@type": "Organization",
      name: "VaahanSafe",
      url: "https://vaahansafe.com",
    },
    hasPart: [
      {
        "@type": "TechArticle",
        name: "VaahanSafe Product Guide",
        url: "https://vaahansafe.com/documents/product-guide",
      },
      {
        "@type": "TechArticle",
        name: "VaahanSafe Quick-Start Guide",
        url: "https://vaahansafe.com/documents/quick-start",
      },
      {
        "@type": "TechArticle",
        name: "Retail QR Activation Guide",
        url: "https://vaahansafe.com/documents/activation",
      },
      {
        "@type": "TechArticle",
        name: "QR Placement Guide",
        url: "https://vaahansafe.com/documents/qr-placement",
      },
      {
        "@type": "TechArticle",
        name: "Safety & Emergency Contact Guide",
        url: "https://vaahansafe.com/documents/safety",
      },
      {
        "@type": "TechArticle",
        name: "VaahanSafe Privacy Guide",
        url: "https://vaahansafe.com/documents/privacy",
      },
      {
        "@type": "TechArticle",
        name: "Plans, Orders & Support Guide",
        url: "https://vaahansafe.com/documents/plans-orders-support",
      },
    ],
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
        <DocumentsHero />

        {/* 02 Thin Architectural Journey Rail */}
        <LibraryJourneyRail />

        {/* 03 Editorial Document Catalogue with Integrated Search */}
        <DocumentsCatalogue />

        {/* 04 Ecosystem Cross-Link */}
        <DocumentsCrossLinkStation />
      </main>

      <SiteFooter />
    </div>
  );
}
