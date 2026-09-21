"use client";

import * as React from "react";
import { HERO_IDENTITY_DEMO } from "../../../lib/demo/identity-demo";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export function IdentityObject() {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [activeSegment, setActiveSegment] = React.useState<"vehicle" | "qr" | "emergency">("qr");
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Subtle 1-3px pointer interaction for desktop (respects reduced motion)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Calculate normalized delta between -1 and 1, damp to max 3px
    const dx = Math.min(Math.max((e.clientX - centerX) / (rect.width / 2), -1), 1) * 3;
    const dy = Math.min(Math.max((e.clientY - centerY) / (rect.height / 2), -1), 1) * 3;
    setOffset({ x: dx, y: dy });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: "transform 0.15s cubic-bezier(0.2, 0, 0, 1)",
      }}
      className="relative w-full max-w-[540px] mx-auto select-none group"
      aria-label="Interactive VaahanSafe Vehicle Safety Identity Artifact"
    >
      {/* Ambient Depth Glow (Teal / Mint Accent, subtle and non-neon) */}
      <div
        className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/10 via-[#22D3A7]/10 to-transparent blur-xl opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Identity Object Container */}
      <div className="relative rounded-2xl border-2 border-border bg-card/95 text-foreground shadow-lg backdrop-blur-sm overflow-hidden transition-colors">
        {/* Top Control Bar: System Name + Live Active Resolver Beacon */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#22D3A7] animate-pulse" />
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-foreground">
              VAHANSAFE IDENTITY
            </span>
            <span className="text-muted-foreground/50 text-xs">•</span>
            <span className="font-mono text-[11px] text-muted-foreground">NODE: D1-IN-NORTH</span>
          </div>

          <Badge variant="signature" className="font-mono text-[11px] px-2 py-0.5 tracking-tight font-bold">
            ACTIVE RESOLVER
          </Badge>
        </div>

        {/* Core Identity Stack */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* SECTION 1: VEHICLE ARCHITECTURAL SCHEMATIC */}
          <div
            onMouseEnter={() => setActiveSegment("vehicle")}
            className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
              activeSegment === "vehicle"
                ? "border-primary/60 bg-accent/25 shadow-xs"
                : "border-border bg-muted/20 hover:border-border/80"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <VaahanIcon name="car" size={18} className="text-primary" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Linked Vehicle Hardware
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-foreground px-2 py-0.5 rounded bg-background border border-border">
                {HERO_IDENTITY_DEMO.vehicle.plateNumber}
              </span>
            </div>

            {/* Vehicle Silhouette & Line Illustration */}
            <div className="relative h-28 w-full rounded-lg bg-gradient-to-b from-muted/40 to-background border border-border/70 flex items-center justify-center overflow-hidden px-4">
              {/* Technical Blueprint Measurement Grid */}
              <div
                className="absolute inset-0 opacity-15 bg-[radial-gradient(#0D4844_1px,transparent_1px)] [background-size:12px_12px]"
                aria-hidden="true"
              />

              {/* High-craft Stylized Vehicle Schematic SVG */}
              <svg
                viewBox="0 0 280 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-20 text-foreground drop-shadow-sm"
                aria-label="Tata Safari Vehicle Profile Schematic"
              >
                {/* Roofline & Window Pillar */}
                <path
                  d="M40 50L68 25H180L218 42L255 48V62H24"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Window Frame Glass */}
                <path
                  d="M74 29H135V48H52L74 29Z"
                  fill="currentColor"
                  fillOpacity="0.12"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M142 29H177L210 48H142V29Z"
                  fill="currentColor"
                  fillOpacity="0.12"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                {/* Wheel Arches & Wheels */}
                <circle cx="68" cy="62" r="14" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.2" />
                <circle cx="68" cy="62" r="6" fill="#22D3A7" />
                <circle cx="212" cy="62" r="14" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.2" />
                <circle cx="212" cy="62" r="6" fill="#22D3A7" />
                {/* Dimension Line & Tag */}
                <line x1="24" y1="74" x2="255" y2="74" stroke="currentColor" strokeOpacity="0.3" strokeDasharray="3 3" />
              </svg>

              {/* Vehicle Title Overprint */}
              <div className="absolute bottom-2 left-3 text-[11px] font-semibold text-foreground/90 flex items-center gap-1.5">
                <span>{HERO_IDENTITY_DEMO.vehicle.make} {HERO_IDENTITY_DEMO.vehicle.model}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{HERO_IDENTITY_DEMO.vehicle.edition}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: THE PERMANENT QR IDENTIFIER & ROUTE TRACE */}
          <div
            onMouseEnter={() => setActiveSegment("qr")}
            className={`relative rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
              activeSegment === "qr"
                ? "border-primary/60 bg-accent/25 shadow-xs"
                : "border-border bg-muted/20 hover:border-border/80"
            }`}
          >
            {/* Route Connector Anchor Line */}
            <div className="absolute -top-3 left-8 w-0.5 h-3 bg-gradient-to-b from-primary/80 to-[#22D3A7]" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* QR Code Precision Module */}
              <div className="flex items-center gap-4">
                {/* Precision QR Frame with Corner Brackets */}
                <div className="relative p-2 rounded-xl bg-white border border-[#DCE5E2] shadow-xs flex-shrink-0">
                  {/* Target Brackets */}
                  <span className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-primary" />
                  <span className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-primary" />
                  <span className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-primary" />
                  <span className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-primary" />

                  {/* Scannable-like Geometric QR Matrix */}
                  <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-14 h-14 text-[#06302E]"
                    aria-hidden="true"
                  >
                    {/* Position Detection Squares */}
                    <rect x="4" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="3" />
                    <rect x="9" y="9" width="8" height="8" fill="currentColor" />

                    <rect x="42" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="3" />
                    <rect x="47" y="9" width="8" height="8" fill="currentColor" />

                    <rect x="4" y="42" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="3" />
                    <rect x="9" y="47" width="8" height="8" fill="currentColor" />

                    {/* Data Matrix Cells */}
                    <rect x="28" y="6" width="6" height="6" fill="#22D3A7" />
                    <rect x="28" y="16" width="6" height="6" fill="currentColor" />
                    <rect x="36" y="24" width="6" height="6" fill="currentColor" />
                    <rect x="24" y="28" width="6" height="6" fill="currentColor" />
                    <rect x="18" y="28" width="6" height="6" fill="#22D3A7" />
                    <rect x="28" y="38" width="6" height="6" fill="currentColor" />
                    <rect x="44" y="28" width="6" height="6" fill="currentColor" />
                    <rect x="52" y="38" width="6" height="6" fill="currentColor" />
                    <rect x="38" y="48" width="6" height="6" fill="#22D3A7" />
                    <rect x="48" y="52" width="6" height="6" fill="currentColor" />
                  </svg>
                </div>

                {/* Permanent Identity Metadata */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    PERMANENT IDENTIFIER
                  </div>
                  <div className="font-mono text-base font-bold tracking-tight text-foreground">
                    {HERO_IDENTITY_DEMO.publicId}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <VaahanIcon name="qr-scan" size={14} className="text-primary" />
                    <span>Permanent URL: qr.vaahansafe.com/{HERO_IDENTITY_DEMO.publicId}</span>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="self-start sm:self-center">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#D1FAED] dark:bg-[#16B98F]/20 px-2.5 py-1 text-xs font-semibold text-[#0D4844] dark:text-[#34D6AE] border border-[#22D3A7]/30">
                  <VaahanIcon name="shield" size={13} />
                  <span>Tamper Verified</span>
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: EMERGENCY PROFILE PROJECTION (CONTROLLED PUBLIC VIEW) */}
          <div
            onMouseEnter={() => setActiveSegment("emergency")}
            className={`relative rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
              activeSegment === "emergency"
                ? "border-primary/60 bg-accent/25 shadow-xs"
                : "border-border bg-muted/20 hover:border-border/80"
            }`}
          >
            {/* Route Connector Anchor Line */}
            <div className="absolute -top-3 left-8 w-0.5 h-3 bg-gradient-to-b from-[#22D3A7] to-primary/80" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VaahanIcon name="phone" size={16} className="text-[#16A36A]" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Emergency Profile Projection
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#16A36A] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                  2 Contacts Active
                </span>
              </div>

              {/* Masked Emergency Action Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-background border border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">Primary Contact</div>
                    <div className="font-mono text-[11px] text-muted-foreground">+91 ••••• ••421</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0 border-border">Masked</Badge>
                </div>

                <div className="p-2.5 rounded-lg bg-background border border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">Secondary Contact</div>
                    <div className="font-mono text-[11px] text-muted-foreground">+91 ••••• ••980</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0 border-border">Masked</Badge>
                </div>
              </div>

              {/* Safety Protocol Note */}
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground flex items-center justify-between">
                <span className="truncate">Emergency Note: Blood Group O+ • Hospital Relay Active</span>
                <span className="font-mono text-[10px] text-primary font-semibold flex-shrink-0 ml-2">RELAY READY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Technical Guarantee Strip */}
        <div className="border-t border-border bg-muted/20 px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5">
            <VaahanIcon name="lock" size={13} className="text-primary" />
            <span>Zero account access exposed to bystander</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            SLA: 99.99% • CF Workers Edge
          </div>
        </div>
      </div>
    </div>
  );
}
