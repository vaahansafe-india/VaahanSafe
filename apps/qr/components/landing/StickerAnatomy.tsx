import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
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
    <section className="w-full py-16 sm:py-24 border-b border-border/80 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary font-semibold">
            <span>04</span>
            <span>&bull;</span>
            <span>Industrial Hardware</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-[1.15]">
            Engineered for the vehicle. <br />
            <span className="italic text-primary font-medium">Sticker anatomy.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Every VaahanSafe physical QR is printed on UV-resistant, weatherproof automotive vinyl
            built to withstand Indian monsoons, heat, and highway grit.
          </p>
        </div>

        {/* Anatomy Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Exploded Visual Presentation (Left 5-6 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[300px] rounded-3xl border-2 border-[#E6DFD8] bg-[#FAF9F5] p-6 shadow-md select-none space-y-4">
              {/* 03: Top Emblem & Brand */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD8]">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-[#CC785C]/15 text-[#CC785C] flex items-center justify-center border border-[#CC785C]/30">
                    <VaahanIcon name="shield" size={13} />
                  </div>
                  <span className="font-serif text-xs font-bold text-[#141413]">
                    VAAHANSAFE
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-[8px] uppercase tracking-wider text-[#6C6A64]">
                  #03 Emblem
                </Badge>
              </div>

              {/* 01: QR Matrix Graphic */}
              <div className="flex flex-col items-center py-2 relative">
                <div className="p-3 bg-white rounded-xl border border-[#E6DFD8] shadow-xs">
                  <div className="size-28 bg-[#141413] rounded-lg flex items-center justify-center text-[#FAF9F5] p-2">
                    <div className="grid grid-cols-5 gap-1 w-full h-full p-1">
                      <div className="bg-[#FAF9F5] rounded-xs" />
                      <div className="bg-[#CC785C] rounded-xs" />
                      <div className="bg-[#FAF9F5] rounded-xs" />
                      <div className="bg-[#FAF9F5] rounded-xs" />
                      <div className="bg-[#CC785C] rounded-xs" />
                      <div className="bg-[#FAF9F5] rounded-xs" />
                      <div className="bg-[#141413] rounded-xs" />
                      <div className="bg-[#CC785C] rounded-xs" />
                      <div className="bg-[#141413] rounded-xs" />
                      <div className="bg-[#FAF9F5] rounded-xs" />
                      <div className="bg-[#CC785C] rounded-xs" />
                      <div className="bg-[#FAF9F5] rounded-xs" />
                      <div className="bg-[#CC785C] rounded-xs" />
                      <div className="bg-[#FAF9F5] rounded-xs" />
                      <div className="bg-[#141413] rounded-xs" />
                      <div className="bg-[#FAF9F5] rounded-xs" />
                      <div className="bg-[#141413] rounded-xs" />
                      <div className="bg-[#FAF9F5] rounded-xs" />
                      <div className="bg-[#CC785C] rounded-xs" />
                      <div className="bg-[#FAF9F5] rounded-xs" />
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#6C6A64] mt-1.5">
                  #01 QR Matrix
                </span>
              </div>

              {/* 02: Visible ID */}
              <div className="text-center p-2 rounded-lg bg-white border border-[#E6DFD8]">
                <span className="font-mono text-xs font-bold text-[#141413] tracking-wider block">
                  VS-7F3K-9021
                </span>
                <span className="font-mono text-[8px] uppercase tracking-wider text-[#6C6A64]">
                  #02 Visible ID
                </span>
              </div>

              {/* 04: Scratch Secret Area */}
              <div className="text-center p-2 rounded-lg bg-[#E6DFD8]/40 border border-dashed border-[#CC785C]/60 space-y-0.5">
                <span className="font-mono text-[10px] tracking-widest text-[#6C6A64] block font-bold">
                  &bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;
                </span>
                <span className="font-mono text-[8px] uppercase tracking-wider text-[#CC785C] block">
                  #04 Scratch PIN (DEMO ONLY)
                </span>
              </div>

              {/* 05: Scan Prompt */}
              <div className="text-center pt-1 border-t border-[#E6DFD8]">
                <span className="text-[10px] text-[#3D3D3A] font-medium block">
                  Scan with Camera for Emergency Contact
                </span>
                <span className="font-mono text-[8px] uppercase tracking-wider text-[#6C6A64]">
                  #05 Instructions
                </span>
              </div>
            </div>
          </div>

          {/* Annotations List (Right 6-7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {annotations.map((a) => (
              <div
                key={a.num}
                className="p-4 rounded-xl border border-border/80 bg-background flex items-start gap-4 shadow-xs"
              >
                <span className="size-7 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-primary/20">
                  {a.num}
                </span>
                <div className="space-y-1">
                  <h3 className="font-serif text-base font-semibold text-foreground tracking-tight">
                    {a.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
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
