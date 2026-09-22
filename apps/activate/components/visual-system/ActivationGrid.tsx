"use client";

import React from "react";
import type { ActivationStage } from "@/lib/types";

interface ActivationGridProps {
  stage: ActivationStage;
}

const ORDER: ActivationStage[] = [
  "RECOGNIZE",
  "VERIFY",
  "IDENTITY",
  "VEHICLE",
  "REVIEW",
  "ACTIVE",
];

function stageReached(
  current: ActivationStage,
  target: ActivationStage,
) {
  return ORDER.indexOf(current) >= ORDER.indexOf(target);
}

export function ActivationGrid({
  stage,
}: ActivationGridProps) {
  const verified = stageReached(stage, "IDENTITY");
  const identity = stageReached(stage, "VEHICLE");
  const vehicle = stageReached(stage, "REVIEW");
  const active = stage === "ACTIVE";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Very subtle material texture */}
      <div className="absolute inset-0 bg-background" />

      {/* Desktop topology */}
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        className="
          absolute inset-0 hidden h-full w-full
          text-foreground
          opacity-[0.05]
          lg:block
          dark:opacity-[0.07]
        "
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        >
          {/* Left registration architecture */}
          <path d="M70 150 H210 V105 H305" opacity=".28" />
          <path d="M0 620 H145 V575 H260" opacity=".18" />
          <path d="M115 845 H280" opacity=".18" />

          {/* Right registration architecture */}
          <path d="M1320 120 H1500 V205 H1600" opacity=".24" />
          <path d="M1390 660 H1535 V610 H1600" opacity=".18" />
          <path d="M1280 875 H1480 V835" opacity=".18" />

          {/* QR corner fragments */}
          <path d="M350 190 H405 M350 190 V245" opacity=".32" />
          <path d="M1185 285 H1240 M1240 285 V340" opacity=".25" />
          <path d="M285 755 H335 M285 705 V755" opacity=".2" />

          {/* Structural central rails */}
          <path
            d="M535 350 H685 V430 H790"
            opacity={verified ? ".72" : ".22"}
            className="transition-opacity duration-700"
          />

          <path
            d="M1065 350 H930 V430 H810"
            opacity={vehicle ? ".72" : ".2"}
            className="transition-opacity duration-700"
          />

          <path
            d="M800 430 V600"
            opacity={identity ? ".7" : ".18"}
            className="transition-opacity duration-700"
          />

          <path
            d="M800 600 V770"
            opacity={active ? ".9" : ".16"}
            className="transition-opacity duration-700"
          />

          {/* Secondary incomplete rails */}
          <path d="M435 500 H520 V535" opacity=".16" />
          <path d="M1115 520 H1040 V565" opacity=".16" />
          <path d="M660 825 H735" opacity=".16" />
          <path d="M875 825 H960" opacity=".16" />

          {/* Tiny coordinate ticks */}
          <path d="M205 310 H230" opacity=".3" />
          <path d="M217.5 297.5 V322.5" opacity=".3" />

          <path d="M1290 470 H1315" opacity=".26" />
          <path d="M1302.5 457.5 V482.5" opacity=".26" />

          <path d="M1130 790 H1150" opacity=".2" />
          <path d="M1140 780 V800" opacity=".2" />
        </g>

        {/* Registration dots */}
        <g fill="currentColor">
          <circle cx="210" cy="105" r="2.5" opacity=".35" />
          <circle cx="145" cy="575" r="2" opacity=".25" />
          <circle cx="1500" cy="205" r="2.5" opacity=".32" />
          <circle cx="1390" cy="660" r="2" opacity=".22" />
          <circle cx="435" cy="500" r="2" opacity=".22" />
          <circle cx="1115" cy="520" r="2" opacity=".22" />
        </g>

        {/* QR node */}
        <g>
          <circle
            cx="535"
            cy="350"
            r="6"
            className="fill-foreground"
          />

          <circle
            cx="535"
            cy="350"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity=".16"
          />
        </g>

        {/* Verification node */}
        <circle
          cx="800"
          cy="430"
          r="6"
          className={
            verified
              ? "fill-primary transition-colors duration-700"
              : "fill-background stroke-border"
          }
          strokeWidth="1"
        />

        {/* Vehicle node */}
        <circle
          cx="1065"
          cy="350"
          r="6"
          className={
            vehicle
              ? "fill-foreground transition-colors duration-700"
              : "fill-background stroke-border"
          }
          strokeWidth="1"
        />

        {/* Identity node */}
        <circle
          cx="800"
          cy="600"
          r="6"
          className={
            identity
              ? "fill-primary transition-colors duration-700"
              : "fill-background stroke-border"
          }
          strokeWidth="1"
        />

        {/* Active node */}
        <circle
          cx="800"
          cy="770"
          r="7"
          className={
            active
              ? "fill-[var(--activation-success)] transition-colors duration-700"
              : "fill-background stroke-border"
          }
          strokeWidth="1"
        />
      </svg>



      {/* Subtle edge fades */}
      <div
        aria-hidden="true"
        className="
          absolute inset-x-0 top-0 h-36
          bg-gradient-to-b from-background via-background/80 to-transparent
        "
      />

      <div
        aria-hidden="true"
        className="
          absolute inset-x-0 bottom-0 h-28
          bg-gradient-to-t from-background to-transparent
        "
      />
    </div>
  );
}
