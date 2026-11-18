"use client";

import * as React from "react";
import Link from "next/link";
import { submitQrActivationAction } from "@/app/(app)/qr/actions";
import { ArrowRight, CheckCircle2, KeyRound } from "@/components/ui/icons";
import { useCustomerRouter } from "@/lib/use-customer-router";
import type { QrActivationData } from "@/lib/qr-types";
import { MAX_ACTIVATION_PROOF_INPUT_LENGTH } from "@vaahansafe/qr-core/client";

interface RetailScratchActivationProps {
  data: QrActivationData;
}

const inputClass = "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring";
const primaryClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#93462f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#793823] disabled:opacity-60";

export function RetailScratchActivation({ data }: RetailScratchActivationProps) {
  const router = useCustomerRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [result, setResult] = React.useState<{ publicId: string; maskedPlate: string }>();

  const availableVehicles = data.eligibleVehicles.filter((vehicle) => !vehicle.hasActiveQr);

  async function activate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError(undefined);
    try {
      const response = await submitQrActivationAction({
        publicId: String(form.get("publicId") ?? ""),
        scratchCode: String(form.get("scratchCode") ?? ""),
        vehicleId: String(form.get("vehicleId") ?? ""),
      });
      if (response.success && response.publicId && response.maskedPlate) {
        setResult({ publicId: response.publicId, maskedPlate: response.maskedPlate });
        router.refresh();
      } else {
        setError(response.error ?? "We couldn't activate this sticker. Please try again.");
      }
    } catch {
      setError("We couldn't reach VaahanSafe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12">
      <Link href="/qr" className="inline-flex min-h-10 items-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
        &larr; My QR Hub
      </Link>
      <header className="rounded-3xl border border-border bg-gradient-to-br from-[#cc785c]/15 via-card to-card p-5 sm:p-8">
        <KeyRound aria-hidden="true" className="mb-4 size-10 rounded-xl bg-[#cc785c]/15 p-2.5 text-foreground" />
        <h1 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">Activate a retail QR</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Link a new VaahanSafe sticker to a vehicle using the details on its retail pack.</p>
      </header>

      {result ? (
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-8" aria-live="polite">
          <CheckCircle2 className="size-7 text-emerald-600" aria-hidden="true" />
          <h2 className="font-serif text-2xl text-foreground">Sticker activated</h2>
          <p className="text-sm text-muted-foreground">VaahanSafe ID <strong className="break-all text-foreground">{result.publicId}</strong> is linked to <strong className="text-foreground">{result.maskedPlate}</strong>.</p>
          <Link href={`/qr/digital?id=${encodeURIComponent(result.publicId)}`} className={primaryClass}>View Digital QR</Link>
        </section>
      ) : (
        <>
          <section className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 rounded-2xl border border-border bg-card px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Already have an active VaahanSafe ID?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Add a second vehicle from QR Codes. Your scratch code is only used for the first activation.</p>
            </div>
            <Link href="/qr/codes" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground underline decoration-[#cc785c] underline-offset-4">
              Manage linked vehicles <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>

          {availableVehicles.length ? (
            <form onSubmit={activate} className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
              <fieldset disabled={isSubmitting} className="min-w-0 space-y-6">
                <legend className="mb-4 font-serif text-2xl text-foreground">New sticker details</legend>
                <div>
                  <label htmlFor="publicId" className="text-sm font-semibold text-foreground">Sticker ID</label>
                  <p id="sticker-help" className="mt-1 text-sm text-muted-foreground">Use the ID printed below the QR, or paste the QR link.</p>
                  <input id="publicId" name="publicId" required maxLength={256} autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false} aria-describedby="sticker-help" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="scratchCode" className="text-sm font-semibold text-foreground">Scratch code</label>
                  <p id="scratch-help" className="mt-1 text-sm text-muted-foreground">Find this under the silver scratch panel on the same pack.</p>
                  <input id="scratchCode" name="scratchCode" type="password" required maxLength={MAX_ACTIVATION_PROOF_INPUT_LENGTH} autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false} aria-describedby="scratch-help" className={inputClass} />
                </div>
                <fieldset className="min-w-0 space-y-2 border-t border-border pt-4">
                  <legend className="pr-2 text-sm font-semibold text-foreground">Choose a vehicle</legend>
                  {availableVehicles.map((vehicle) => (
                    <label key={vehicle.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-3.5 has-checked:border-[#93462f] has-checked:bg-[#cc785c]/10">
                      <input type="radio" name="vehicleId" value={vehicle.id} required defaultChecked={availableVehicles.length === 1} className="size-4 shrink-0 accent-[#93462f]" />
                      <span className="min-w-0">
                        <span className="block font-mono text-sm font-semibold text-foreground">{vehicle.maskedPlate}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{vehicle.make} {vehicle.model}</span>
                      </span>
                    </label>
                  ))}
                  {availableVehicles.length < data.eligibleVehicles.length && (
                    <p className="pt-1 text-sm text-muted-foreground">Vehicles with a linked sticker are managed in <Link href="/qr/codes" className="underline underline-offset-4">QR Codes</Link>.</p>
                  )}
                </fieldset>
                {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
                <button type="submit" className={`${primaryClass} w-full`}>{isSubmitting ? "Verifying sticker..." : "Activate sticker"}</button>
              </fieldset>
            </form>
          ) : (
            <section className="space-y-3 rounded-3xl border border-border bg-card p-5 sm:p-8">
              <h2 className="font-serif text-2xl text-foreground">{data.eligibleVehicles.length ? "All your vehicles have a sticker" : "Add a vehicle first"}</h2>
              <p className="text-sm text-muted-foreground">{data.eligibleVehicles.length ? "Add another vehicle to activate a new sticker, or request a replacement for an existing one." : "Register the vehicle you want to link to this sticker."}</p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/vehicles/new" className={primaryClass}>Add a vehicle</Link>
                {data.eligibleVehicles.length > 0 && <Link href="/qr/replace" className="text-sm font-medium underline underline-offset-4">Replace a sticker</Link>}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
