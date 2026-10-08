import { getActivateUrl, getWebUrl } from "@vaahansafe/config";
import { QrLandingHeader } from "./QrLandingHeader";
import { IdentityHero } from "./IdentityHero";
import { HowItWorks } from "./HowItWorks";
import { PublicViewDemo } from "./PublicViewDemo";
import { PrivacyChapter } from "./PrivacyChapter";
import { QrLifecycleSection } from "./QrLifecycleSection";
import { ActivationHandoff } from "./ActivationHandoff";
import { QrFaq } from "./QrFaq";
import { QrLandingFooter } from "./QrLandingFooter";
export function LandingExperience() {
  return (
    <>
      <QrLandingHeader activateUrl={getActivateUrl()} webUrl={getWebUrl()} />
      <main id="main-content" tabIndex={-1}>
        <IdentityHero />
        <HowItWorks />
        <PrivacyChapter />
        <PublicViewDemo />
        <QrLifecycleSection />
        <ActivationHandoff />
        <QrFaq />
      </main>
      <QrLandingFooter />
    </>
  );
}
