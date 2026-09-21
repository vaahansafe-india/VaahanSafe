"use client";

import * as React from "react";
import { QrIdentityHero } from "./QrIdentityHero";
import { CurrentQrIdentity } from "./CurrentQrIdentity";
import { QrActionStation } from "./QrActionStation";
import { QrVehicleList } from "./QrVehicleList";
import { QrPlacementGuide, QrHelpSurface } from "./QrPlacementGuide";
import { QrFrame } from "../primitives/QrFrame";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VaahanIcon } from "@vaahansafe/icons";
import { AlertTriangle, Copy } from "lucide-react";
import type { QrOverviewData } from "@/lib/qr-types";

interface QrOverviewControllerProps {
  overview: QrOverviewData;
}

export function QrOverviewController({ overview }: QrOverviewControllerProps) {
  const [inspectOpen, setInspectOpen] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const primarySticker = overview.primarySticker;

  const handleCopyUrl = async () => {
    if (!primarySticker?.resolverUrl) return;
    try {
      await navigator.clipboard.writeText(primarySticker.resolverUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Flagship Asymmetric Hero */}
      <QrIdentityHero
        overview={overview}
        onOpenSignalNode={() => setInspectOpen(true)}
      />

      {/* 2. Attention Rail (if any vehicles need QR or contacts) */}
      {overview.attentionItems.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
          <div className="flex items-center gap-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            <span>ACTION REQUIRED FOR OPTIMAL SAFETY ROUTING</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {overview.attentionItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-background/80 p-3"
              >
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {item.title}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {item.description}
                  </div>
                </div>
                <a
                  href={item.actionHref}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#cc785c] px-3 font-mono text-[11px] font-semibold uppercase text-white hover:bg-[#b5654b] transition-colors"
                >
                  <span>{item.actionLabel}</span>
                  <VaahanIcon name="arrow-right" size={11} aria-hidden="true" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Action Station ("What would you like to do?") */}
      <QrActionStation
        recommendedAction={overview.recommendedAction}
        stickersCount={overview.stickersCount}
        vehiclesCount={overview.vehicles.length}
      />

      {/* 4. Current Hardware Identity Anchor & Fleet Relationship */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <CurrentQrIdentity
            sticker={overview.primarySticker}
            onInspectQr={() => setInspectOpen(true)}
          />
        </div>
        <div className="lg:col-span-5">
          <QrVehicleList vehicles={overview.vehicles} />
        </div>
      </div>

      {/* 5. Automotive Guidance & Support */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <QrPlacementGuide />
        </div>
        <div className="lg:col-span-5">
          <QrHelpSurface />
        </div>
      </div>

      {/* Modal Dialog for QR Inspection */}
      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="max-w-md bg-card border-border p-6 text-foreground">
          <DialogHeader>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
              QR INSPECTOR
            </div>
            <DialogTitle className="font-serif text-xl font-medium">
              Authoritative QR Sticker
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Official printed identity matrix and permanent Cloudflare D1 resolver endpoint.
            </DialogDescription>
          </DialogHeader>

          {primarySticker && (
            <div className="mt-4 flex flex-col items-center">
              <QrFrame
                publicId={primarySticker.publicId}
                visibleCode={primarySticker.visibleCode}
                status={primarySticker.status}
                size={200}
              />

              <div className="mt-5 w-full rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Public Code:</span>
                  <span className="font-mono font-bold">{primarySticker.visibleCode}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {primarySticker.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Permanent Resolver:</span>
                  <span className="font-mono text-[11px] truncate max-w-[200px]">
                    {primarySticker.resolverUrl}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex w-full gap-2">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 font-mono text-xs font-semibold uppercase text-foreground hover:bg-muted transition-colors"
                >
                  <Copy className="size-3.5" aria-hidden="true" />
                  <span>{copiedUrl ? "Copied!" : "Copy Resolver Link"}</span>
                </button>
                <a
                  href={primarySticker.resolverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase text-white hover:bg-[#b5654b] transition-colors"
                >
                  <VaahanIcon name="external-link" size={13} aria-hidden="true" />
                  <span>Test Scan</span>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
