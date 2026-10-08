const questions = [
  {
    question: "Do I need an account to scan a QR?",
    answer:
      "No. You can open an enabled public safety view in your phone browser. An account and verified mobile are required to activate or manage your own sticker.",
  },
  {
    question: "What if my camera cannot scan the sticker?",
    answer:
      "Enter the VaahanSafe ID printed on the sticker in the field above. You can also choose a photo in the scanner if your browser supports image decoding.",
  },
  {
    question: "Which details are visible to a passerby?",
    answer:
      "Only the safety details the owner has approved for sharing, such as vehicle information, enabled emergency contacts and optional safety notes. Private account and billing details are excluded.",
  },
  {
    question: "Does a scan activate my sticker?",
    answer:
      "No. Activation requires a verified owner, valid activation proof and a connection to an eligible vehicle. A public QR link is separate from the private activation proof.",
  },
  {
    question: "Why might a QR be unavailable?",
    answer:
      "It may need activation, have been replaced, or have its service disabled. Follow the next step shown on the QR page. If the service cannot be reached, try again.",
  },
  {
    question: "Does VaahanSafe replace emergency services?",
    answer:
      "No. VaahanSafe helps people find approved safety information and contacts. For an immediate emergency in India, contact the official emergency services on 112 / 108.",
  },
];
export function QrFaq() {
  return (
    <section id="faq" className="qr-section">
      <div className="qr-container qr-faq">
        <div>
          <p className="qr-label">A little clarity</p>
          <h2 className="qr-section-title mt-3">
            Good questions.
            <br />
            <em>Clear answers.</em>
          </h2>
        </div>
        <div>
          {questions.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
