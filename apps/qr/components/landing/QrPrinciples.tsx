import React from "react";

export function QrPrinciples() {
  const principles = [
    {
      num: "01",
      title: "Scan does not mean ownership",
      desc: "Scanning a public QR code allows a finder to view the safety pass, but conveys zero administrative control over the vehicle or account.",
    },
    {
      num: "02",
      title: "Public ID is not an activation secret",
      desc: "The visible resolver code (VS-7F3K-9021) is an opaque public identifier. It cannot be used to activate, modify, or steal a sticker.",
    },
    {
      num: "03",
      title: "Private data stays behind the projection",
      desc: "Our server whitelist guarantees that emails, billing addresses, and raw database IDs are never included in the resolver payload.",
    },
    {
      num: "04",
      title: "An old QR can be cleanly retired",
      desc: "When a damaged sticker is replaced, the old code is immediately decommissioned and securely routed to the new identity.",
    },
    {
      num: "05",
      title: "The QR is an information & connection tool",
      desc: "VaahanSafe enables direct citizen-to-owner contact relays. It does not replace emergency ambulance, police, or hospital dispatch (112 / 108).",
    },
  ];

  return (
    <section id="principles" className="qr-section">
      <div className="qr-container space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <p className="qr-label">06 / System Principles</p>
          <h2 className="qr-section-title mt-3">
            Foundational rules of <br />
            the <span className="italic text-primary font-medium">VaahanSafe QR architecture.</span>
          </h2>
          <p className="qr-muted mt-5 text-sm sm:text-base leading-relaxed">
            These non-negotiable security boundaries protect vehicle owners and reassure first responders.
          </p>
        </div>

        {/* Registry List */}
        <div className="border-t border-[var(--qr-line)] divide-y divide-[var(--qr-line)]">
          {principles.map((p) => (
            <div
              key={p.num}
              className="py-6 sm:py-8 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start hover:bg-[var(--qr-surface)]/50 transition-colors px-3 rounded"
            >
              <div className="md:col-span-2">
                <span className="font-mono text-xs sm:text-sm font-bold text-[var(--qr-accent)]">
                  {p.num}
                </span>
              </div>

              <div className="md:col-span-4">
                <h3 className="font-serif text-lg sm:text-xl font-medium text-foreground tracking-tight uppercase">
                  {p.title}
                </h3>
              </div>

              <div className="md:col-span-6">
                <p className="qr-muted text-xs sm:text-sm leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
