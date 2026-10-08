import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import { getActivateUrl, getStatusUrl, getWebUrl } from "@vaahansafe/config";
export function QrLandingFooter() {
  const webUrl = getWebUrl();
  return (
    <footer className="qr-footer">
      <div className="qr-container">
        <div className="qr-footer-top">
          <div>
            <VaahanSafeLogo size="sm" variant="brand" showTagline={false} />
            <p className="qr-muted mt-3 text-sm">
              A little care, carried on every journey.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <a href={webUrl}>VaahanSafe Platform</a>
            <a href={getActivateUrl()}>Retail Activation</a>
            <a href={`${webUrl}/privacy`}>Privacy Policy</a>
            <a href={getStatusUrl()}>System Status</a>
            <a href={`${webUrl}/help`}>Help & Support</a>
          </nav>
        </div>
        <div className="qr-footer-bottom">
          <p>
            © {new Date().getFullYear()} VaahanSafe. Built for Indian roads.
          </p>
          <p className="max-w-md">
            Emergency Service Notice: VaahanSafe does not replace official
            emergency response. For emergencies, call 112 / 108.
          </p>
        </div>
      </div>
    </footer>
  );
}
