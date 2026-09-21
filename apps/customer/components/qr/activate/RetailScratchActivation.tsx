"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { submitQrActivationAction } from "@/app/(app)/qr/actions";
import { Sparkles, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from "lucide-react";
import type { QrActivationData } from "@/lib/qr-types";
import { cn } from "@vaahansafe/ui/lib/utils";

interface RetailScratchActivationProps {
  data: QrActivationData;
}

export function RetailScratchActivation({ data }: RetailScratchActivationProps) {
  const router = useRouter();
  const [scratchCode, setScratchCode] = React.useState("");
  const [publicId, setPublicId] = React.useState("");
  const [selectedVehicleId, setSelectedVehicleId] = React.useState(
    data.eligibleVehicles[0]?.id || ""
  );
  const [isScratchRevealed, setIsScratchRevealed] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successResult, setSuccessResult] = React.useState<{
    publicId: string;
    maskedPlate: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!scratchCode.trim()) {
      setErrorMessage("Please enter the secret activation code found under the scratch panel.");
      return;
    }

    if (!selectedVehicleId) {
      setErrorMessage("Please select a vehicle to pair with this QR sticker.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitQrActivationAction({
        scratchCode: scratchCode.trim(),
        vehicleId: selectedVehicleId,
        publicId: publicId.trim() || undefined,
      });

      if (res.success && res.publicId && res.maskedPlate) {
        setSuccessResult({
          publicId: res.publicId,
          maskedPlate: res.maskedPlate,
        });
      } else {
        setErrorMessage(res.error || "Failed to activate sticker. Please verify the code.");
      }
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVehicle = data.eligibleVehicles.find((v) => v.id === selectedVehicleId);

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb */}
      <Link
        href="/qr"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[#cc785c]"
      >
        <VaahanIcon name="arrow-left" size={13} aria-hidden="true" />
        <span>Back to My QR Hub</span>
      </Link>

      {/* Header */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
          HARDWARE ONBOARDING &bull; RETAIL KIT
        </div>
        <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Activate Retail QR Sticker
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Gently scratch the silver tamper-evident coating on your physical kit packaging to reveal your secret proof-of-ownership key.
        </p>
      </div>

      {successResult ? (
        /* Success State */
        <div className="rounded-3xl border border-emerald-500/30 bg-card p-6 sm:p-10 shadow-lg text-center max-w-2xl mx-auto">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-9" />
          </div>

          <div className="mt-5 font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            CRYPTOGRAPHIC PAIRING SUCCESSFUL
          </div>

          <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-medium text-foreground">
            Vehicle Safety Identity Live
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            QR Sticker <span className="font-mono font-bold text-foreground">{successResult.publicId}</span> has been bound to <span className="font-mono font-bold text-foreground">{successResult.maskedPlate}</span>. Real-time emergency routing and anonymous owner calling are now fully active.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/qr/digital?id=${encodeURIComponent(successResult.publicId)}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-6 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#b5654b] shadow-xs transition-colors"
            >
              <span>View Digital QR Pass</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/qr"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 font-mono text-xs font-semibold uppercase text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Return to QR Hub
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left 7 Cols: Form & Vehicle Selection */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
              {errorMessage && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Scratch Secret Code */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="scratchCode"
                    className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    1. Secret Activation Proof Code *
                  </label>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    From Silver Scratch Panel
                  </span>
                </div>

                <div className="relative mt-2">
                  <input
                    id="scratchCode"
                    type="text"
                    value={scratchCode}
                    onChange={(e) => setScratchCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SEC-A98B2C"
                    maxLength={16}
                    required
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 font-mono text-lg font-bold tracking-widest uppercase text-foreground placeholder:text-muted-foreground/40 focus:border-[#cc785c] focus:outline-hidden focus:ring-2 focus:ring-[#cc785c]/30 transition-all"
                  />
                  <div className="absolute right-3 top-3 text-muted-foreground">
                    <KeyRound className="size-5" />
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  The 6-to-12 character alphanumeric code revealed after scratching the silver panel. Never share this with anyone.
                </p>
              </div>

              {/* Optional: Public Sticker ID */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="publicId"
                    className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    2. Public Sticker ID (Optional)
                  </label>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Printed Under QR Code
                  </span>
                </div>

                <input
                  id="publicId"
                  type="text"
                  value={publicId}
                  onChange={(e) => setPublicId(e.target.value.toUpperCase())}
                  placeholder="e.g. VS-9842"
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-4 font-mono text-sm uppercase text-foreground placeholder:text-muted-foreground/40 focus:border-[#cc785c] focus:outline-hidden focus:ring-2 focus:ring-[#cc785c]/30 transition-all"
                />
              </div>

              {/* Step 2: Target Vehicle */}
              <div>
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                  3. Select Vehicle to Protect *
                </label>

                {data.eligibleVehicles.length > 0 ? (
                  <div className="mt-3 space-y-2.5">
                    {data.eligibleVehicles.map((v) => {
                      const isSelected = v.id === selectedVehicleId;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all",
                            isSelected
                              ? "border-[#cc785c] bg-[#cc785c]/5 ring-1 ring-[#cc785c]/30"
                              : "border-border bg-background hover:bg-muted"
                          )}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-foreground">
                                {v.maskedPlate}
                              </span>
                              {v.hasActiveQr && (
                                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                                  Has Existing QR (Will Re-assign)
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {v.make} {v.model} &bull; {v.type}
                            </div>
                          </div>

                          <div
                            className={cn(
                              "size-5 rounded-full border flex items-center justify-center shrink-0",
                              isSelected
                                ? "border-[#cc785c] bg-[#cc785c] text-white"
                                : "border-muted-foreground/40"
                            )}
                          >
                            {isSelected && <CheckCircle2 className="size-3.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      No vehicles found in your garage.
                    </p>
                    <Link
                      href="/vehicles/new"
                      className="mt-2 inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#cc785c] hover:underline"
                    >
                      <span>Register a vehicle first &rarr;</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={isSubmitting || data.eligibleVehicles.length === 0}
                  className="flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-[#cc785c] font-mono text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#b5654b] shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="size-4" />
                  <span>
                    {isSubmitting ? "Verifying Cryptographic Proof..." : "Verify & Activate QR Sticker"}
                  </span>
                </button>
                <div className="mt-2.5 text-center font-mono text-[10px] text-muted-foreground">
                  D1 Authenticated Transaction &bull; Immediate Protection
                </div>
              </div>
            </form>
          </div>

          {/* Right 5 Cols: Scratch Card Metaphor & Security Notes */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tangible Scratch Card Simulation */}
            <div className="rounded-3xl border border-border bg-radial from-card to-background p-6 shadow-md text-foreground">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-[#cc785c]" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground">
                    OFFICIAL RETAIL CARD
                  </span>
                </div>
                <span className="font-mono text-[9.5px] text-muted-foreground">
                  SERIES 2026
                </span>
              </div>

              <div className="mt-5 space-y-3 text-center">
                <div className="font-serif text-lg font-medium text-foreground">
                  Proof of Physical Ownership
                </div>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Match the scratch pattern on your card with the secret proof field.
                </p>

                {/* Silver Scratch Panel Metaphor */}
                <div
                  onClick={() => setIsScratchRevealed(!isScratchRevealed)}
                  role="button"
                  tabIndex={0}
                  className="mt-4 relative overflow-hidden rounded-2xl border-2 border-dashed border-border bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-300 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-700 p-6 cursor-pointer select-none group transition-all"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.4),transparent)]" />

                  {isScratchRevealed ? (
                    <div className="font-mono text-xl font-black tracking-widest text-foreground animate-in fade-in zoom-in-95">
                      {scratchCode || "VSAFE-RETAIL-98"}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
                        SILVER SCRATCH PANEL
                      </div>
                      <div className="text-[10px] text-zinc-700 dark:text-zinc-300 font-medium">
                        Click or scratch on packaging to reveal
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedVehicle && (
                <div className="mt-6 rounded-xl border border-border/80 bg-card/60 p-3 text-xs">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Selected Vehicle Pairing
                  </div>
                  <div className="mt-1 flex items-center justify-between font-mono font-semibold text-foreground">
                    <span>{selectedVehicle.maskedPlate}</span>
                    <span className="text-muted-foreground font-normal text-[11px]">{selectedVehicle.make} {selectedVehicle.model}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Security Guarantee */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 text-xs text-muted-foreground space-y-3">
              <div className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#cc785c]">
                <ShieldCheck className="size-4" />
                <span>ANTI-TAMPER GUARANTEE</span>
              </div>
              <p>
                Each retail activation secret is hashed with PBKDF2-HMAC-SHA256 and salted. The plaintext code is never stored in plain text. Once activated, the secret is permanently consumed and cannot be reused.
              </p>
              <div className="border-t border-border pt-3 space-y-1 text-[11px]">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="size-1.5 rounded-full bg-[#5db8a6]" />
                  <span>Immediate SMS alerts to emergency contacts</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <span className="size-1.5 rounded-full bg-[#5db8a6]" />
                  <span>Private masked calling active upon scan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
