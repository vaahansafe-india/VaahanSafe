"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { SharedScanLocation, ScanReportReason } from "@vaahansafe/qr-core";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
const getTurnstile = () =>
  (window as unknown as { turnstile?: Turnstile }).turnstile;
const reasons: { value: ScanReportReason; label: string }[] = [
  { value: "PARKING", label: "Parking / access blocked" },
  { value: "EMERGENCY", label: "Possible emergency" },
  { value: "LIGHTS_ON", label: "Lights left on" },
  { value: "DAMAGE", label: "Vehicle damage" },
  { value: "OTHER", label: "Other safety concern" },
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
  const container = useRef<HTMLDivElement>(null),
    widget = useRef<string | undefined>(undefined),
    requestId = useRef<string | undefined>(undefined);
  useEffect(() => {
    const turnstile = getTurnstile();
    if (!scriptReady || !siteKey || !container.current || !turnstile) return;
    const id = turnstile.render(container.current, {
      sitekey: siteKey,
      action: "scan-report",
      callback: (value: string) => setToken(value),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
    widget.current = id;
    return () => {
      turnstile.remove(id);
      widget.current = undefined;
    };
  }, [scriptReady, siteKey]);
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
      if (files.length > 3) throw new Error("Choose up to three photos.");
      setPhotos(await Promise.all(Array.from(files).map(preparePhoto)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not prepare photos.");
    } finally {
      setPreparing(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
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
  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div>
        <h2 className="font-semibold text-base text-foreground">
          Notify the vehicle owner
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Share a parking concern or safety report. For immediate danger, call
          112.
        </p>
      </div>
      {success ? (
        <p role="status" className="text-sm text-primary">
          {success}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-xs font-medium">
            What did you notice?
            <select
              value={reason}
              disabled={busy}
              onChange={(e) => setReason(e.target.value as ScanReportReason)}
              className="mt-1 w-full min-h-[44px] rounded-xl border border-border bg-background p-2 text-sm"
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium">
            Details (optional)
            <textarea
              value={note}
              disabled={busy}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm"
              placeholder="Describe the car or parking area"
              rows={2}
            />
          </label>
          <div className="rounded-xl border border-border p-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Your shared location describes where you are standing near the
              car. GPS accuracy varies; it is not vehicle tracking.
            </p>
            <button
              type="button"
              onClick={shareLocation}
              disabled={busy || locating}
              className="min-h-[44px] px-3 rounded-xl border border-primary/30 text-primary text-sm font-medium"
            >
              {locating
                ? "Finding location…"
                : location
                  ? "Refresh shared location"
                  : "Share location"}
            </button>
            {location && (
              <div className="text-xs">
                GPS captured · accuracy ±{Math.ceil(location.accuracy)} m{" "}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setLocation(undefined)}
                  className="underline ml-2"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <label className="block text-xs font-medium">
            Photos of the vehicle / parking area (up to 3)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy || preparing}
              onChange={(e) => void addPhotos(e.target.files)}
              className="mt-2 block w-full text-xs"
            />
          </label>
          <label className="inline-flex items-center min-h-[44px] px-3 rounded-xl border border-border text-sm cursor-pointer">
            Take a photo
            <input
              type="file"
              className="sr-only"
              accept="image/*"
              capture="environment"
              disabled={busy || preparing}
              onChange={(e) => void addPhotos(e.target.files)}
            />
          </label>
          {photos.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {photos.length} photo(s) ready. Original image metadata removed.{" "}
              <button
                type="button"
                disabled={busy}
                onClick={() => setPhotos([])}
                className="underline"
              >
                Remove photos
              </button>
            </p>
          )}
          <label className="flex gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              disabled={busy}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I agree to share these details and any selected location/photos
              with the vehicle owner. Photos remain private and are accessed
              through their VaahanSafe account.
            </span>
          </label>
          {siteKey ? (
            <>
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                onReady={() => setScriptReady(true)}
              />
              <div ref={container} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Reporting is temporarily unavailable. You can still call or
              message an approved contact below.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            disabled={locked}
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
          >
            {busy
              ? "Saving report…"
              : preparing
                ? "Preparing photos…"
                : "Send owner alert"}
          </button>
        </form>
      )}
    </section>
  );
}
