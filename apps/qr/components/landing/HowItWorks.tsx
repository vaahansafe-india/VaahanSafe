const steps = [
  {
    title: "Find the sticker",
    body: "Look for the VaahanSafe QR on the vehicle. Move to a safe place before using your phone.",
  },
  {
    title: "Scan or enter the ID",
    body: "Use your phone camera, our scanner, or the visible VaahanSafe ID. The link opens in your browser.",
  },
  {
    title: "Find a way to help",
    body: "Read the information the owner has chosen to share and use an available emergency contact when needed.",
  },
];
export function HowItWorks() {
  return (
    <section id="how-it-works" className="qr-section">
      <div className="qr-container">
        <p className="qr-label">01 / A clear way to help</p>
        <h2 className="qr-section-title mt-3">
          Three steps. One useful connection.
        </h2>
        <div className="qr-step-grid">
          {steps.map((step, index) => (
            <article key={step.title} className="qr-step">
              <span className="qr-label">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
