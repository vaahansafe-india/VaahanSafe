import * as React from "react";
import Link from "next/link";

export function IdentityEditorialSection() {
  const steps = [
    { name: "VEHICLE", desc: "Physical asset on the road", color: "bg-[#cc785c]" },
    { name: "QR IDENTITY", desc: "Opaque, non-enumerable token", color: "bg-[#5db8a6]" },
    { name: "PUBLIC RESOLVER", desc: "Encrypted server routing", color: "bg-[#e8a55a]" },
    { name: "SAFETY VIEW", desc: "Zero-exposure bystander view", color: "bg-[#5db872]" },
  ];

  return (
    <section
      aria-labelledby="identity-editorial-heading"
      className="border-b border-[#2e2b27] bg-[#181715] py-16 sm:py-24 text-[#faf9f5]"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: Large Editorial Statement (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Small Label */}
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
              QR &amp; IDENTITY
            </div>

            {/* Large Serif Headline */}
            <h2
              id="identity-editorial-heading"
              className="
                font-serif
                text-3xl sm:text-4xl lg:text-[3.25rem]
                font-normal
                leading-[1.08]
                tracking-[-0.02em]
                text-[#faf9f5]
              "
            >
              A QR can be public. <br className="hidden sm:inline" />
              Your private identity <br className="hidden sm:inline" />
              <span className="text-[#8e8b82]">doesn&apos;t have to be.</span>
            </h2>

            {/* Small Supporting Copy */}
            <p className="max-w-xl font-sans text-sm leading-relaxed text-[#a09d96] sm:text-base">
              Encoding personal phone numbers, names, or addresses directly into static QR stickers permanently exposes your private life. VaahanSafe resolves an opaque public token through an authenticated cloud relay—enabling immediate roadside emergency assistance while keeping private account data completely isolated.
            </p>

            {/* Explore Link */}
            <div className="pt-2">
              <Link
                href="/category/qr-identity"
                className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#faf9f5] transition-colors hover:text-[#cc785c]"
              >
                <span>Explore QR &amp; Identity</span>
                <span
                  className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  &rarr;
                </span>
              </Link>
            </div>
          </div>

          {/* Right: VaahanSafe Identity Diagram (5 cols) */}
          <div className="flex justify-start lg:col-span-5 lg:justify-center">
            <div
              className="w-full max-w-sm rounded-2xl border border-[#2e2b27] bg-[#141413]/60 p-6 sm:p-8"
              aria-label="VaahanSafe Identity Architecture Diagram"
            >
              <div className="mb-6 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82]">
                IDENTITY ARCHITECTURE
              </div>

              <div className="space-y-0">
                {steps.map((step, index) => {
                  const isLast = index === steps.length - 1;
                  return (
                    <div key={step.name} className="flex items-start gap-4">
                      {/* Node & Connecting Line */}
                      <div className="flex flex-col items-center">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ring-4 ring-[#181715] ${step.color}`}
                        />
                        {!isLast && (
                          <span className="my-1 h-10 w-px bg-[#2e2b27]" />
                        )}
                      </div>

                      {/* Node Label & Description */}
                      <div className="pb-4">
                        <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#faf9f5]">
                          {step.name}
                        </div>
                        <div className="font-sans text-[11px] text-[#8e8b82]">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-[#2e2b27] pt-4 font-mono text-[9px] text-[#8e8b82]">
                OPAQUE RESOLVER &bull; ZERO EXPOSURE
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
