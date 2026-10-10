"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";
import type { SharedScanLocation, ScanReportReason } from "@vaahansafe/qr-core";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vaahansafe/ui/components/select";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
const getTurnstile = () =>
  (window as unknown as { turnstile?: Turnstile }).turnstile;
const reasons: { value: ScanReportReason; label: string; hint: string }[] = [
  {
    value: "PARKING",
    label: "Parking or blocked access",
    hint: "Let the owner know if their vehicle is blocking a gate, driveway or another vehicle.",
  },
  {
    value: "EMERGENCY",
    label: "Possible emergency",
    hint: "Alert the owner about an urgent situation. If someone is in immediate danger, call 112 first.",
  },
  {
    value: "LIGHTS_ON",
    label: "Lights left on",
    hint: "A quick alert can help the owner avoid a flat battery.",
  },
  {
    value: "DAMAGE",
    label: "Vehicle damage",
    hint: "Share what you noticed. A photo can help the owner understand the situation.",
  },
  {
    value: "OTHER",
    label: "Other safety concern",
    hint: "Describe the concern so the owner knows how they can help.",
  },
];

/** Redraw photos to remove original metadata and keep uploads within server limits. */
async function preparePhoto(file: File): Promise<File> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 15 * 1024 * 1024
  )
    throw new Error("Choose a JPEG, PNG or WebP photo smaller than 15 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas"),
      scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the photo.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Could not prepare photo."))),
        "image/jpeg",
        0.78,
      ),
    );
    if (blob.size > 1024 * 1024)
      throw new Error("Please choose a smaller photo.");
    return new File([blob], "vehicle-report.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

export function ScanReportForm({
  publicId,
  siteKey,
}: {
  publicId: string;
  siteKey: string;
}) {
  const [reason, setReason] = useState<ScanReportReason>("PARKING"),
    [note, setNote] = useState("");
  const [location, setLocation] = useState<SharedScanLocation>(),
    [photos, setPhotos] = useState<File[]>([]);
  const [consent, setConsent] = useState(false),
    [token, setToken] = useState(""),
    [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false),
    [locating, setLocating] = useState(false),
    [preparing, setPreparing] = useState(false);
  const [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const formId = useId();
  const container = useRef<HTMLDivElement>(null),
    widget = useRef<string | undefined>(undefined),
    requestId = useRef<string | undefined>(undefined);
  useEffect(() => {
    const turnstile = getTurnstile();
    if (!scriptReady || !siteKey || success || !container.current || !turnstile)
      return;
    let id: string;
    try {
      id = turnstile.render(container.current, {
        sitekey: siteKey,
        action: "scan-report",
        size: container.current.clientWidth < 300 ? "compact" : "flexible",
        theme: "auto",
        callback: (value: string) => {
          setToken(value);
          setSecurityError("");
        },
        "expired-callback": () => {
          setToken("");
          setSecurityError(
            "The security check expired. Please retry it before sending.",
          );
        },
        "error-callback": () => {
          setToken("");
          setSecurityError(
            "The security check could not finish. Please retry, or use an approved contact above.",
          );
        },
      });
    } catch {
      setSecurityError(
        "The security check could not load. Please refresh this page or use an approved contact above.",
      );
      return;
    }
    widget.current = id;
    return () => {
      turnstile.remove(id);
      widget.current = undefined;
    };
  }, [scriptReady, siteKey, success]);
  useEffect(() => {
    const urls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);
  useEffect(() => {
    if (!siteKey || scriptReady || success) return;
    const timer = setTimeout(
      () =>
        setSecurityError(
          "The security check is taking longer than expected. Please refresh this page or use an approved contact above.",
        ),
      15000,
    );
    return () => clearTimeout(timer);
  }, [siteKey, scriptReady, success]);
  function shareLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError(
        "Location is unavailable in this browser. You can still send a report.",
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
          capturedAt: new Date(p.timestamp).toISOString(),
        });
        setLocating(false);
      },
      () => {
        setError(
          "Location was not shared. You can try again or send the report without it.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }
  async function addPhotos(files: FileList | null) {
    if (!files) return;
    setError("");
    setPreparing(true);
    try {
      if (photos.length + files.length > 3)
        throw new Error(
          "You can add up to three photos. Remove a photo to choose another.",
        );
      const prepared = await Promise.all(Array.from(files).map(preparePhoto));
      setPhotos((current) => [...current, ...prepared]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not prepare photos.");
    } finally {
      setPreparing(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!consent || !token || !siteKey || preparing || locating) {
      setError(
        "Please agree to share your report and complete the security check before sending.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!requestId.current) requestId.current = crypto.randomUUID();
      const data = new FormData();
      data.set(
        "report",
        JSON.stringify({
          publicId,
          requestId: requestId.current,
          reason,
          note,
          consent,
          location,
        }),
      );
      data.set("turnstileToken", token);
      for (const photo of photos) data.append("photos", photo);
      const res = await fetch("/api/scan-reports", {
        method: "POST",
        body: data,
      });
      const body = await res.json();
      // Only start a fresh request after the server confirms the previous write failed.
      // An ambiguous network error keeps the same ID so a saved report is never duplicated.
      if (body.code === "REPORT_RETRY") requestId.current = undefined;
      if (!res.ok || !body.recorded)
        throw new Error(
          body.error || "We couldn’t send your report. Please try again.",
        );
      setSuccess(
        "Your report is saved and the owner notification is queued. Delivery may take a moment.",
      );
      setPhotos([]);
      setLocation(undefined);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn’t send your report. Please try again.",
      );
    } finally {
      setBusy(false);
      setToken("");
      if (widget.current) getTurnstile()?.reset(widget.current);
    }
  }
  const locked =
    busy || preparing || locating || !consent || !token || !siteKey;
  const selectedReason = reasons.find((item) => item.value === reason)!;
  const control =
    "min-h-12 rounded-xl border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <section
      aria-labelledby={`${formId}-heading`}
      className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_-18px_rgba(37,35,32,0.25)]"
    >
      <header className="border-b border-border bg-muted/40 px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-3 flex items-center gap-2 text-primary">
          <VaahanIcon name="shield-check" size={18} />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
            A little help, directly to the owner
          </span>
        </div>
        <h2
          id={`${formId}-heading`}
          className="font-serif text-2xl leading-tight text-foreground sm:text-3xl"
        >
          Notify the vehicle owner
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Seen something that needs their attention? Send a short report. No
          sign-in needed.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Immediate danger?{" "}
          <a
            href="tel:112"
            className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline underline-offset-4"
          >
            Call 112 <VaahanIcon name="arrow-right" size={14} />
          </a>
        </p>
      </header>
      {success ? (
        <div role="status" className="space-y-3 px-4 py-6 sm:px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
            <VaahanIcon name="success" size={24} />
          </div>
          <h3 className="font-serif text-2xl">Thank you for looking out.</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {success}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            If you need an immediate response, use an approved contact above. In
            an emergency, call 112.
          </p>
        </div>
      ) : (
        <form
          onSubmit={submit}
          aria-busy={busy}
          className="space-y-6 px-4 py-5 sm:px-6 sm:py-6"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-primary">01</span>
              <h3 className="text-sm font-semibold">Tell us what happened</h3>
            </div>
            <div className="space-y-2">
              <label
                id={`${formId}-reason-label`}
                htmlFor={`${formId}-reason`}
                className="block text-xs font-medium"
              >
                What did you notice?
              </label>
              <Select
                value={reason}
                onValueChange={(value) => setReason(value as ScanReportReason)}
                disabled={busy}
                name="reason"
              >
                <SelectTrigger
                  id={`${formId}-reason`}
                  aria-labelledby={`${formId}-reason-label`}
                  aria-describedby={`${formId}-reason-hint`}
                  className="h-auto min-h-12 rounded-xl bg-background px-3 text-left text-base shadow-none sm:text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[min(360px,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-32px)] rounded-xl p-1">
                  {reasons.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="min-h-11 cursor-pointer rounded-lg py-3 text-sm"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p
                id={`${formId}-reason-hint`}
                className="text-xs leading-relaxed text-muted-foreground"
              >
                {selectedReason.hint}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`${formId}-note`}
                  className="text-xs font-medium"
                >
                  Add a few details{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {note.length}/300
                </span>
              </div>
              <textarea
                id={`${formId}-note`}
                value={note}
                disabled={busy}
                maxLength={300}
                onChange={(event) => setNote(event.target.value)}
                className="block w-full resize-y rounded-xl border border-border bg-background p-3 text-base leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                placeholder="For example: Your car is blocking the gate near the main entrance."
                rows={3}
              />
            </div>
          </div>
          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-primary">02</span>
              <h3 className="text-sm font-semibold">
                Help them find the situation
              </h3>
              <span className="ml-auto text-[10px] text-muted-foreground">
                Optional
              </span>
            </div>
            <div className="rounded-xl border border-border bg-muted/25 p-3.5">
              <div className="flex items-start gap-2.5">
                <VaahanIcon
                  name="map-pin"
                  size={18}
                  className="mt-0.5 shrink-0 text-primary"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Share where you are</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Your current location can help the owner find the vehicle.
                    It is shared only with this report.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={shareLocation}
                disabled={busy || locating}
                className={`${control} mt-3 flex w-full items-center justify-center gap-2 text-primary`}
              >
                <VaahanIcon
                  name={locating ? "loading" : "map-pin"}
                  size={17}
                  className={locating ? "animate-spin" : ""}
                />
                {locating
                  ? "Finding your location…"
                  : location
                    ? "Update shared location"
                    : "Share my location"}
              </button>
              {location && (
                <div
                  role="status"
                  className="mt-2 flex flex-wrap items-center justify-between gap-x-2 text-xs"
                >
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Location added · accuracy ±{Math.ceil(location.accuracy)} m
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setLocation(undefined)}
                    className="min-h-11 px-2 font-medium underline underline-offset-4"
                  >
                    Remove location
                  </button>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-muted/25 p-3.5">
              <div className="flex items-start gap-2.5">
                <VaahanIcon
                  name="camera"
                  size={18}
                  className="mt-0.5 shrink-0 text-primary"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Add a photo</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Up to 3 photos of the vehicle or nearby area. Avoid faces
                    and personal documents.
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                <label
                  className={`${control} relative flex cursor-pointer items-center justify-center gap-2 px-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50`}
                >
                  <VaahanIcon name="add" size={17} />
                  Choose photos
                  <input
                    aria-label="Choose photos"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={busy || preparing || photos.length === 3}
                    onChange={(event) => {
                      void addPhotos(event.target.files);
                      event.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>
                <label
                  className={`${control} relative flex cursor-pointer items-center justify-center gap-2 px-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50`}
                >
                  <VaahanIcon name="camera" size={17} />
                  Take a photo
                  <input
                    aria-label="Take a photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    disabled={busy || preparing || photos.length === 3}
                    onChange={(event) => {
                      void addPhotos(event.target.files);
                      event.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
              {preparing && (
                <p role="status" className="mt-3 text-xs text-muted-foreground">
                  Preparing your photos…
                </p>
              )}
              {photos.length > 0 && (
                <>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {previews.map((src, index) => (
                      <div
                        key={src}
                        className="min-w-0 overflow-hidden rounded-lg border border-border bg-background"
                      >
                        {/* Local, metadata-free preview; no external image service. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`Selected report photo ${index + 1}`}
                          className="aspect-square w-full object-cover"
                        />
                        <button
                          type="button"
                          disabled={busy || preparing}
                          aria-label={`Remove photo ${index + 1}`}
                          onClick={() =>
                            setPhotos((current) =>
                              current.filter((_, i) => i !== index),
                            )
                          }
                          className="flex min-h-11 w-full items-center justify-center gap-1 text-xs text-muted-foreground"
                        >
                          <VaahanIcon name="close" size={14} />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <p
                    role="status"
                    className="mt-2 text-xs text-muted-foreground"
                  >
                    {photos.length} of 3 photos added. Photo metadata is removed
                    before upload.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="space-y-4 border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-primary">03</span>
              <h3 className="text-sm font-semibold">Review and send</h3>
            </div>
            <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 p-3.5">
              <input
                type="checkbox"
                checked={consent}
                disabled={busy}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
              />
              <span className="text-xs leading-relaxed text-muted-foreground">
                I agree to share this report and any added photos or location
                with the vehicle owner. Photos remain private in their
                VaahanSafe account.
              </span>
            </label>
            {siteKey ? (
              <div className="min-w-0 space-y-2">
                <Script
                  src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                  onReady={() => {
                    setScriptReady(true);
                    setSecurityError("");
                  }}
                  onError={() =>
                    setSecurityError(
                      "The security check could not load. Please refresh this page or use an approved contact above.",
                    )
                  }
                />
                <div
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                  role="status"
                >
                  <VaahanIcon
                    name={token ? "shield-check" : "shield"}
                    size={16}
                  />
                  <span>
                    {token
                      ? "Security check complete"
                      : securityError
                        ? "Security check needs attention"
                        : "Complete the security check below"}
                  </span>
                </div>
                <div ref={container} className="min-w-0" />
                {securityError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs leading-relaxed"
                  >
                    <p>{securityError}</p>
                    {widget.current && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setToken("");
                          setSecurityError("");
                          if (widget.current)
                            getTurnstile()?.reset(widget.current);
                        }}
                        className="mt-1 min-h-11 font-semibold text-primary underline underline-offset-4"
                      >
                        Retry security check
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                role="status"
                className="rounded-xl border border-primary/25 bg-primary/5 p-3.5"
              >
                <p className="text-sm font-medium">
                  Online reporting is unavailable right now
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Please call or message an approved contact above. For
                  immediate danger, call 112.
                </p>
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive"
              >
                {error}
              </p>
            )}
            <button
              disabled={locked}
              type="submit"
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <VaahanIcon
                name={busy || preparing ? "loading" : "arrow-right"}
                size={18}
                className={busy || preparing ? "animate-spin" : ""}
              />
              {busy
                ? "Sending your report…"
                : preparing
                  ? "Preparing photos…"
                  : "Send report to owner"}
            </button>
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              {!siteKey
                ? "You can still use the contact options above."
                : !consent
                  ? "Agree to share your report to continue."
                  : !token
                    ? "Complete the security check to enable sending."
                    : "The owner will be notified after your report is saved."}
            </p>
          </div>
        </form>
      )}
    </section>
  );
}
