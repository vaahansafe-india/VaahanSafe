"use client";

import React, { useState } from "react";
import { ManualQrEntry } from "./ManualQrEntry";
import { ActivationScanner } from "./ActivationScanner";
import { VaahanIcon } from "@vaahansafe/icons";
import type { RecognizeResultDto } from "@/lib/types";

interface RecognizeQrProps {
  initialPublicId?: string;
  onRecognized: (publicId: string, visibleCode?: string) => void;
}

export function RecognizeQr({ initialPublicId = "", onRecognized }: RecognizeQrProps) {
  const [tab, setTab] = useState<"scan" | "manual">(
    initialPublicId ? "manual" : "scan"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: "error" | "warning";
    text: string;
  } | null>(null);

  const handleRecognizeSubmit = async (rawId: string) => {
    setIsLoading(true);
    setResultMessage(null);

    try {
      const res = await fetch("/api/activate/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: rawId }),
      });

      const data: RecognizeResultDto = await res.json();

      if (data.status === "ELIGIBLE") {
        onRecognized(data.publicId || rawId, data.visibleCode);
      } else if (data.status === "ALREADY_ACTIVATED_BY_YOU") {
        setResultMessage({
          type: "warning",
          text: data.message || "This QR is already activated on your account. You can manage it from your customer dashboard.",
        });
      } else {
        setTab("manual");
        setResultMessage({
          type: "error",
          text: data.message || "We couldn't recognize this VaahanSafe QR. Please verify the identifier and try again.",
        });
      }
    } catch {
      setResultMessage({
        type: "error",
        text: "Could not connect to VaahanSafe verification service. Please check your internet connection.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-2.5">
        <p className="activation-kicker">Identify your sticker</p>
        <h2 className="max-w-2xl font-serif text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[.98] tracking-[-.035em] text-foreground">
          Start with the QR in your kit.
        </h2>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Scan the sticker or enter its printed VaahanSafe ID. This identifies the sticker; activation comes after the security code and vehicle checks.
        </p>
      </div>

      <div className="activation-form-sheet">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-4">
          <p className="text-sm font-semibold text-foreground">How would you like to begin?</p>
          <span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Scan / Enter ID</span>
        </div>
        <div className="grid grid-cols-2 gap-2 border-b border-border py-3">
          <button
            type="button"
            onClick={() => setTab("scan")}
            aria-pressed={tab === "scan"}
            className={`flex min-h-11 items-center justify-center gap-2 border px-2 text-xs font-semibold transition-colors ${tab === "scan" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            <VaahanIcon name="qr-scan" size={15} /> Scan the QR
          </button>
          <button
            type="button"
            onClick={() => setTab("manual")}
            aria-pressed={tab === "manual"}
            className={`flex min-h-11 items-center justify-center gap-2 border px-2 text-xs font-semibold transition-colors ${tab === "manual" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            <VaahanIcon name="edit" size={15} /> Enter ID
          </button>
        </div>
        {tab === "scan" ? (
          <ActivationScanner
            onScanSuccess={(id) => handleRecognizeSubmit(id)}
            onFallbackToManual={() => setTab("manual")}
          />
        ) : (
          <div className="py-5">
            <ManualQrEntry initialValue={initialPublicId} onSubmit={handleRecognizeSubmit} isLoading={isLoading} />
          </div>
        )}
      </div>

      {/* Error / Warning Notice */}
      {resultMessage && (
        <div
          className={`rounded-sm border p-4 text-xs space-y-1 ${
            resultMessage.type === "warning"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
              : "border-destructive/30 bg-destructive/10 text-destructive dark:text-red-400"
          }`}
          role="alert"
        >
          <div className="font-semibold flex items-center gap-2">
            <VaahanIcon name="alert" size={15} />
            <span>
              {resultMessage.type === "warning" ? "Already Registered" : "Verification Notice"}
            </span>
          </div>
          <p className="leading-relaxed pl-6">{resultMessage.text}</p>
        </div>
      )}
    </div>
  );
}
