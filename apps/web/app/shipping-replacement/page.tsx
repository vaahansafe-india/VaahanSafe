import type { Metadata } from "next";
import * as React from "react";

import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { ShippingPolicyHero } from "../../components/shipping/ShippingPolicyHero";
import { ShippingJourneyVisual } from "../../components/shipping/ShippingJourneyVisual";
import { ShippingNavigation } from "../../components/shipping/ShippingNavigation";
import { MobileShippingNavigation } from "../../components/shipping/MobileShippingNavigation";
import { ShippingSectionView } from "../../components/shipping/ShippingSectionView";
import { ReplacementIdentityCard } from "../../components/shipping/ReplacementIdentityCard";
import { RefundVsReplacementCard } from "../../components/shipping/RefundVsReplacementCard";
import { ShippingSupportFlowCard } from "../../components/shipping/ShippingSupportFlowCard";
import { ShippingContactStation } from "../../components/shipping/ShippingContactStation";
import { ShippingDocumentMetaView } from "../../components/shipping/ShippingDocumentMetaView";
import { SHIPPING_SECTIONS } from "./shipping-replacement-content";

export const metadata: Metadata = {
  title: "Shipping & Replacement Policy | VaahanSafe",
  description:
    "Learn how physical VaahanSafe decal orders, delivery issues, transit damage, and QR replacement requests are handled.",
  alternates: {
    canonical: "https://vaahansafe.com/shipping-replacement",
  },
  openGraph: {
    title: "Shipping & Replacement Policy | VaahanSafe",
    description:
      "Learn how physical VaahanSafe decal orders, delivery issues, transit damage, and QR replacement requests are handled.",
    url: "https://vaahansafe.com/shipping-replacement",
    siteName: "VaahanSafe",
    locale: "en_IN",
    type: "website",
  },
};

export default function ShippingReplacementPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* 01 Site Header */}
      <SiteHeader />

      <main id="main-content">
        {/* 02 Hero */}
        <ShippingPolicyHero />

        {/* 03 Signature Journey: ORDER → SHIP → DELIVER → PLACE → VEHICLE IDENTITY */}
        <ShippingJourneyVisual />

        {/* 04 Mobile Navigation Sheet */}
        <MobileShippingNavigation sections={SHIPPING_SECTIONS} />

        {/* 05 Main Legal Document Layout: Sticky Sidebar + Structured Policy Content */}
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="flex items-start gap-12 lg:gap-16">
            {/* Desktop Sticky Index */}
            <ShippingNavigation sections={SHIPPING_SECTIONS} />

            {/* Document Content Column */}
            <div className="min-w-0 max-w-[760px] flex-1">
              {SHIPPING_SECTIONS.map((section) => (
                <React.Fragment key={section.id}>
                  <ShippingSectionView section={section} />

                  {/* Contextual signature card for Section 08: Transit Damage & Comparison */}
                  {section.id === "damaged-delivery" && <RefundVsReplacementCard />}

                  {/* Contextual signature card for Section 11: Support Protocol */}
                  {section.id === "replacement" && <ShippingSupportFlowCard />}

                  {/* Contextual signature card for Section 12: Identity Continuity */}
                  {section.id === "replacement-identity" && <ReplacementIdentityCard />}
                </React.Fragment>
              ))}

              {/* 06 Order Support Station */}
              <ShippingContactStation />

              {/* 07 Document Record & Operations Review Notice */}
              <ShippingDocumentMetaView />
            </div>
          </div>
        </div>
      </main>

      {/* 08 Site Footer */}
      <SiteFooter />
    </div>
  );
}
