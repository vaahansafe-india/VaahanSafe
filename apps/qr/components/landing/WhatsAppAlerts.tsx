import { VaahanIcon } from "@vaahansafe/icons";

export function WhatsAppAlerts() {
  return (
    <section
      id="whatsapp-alerts"
      className="qr-section qr-alert-chapter"
      aria-labelledby="qr-alert-title"
    >
      <div className="qr-container">
        <div className="qr-alert-heading">
          <div>
            <p className="qr-label">A scan. A thoughtful response.</p>
            <h2 id="qr-alert-title" className="qr-section-title mt-3">
              The right alert.
              <br />
              <em>To the right people.</em>
            </h2>
          </div>
          <p className="qr-muted leading-relaxed">
            Open an active vehicle QR, choose the situation and send a report. A
            scan alone never sends an accident alert.
          </p>
        </div>
        <div className="qr-alert-grid">
          <article className="qr-alert-card">
            <div className="qr-alert-card-top">
              <VaahanIcon name="car" size={24} />
              <span className="qr-label">01 / Everyday care</span>
            </div>
            <h3>Parking or blocked access</h3>
            <p>
              A blocked driveway, gate or another vehicle? Send a WhatsApp alert
              so the owner knows where help is needed.
            </p>
            <div className="qr-alert-audience">
              <VaahanIcon name="message" size={17} />
              <span>Vehicle owner only</span>
            </div>
          </article>
          <article className="qr-alert-card qr-alert-card-emergency">
            <div className="qr-alert-card-top">
              <VaahanIcon name="alert" size={24} />
              <span className="qr-label">02 / When it matters</span>
            </div>
            <h3>Accident or emergency</h3>
            <p>
              Share what happened with the owner and contacts enabled for
              emergency messages. For immediate danger, call 112 first.
            </p>
            <div className="qr-alert-audience">
              <VaahanIcon name="message" size={17} />
              <span>Owner + enabled emergency contacts</span>
            </div>
          </article>
        </div>
        <div className="qr-alert-sharing">
          <div className="qr-alert-sharing-icon">
            <VaahanIcon name="shield-check" size={25} />
          </div>
          <div className="min-w-0">
            <p className="qr-label">A private view. A clear time limit.</p>
            <h3>Useful context, shared with care.</h3>
            <p className="qr-muted">
              Add up to three photos, a note and an optional location. The
              WhatsApp alert includes a report link at{" "}
              <span className="font-medium text-foreground">
                view.vaahansafe.com
              </span>{" "}
              that expires after 24 hours. The owner can revoke it earlier.
            </p>
            <p className="qr-muted mt-2 text-xs">
              Anyone holding the link can view that report until access ends.
              Alerts are queued after submission; delivery depends on recipient
              settings and provider availability.
            </p>
          </div>
          <div className="qr-alert-expiry">
            <strong>
              24<span>h</span>
            </strong>
            <span>LINK LIFETIME</span>
          </div>
        </div>
        <div className="qr-alert-bottom">
          <a href="#scan-vehicle" className="qr-text-link">
            Scan a vehicle QR to get started <span aria-hidden="true">↗</span>
          </a>
          <span className="qr-muted text-xs">
            No sign-in needed to report a concern.
          </span>
        </div>
      </div>
    </section>
  );
}
