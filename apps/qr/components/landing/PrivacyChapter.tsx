import Image from "next/image";
import { ProjectionBoundaryDiagram } from "./ProjectionBoundaryDiagram";

export function PrivacyChapter() {
  return (
    <section id="privacy" className="qr-section">
      <div className="qr-container space-y-12">
        <div className="qr-split">
          <figure>
            <Image
              src="/images/qr-privacy-concept.webp"
              alt="Illustration of a windshield QR, a phone, and a shield representing controlled access to safety information"
              width={1400}
              height={933}
              sizes="(max-width: 767px) calc(100vw - 32px), 45vw"
              className="qr-hero-art"
            />
          </figure>
          <div>
            <p className="qr-label">02 / Thoughtfully shared</p>
            <h2 className="qr-section-title mt-3">
              Public QR.
              <br />
              <em>Personal boundaries.</em>
            </h2>
            <p className="qr-muted mt-5 leading-relaxed">
              The sticker opens a limited safety view. The owner controls which
              supported details appear, and the server checks whether the QR’s
              safety service is enabled.
            </p>
            <ul className="qr-detail-list">
              <li>
                <span aria-hidden="true">01</span>Only owner-approved safety
                details are shown.
              </li>
              <li>
                <span aria-hidden="true">02</span>Account credentials, billing
                details and home addresses stay private.
              </li>
              <li>
                <span aria-hidden="true">03</span>Scanning a sticker does not give
                ownership or activate it.
              </li>
            </ul>
          </div>
        </div>

        {/* Architectural Projection Boundary Visualization */}
        <ProjectionBoundaryDiagram />
      </div>
    </section>
  );
}
