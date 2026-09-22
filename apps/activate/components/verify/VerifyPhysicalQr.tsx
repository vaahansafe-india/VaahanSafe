"use client";

import React, { useState } from "react";
import { ActivationCodeInput } from "./ActivationCodeInput";
import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import type { VerifyProofResultDto } from "@/lib/types";

interface VerifyPhysicalQrProps {
  publicId: string;
  visibleCode?: string;
  onProofVerified: (expiresAt?: string) => void;
  onResetToRecognize: () => void;
}

export function VerifyPhysicalQr({
  publicId,
  visibleCode,
  onProofVerified,
  onResetToRecognize,
}: VerifyPhysicalQrProps) {
  const [scratchCode, setScratchCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchCode.trim() || isLoading || isLocked) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/activate/verify-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId,
          scratchCode: scratchCode.trim(),
        }),
      });

      const data: VerifyProofResultDto = await res.json();

      if (data.success) {
        onProofVerified(data.expiresAt);
      } else {
        if (data.isLocked) {
          setIsLocked(true);
          setLockedUntil(data.lockedUntil || null);
        }
        setError(data.error || "We couldn't verify this activation code. Please verify the characters and try again.");
      }
    } catch {
      setError("Connection error. Could not reach the verification service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const displayCode = visibleCode || publicId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
          Enter Scratch Security Code
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed">
          Scratch the silver security panel on your sticker packaging to reveal your 6-character code.
        </p>
      </div>

      {/* Recognized Sticker Identity Row */}
      <div className="flex items-center justify-between border-y border-border py-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
              QR Identity
            </div>
            <div className="font-mono text-sm font-bold text-foreground">
              {displayCode}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetToRecognize}
          className="font-mono text-[11px] text-muted-foreground hover:text-foreground underline transition-colors"
        >
          Change QR
        </button>
      </div>

      {/* Proof Submission Form */}
      <form onSubmit={handleVerifySubmit} className="space-y-5">
        <ActivationCodeInput
          value={scratchCode}
          onChange={setScratchCode}
          disabled={isLoading || isLocked}
          error={error}
        />

        {isLocked && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-semibold flex items-center gap-2">
              <VaahanIcon name="lock" size={14} />
              <span>Temporary Verification Lock</span>
            </div>
            <p className="leading-relaxed pl-5 text-[11px]">
              Multiple failed attempts detected. For this sticker&apos;s protection, verification is locked temporarily.
              {lockedUntil && (
                <span className="block pt-1 font-mono">
                  Unlocks around: {new Date(lockedUntil).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || isLocked || !scratchCode.trim()}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Verifying Proof...</span>
            </div>
          ) : (
            <span>Verify QR</span>
          )}
        </Button>
      </form>

      {/* Security microcopy note */}
      <div className="border-t border-border pt-3 text-[11px] font-mono text-muted-foreground leading-relaxed">
        This code verifies possession of the physical QR. It does not prove vehicle ownership.
      </div>
    </div>
  );
}
