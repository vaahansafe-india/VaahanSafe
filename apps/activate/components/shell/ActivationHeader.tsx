"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@vaahansafe/ui/theme";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components";
import type { ActivationSessionUserDto } from "@/lib/types";

interface ActivationHeaderProps {
  user: ActivationSessionUserDto | null;
}

export function ActivationHeader({ user }: ActivationHeaderProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <header className="sticky inset-x-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div
          className="
            mx-auto flex h-14 sm:h-[72px] w-full max-w-[1288px]
            items-center justify-between
            px-3.5 sm:px-6 lg:px-8
          "
        >
          <Link
            href="/"
            className="
              group flex min-w-0 items-center gap-1.5 sm:gap-3
              rounded-sm
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-ring
              focus-visible:ring-offset-4
              focus-visible:ring-offset-background
            "
            aria-label="VaahanSafe Activate home"
          >
            <VaahanSafeLogo size="sm" variant="brand" showTagline={false} className="shrink-0 scale-90 sm:scale-100 origin-left" />

            <div className="flex min-w-0 items-center">
              <span className="mx-1.5 sm:mx-2.5 h-3.5 w-px bg-border shrink-0" />

              <span className="font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider sm:tracking-[0.14em] text-primary whitespace-nowrap">
                Retail activation
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="
                inline-flex min-h-9 items-center px-2 py-1
                text-xs font-medium text-muted-foreground
                transition-colors hover:text-foreground
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-ring
              "
              aria-label="Open activation help"
            >
              Help
            </button>

            <ThemeToggle className="h-9 w-9 sm:h-11 sm:w-11 rounded-sm border-border shrink-0" />

            {user && (
              <div className="hidden items-center gap-3 border-l border-border pl-4 md:flex">
                <span
                  aria-hidden="true"
                  className="size-1.5 bg-primary"
                />

                <div className="max-w-36">
                  <p className="truncate text-xs font-medium">
                    {user.displayName ?? user.name ?? user.maskedPhone ?? "Account"}
                  </p>

                  {user.phoneVerified && (
                    <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                      Mobile verified
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Help Modal — Responsive Contextual Guidance */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto rounded-sm p-5 sm:p-6 border border-border bg-background shadow-xl">
          <DialogHeader className="pr-8 sm:pr-0">
            <DialogTitle className="text-base sm:text-lg font-bold tracking-tight">
              Activation help
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              What you need to connect a physical QR to a vehicle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 pt-2 text-xs text-muted-foreground">
            <div className="border-b border-border py-3 space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-2">
                <span className="font-mono text-[10px] text-primary">01</span>
                <span>Public QR Identification</span>
              </div>
              <p className="leading-relaxed text-[11px] sm:text-xs pl-5">
                Scanning identifies the QR. It does not activate any service.
              </p>
            </div>

            <div className="border-b border-border py-3 space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-2">
                <span className="font-mono text-[10px] text-primary">02</span>
                <span>Silver Scratch Possession Proof</span>
              </div>
              <p className="leading-relaxed text-[11px] sm:text-xs pl-5">
                Enter the protected code from the physical package to verify possession.
              </p>
            </div>

            <div className="border-b border-border py-3 space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-2">
                <span className="font-mono text-[10px] text-primary">03</span>
                <span>Connect to a vehicle</span>
              </div>
              <p className="leading-relaxed text-[11px] sm:text-xs pl-5">
                Sign in with a verified mobile number, choose your vehicle, and confirm the connection.
              </p>
            </div>

            <div className="border-t border-border pt-3 text-[11px] text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span>Code damaged or unreadable?</span>
              <a
                href="mailto:support@vaahansafe.com"
                className="font-medium text-primary hover:underline"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
