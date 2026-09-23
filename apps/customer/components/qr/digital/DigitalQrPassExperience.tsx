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
  QrCode,
  Smartphone,
  ArrowRight,
  Download,
  FileCheck2,
} from "lucide-react";
import type { QrDigitalPassData } from "@/lib/qr-types";
import { downloadPlacardPdf } from "@/lib/pdf/generate-placard-pdf";

interface DigitalQrPassExperienceProps {
  data: QrDigitalPassData | null;
}

export function DigitalQrPassExperience({ data }: DigitalQrPassExperienceProps) {
  const [copied, setCopied] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [pdfDownloaded, setPdfDownloaded] = React.useState(false);

  const handleCopyLink = () => {
    if (!data?.resolverUrl) return;
    navigator.clipboard.writeText(data.resolverUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestScan = () => {
    if (!data?.publicId) return;
    try {
      fetch("/api/qr/test-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: data.publicId }),
      }).catch(() => {});
    } catch {
      // Ignored
    }
  };

  const handleDownloadPdf = async () => {
    if (!data || isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      // Attempt server-authoritative download route first
      const res = await fetch(
        `/api/qr/placard?id=${encodeURIComponent(data.publicId)}`
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanPlate = data.vehicle.plate.replace(/[^a-zA-Z0-9]/g, "");
        a.download = `VaahanSafe-Vehicle-Safety-Identity-${cleanPlate}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // High-fidelity client-side PDF generation fallback
        await downloadPlacardPdf(data);
      }
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error("[VaahanSafe] Error downloading placard PDF:", err);
      // Client-side fallback
      try {
        await downloadPlacardPdf(data);
        setPdfDownloaded(true);
        setTimeout(() => setPdfDownloaded(false), 3000);
      } catch (clientErr) {
        console.error("[VaahanSafe] Client PDF fallback error:", clientErr);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto w-full min-w-0 space-y-6 sm:space-y-8 pb-12">
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
          <h1 className="mt-1 font-serif text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-foreground">
            Digital QR Pass
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-muted-foreground">
            A smartphone-accessible verifiable vehicle safety identity pass for your phone lock screen, Apple/Google Wallet, and printed temporary placards.
          </p>
        </div>

        {/* Empty State */}
        <div className="rounded-3xl border border-dashed border-border bg-card p-6 sm:p-12 text-center max-w-2xl mx-auto space-y-5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-[#cc785c] border border-border">
            <QrCode className="size-7" />
          </div>

          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-foreground">
              No Activated QR Sticker Found
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Digital QR passes require at least one registered vehicle with an activated physical safety sticker. Once paired, your verifiable pass will be automatically rendered here.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link
              href="/qr/activate"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-6 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#b5654b] transition-colors shadow-xs"
            >
              <span>Activate Retail QR</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/qr/buy"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-xl border border-border bg-background px-6 font-mono text-xs font-semibold uppercase text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
    <>
      {/* ------------------------------------------------------------- */}
      {/* SCREEN UI (Hidden during print)                               */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-6xl mx-auto w-full min-w-0 space-y-6 sm:space-y-8 pb-12 print:hidden overflow-x-clip">
        {/* Top Breadcrumb */}
        <Link
          href="/qr"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[#cc785c]"
        >
          <VaahanIcon name="arrow-left" size={13} aria-hidden="true" />
          <span>Back to My QR Hub</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 min-w-0 w-full">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
              VERIFIABLE WALLET PASS &bull; LIVE PASS
            </div>
            <h1 className="mt-1 font-serif text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-foreground truncate">
              Digital QR Pass
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Verifiable digital pass for vehicle{" "}
              <span className="font-mono font-bold text-foreground">{vehicle.plate}</span>. Scan with any phone camera to trigger anonymous alerts or view safety profile.
            </p>
          </div>

        </div>

        {/* Responsive Grid: Stacks on medium/half-screen (col-1), 2-col on XL (xl:col-12) */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 xl:grid-cols-12 items-start w-full min-w-0">
          {/* Left Column: Authentic Digital Wallet Pass Card */}
          <div className="xl:col-span-5 flex flex-col items-center w-full min-w-0 xl:sticky xl:top-20">
            <div className="w-full max-w-[340px] xs:max-w-[360px] sm:max-w-sm rounded-3xl border border-neutral-800 bg-[#0a0b0d] text-white p-5 sm:p-6 shadow-2xl relative overflow-hidden select-none">
              {/* Ambient specular highlight */}
              <div className="pointer-events-none absolute -top-20 -left-20 size-48 rounded-full bg-[#cc785c]/25 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 size-48 rounded-full bg-emerald-500/20 blur-2xl" />

              {/* Pass Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-3.5">
                <div className="flex items-center gap-2.5">
                  <VaahanSafeMark className="size-6 text-[#cc785c]" />
                  <div>
                    <div className="font-mono text-xs font-black tracking-widest text-white">
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

              {/* Scannable QR Matrix */}
              <div className="my-5 sm:my-6 flex flex-col items-center">
                <div className="rounded-2xl bg-white p-2.5 sm:p-3 shadow-xl">
                  <QrFrame
                    publicId={publicId}
                    visibleCode={visibleCode}
                    status="ACTIVATED"
                    size={185}
                    hideFooter={true}
                    className="border-0 shadow-none p-0"
                  />
                </div>

                <div className="mt-3 sm:mt-3.5 font-mono text-sm sm:text-base font-bold tracking-widest text-white">
                  {visibleCode}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-neutral-400">
                  ID: {publicId}
                </div>
              </div>

              {/* Vehicle Details Strip (High Contrast Solid Dark Theme) */}
              <div className="rounded-2xl border border-white/10 bg-[#14161b] p-3.5 sm:p-4 space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                      Vehicle Number
                    </div>
                    <div className="font-mono text-sm sm:text-base font-black text-white tracking-wide truncate">
                      {vehicle.plate}
                    </div>
                  </div>
                  <div className="text-right min-w-0">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                      Model
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-neutral-200 truncate">
                      {vehicle.make} {vehicle.model}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2 flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-neutral-300 min-w-0">
                    <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {safetySummary.emergencyContactsCount > 0
                        ? `${safetySummary.emergencyContactsCount} Contacts Active`
                        : "0 Contacts Active"}
                    </span>
                  </div>
                  {safetySummary.bloodGroup ? (
                    <div className="font-mono text-[10px] font-bold text-[#e08b6f] rounded-md bg-[#cc785c]/20 px-2 py-0.5 border border-[#cc785c]/30 shrink-0">
                      {safetySummary.bloodGroup}
                    </div>
                  ) : (
                    <div className="font-mono text-[9px] text-neutral-400 rounded-md bg-white/5 px-2 py-0.5 border border-white/5 shrink-0">
                      Standard Shield
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Notice */}
              <div className="mt-3.5 sm:mt-4 text-center font-mono text-[9px] uppercase tracking-wider text-neutral-400 leading-tight">
                Scan with camera to report issue or connect anonymously
              </div>
            </div>

            {/* Mobile / Screen Hint Under Pass */}
            <div className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <Smartphone className="size-3.5 text-[#cc785c]" />
              <span>Ready for phone lock screen & wallet</span>
            </div>
          </div>

          {/* Right Column: Actions, Placard Info & Resolver Tools */}
          <div className="xl:col-span-7 w-full min-w-0 space-y-4 sm:space-y-6">
            {/* Card 1: Resolver Link Action Box */}
            <div className="w-full min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4 overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#cc785c]">
                DYNAMIC RESOLVER ENDPOINT
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-medium text-foreground">
                Official QR Public Link
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                This is the secure production URL opened when someone scans your sticker. It masks your personal phone number while enabling immediate WhatsApp and SMS relays.
              </p>

              {/* Responsive URL copy container */}
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2 min-w-0 w-full overflow-hidden">
                <a
                  href={resolverUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleTestScan}
                  className="flex-1 min-w-0 truncate font-mono text-xs text-foreground hover:text-[#cc785c] px-2 py-1 select-all transition-colors flex items-center gap-1.5"
                  title="Open Public Resolver Profile"
                >
                  <span className="truncate">{resolverUrl}</span>
                  <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-muted hover:bg-muted/80 px-3.5 font-mono text-xs font-semibold text-foreground transition-colors shrink-0 whitespace-nowrap"
                >
                  {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center pt-1 w-full">
                <a
                  href={resolverUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleTestScan}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 font-mono text-xs font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap shadow-xs"
                >
                  <span>Preview Scan Page</span>
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </a>
              </div>
            </div>

            {/* Card 2: Executive Windshield Placard Notice & PDF Download */}
            <div className="w-full min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Printer className="size-4 text-[#cc785c]" />
                  <span>VEHICLE SAFETY IDENTITY &bull; PRINTABLE ARTIFACT</span>
                </div>
                <span className="hidden sm:inline-flex rounded-md bg-[#cc785c]/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-[#cc785c]">
                  Vector PDF 1200 DPI
                </span>
              </div>

              <h3 className="font-serif text-lg font-medium text-foreground">
                Vehicle Safety Identity Placard
              </h3>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Download the publication-grade A4 safety identity placard. Designed as an integrated physical sheet with high-density vector typography, precision alignment marks, owner-controlled safety details, and a quiet-zone-compliant QR matrix.
              </p>

              {/* Feature specs badges */}
              <div className="grid grid-cols-3 gap-2 pt-1 pb-1">
                <div className="rounded-xl border border-border/80 bg-background/80 p-2.5 text-center">
                  <div className="font-mono text-[10px] font-bold text-foreground">A4 ADAPTIVE</div>
                  <div className="text-[10px] text-muted-foreground">Standard Paper</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-background/80 p-2.5 text-center">
                  <div className="font-mono text-[10px] font-bold text-[#cc785c]">1200 DPI</div>
                  <div className="text-[10px] text-muted-foreground">High-Res Matrix</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-background/80 p-2.5 text-center">
                  <div className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">QUIET ZONE</div>
                  <div className="text-[10px] text-muted-foreground">Reliable Scan</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#cc785c] hover:bg-[#b5654b] px-5 font-mono text-xs font-semibold text-white transition-all whitespace-nowrap shadow-xs disabled:opacity-60"
                >
                  {isGeneratingPdf ? (
                    <>
                      <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating PDF Placard...</span>
                    </>
                  ) : pdfDownloaded ? (
                    <>
                      <FileCheck2 className="size-4 text-white" />
                      <span>Placard PDF Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-4" />
                      <span>Download Safety Placard (PDF)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 font-mono text-xs font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap shadow-xs"
                >
                  <Printer className="size-3.5" />
                  <span>Direct Print</span>
                </button>
              </div>
            </div>

            {/* Card 3: Privacy & Safety Relay Notice */}
            <div className="w-full min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4 overflow-hidden">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>CONTROLLED PUBLIC SAFETY PROJECTION</span>
              </div>
              <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>Only information intentionally configured by you is visible upon scan.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>Contact options route through owner-controlled relays without exposing direct private lines.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>Optional medical notes and blood group assist emergency helpers when seconds matter.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PRINT-ONLY PLACARD SHEET (Aligned with PDF Design System)     */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden print:block font-sans text-[#141413] bg-[#faf9f5] p-8 m-0 w-full max-w-2xl mx-auto min-h-screen">
        <style dangerouslySetInnerHTML={{ __html: `@page { size: A4 portrait; margin: 10mm; }` }} />
        
        {/* Registration Corner Marks */}
        <div className="relative border border-[#e6dfd8] p-8 space-y-6 bg-white rounded-lg shadow-none">
          <div className="absolute top-2 left-3 font-mono text-[8px] text-[#8e8b82]">A/01</div>
          <div className="absolute top-2 right-3 font-mono text-[8px] text-[#8e8b82]">A/02</div>
          <div className="absolute bottom-2 left-3 font-mono text-[8px] text-[#8e8b82]">B/03</div>
          <div className="absolute bottom-2 right-3 font-mono text-[8px] text-[#8e8b82]">B/04</div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e6dfd8] pb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider text-[#141413]">VAAHANSAFE</span>
              <span className="font-mono text-[10px] text-[#6c6a64]">/ VEHICLE SAFETY IDENTITY</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#141413]">
              <span className="size-2 rounded-full bg-[#5db872]" />
              <span>ACTIVE</span>
            </div>
          </div>

          {/* Hero Statement & QR */}
          <div className="grid grid-cols-12 gap-6 items-center pt-2">
            <div className="col-span-7 space-y-2">
              <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#a9583e]">
                IDENTITY / 01
              </div>
              <h2 className="font-serif text-2xl font-bold leading-tight tracking-tight text-[#141413]">
                THIS VEHICLE CARRIES A VAAHANSAFE SAFETY IDENTITY.
              </h2>
              <p className="text-xs text-[#3d3d3a] leading-relaxed pt-1">
                Scan the QR to open the vehicle owner&apos;s controlled public safety view.
              </p>
            </div>

            <div className="col-span-5 flex flex-col items-center justify-center p-3 border border-[#e6dfd8] rounded-md bg-[#faf9f5]">
              <div className="font-mono text-[8px] font-bold text-[#a9583e] mb-1.5">QR / 02</div>
              <QrFrame
                publicId={publicId}
                visibleCode={visibleCode}
                status="ACTIVATED"
                size={140}
                hideFooter={true}
                className="border-0 shadow-none p-0 bg-transparent"
              />
              <div className="mt-2 font-mono text-[10px] font-bold text-[#141413]">
                {visibleCode}
              </div>
              <div className="font-mono text-[8px] text-[#6c6a64] uppercase tracking-wider">
                SCAN TO OPEN SAFETY VIEW
              </div>
            </div>
          </div>

          {/* Connection Rail */}
          <div className="border-t border-[#e6dfd8] pt-2 flex items-center justify-between font-mono text-[8px] text-[#6c6a64]">
            <span>PHYSICAL VEHICLE</span>
            <span>&bull; &bull; &bull; IDENTITY &bull; &bull; &bull;</span>
            <span>QR RESOLVER</span>
          </div>

          {/* Vehicle Section */}
          <div className="border-t border-[#e6dfd8] pt-3">
            <div className="font-mono text-[9px] font-bold text-[#a9583e] uppercase">VEHICLE / 03</div>
            <div className="flex items-center justify-between pt-1">
              <div className="font-bold text-base text-[#141413]">
                {vehicle.make} {vehicle.model}
              </div>
              <div className="font-mono font-bold text-sm text-[#141413]">
                {vehicle.plate}
              </div>
            </div>
            <div className="text-[9px] text-[#6c6a64] pt-0.5">
              Vehicle information associated with this VaahanSafe identity.
            </div>
          </div>

          {/* Safety View Summary */}
          <div className="border-t border-[#e6dfd8] pt-3">
            <div className="font-mono text-[9px] font-bold text-[#a9583e] uppercase">SAFETY VIEW / 04</div>
            <div className="divide-y divide-[#e6dfd8]/60 pt-1 text-xs">
              <div className="flex justify-between py-1.5">
                <span className="text-[#3d3d3a]">Emergency contacts</span>
                <span className="font-bold text-[#141413]">
                  {safetySummary.emergencyContactsCount === 1
                    ? "1 available"
                    : `${safetySummary.emergencyContactsCount} available`}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#3d3d3a]">Blood group</span>
                <span className="font-bold text-[#141413]">
                  {safetySummary.bloodGroup || "Not shared"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#3d3d3a]">Public safety view</span>
                <span className="font-bold text-[#141413]">Owner controlled</span>
              </div>
            </div>
            <div className="text-[9px] text-[#6c6a64] pt-1.5">
              Only information intentionally included in the public safety view should be shown after scanning.
            </div>
          </div>

          {/* How To Use */}
          <div className="border-t border-[#e6dfd8] pt-3">
            <div className="font-mono text-[9px] font-bold text-[#a9583e] uppercase">HOW TO USE / 05</div>
            <div className="grid grid-cols-3 gap-3 pt-2 text-[10px]">
              <div>
                <span className="font-mono font-bold text-[#cc785c]">01 </span>
                <span className="font-bold text-[#141413]">SCAN</span>
                <p className="text-[#6c6a64] pt-0.5 text-[9px]">Scan the QR using a compatible phone camera.</p>
              </div>
              <div>
                <span className="font-mono font-bold text-[#cc785c]">02 </span>
                <span className="font-bold text-[#141413]">OPEN</span>
                <p className="text-[#6c6a64] pt-0.5 text-[9px]">Open the VaahanSafe public safety view.</p>
              </div>
              <div>
                <span className="font-mono font-bold text-[#cc785c]">03 </span>
                <span className="font-bold text-[#141413]">CONNECT</span>
                <p className="text-[#6c6a64] pt-0.5 text-[9px]">Use only the contact options made available in that view.</p>
              </div>
            </div>
          </div>

          {/* Legal Footer */}
          <div className="border-t border-[#e6dfd8] pt-3 flex items-start justify-between text-[8px] text-[#6c6a64]">
            <div className="space-y-0.5 max-w-sm">
              <div className="font-mono font-bold text-[#141413]">VAAHANSAFE / {visibleCode}</div>
              <div>VaahanSafe is a connection tool. It is not an emergency service, government identity document, or medical record.</div>
            </div>
            <div className="text-right font-mono">
              <div>vaahansafe.com</div>
              <div className="text-[7.5px] uppercase pt-0.5">SCAN THE QR FOR CURRENT INFORMATION</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
