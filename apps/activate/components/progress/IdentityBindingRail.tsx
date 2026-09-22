"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { ActivationStage } from "@/lib/types";

type Variant = "rail" | "compact" | "ribbon";

interface IdentityBindingRailProps {
  currentStage: ActivationStage;
  variant?: Variant;
  recognizedCode?: string | null;
  selectedVehicleRef?: string | null;
}

const stages: Array<{
  id: ActivationStage;
  number: string;
  short: string;
  label: string;
  description: string;
}> = [
  {
    id: "RECOGNIZE",
    number: "01",
    short: "Scan",
    label: "Scan QR Sticker",
    description: "Scan packaging or type ID",
  },
  {
    id: "VERIFY",
    number: "02",
    short: "Code",
    label: "Security Code",
    description: "Enter 6-digit scratch code",
  },
  {
    id: "IDENTITY",
    number: "03",
    short: "Mobile",
    label: "Verify Mobile",
    description: "Verify phone number via OTP",
  },
  {
    id: "VEHICLE",
    number: "04",
    short: "Vehicle",
    label: "Select Vehicle",
    description: "Choose vehicle to link",
  },
  {
    id: "REVIEW",
    number: "05",
    short: "Confirm",
    label: "Confirm & Activate",
    description: "Finalize and enable protection",
  },
  {
    id: "ACTIVE",
    number: "05",
    short: "Live",
    label: "QR Activated",
    description: "Protection is now active",
  },
];

export function IdentityBindingRail({
  currentStage,
  variant = "rail",
  recognizedCode,
  selectedVehicleRef,
}: IdentityBindingRailProps) {
  const currentIndex = stages.findIndex((item) => item.id === currentStage);

  // Compact bar for mobile screens
  if (variant === "compact" || variant === "ribbon") {
    return (
      <div aria-label="Activation steps" className="w-full">
        <ol className="flex w-full items-center">
          {stages.slice(0, 5).map((item, index) => {
            const completed = index < currentIndex || currentStage === "ACTIVE";
            const current = index === currentIndex && currentStage !== "ACTIVE";

            return (
              <li
                key={item.id}
                aria-current={current ? "step" : undefined}
                className="flex min-w-0 flex-1 items-center last:flex-none"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <StageNode completed={completed} current={current} />

                  <span
                    className={`
                      hidden text-[10px] font-medium
                      sm:block
                      ${current ? "font-semibold text-foreground" : "text-muted-foreground"}
                    `}
                  >
                    {item.short}
                  </span>

                  <span className="sr-only">
                    {item.label}
                    {completed ? ", completed" : current ? ", current step" : ", upcoming step"}
                  </span>
                </div>

                {index !== 4 && (
                  <span
                    aria-hidden="true"
                    className={`
                      mx-1.5 h-0.5 min-w-2 flex-1 rounded-full transition-colors duration-300
                      sm:mx-2.5
                      ${index < currentIndex || currentStage === "ACTIVE" ? "bg-primary" : "bg-border"}
                    `}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  // Desktop vertical rail
  return (
    <div className="relative space-y-6">
      {/* Active Code / Vehicle Badges if present */}
      {(recognizedCode || selectedVehicleRef) && (
        <div className="space-y-2 rounded-xl border border-border/70 bg-card/60 p-3.5 text-xs shadow-2xs">
          {recognizedCode && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">QR Sticker ID:</span>
              <span className="font-mono font-semibold text-foreground">{recognizedCode}</span>
            </div>
          )}
          {selectedVehicleRef && (
            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <span className="text-muted-foreground">Vehicle:</span>
              <span className="font-medium text-foreground truncate max-w-[160px]">
                {selectedVehicleRef}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Stepper List */}
      <ol className="relative space-y-1">
        {stages.slice(0, 5).map((item, index) => {
          const completed = index < currentIndex || currentStage === "ACTIVE";
          const current = index === currentIndex && currentStage !== "ACTIVE";
          const isLast = index === 4;

          return (
            <li
              key={item.id}
              aria-current={current ? "step" : undefined}
              className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-3.5"
            >
              <div className="relative flex justify-center">
                <StageNode completed={completed} current={current} />

                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={`
                      absolute left-1/2 top-[24px]
                      h-[calc(100%-12px)] w-0.5
                      -translate-x-1/2
                      transition-colors duration-300
                      ${index < currentIndex || currentStage === "ACTIVE" ? "bg-primary" : "bg-border/60"}
                    `}
                  />
                )}
              </div>

              <div className="min-h-[58px] pb-5">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`
                      text-xs tracking-tight
                      ${
                        current
                          ? "font-bold text-primary"
                          : completed
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                      }
                    `}
                  >
                    {item.label}
                  </p>

                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {item.number}
                  </span>
                </div>

                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>

                <span className="sr-only">
                  {completed ? "Completed" : current ? "Current step" : "Upcoming"}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Privacy Guarantee Card */}
      <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <VaahanIcon name="shield" size={14} className="text-primary shrink-0" />
          <span>Privacy Protected</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Your phone number is completely private. Scanners reach you safely through VaahanSafe alerts without seeing your contact details.
        </p>
      </div>
    </div>
  );
}

function StageNode({
  completed,
  current,
}: {
  completed: boolean;
  current: boolean;
}) {
  if (completed) {
    return (
      <span
        aria-hidden="true"
        className="relative z-10 mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-2xs"
      >
        <VaahanIcon name="check" size={11} className="stroke-[2.5]" />
      </span>
    );
  }

  if (current) {
    return (
      <span
        aria-hidden="true"
        className="relative z-10 mt-0.5 flex size-5 items-center justify-center rounded-full border-2 border-primary bg-background shadow-xs ring-4 ring-primary/20"
      >
        <span className="size-2 rounded-full bg-primary" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="relative z-10 mt-0.5 flex size-5 items-center justify-center rounded-full border border-border bg-background"
    >
      <span className="size-1.5 rounded-full bg-border" />
    </span>
  );
}
