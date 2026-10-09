import Image from "next/image";
import { Badge } from "@vaahansafe/ui/components";

export function StickerAnatomy() {
  const annotations = [
    {
      num: "01",
      title: "Opaque Resolver Matrix",
      desc: "Standards-compliant Level M error-correcting QR encoding ONLY the public URL. Never contains PII or personal data in the print itself.",
    },
    {
      num: "02",
      title: "Visible VaahanSafe ID",
      desc: "High-contrast alphanumeric identifier (e.g. VS-7F3K-9021) allowing manual resolution if a camera lens is smudged or scratched.",
    },
    {
      num: "03",
      title: "VaahanSafe Identity Emblem",
      desc: "Official brand security seal reassuring finders and first responders of an authentic emergency safety profile.",
    },
    {
      num: "04",
      title: "Scratch-Off Activation Proof",
      desc: "Single-use retail scratch secret (shown as •••••••• DEMO). Plaintext is never stored in databases; only one-way cryptographic hashes.",
    },
    {
      num: "05",
      title: "Clear Roadside Instructions",
      desc: "Plain language prompt reminding passersby that any standard smartphone camera will open the safety profile instantly.",
    },
  ];

  return (
    <section id="anatomy" className="qr-section">
      <div className="qr-container space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <p className="qr-label">04 / Industrial Hardware</p>
          <h2 className="qr-section-title mt-3">
            Engineered for the vehicle. <br />
            <span className="italic text-primary font-medium">Sticker anatomy.</span>
          </h2>
          <p className="qr-muted mt-5 text-sm sm:text-base leading-relaxed">
            Every VaahanSafe physical QR is printed on UV-resistant, weatherproof automotive vinyl
            built to withstand Indian monsoons, heat, and highway grit.
          </p>
        </div>

        {/* Anatomy Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Industrial Hardware Image & Presentation (Left 5-6 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <figure className="relative w-full max-w-[320px] rounded-2xl border border-[var(--qr-line)] bg-[var(--qr-paper)] p-3 sm:p-4 shadow-md select-none">
              <Image
                src="/images/qr-sticker-anatomy.webp"
                alt="VaahanSafe industrial automotive QR sticker with visible ID VS-7F3K-9021, scratch PIN (DEMO ONLY), security emblem, and scan instructions"
                width={896}
                height={1200}
                sizes="(max-width: 640px) 280px, 320px"
                className="w-full h-auto rounded-xl object-contain shadow-xs"
                priority
              />
              <figcaption className="mt-3 pt-2.5 border-t border-[var(--qr-line)] flex items-center justify-between text-[11px] font-mono qr-muted">
                <span>VS-7F3K-9021 &bull; DEMO ONLY</span>
                <span>Automotive Vinyl</span>
              </figcaption>
            </figure>
          </div>

          {/* Annotations List (Right 6-7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            {annotations.map((a) => (
              <div
                key={a.num}
                className="p-4 sm:p-5 rounded border border-[var(--qr-line)] bg-[var(--qr-paper)] flex items-start gap-4 shadow-xs hover:border-[var(--qr-accent)] transition-colors"
              >
                <span className="size-7 rounded bg-[var(--qr-surface)] text-[var(--qr-accent)] font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-[var(--qr-line)]">
                  {a.num}
                </span>
                <div className="space-y-1">
                  <h3 className="font-serif text-base font-semibold text-foreground tracking-tight">
                    {a.title}
                  </h3>
                  <p className="qr-muted text-xs sm:text-sm leading-relaxed">
                    {a.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
