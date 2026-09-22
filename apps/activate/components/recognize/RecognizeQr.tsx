"use client";

import React, { useState } from "react";
import { ManualQrEntry } from "./ManualQrEntry";
import { ActivationScanner } from "./ActivationScanner";
import { Button } from "@vaahansafe/ui/components";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
          Activate your <span className="text-foreground">VaahanSafe QR</span>
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed w-full max-w-xl">
          Link your physical QR sticker to your vehicle. Once active, emergency alerts and vehicle safety protection start working immediately.
        </p>
      </div>

      {/* Segmented Control Tabs — Full Width on Mobile, Inline on Desktop */}
      <div className="grid w-full grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border sm:inline-flex sm:w-auto">
        <button
          type="button"
          onClick={() => setTab("scan")}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
            tab === "scan"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <VaahanIcon name="qr-scan" size={14} className={tab === "scan" ? "text-primary" : "text-muted-foreground"} />
          <span className="truncate">Scan with Camera</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("manual")}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
            tab === "manual"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <VaahanIcon name="edit" size={14} className={tab === "manual" ? "text-primary" : "text-muted-foreground"} />
          <span className="truncate">Enter ID Manually</span>
        </button>
      </div>

      {/* Main Interaction Area */}
      {tab === "scan" && (
        <div className="w-full space-y-4">
          <ActivationScanner
            onScanSuccess={(id) => handleRecognizeSubmit(id)}
            onFallbackToManual={() => setTab("manual")}
          />
        </div>
      )}

      {tab === "manual" && (
        <div className="w-full rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <ManualQrEntry
            initialValue={initialPublicId}
            onSubmit={handleRecognizeSubmit}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Error / Warning Notice */}
      {resultMessage && (
        <div
          className={`rounded-lg border p-4 text-xs space-y-1 ${
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
