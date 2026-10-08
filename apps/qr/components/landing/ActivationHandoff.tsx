import { getActivateUrl } from "@vaahansafe/config";
export function ActivationHandoff() {
  return (
    <section id="activate" className="qr-section">
      <div className="qr-container qr-split">
        <div>
          <p className="qr-label">For vehicle owners</p>
          <h2 className="qr-section-title mt-3">
            Make your sticker
            <br />
            <em>part of your journey.</em>
          </h2>
        </div>
        <div>
          <p className="qr-muted leading-relaxed">
            Have a retail VaahanSafe sticker? Verify your mobile, provide the
            activation proof and connect your vehicle to enable its safety
            services.
          </p>
          <a
            href={getActivateUrl()}
            className="qr-button qr-button-primary mt-6"
          >
            Activate your QR <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
