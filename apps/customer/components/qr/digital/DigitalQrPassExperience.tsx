"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { VaahanSafeMark } from "@vaahansafe/ui/brand";
import { QrFrame } from "../primitives/QrFrame";
import {
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  PhoneCall,
  HeartHandshake,
  QrCode,
  Sparkles,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import type { QrDigitalPassData } from "@/lib/qr-types";
import { cn } from "@vaahansafe/ui/lib/utils";

interface DigitalQrPassExperienceProps {
  data: QrDigitalPassData | null;
}

export function DigitalQrPassExperience({ data }: DigitalQrPassExperienceProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    if (!data?.resolverUrl) return;
    navigator.clipboard.writeText(data.resolverUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!data) {
    return (
      <div className="space-y-8 pb-12">
        <Link
          href="/qr"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[#cc785c]"
        >
          <VaahanIcon name="arrow-left" size={13} aria-hidden="true" />
          <span>Back to My QR Hub</span>
        </Link>

        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
            VERIFIABLE WALLET PASS &bull; DIGITAL
          </div>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Digital QR Pass
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            A smartphone-accessible verifiable vehicle safety identity pass for your phone lock screen, Apple/Google Wallet, and printed temporary placards.
          </p>
        </div>

        {/* Empty State */}
        <div className="rounded-3xl border border-dashed border-border bg-card p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-[#cc785c] border border-border">
            <QrCode className="size-7" />
          </div>

          <div>
            <h2 className="font-serif text-2xl font-medium text-foreground">
              No Activated QR Sticker Found
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Digital QR passes require at least one registered vehicle with an activated physical safety sticker. Once paired, your verifiable pass will be automatically rendered here.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link
              href="/qr/activate"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-6 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#b5654b] transition-colors shadow-xs"
            >
              <span>Activate Retail QR</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/qr/buy"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 font-mono text-xs font-semibold uppercase text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Order Hardware Kit
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { publicId, visibleCode, resolverUrl, vehicle, safetySummary } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Breadcrumb */}
      <Link
        href="/qr"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[#cc785c]"
      >
        <VaahanIcon name="arrow-left" size={13} aria-hidden="true" />
        <span>Back to My QR Hub</span>
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
            VERIFIABLE WALLET PASS &bull; LIVE PASS
          </div>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Digital QR Pass
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Verifiable digital pass for vehicle <span className="font-mono font-bold text-foreground">{vehicle.plate}</span>. Scan with any phone camera to trigger anonymous alerts or view safety profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-4 font-mono text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            <Printer className="size-3.5" />
            <span>Print Windshield Placard</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left 6 cols: Authentic Digital Wallet Pass Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm rounded-3xl border border-neutral-800 bg-[#0d0f12] text-white p-7 shadow-2xl relative overflow-hidden">
            {/* Ambient specular highlight */}
            <div className="pointer-events-none absolute -top-20 -left-20 size-48 rounded-full bg-[#cc785c]/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 size-48 rounded-full bg-emerald-500/15 blur-2xl" />

            {/* Pass Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2.5">
                <VaahanSafeMark className="size-6 text-[#cc785c]" />
                <div>
                  <div className="font-mono text-xs font-black tracking-widest text-neutral-100">
                    VAAHANSAFE
                  </div>
                  <div className="font-mono text-[8.5px] uppercase tracking-wider text-neutral-400">
                    SAFETY IDENTITY PASS
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[9px] font-semibold text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE</span>
              </div>
            </div>

            {/* Standards-Compliant Scannable QR Code Matrix */}
            <div className="my-6 flex flex-col items-center">
              <div className="rounded-2xl bg-white p-3 shadow-xl">
                <QrFrame
                  publicId={publicId}
                  visibleCode={visibleCode}
                  status="ACTIVATED"
                  size={200}
                  hideFooter={true}
                  className="border-0 shadow-none p-0"
                />
              </div>

              <div className="mt-4 font-mono text-sm font-bold tracking-widest text-neutral-100">
                {visibleCode}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-neutral-400">
                ID: {publicId}
              </div>
            </div>

            {/* Vehicle Details Strip */}
            <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                    Vehicle Number
                  </div>
                  <div className="font-mono text-base font-black text-neutral-100">
                    {vehicle.plate}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                    Model
                  </div>
                  <div className="text-xs font-semibold text-neutral-200">
                    {vehicle.make} {vehicle.model}
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-2 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  <span>{safetySummary.emergencyContactsCount} Contacts Active</span>
                </div>
                {safetySummary.bloodGroup && (
                  <div className="font-mono text-[10px] font-bold text-[#cc785c] rounded-md bg-[#cc785c]/15 px-2 py-0.5">
                    {safetySummary.bloodGroup}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-5 text-center font-mono text-[9px] uppercase tracking-wider text-neutral-500">
              Scan with camera to report issue or connect anonymously
            </div>
          </div>
        </div>

        {/* Right 6 cols: Actions, Placard Info & Resolver Tools */}
        <div className="lg:col-span-6 space-y-6">
          {/* Resolver Link Action Box */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#cc785c]">
              DYNAMIC RESOLVER ENDPOINT
            </div>
            <h3 className="font-serif text-lg font-medium text-foreground">
              Official QR Public Link
            </h3>
            <p className="text-xs text-muted-foreground">
              This is the secure production URL opened when someone scans your sticker. It masks your personal phone number while enabling immediate WhatsApp and SMS relays.
            </p>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
              <span className="flex-1 truncate font-mono text-xs text-foreground px-2">
                {resolverUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-muted px-3 font-mono text-[11px] font-semibold text-foreground hover:bg-muted/80 transition-colors shrink-0"
              >
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={resolverUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-4 font-mono text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <span>Preview Scan Page</span>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </a>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold text-white hover:bg-[#b5654b] transition-colors"
              >
                <Printer className="size-3.5" />
                <span>Print Placard</span>
              </button>
            </div>
          </div>

          {/* Windshield Placard Notice */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <Printer className="size-4 text-[#cc785c]" />
              <span>TEMPORARY WINDSHIELD PLACARD</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting your physical sticker delivery? Print the temporary placard on normal paper and place it inside your windshield or dashboard. It uses the exact same cryptographic resolver and protects your vehicle from day one.
            </p>
          </div>

          {/* Privacy & Safety Relay Notice */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span>PRIVACY FIRST ARCHITECTURE</span>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Passersby never see your personal phone number or home address.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Calls are bridged through an encrypted virtual mask.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Emergency responders receive immediate access to blood group & medical notes.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
