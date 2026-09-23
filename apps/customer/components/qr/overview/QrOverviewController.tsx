"use client";

import * as React from "react";
import Link from "next/link";
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
import type { QrOverviewData, QrSignalRailStates } from "@/lib/qr-types";

interface QrOverviewControllerProps {
  overview: QrOverviewData;
}

export function QrOverviewController({ overview }: QrOverviewControllerProps) {
  const [inspectOpen, setInspectOpen] = React.useState(false);
  const [activeNode, setActiveNode] = React.useState<keyof QrSignalRailStates | "qr" | null>(null);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const primarySticker = overview.primarySticker;
  const primaryVehicle = overview.primaryVehicle;

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

  const handleTestScan = () => {
    if (!primarySticker?.publicId) return;
    try {
      fetch("/api/qr/test-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: primarySticker.publicId }),
      }).catch(() => {});
    } catch {
      // Ignored
    }
  };

  const handleOpenNode = (nodeKey: string) => {
    setActiveNode(nodeKey as keyof QrSignalRailStates);
    setInspectOpen(true);
  };

  const handleInspectQr = () => {
    setActiveNode("qrNode");
    setInspectOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Flagship Asymmetric Hero */}
      <QrIdentityHero
        overview={overview}
        onOpenSignalNode={handleOpenNode}
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
            onInspectQr={handleInspectQr}
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

      {/* Contextual Modal Dialog for Inspection */}
      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="w-full sm:max-w-md rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-6 text-foreground shadow-2xl overflow-hidden">
          {/* Node 01: VEHICLE INSPECTOR */}
          {activeNode === "vehicleNode" && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
                  <VaahanIcon name="vehicle" size={13} aria-hidden="true" />
                  <span>01 VEHICLE INSPECTOR</span>
                </div>
                <DialogTitle className="font-serif text-xl sm:text-2xl font-medium text-foreground">
                  {primaryVehicle
                    ? `${primaryVehicle.make} ${primaryVehicle.model}`
                    : "Vehicle Fleet Registration"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Official RTO registration and physical chassis record bound to VaahanSafe Cloudflare D1.
                </DialogDescription>
              </DialogHeader>

              {primaryVehicle ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          License Plate
                        </div>
                        <div className="font-mono text-lg font-bold tracking-wider text-foreground">
                          {primaryVehicle.maskedPlate}
                        </div>
                      </div>
                      <span className="rounded-md border border-border bg-background px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-foreground">
                        {primaryVehicle.type || "Vehicle"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">D1 Identity Key:</span>
                        <span className="font-mono font-bold text-[#cc785c]">
                          {primaryVehicle.identityId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">QR Hardware Link:</span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {primaryVehicle.qrStatus === "ACTIVATED" ? "Active Linked" : "Not Linked"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Emergency Contacts:</span>
                        <span className="font-mono font-semibold text-foreground">
                          {primaryVehicle.hasEmergencyContacts ? "Configured" : "None Configured"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Public Safety View:</span>
                        <span className="font-mono font-semibold text-foreground">
                          {primaryVehicle.isSafetyViewConfigured ? "Configured" : "Pending Setup"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row gap-2">
                    <Link
                      href="/vehicles"
                      onClick={() => setInspectOpen(false)}
                      className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase text-white hover:bg-[#b5654b] transition-colors"
                    >
                      <span>Manage Vehicle Fleet</span>
                      <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      No primary vehicle is currently enrolled in your Cloudflare D1 account.
                    </p>
                  </div>
                  <Link
                    href="/vehicles"
                    onClick={() => setInspectOpen(false)}
                    className="inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase text-white hover:bg-[#b5654b] transition-colors"
                  >
                    <span>Register a Vehicle</span>
                    <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Node 02: IDENTITY VAULT */}
          {activeNode === "identityNode" && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
                  <VaahanIcon name="shield" size={13} aria-hidden="true" />
                  <span>02 IDENTITY VAULT</span>
                </div>
                <DialogTitle className="font-serif text-xl sm:text-2xl font-medium text-foreground">
                  Cryptographic Vehicle Identity
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Privacy-first identity vault ensuring your personal phone number and private records are never exposed to the public.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">D1 Identity Token:</span>
                    <span className="font-mono text-xs font-bold text-[#cc785c]">
                      {primaryVehicle?.identityId || "D1-VAULT-PROTECTED"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Privacy Protection:</span>
                    <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Cloudflare D1 Proxy Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Direct PII Exposure:</span>
                    <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      0% (Zero PII Exposed)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Anti-Abuse Engine:</span>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      Cloudflare Turnstile Verified
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-muted-foreground leading-relaxed">
                  When passersby scan your vehicle&apos;s physical QR, all communication travels through an encrypted relay. Your personal phone number and private records remain strictly protected.
                </div>

                <Link
                  href="/vehicles"
                  onClick={() => setInspectOpen(false)}
                  className="inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase text-white hover:bg-[#b5654b] transition-colors"
                >
                  <span>View Identity in Vehicles</span>
                  <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}

          {/* Node 03: QR HARDWARE (or default QR inspection) */}
          {(activeNode === "qrNode" || activeNode === "qr" || !activeNode) && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
                  <VaahanIcon name="qr" size={13} aria-hidden="true" />
                  <span>03 QR HARDWARE</span>
                </div>
                <DialogTitle className="font-serif text-xl sm:text-2xl font-medium text-foreground">
                  Authoritative QR Sticker
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Official printed identity matrix and permanent Cloudflare D1 resolver endpoint.
                </DialogDescription>
              </DialogHeader>

              {primarySticker ? (
                <div className="mt-4 flex flex-col items-center">
                  <QrFrame
                    publicId={primarySticker.publicId}
                    visibleCode={primarySticker.visibleCode}
                    status={primarySticker.status}
                    size={190}
                  />

                  <div className="mt-4 w-full rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Public Code:</span>
                      <span className="font-mono font-bold text-foreground">{primarySticker.visibleCode}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {primarySticker.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Permanent Resolver:</span>
                      <span className="font-mono text-[11px] truncate max-w-[200px] text-foreground">
                        {primarySticker.resolverUrl}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex w-full flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 font-mono text-xs font-semibold uppercase text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Copy className="size-3.5" aria-hidden="true" />
                      <span>{copiedUrl ? "Copied!" : "Copy Link"}</span>
                    </button>
                    <a
                      href={primarySticker.resolverUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleTestScan}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase text-white hover:bg-[#b5654b] transition-colors"
                    >
                      <VaahanIcon name="external-link" size={13} aria-hidden="true" />
                      <span>Test Scan</span>
                    </a>
                  </div>

                  <div className="mt-3 text-center">
                    <Link
                      href="/qr/replace"
                      onClick={() => setInspectOpen(false)}
                      className="font-mono text-[11px] text-[#cc785c] hover:underline"
                    >
                      Damaged or peeled sticker? Request Replacement &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      No physical QR sticker has been bound to this vehicle yet. Activate an existing retail pack or order a new safety kit.
                    </p>
                  </div>
                  <div className="flex flex-row gap-2">
                    <Link
                      href="/qr/activate"
                      onClick={() => setInspectOpen(false)}
                      className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#cc785c] px-3 font-mono text-xs font-semibold uppercase text-white hover:bg-[#b5654b] transition-colors text-center"
                    >
                      <span>Activate Retail QR</span>
                    </Link>
                    <Link
                      href="/qr/buy"
                      onClick={() => setInspectOpen(false)}
                      className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 font-mono text-xs font-semibold uppercase text-foreground hover:bg-muted transition-colors text-center"
                    >
                      <span>Buy Safety Kit</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Node 04: EMERGENCY CONTACTS */}
          {activeNode === "contactNode" && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
                  <VaahanIcon name="phone" size={13} aria-hidden="true" />
                  <span>04 EMERGENCY CONTACTS</span>
                </div>
                <DialogTitle className="font-serif text-xl sm:text-2xl font-medium text-foreground">
                  Golden-Hour Emergency Network
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Verified priority contacts alerted via MSG91 SMS and WhatsApp when your vehicle QR is scanned during an incident.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Armed Responders:</span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {(primarySticker?.emergencyContactsCount ?? 0) > 0
                        ? `${primarySticker?.emergencyContactsCount} Contact(s) Active`
                        : primaryVehicle?.hasEmergencyContacts
                        ? "Configured on Vehicle"
                        : "None Configured"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Alert Channel:</span>
                    <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      MSG91 SMS + WhatsApp Alerts
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Golden-Hour Readiness:</span>
                    <span className="font-mono text-xs font-semibold">
                      {overview.railStates.contactNode === "active" ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Armed &amp; Ready</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">Action Required</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Privacy Routing:</span>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      Contact Numbers Masked
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-muted-foreground leading-relaxed">
                  During emergencies, passersby can press an alert button to notify all your emergency contacts at once with incident location data, without revealing their personal numbers.
                </div>

                <Link
                  href="/emergency-contacts"
                  onClick={() => setInspectOpen(false)}
                  className="inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase text-white hover:bg-[#b5654b] transition-colors"
                >
                  <span>Configure Emergency Contacts</span>
                  <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}

          {/* Node 05: PUBLIC SAFETY VIEW */}
          {activeNode === "safetyNode" && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
                  <VaahanIcon name="eye" size={13} aria-hidden="true" />
                  <span>05 PUBLIC SAFETY VIEW</span>
                </div>
                <DialogTitle className="font-serif text-xl sm:text-2xl font-medium text-foreground">
                  Public QR Safety View
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  The exact screen first responders and passersby see when scanning your vehicle&apos;s physical QR sticker.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Public Projection:</span>
                    <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {primarySticker?.safetyViewConfigured || primaryVehicle?.isSafetyViewConfigured
                        ? "Active & Publicly Resolvable"
                        : "Needs Attention"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Relay Communication:</span>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      One-Click Call &amp; WhatsApp Alert
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Owner Anonymity:</span>
                    <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      100% (Strict Masking)
                    </span>
                  </div>
                  {primarySticker?.resolverUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Resolver Target:</span>
                      <span className="font-mono text-[11px] truncate max-w-[190px] text-foreground">
                        {primarySticker.resolverUrl}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-row gap-2">
                  {primarySticker?.resolverUrl ? (
                    <>
                      <a
                        href={primarySticker.resolverUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleTestScan}
                        className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase text-white hover:bg-[#b5654b] transition-colors text-center"
                      >
                        <span>Preview Safety View</span>
                        <VaahanIcon name="external-link" size={13} aria-hidden="true" />
                      </a>
                      <Link
                        href="/emergency-contacts"
                        onClick={() => setInspectOpen(false)}
                        className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-4 font-mono text-xs font-semibold uppercase text-foreground hover:bg-muted transition-colors text-center"
                      >
                        <span>Manage Contacts</span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/qr/activate"
                      onClick={() => setInspectOpen(false)}
                      className="inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase text-white hover:bg-[#b5654b] transition-colors"
                    >
                      <span>Activate QR to Enable</span>
                      <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
