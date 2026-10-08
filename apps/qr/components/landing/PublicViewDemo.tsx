export function PublicViewDemo() {
  return (
    <section id="safety-view" className="qr-section">
      <div className="qr-container qr-split">
        <div>
          <p className="qr-label">03 / The safety view</p>
          <h2 className="qr-section-title mt-3">
            Useful information.
            <br />
            When it matters.
          </h2>
          <p className="qr-muted mt-5 leading-relaxed">
            Every enabled QR reflects its connected vehicle’s current settings.
            Available information depends on what the owner has approved.
          </p>
        </div>
        <ul className="qr-detail-list !mt-0">
          <li>
            <span aria-hidden="true">↗</span>
            <div>
              <h3 className="font-semibold">Vehicle identity</h3>
              <p className="qr-muted mt-1">
                Approved vehicle details help identify the vehicle you are
                beside.
              </p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">↗</span>
            <div>
              <h3 className="font-semibold">Emergency contacts</h3>
              <p className="qr-muted mt-1">
                Contact options appear only when the owner has enabled them.
              </p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">↗</span>
            <div>
              <h3 className="font-semibold">Safety notes</h3>
              <p className="qr-muted mt-1">
                Optional blood group and medical notes appear when sharing is
                approved.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
