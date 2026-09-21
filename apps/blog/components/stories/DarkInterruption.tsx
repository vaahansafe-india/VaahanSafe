import * as React from "react";
import Link from "next/link";

export function DarkInterruption() {
  return (
    <section
      aria-labelledby="dark-interruption-title"
      className="my-12 sm:my-16 bg-[#181715] text-[#faf9f5] py-16 sm:py-20 border-y border-[#2e2b27]"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Editorial Idea (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span>QR &amp; IDENTITY PERSPECTIVE</span>
            </div>

            <h2
              id="dark-interruption-title"
              className="
                font-serif
                text-3xl sm:text-4xl lg:text-5xl
                font-normal
                leading-[1.1]
                tracking-[-0.03em]
                text-[#faf9f5]
              "
            >
              A QR should point to an identity. <br />
              <span className="text-[#a09d96]">
                It should not contain your private identity.
              </span>
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-[#a09d96] max-w-xl font-sans">
              Static stickers that hardcode personal telephone numbers and residential addresses create a permanent security liability. VaahanSafe separates the physical optical hardware from private account records through privacy-first identity architecture.
            </p>

            <div className="pt-2">
              <Link
                href="/category/qr-identity"
                className="
                  inline-flex items-center gap-2
                  font-mono text-xs font-semibold uppercase tracking-wider
                  text-[#cc785c] hover:text-[#e8a55a] transition-colors
                  group
                "
              >
                <span>Explore QR &amp; Identity Architecture</span>
                <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>

          {/* Editorial Diagram (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#2e2b27] bg-[#1f1e1b] p-6 sm:p-8 space-y-5 font-mono text-xs">
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#8e8b82]">
                DECOUPLED SAFETY CHAIN
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2e2b27] text-[10px] text-[#cc785c] font-bold">
                    01
                  </span>
                  <div>
                    <div className="text-white font-semibold">VEHICLE</div>
                    <div className="text-[10px] text-[#8e8b82]">Physical automotive hardware</div>
                  </div>
                </div>

                <div className="pl-3 border-l border-[#2e2b27] ml-3 h-3" />

                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2e2b27] text-[10px] text-[#5db8a6] font-bold">
                    02
                  </span>
                  <div>
                    <div className="text-white font-semibold">QR IDENTITY</div>
                    <div className="text-[10px] text-[#8e8b82]">Opaque high-entropy identifier</div>
                  </div>
                </div>

                <div className="pl-3 border-l border-[#2e2b27] ml-3 h-3" />

                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2e2b27] text-[10px] text-[#e8a55a] font-bold">
                    03
                  </span>
                  <div>
                    <div className="text-white font-semibold">PUBLIC RESOLVER</div>
                    <div className="text-[10px] text-[#8e8b82]">Authenticated Edge Relay</div>
                  </div>
                </div>

                <div className="pl-3 border-l border-[#2e2b27] ml-3 h-3" />

                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2e2b27] text-[10px] text-emerald-400 font-bold">
                    04
                  </span>
                  <div>
                    <div className="text-white font-semibold">CONTROLLED SAFETY VIEW</div>
                    <div className="text-[10px] text-[#8e8b82]">Masked VoIP relay &amp; medical alerts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
