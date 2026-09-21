"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { QrLandingHeader } from "./QrLandingHeader";
import { IdentityHero } from "./IdentityHero";
import { IdentityPath } from "./IdentityPath";
import { HowItWorks } from "./HowItWorks";
import { PublicViewDemo } from "./PublicViewDemo";
import { PrivacyChapter } from "./PrivacyChapter";
import { QrLifecycleSection } from "./QrLifecycleSection";
import { StickerAnatomy } from "./StickerAnatomy";
import { ScanSituations } from "./ScanSituations";
import { ActivationHandoff } from "./ActivationHandoff";
import { QrPrinciples } from "./QrPrinciples";
import { QrFaq } from "./QrFaq";
import { FinalIdentityStatement } from "./FinalIdentityStatement";
import { QrLandingFooter } from "./QrLandingFooter";

// Dynamically load the Camera Scanner modal on demand
const VaahanScannerModal = dynamic(
  () =>
    import("../scanner/VaahanScannerModal").then((mod) => mod.VaahanScannerModal),
  { ssr: false }
);

export function LandingExperience() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* 01 Minimal Header with Brand Logo & Theme Switcher */}
      <QrLandingHeader />

      <main className="w-full">
        {/* 02 Scan-First Identity Hero */}
        <IdentityHero onOpenScanner={() => setIsScannerOpen(true)} />

        {/* 03 Continuous Identity Milestone Trail */}
        <IdentityPath activeNode="CAMERA" />

        {/* 04 How It Works 4-Stage Narrative */}
        <HowItWorks />

        {/* 05 Public Safety View Preview */}
        <PublicViewDemo />

        {/* 06 & 07 Dark Privacy Chapter + Projection Boundary Diagram */}
        <PrivacyChapter />

        {/* 08 QR Lifecycle States */}
        <QrLifecycleSection />

        {/* 09 Physical Sticker Anatomy */}
        <StickerAnatomy />

        {/* 10 Scan Situations */}
        <ScanSituations />

        {/* 11 Activation Handoff */}
        <ActivationHandoff />

        {/* 12 Safety Principles Registry */}
        <QrPrinciples />

        {/* 13 FAQ Accordion */}
        <QrFaq />

        {/* 14 Final Identity Statement */}
        <FinalIdentityStatement />
      </main>

      {/* 15 Minimal Editorial Footer */}
      <QrLandingFooter />

      {/* Lazy Loaded Camera Scanner Modal */}
      {isScannerOpen && (
        <VaahanScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
}
