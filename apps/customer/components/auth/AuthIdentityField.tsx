import * as React from "react";
import { ALL_CORNERS_PATH, VEHICLE_BODY_PATH } from "@vaahansafe/ui/brand";

/**
 * AuthIdentityField
 *
 * Decorative background layer for the authentication doorway.
 *
 * Concept:
 * PHYSICAL VEHICLE
 *       ↓
 * DIGITAL IDENTITY
 *
 * Requirements:
 * - aria-hidden="true"
 * - Very low opacity
 * - Oversized registration arcs
 * - Sparse QR fragments
 * - Tiny coordinate marks
 * - Registration notches
 * - One coral identity point
 * - Subtle vehicle contour
 * - Thin identity rails
 * - Quiet on mobile
 */
export function AuthIdentityField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
    >
      <svg
        viewBox="0 0 1440 1000"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full text-foreground/[0.04]"
        focusable="false"
      >
        {/* ========================================================== */}
        {/* OVERSIZED REGISTRATION ARCS                                */}
        {/* ========================================================== */}
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        >
          {/* Outer sweeping arcs */}
          <path d="M-100 860 C120 860 140 440 340 440 C460 440 480 260 580 180" />
          <path d="M920 180 C1020 260 1040 440 1160 440 C1360 440 1380 860 1560 860" />

          <path d="M-60 930 C200 930 220 620 400 620" />
          <path d="M1040 620 C1220 620 1240 930 1520 930" />

          {/* Upper framing rails */}
          <path d="M120 150 V80 H360" />
          <path d="M1080 80 H1320 V150" />

          {/* Lower framing rails */}
          <path d="M120 800 V920 H380" />
          <path d="M1060 920 H1320 V800" />

          {/* Side alignment lines */}
          <path d="M80 660 H240" />
          <path d="M1200 660 H1360" />

          {/* Crosshairs */}
          <path d="M180 680 H220" />
          <path d="M200 660 V700" />

          <path d="M1220 680 H1260" />
          <path d="M1240 660 V700" />

          {/* Central datum line with ticks */}
          <path d="M520 880 H920" />
          <path d="M720 880 V950" />

          <path d="M520 875 V885" />
          <path d="M620 876 V884" />
          <path d="M720 874 V886" />
          <path d="M820 876 V884" />
          <path d="M920 875 V885" />
        </g>

        {/* ========================================================== */}
        {/* SPARSE QR FRAGMENTS                                        */}
        {/* ========================================================== */}
        <g
          className="hidden sm:block"
          fill="currentColor"
          transform="translate(160 220) scale(1.6)"
        >
          <path d={ALL_CORNERS_PATH} fillRule="evenodd" />
        </g>

        <g
          className="hidden sm:block"
          fill="currentColor"
          transform="translate(1200 220) scale(1.6)"
        >
          <path d={ALL_CORNERS_PATH} fillRule="evenodd" />
        </g>

        {/* ========================================================== */}
        {/* VEHICLE CONTOUR SILHOUETTE                                 */}
        {/* ========================================================== */}
        <path
          className="hidden sm:block"
          d={VEHICLE_BODY_PATH}
          fill="currentColor"
          fillRule="evenodd"
          transform="translate(470 520) scale(15.5)"
        />

        {/* ========================================================== */}
        {/* CENTRAL REGISTRATION TARGET                                */}
        {/* ========================================================== */}
        <g
          fill="none"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
        >
          <circle cx="720" cy="500" r="160" />
          <circle cx="720" cy="500" r="120" strokeDasharray="3 6" />

          {/* Targeting notches */}
          <path d="M720 320 V350" />
          <path d="M720 650 V680" />
          <path d="M540 500 H570" />
          <path d="M870 500 H900" />
        </g>

        {/* ========================================================== */}
        {/* REGISTRATION NOTCHES & COORDINATE MARKS                     */}
        {/* ========================================================== */}
        <g
          className="hidden md:block font-mono text-[9px] uppercase tracking-[0.24em]"
          fill="currentColor"
        >
          <text x="140" y="110">01 // VEHICLE REGISTRATION</text>
          <text x="1100" y="110">02 // SECURE CREDENTIAL</text>
          <text x="140" y="860">VS // AUTH GATEWAY</text>
          <text x="1100" y="860">IDENTITY RESOLVER // IN</text>
        </g>

        {/* Corner registration rectangles */}
        <g fill="currentColor">
          <rect x="120" y="146" width="16" height="2" rx="1" />
          <rect x="1304" y="146" width="16" height="2" rx="1" />
          <rect x="120" y="798" width="16" height="2" rx="1" />
          <rect x="1304" y="798" width="16" height="2" rx="1" />
        </g>

        {/* ========================================================== */}
        {/* THE SIGNATURE CORAL IDENTITY POINT                         */}
        {/* ========================================================== */}
        <g>
          {/* Subtle glow halo */}
          <circle
            cx="720"
            cy="365"
            r="12"
            fill="#cc785c"
            fillOpacity="0.12"
          />
          {/* Main coral point */}
          <circle
            cx="720"
            cy="365"
            r="4.5"
            fill="#cc785c"
          />
        </g>

        {/* Secondary anchor points */}
        <g fill="currentColor">
          <circle cx="200" cy="680" r="3.5" />
          <circle cx="1240" cy="680" r="3.5" />
        </g>
      </svg>
    </div>
  );
}
