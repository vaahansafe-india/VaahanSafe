import { getActivateUrl, getWebUrl } from "@vaahansafe/config";
import { QrLandingHeader } from "./QrLandingHeader";
import { IdentityHero } from "./IdentityHero";
import { IdentityPath } from "./IdentityPath";
import { HowItWorks } from "./HowItWorks";
import { StickerAnatomy } from "./StickerAnatomy";
import { PublicViewDemo } from "./PublicViewDemo";
import { PrivacyChapter } from "./PrivacyChapter";
import { ScanSituations } from "./ScanSituations";
import { QrLifecycleSection } from "./QrLifecycleSection";
import { QrPrinciples } from "./QrPrinciples";
import { ActivationHandoff } from "./ActivationHandoff";
import { QrFaq } from "./QrFaq";
import { FinalIdentityStatement } from "./FinalIdentityStatement";
import { QrLandingFooter } from "./QrLandingFooter";

export function LandingExperience() {
  return (
    <>
      <QrLandingHeader activateUrl={getActivateUrl()} webUrl={getWebUrl()} />
      <main id="main-content" tabIndex={-1}>
        <IdentityHero />
        <IdentityPath activeNode="CAMERA" />
        <HowItWorks />
        <StickerAnatomy />
        <PublicViewDemo />
        <PrivacyChapter />
        <ScanSituations />
        <QrLifecycleSection />
        <QrPrinciples />
        <ActivationHandoff />
        <QrFaq />
        <FinalIdentityStatement />
      </main>
      <QrLandingFooter />
    </>
  );
}
