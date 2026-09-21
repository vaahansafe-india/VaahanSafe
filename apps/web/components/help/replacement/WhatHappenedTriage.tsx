"use client";

import * as React from "react";
import { useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";

type ProblemType = "damaged" | "lost" | "not-scanning" | "other";

interface ProblemOption {
  id: ProblemType;
  label: string;
  sublabel: string;
  guidance: string;
  recommendation: string;
  actionLabel: string;
  actionHref: string;
}

const PROBLEM_OPTIONS: readonly ProblemOption[] = [
  {
    id: "damaged",
    label: "DAMAGED",
    sublabel: "My QR is physically damaged.",
    guidance:
      "Physical abrasion, windshield replacement, or severe stone chip impacts can compromise the high-contrast optical grid. If camera autofocus cannot consistently resolve the code, requesting a replacement decal preserves continuous roadside safety.",
    recommendation:
      "Log into your dashboard, select the affected vehicle, and file a replacement request under 'My QR'. Once the replacement is approved, your prior QR code is revoked and the new decal is linked to your existing vehicle record.",
    actionLabel: "Request Decal Replacement",
    actionHref: "/help/replacement#replacement-journey",
  },
  {
    id: "lost",
    label: "LOST",
    sublabel: "I no longer have the QR.",
    guidance:
      "If an unapplied decal was misplaced during transit, or if a vehicle panel was replaced without recovering the decal, report the serial immediately to prevent unauthorized attachment.",
    recommendation:
      "Navigate to 'My QR' in your customer portal and mark the decal as 'Lost / Inactive'. This immediately neutralizes any roadside scans pointing to your profile. You can then dispatch a fresh replacement kit.",
    actionLabel: "Mark QR as Inactive",
    actionHref: "/help/replacement#replacement-journey",
  },
  {
    id: "not-scanning",
    label: "NOT SCANNING",
    sublabel: "The QR is present but cannot be scanned.",
    guidance:
      "Often caused by heavy aftermarket window tint, dirty windshield glass, direct glare from low sun, or scanning from too close (<15 cm). Before requesting a replacement, ensure the surface is clean and test at a 30 to 50 cm distance.",
    recommendation:
      "Clean the outer glass with a lint-free cloth. Test in shaded daylight with both iOS and Android default camera apps. If the target remains unreadable despite clean glass, proceed with optical replacement.",
    actionLabel: "Review Placement Guidelines",
    actionHref: "/gallery",
  },
  {
    id: "other",
    label: "OTHER ISSUE",
    sublabel: "Something else is wrong.",
    guidance:
      "For issues such as incorrect vehicle make binding, duplicate QR assignment, or dealership retail kit questions, our support engineering team can review your account record directly.",
    recommendation:
      "Reach out to support@vaahansafe.com with your vehicle registration number and the visible public ID (e.g. VS-7F3K-9021) printed on the front face of your decal.",
    actionLabel: "Contact Support Team",
    actionHref: "mailto:support@vaahansafe.com",
  },
];

export function WhatHappenedTriage() {
  const [selectedProblem, setSelectedProblem] = useState<ProblemType>("damaged");
  const activeOption: ProblemOption =
    PROBLEM_OPTIONS.find((o) => o.id === selectedProblem) ?? PROBLEM_OPTIONS[0]!;

  return (
    <section
      aria-labelledby="triage-heading"
      className="
        border-b border-border
        bg-background
        py-16 sm:py-20
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>Interactive Problem Triage</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="triage-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            What happened to your QR?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Select your situation below for tailored resolution guidance and immediate next steps.
          </p>
        </div>

        {/* 4 Interactive Choice Buttons */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEM_OPTIONS.map((option) => {
            const isSelected = option.id === selectedProblem;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedProblem(option.id)}
                aria-pressed={isSelected}
                className={`
                  flex flex-col justify-between rounded-xl border p-5 text-left transition-all
                  ${
                    isSelected
                      ? "border-[#cc785c] bg-white shadow-sm ring-1 ring-[#cc785c]/30 dark:border-[#cc785c] dark:bg-zinc-900"
                      : "border-border bg-muted/50 hover:border-[#cc785c]/40 hover:bg-white dark:border-white/[0.08] dark:bg-zinc-950 dark:hover:bg-zinc-800"
                  }
                `}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold tracking-wider text-[#cc785c]">
                      {option.label}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full transition-colors ${
                        isSelected ? "bg-[#cc785c]" : "bg-transparent border border-border"
                      }`}
                    />
                  </div>

                  <div className="mt-3 font-serif text-base text-foreground dark:text-zinc-50">
                    {option.sublabel}
                  </div>
                </div>

                <div className="mt-4 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {isSelected ? "● Active selection" : "Select situation →"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Context Guidance Panel */}
        <div className="mt-8 rounded-2xl border border-border bg-muted p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-border pb-4 dark:border-white/[0.08]">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
              <VaahanIcon name="info" size={14} aria-hidden="true" />
              <span>Assessment: {activeOption.label}</span>
            </div>
            <span className="font-mono text-[9px] text-muted-foreground">
              RESOLUTION ADVISORY
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7">
              <h3 className="font-serif text-2xl text-foreground dark:text-zinc-50">
                {activeOption.sublabel}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#3f3f46] sm:text-sm dark:text-zinc-400">
                {activeOption.guidance}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 lg:col-span-5 dark:border-white/[0.08] dark:bg-zinc-950">
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#5db8a6]">
                Recommended Action
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                {activeOption.recommendation}
              </p>

              <div className="mt-4 pt-4 border-t border-[#f0eae1] dark:border-white/[0.06]">
                <a
                  href={activeOption.actionHref}
                  className="
                    inline-flex h-9 items-center justify-center gap-2
                    rounded-md bg-[#09090b] px-4
                    font-mono text-[10px] font-medium uppercase tracking-[0.14em]
                    text-white transition-colors
                    hover:bg-[#27272a]
                    dark:bg-background dark:text-foreground dark:hover:bg-[#e4e4e7]
                  "
                >
                  <span>{activeOption.actionLabel}</span>
                  <VaahanIcon name="arrow-right" size={10} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
