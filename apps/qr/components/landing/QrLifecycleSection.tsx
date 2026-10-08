const states = [
  {
    title: "Ready to activate",
    body: "The sticker exists, but its safety view is not enabled. The owner must complete secure activation.",
  },
  {
    title: "Safety view enabled",
    body: "A connected vehicle and valid service entitlement allow its approved information to appear.",
  },
  {
    title: "Replaced or unavailable",
    body: "An old, blocked or unusable sticker shows a clear next step without exposing a safety profile.",
  },
];
export function QrLifecycleSection() {
  return (
    <section id="lifecycle" className="qr-section">
      <div className="qr-container">
        <p className="qr-label">04 / A clear status at every scan</p>
        <h2 className="qr-section-title mt-3">
          The right information for this QR.
        </h2>
        <div className="qr-step-grid">
          {states.map((state) => (
            <article key={state.title} className="qr-step">
              <h3 className="!mt-0">{state.title}</h3>
              <p>{state.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
