import { SiteHeader } from "../components/marketing/site-header";
import { SiteFooter } from "../components/marketing/site-footer";

// PHASE 15.2: The 15 Locked Homepage Stations in Exact Narrative Sequence
import { RouteHero } from "../components/home/RouteHero";
import { WhatIsVaahanSafe } from "../components/home/WhatIsVaahanSafe";
import { QrThreeStepFlow } from "../components/home/QrThreeStepFlow";
import { PhysicalStickerAnatomy } from "../components/home/PhysicalStickerAnatomy";
import { EmergencyScanPreview } from "../components/home/EmergencyScanPreview";
import { CustomerAppShowcase } from "../components/home/CustomerAppShowcase";
import { RetailActivationPreview } from "../components/home/RetailActivationPreview";
import { PlanPreview } from "../components/home/PlanPreview";
import { PrivacyProjection } from "../components/home/PrivacyProjection";
import { PlacementGalleryPreview } from "../components/home/PlacementGalleryPreview";
import { TrustSecurityAvailability } from "../components/home/TrustSecurityAvailability";
import { ResourceStation } from "../components/home/ResourceStation";
import { EvidenceSection } from "../components/home/EvidenceSection";
import { HomepageFaq } from "../components/home/HomepageFaq";
import { FinalCtaStation } from "../components/home/FinalCtaStation";

export default function WebHomePage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground flex flex-col antialiased selection:bg-accent selection:text-accent-foreground">
      {/* Site Header with Navigation, Resources Dropdown, and Surface Action Links */}
      <SiteHeader />

      {/* Main Content Landmark with Skip-Link Anchor */}
      <main id="main-content" className="flex-1">
        {/* 01 Route-Based Hero */}
        <RouteHero />

        {/* 02 What VaahanSafe Is */}
        <WhatIsVaahanSafe />

        {/* 03 How the QR Works (Place / Scan / Connect in 3 Concise Steps) */}
        <QrThreeStepFlow />

        {/* 04 Physical QR Sticker Anatomy + Security (QR + Visible ID + Scratch Security) */}
        <PhysicalStickerAnatomy />

        {/* 05 Emergency Scan Preview (Finder View • Zero-Login • Masked Actions) */}
        <EmergencyScanPreview />

        {/* 06 Customer App Preview (Owner View • Dashboard • Vehicles • Relays) */}
        <CustomerAppShowcase />

        {/* 07 Retail Activation Preview (Buy → Scan → Scratch → Activate) */}
        <RetailActivationPreview />

        {/* 08 Subscription / Plan Preview (QR Identity Asset != Subscription Entitlement) */}
        <PlanPreview />

        {/* 09 Vehicle + Emergency Profile Privacy Controls (Private → Control → Public) */}
        <PrivacyProjection />

        {/* 10 Gallery / Real-World Placement (Car, Bike, Helmet, Packaging, Retail) */}
        <PlacementGalleryPreview />

        {/* 11 Trust / Security / Availability (Factual Pillars • Zero Fake Certifications) */}
        <TrustSecurityAvailability />

        {/* 12 Documents / Help Resources (Connected Documentation & Self-Service Zones) */}
        <ResourceStation />

        {/* 13 Testimonials / Pilot Evidence (STRICTLY CONDITIONAL • Collapses when no evidence) */}
        <EvidenceSection />

        {/* 14 FAQ (Pre-Purchase Clarity Accordion) */}
        <HomepageFaq />

        {/* 15 Final CTA Station */}
        <FinalCtaStation />
      </main>

      {/* Surface-Aware Directory Footer */}
      <SiteFooter />
    </div>
  );
}
