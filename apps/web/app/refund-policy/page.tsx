import type { Metadata } from "next";
import * as React from "react";

import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { RefundPolicyHero } from "../../components/refund/RefundPolicyHero";
import { PurchaseLifecycleVisual } from "../../components/refund/PurchaseLifecycleVisual";
import { BeforeYouPurchaseCard } from "../../components/refund/BeforeYouPurchaseCard";
import { RefundNavigation } from "../../components/refund/RefundNavigation";
import { MobileRefundNavigation } from "../../components/refund/MobileRefundNavigation";
import { RefundSectionView } from "../../components/refund/RefundSectionView";
import { RefundVsOrderProblemCard } from "../../components/refund/RefundVsOrderProblemCard";
import { OrderReviewFlowCard } from "../../components/refund/OrderReviewFlowCard";
import { NoRefundNoSupportStatement } from "../../components/refund/NoRefundNoSupportStatement";
import { RefundSupportStation } from "../../components/refund/RefundSupportStation";
import { RefundDocumentMetaView } from "../../components/refund/RefundDocumentMetaView";
import { REFUND_SECTIONS } from "./refund-policy-content";

export const metadata: Metadata = {
  title: "Refund Policy | VaahanSafe",
  description:
    "Read VaahanSafe's refund policy and learn how payment, order, delivery and replacement issues are handled.",
  alternates: {
    canonical: "https://vaahansafe.com/refund-policy",
  },
  openGraph: {
    title: "Refund Policy | VaahanSafe",
    description:
      "Read VaahanSafe's refund policy and learn how payment, order, delivery and replacement issues are handled.",
    url: "https://vaahansafe.com/refund-policy",
    siteName: "VaahanSafe",
    locale: "en_IN",
    type: "website",
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* 01 Site Header (Reusable thin identity rail) */}
      <SiteHeader />

      <main id="main-content">
        {/* 02 Refund Policy Hero */}
        <RefundPolicyHero />

        {/* 03 Signature Purchase Lifecycle Visual: PURCHASE → CONFIRM → FULFILL → NON-REFUNDABLE */}
        <PurchaseLifecycleVisual />

        {/* 04 Before You Purchase Overview: 4 Editorial Rows */}
        <BeforeYouPurchaseCard />

        {/* 05 Mobile Refund Navigation Sheet */}
        <MobileRefundNavigation sections={REFUND_SECTIONS} />

        {/* 06 Main Legal Document Layout: Sticky Sidebar + Structured Policy Content */}
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="flex items-start gap-12 lg:gap-16">
            {/* Desktop Sticky Index */}
            <RefundNavigation sections={REFUND_SECTIONS} />

            {/* Document Content Column */}
            <div className="min-w-0 max-w-[760px] flex-1">
              {REFUND_SECTIONS.map((section) => (
                <React.Fragment key={section.id}>
                  <RefundSectionView section={section} />

                  {/* Contextual signature card for Section 03: Order Details & Comparison */}
                  {section.id === "order-information" && <RefundVsOrderProblemCard />}

                  {/* Contextual signature card for Section 10: Order Review Protocol */}
                  {section.id === "order-review" && <OrderReviewFlowCard />}
                </React.Fragment>
              ))}

              {/* 07 Editorial Principle: NO REFUND DOES NOT MEAN NO SUPPORT */}
              <NoRefundNoSupportStatement />

              {/* 08 Order Support Station */}
              <RefundSupportStation />

              {/* 09 Document Record & Compliance Notice */}
              <RefundDocumentMetaView />
            </div>
          </div>
        </div>
      </main>

      {/* 10 Site Footer (Reusable persistent dark anchor) */}
      <SiteFooter />
    </div>
  );
}
