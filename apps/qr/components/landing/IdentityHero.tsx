"use client";
import { useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { parseVaahanSafeQrPayload } from "@vaahansafe/qr-core/scanner";
const VaahanScannerModal = dynamic(
  () =>
    import("../scanner/VaahanScannerModal").then(
      (mod) => mod.VaahanScannerModal,
    ),
  { ssr: false },
);
export function IdentityHero() {
  const router = useRouter();
  const [lookupId, setLookupId] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    const result = parseVaahanSafeQrPayload(lookupId);
    if (!result.valid || !result.publicId) {
      setInputError(
        "Enter the VaahanSafe ID printed on the sticker, or its QR link.",
      );
      return;
    }
    setInputError(null);
    router.push(`/${encodeURIComponent(result.publicId)}`);
  }
  return (
    <>
      <section className="qr-container qr-hero" aria-labelledby="qr-hero-title">
        <div className="qr-hero-content w-full flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="qr-label text-center lg:text-left text-[11px] sm:text-xs">Small sticker. A meaningful connection.</p>
          <h1 id="qr-hero-title" className="qr-title mt-4 sm:mt-5 text-center lg:text-left text-balance">
            Your vehicle.
            <br />A <em className="text-primary font-normal italic">safety identity.</em>
          </h1>
          <p className="qr-muted mt-4 sm:mt-6 max-w-lg text-sm sm:text-base leading-relaxed mx-auto lg:mx-0 text-center lg:text-left text-balance">
            A scan can help someone reach the people who matter. Open the
            vehicle’s owner-approved safety information with a VaahanSafe QR.
          </p>
          <div className="qr-hero-actions mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
            <button
              className="qr-button qr-button-primary w-full sm:w-auto justify-center"
              onClick={() => setScannerOpen(true)}
            >
              Scan a VaahanSafe QR <span aria-hidden="true">↗</span>
            </button>
            <a className="qr-text-link justify-center text-center py-1 sm:py-0" href="#how-it-works">
              How it works <span aria-hidden="true">↓</span>
            </a>
          </div>
          <form className="qr-lookup w-full max-w-sm sm:max-w-md mx-auto lg:mx-0 text-left mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[var(--qr-line)]" onSubmit={submit}>
            <label htmlFor="hero-lookup-input" className="text-xs sm:text-sm font-medium block text-center lg:text-left">
              Or enter the ID on your sticker
            </label>
            <div className="qr-lookup-row flex gap-2 mt-2">
              <input
                id="hero-lookup-input"
                value={lookupId}
                onChange={(event) => {
                  setLookupId(event.target.value);
                  setInputError(null);
                }}
                placeholder="VaahanSafe ID or QR link"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(inputError)}
                aria-describedby={inputError ? "lookup-error" : "lookup-help"}
              />
              <button
                type="submit"
                className="qr-button shrink-0"
                aria-label="Open safety information"
              >
                Open <span aria-hidden="true">→</span>
              </button>
            </div>
            {inputError ? (
              <p
                id="lookup-error"
                role="alert"
                className="mt-2 text-xs sm:text-sm text-destructive text-center lg:text-left"
              >
                {inputError}
              </p>
            ) : (
              <p id="lookup-help" className="qr-muted mt-2 text-[11px] sm:text-xs text-center lg:text-left">
                No app or account needed to view an enabled QR.
              </p>
            )}
          </form>
        </div>
        <figure className="qr-hero-figure">
          <Image
            src="/images/qr-scan-concept.webp"
            alt="Illustration of a passerby scanning a VaahanSafe windshield sticker with a phone"
            width={1400}
            height={933}
            sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1304px) 55vw, 650px"
            priority
            className="qr-hero-art"
          />
          <figcaption>
            <span>A connection built for everyday journeys.</span>
            <span aria-hidden="true">01 / Scan</span>
          </figcaption>
        </figure>
      </section>
      {scannerOpen && (
        <VaahanScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </>
  );
}
