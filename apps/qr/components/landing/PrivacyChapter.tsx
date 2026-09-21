import React from "react";
import { ProjectionBoundaryDiagram } from "./ProjectionBoundaryDiagram";

export function PrivacyChapter() {
  return (
    <section id="privacy" className="w-full py-16 sm:py-24 bg-[#181715] text-[#FAF9F5] border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Editorial Statement */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#CC785C]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#CC785C] font-semibold">
              Privacy / Projection Architecture
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-normal tracking-tight text-[#FAF9F5] leading-[1.12]">
            A QR can be public. <br />
            <span className="italic text-[#CC785C]">Your whole identity doesn&apos;t have to be.</span>
          </h2>

          <p className="text-sm sm:text-base text-[#FAF9F5]/70 leading-relaxed font-sans max-w-2xl">
            Most QR codes either dump raw phone numbers into plain text or expose full user profiles.
            VaahanSafe uses server-side whitelisting to expose only the specific safety details you authorize.
          </p>
        </div>

        {/* Boundary Diagram Embedded in Dark Section */}
        <div className="pt-2 text-foreground">
          <ProjectionBoundaryDiagram />
        </div>
      </div>
    </section>
  );
}
