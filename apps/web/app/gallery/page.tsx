import type { Metadata } from "next";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { PlacementHero } from "../../components/gallery/PlacementHero";
import { PlacementPrincipleVisual } from "../../components/gallery/PlacementPrincipleVisual";
import { CarPlacementGuide } from "../../components/gallery/CarPlacementGuide";
import { TwoWheelerPlacementGuide } from "../../components/gallery/TwoWheelerPlacementGuide";
import { PrePlacementChecklist } from "../../components/gallery/PrePlacementChecklist";
import { DecalAnatomyGuide } from "../../components/gallery/DecalAnatomyGuide";
import { PlacementWhatNotToDo } from "../../components/gallery/PlacementWhatNotToDo";
import { PlacementToConnectionFlow } from "../../components/gallery/PlacementToConnectionFlow";
import { IllustrativePlacementGallery } from "../../components/gallery/IllustrativePlacementGallery";
import { InstallationHelpStation } from "../../components/gallery/InstallationHelpStation";
import { PlacementFinalCta } from "../../components/gallery/PlacementFinalCta";

export const metadata: Metadata = {
  title: "Vehicle QR Placement Guide — VaahanSafe",
  description:
    "Explore how to position your physical VaahanSafe QR decal on cars, SUVs, motorcycles, and scooters for immediate roadside scannability and vehicle compliance.",
  openGraph: {
    title: "VaahanSafe QR Placement — Made to Belong on the Vehicle",
    description:
      "Explore how a VaahanSafe QR can be positioned so it remains visible and accessible without interfering with important vehicle elements.",
    url: "https://vaahansafe.com/gallery",
    type: "website",
  },
  alternates: {
    canonical: "https://vaahansafe.com/gallery",
  },
};

export default function GalleryPlacementPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "VaahanSafe Vehicle QR Placement Guide",
    description:
      "Visual product guide explaining how the physical VaahanSafe QR belongs on a vehicle.",
    url: "https://vaahansafe.com/gallery",
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
        <PlacementHero />

        {/* 02 Placement Principle Visual */}
        <PlacementPrincipleVisual />

        {/* 03 Four-Wheeler Placement Guide */}
        <CarPlacementGuide />

        {/* 04 Two-Wheeler Placement Guide */}
        <TwoWheelerPlacementGuide />

        {/* 05 Pre-Placement Protocol Checklist */}
        <PrePlacementChecklist />

        {/* 06 Decal Specimen & Anatomy */}
        <DecalAnatomyGuide />

        {/* 07 What Not To Do (Misplacements to Avoid) */}
        <PlacementWhatNotToDo />

        {/* 08 Placement to Connection Progression */}
        <PlacementToConnectionFlow />

        {/* 09 Illustrative Reference Specimens */}
        <IllustrativePlacementGallery />

        {/* 10 Installation Assistance Station */}
        <InstallationHelpStation />

        {/* 11 Final Dark CTA */}
        <PlacementFinalCta />
      </main>

      <SiteFooter />
    </div>
  );
}
