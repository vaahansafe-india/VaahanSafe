import type { Metadata } from "next";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { PlansHero } from "../../components/pricing/PlansHero";
import { ProductModelVisual } from "../../components/pricing/ProductModelVisual";
import { DecalIncludedBaseline } from "../../components/pricing/DecalIncludedBaseline";
import { PlanSelectionGrid } from "../../components/pricing/PlanSelectionGrid";
import { PlanComparisonTable } from "../../components/pricing/PlanComparisonTable";
import { PhysicalQrRelationship } from "../../components/pricing/PhysicalQrRelationship";
import { RetailPlanRelationship } from "../../components/pricing/RetailPlanRelationship";
import { RenewalAndExpiryPolicy } from "../../components/pricing/RenewalAndExpiryPolicy";
import { PlansFaqSection } from "../../components/pricing/PlansFaqSection";
import { PlansFinalCta } from "../../components/pricing/PlansFinalCta";

export const metadata: Metadata = {
  title: "Plans & Protection Services — VaahanSafe",
  description:
    "Explore VaahanSafe service tiers. The QR creates the vehicle identity; the plan determines the emergency relays, scan alerts, and support capabilities around it.",
  openGraph: {
    title: "VaahanSafe Plans — Identity Asset + Cloud Services",
    description:
      "Choose the VaahanSafe services that fit how you want to manage and support your vehicle identity.",
    url: "https://vaahansafe.com/pricing",
    type: "website",
  },
  alternates: {
    canonical: "https://vaahansafe.com/pricing",
  },
};

export default function PricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "VaahanSafe Plans & Services",
    description:
      "Commercial and service architecture for VaahanSafe vehicle safety identities.",
    url: "https://vaahansafe.com/pricing",
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
        <PlansHero />

        {/* 02 Product Model Visual: Identity + Services */}
        <ProductModelVisual />

        {/* 03 Baseline Entitlement */}
        <DecalIncludedBaseline />

        {/* 04 Plan Selection Grid */}
        <PlanSelectionGrid />

        {/* 05 Side-by-Side Comparison */}
        <PlanComparisonTable />

        {/* 06 Physical Decal Relationship */}
        <PhysicalQrRelationship />

        {/* 07 Retail Acquisition Relationship */}
        <RetailPlanRelationship />

        {/* 08 Renewal, Expiry & Continuity Policy */}
        <RenewalAndExpiryPolicy />

        {/* 09 FAQ */}
        <PlansFaqSection />

        {/* 10 Final CTA Station */}
        <PlansFinalCta />
      </main>

      <SiteFooter />
    </div>
  );
}
