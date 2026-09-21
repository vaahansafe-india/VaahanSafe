"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { submitQrReplacementAction } from "@/app/(app)/qr/actions";
import {
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { QrReplacementData } from "@/lib/qr-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vaahansafe/ui";
import { cn } from "@vaahansafe/ui/lib/utils";

interface QrReplacementExperienceProps {
  data: QrReplacementData;
  preselectedStickerId?: string;
}

export function QrReplacementExperience({
  data,
  preselectedStickerId,
}: QrReplacementExperienceProps) {
  const router = useRouter();

  const [selectedStickerId, setSelectedStickerId] = React.useState<string>(
    preselectedStickerId || data.eligibleStickers[0]?.id || ""
  );
  const [reason, setReason] = React.useState("WINDSHIELD_REPLACED");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successResult, setSuccessResult] = React.useState<{
    requestId: string;
    vehiclePlate: string;
  } | null>(null);

  const selectedSticker = data.eligibleStickers.find((s) => s.id === selectedStickerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedStickerId) {
      setErrorMessage("Please select a QR sticker or vehicle to replace.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitQrReplacementAction({
        stickerId: selectedStickerId,
        reason,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.requestId) {
        setSuccessResult({
          requestId: res.requestId,
          vehiclePlate: selectedSticker?.vehiclePlate || "Vehicle",
        });
      } else {
        setErrorMessage(res.error || "Failed to submit replacement request.");
      }
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
          HARDWARE LIFECYCLE &bull; SAFETY CONTINUITY
        </div>
        <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Replace QR Sticker
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Windshield replaced, glass damaged, or sticker scratched? Re-issue physical hardware while seamlessly preserving your existing vehicle profile, emergency contacts, and active subscription.
        </p>
      </div>

      {/* Policy Callout */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-foreground flex items-start gap-3">
        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-mono uppercase text-amber-700 dark:text-amber-300">
            Policy Notice: Replacement Maintains Continuity
          </strong>
          <p className="mt-0.5 text-muted-foreground">
            A replacement preserves your vehicle&apos;s digital identity and scan history without requiring you to re-enter emergency contacts or purchase a new subscription plan.
          </p>
        </div>
      </div>

      {successResult ? (
        /* Success State */
        <div className="rounded-3xl border border-emerald-500/30 bg-card p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-lg space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <PackageCheck className="size-9" />
          </div>

          <div className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            REPLACEMENT ORDER RECORDED
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground">
            Hardware En Route to Your Doorstep
          </h2>

          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Replacement request <span className="font-mono font-bold text-foreground">#{successResult.requestId.slice(0, 10)}</span> for vehicle <span className="font-mono font-bold text-foreground">{successResult.vehiclePlate}</span> has been scheduled with courier dispatch.
          </p>

          <div className="rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground text-left max-w-md mx-auto space-y-1.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c] font-semibold">
              Zero Interruption Guarantee:
            </div>
            <div>
              &bull; Your digital QR pass and anonymous phone masking remain 100% operational.
            </div>
            <div>
              &bull; When the replacement arrives, simple 10-second pairing activates it automatically.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Link
              href="/orders"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-6 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#b5654b] transition-colors shadow-xs"
            >
              <span>Track Replacement Shipment</span>
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
          {/* Left 7 cols: Replacement Form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
              {errorMessage && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Select Active Sticker */}
              <div>
                <label
                  htmlFor="stickerSelect"
                  className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  1. Select QR Sticker to Replace *
                </label>

                {data.eligibleStickers.length > 0 ? (
                  <div className="mt-3 space-y-2.5">
                    {data.eligibleStickers.map((s) => {
                      const isSelected = s.id === selectedStickerId;
                      const hasPending = Boolean(s.hasActiveRequest);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedStickerId(s.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all",
                            isSelected
                              ? "border-[#cc785c] bg-[#cc785c]/5 ring-1 ring-[#cc785c]/30"
                              : "border-border bg-background hover:bg-muted"
                          )}
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-bold text-foreground">
                                {s.vehiclePlate}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">
                                ({s.publicId})
                              </span>
                              {hasPending && (
                                <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                  Request {s.activeRequestStatus || "PENDING"}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {s.vehicleMake} {s.vehicleModel}
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
                  <div className="mt-3 rounded-xl border border-dashed border-border p-5 text-center">
                    <p className="text-xs text-muted-foreground">
                      No active QR stickers found in your fleet.
                    </p>
                    <Link
                      href="/qr/activate"
                      className="mt-2 inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#cc785c] hover:underline"
                    >
                      <span>Activate a retail sticker &rarr;</span>
                    </Link>
                  </div>
                )}

                {selectedSticker?.hasActiveRequest && (
                  <div className="mt-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-foreground flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      A replacement request is already in progress ({selectedSticker.activeRequestStatus}) for this sticker. Track status on the right panel.
                    </span>
                  </div>
                )}
              </div>

              {/* Step 2: Reason */}
              <div>
                <label
                  htmlFor="reason"
                  className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  2. Reason for Replacement *
                </label>
                <Select
                  value={reason}
                  onValueChange={(val) => setReason(val)}
                >
                  <SelectTrigger
                    id="reason"
                    className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-xs text-foreground focus:border-[#cc785c] focus:ring-1 focus:ring-[#cc785c]"
                  >
                    <SelectValue placeholder="Select reason for replacement" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border bg-popover text-foreground shadow-xl">
                    <SelectItem
                      value="WINDSHIELD_REPLACED"
                      className="cursor-pointer py-2.5 text-xs focus:bg-[#cc785c]/10 focus:text-[#cc785c]"
                    >
                      Windshield Replaced / Damaged Glass
                    </SelectItem>
                    <SelectItem
                      value="STICKER_FADED"
                      className="cursor-pointer py-2.5 text-xs focus:bg-[#cc785c]/10 focus:text-[#cc785c]"
                    >
                      UV Sun Wear / Faded / Hard to Scan
                    </SelectItem>
                    <SelectItem
                      value="PHYSICAL_DAMAGE"
                      className="cursor-pointer py-2.5 text-xs focus:bg-[#cc785c]/10 focus:text-[#cc785c]"
                    >
                      Car Wash / Tampered / Scratched Surface
                    </SelectItem>
                    <SelectItem
                      value="VEHICLE_REPAINT"
                      className="cursor-pointer py-2.5 text-xs focus:bg-[#cc785c]/10 focus:text-[#cc785c]"
                    >
                      Vehicle Repainting / Body Shop
                    </SelectItem>
                    <SelectItem
                      value="THEFT_OR_LOSS"
                      className="cursor-pointer py-2.5 text-xs focus:bg-[#cc785c]/10 focus:text-[#cc785c]"
                    >
                      Sticker Stolen / Lost
                    </SelectItem>
                    <SelectItem
                      value="OTHER"
                      className="cursor-pointer py-2.5 text-xs focus:bg-[#cc785c]/10 focus:text-[#cc785c]"
                    >
                      Other Operational Reason
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Step 3: Additional Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  3. Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide any specific context or courier delivery instructions..."
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-[#cc785c] focus:outline-hidden focus:ring-1 focus:ring-[#cc785c]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    data.eligibleStickers.length === 0 ||
                    Boolean(selectedSticker?.hasActiveRequest)
                  }
                  className="flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-[#cc785c] font-mono text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#b5654b] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="size-4" />
                  <span>
                    {isSubmitting
                      ? "Submitting Request..."
                      : selectedSticker?.hasActiveRequest
                      ? "Replacement Already In Progress"
                      : "Submit Hardware Replacement"}
                  </span>
                </button>
                <div className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
                  Preserves Subscription &bull; Identity Continuity Maintained
                </div>
              </div>
            </form>
          </div>

          {/* Right 5 cols: Continuity Assurance & Recent Replacements */}
          <div className="lg:col-span-5 space-y-6">
            {/* Continuity Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
                <ShieldCheck className="size-4" />
                <span>HOW REPLACEMENT WORKS</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When you submit a replacement request, your existing digital safety pass and anonymous emergency telephone relays remain fully active.
              </p>
              <div className="space-y-2 border-t border-border pt-3 text-xs text-foreground">
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-[#5db8a6] mt-1.5 shrink-0" />
                  <span>New physical sticker dispatched via express courier</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-[#5db8a6] mt-1.5 shrink-0" />
                  <span>Instant 1-tap activation migrates identity seamlessly</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-[#5db8a6] mt-1.5 shrink-0" />
                  <span>Old sticker permanently deactivated for security</span>
                </div>
              </div>
            </div>

            {/* Past Replacements */}
            {data.activeRequests.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  RECENT REPLACEMENT REQUESTS
                </div>
                <div className="divide-y divide-border">
                  {data.activeRequests.map((req) => (
                    <div key={req.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-foreground">
                          {req.vehiclePlate}
                        </span>
                        <div className="text-[11px] text-muted-foreground capitalize">
                          {req.reason.replace(/_/g, " ").toLowerCase()}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-semibold text-[#cc785c] rounded-md bg-[#cc785c]/10 px-2 py-0.5">
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
