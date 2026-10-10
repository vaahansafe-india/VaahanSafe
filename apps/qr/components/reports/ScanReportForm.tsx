"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";
import type { SharedScanLocation, ScanReportReason } from "@vaahansafe/qr-core";
import { VaahanIcon } from "@vaahansafe/icons";
import { Checkbox } from "@vaahansafe/ui/components/checkbox";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components/dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@vaahansafe/ui/components/radio-group";

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
  vehicleDisplay,
  initialStep = 0,
}: {
  publicId: string;
  siteKey: string;
  vehicleDisplay: string;
  initialStep?: number;
}) {
  const [step, setStep] = useState(initialStep);
  const [offline, setOffline] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [reference, setReference] = useState("");
  const [retryPending, setRetryPending] = useState(false);
  const sending = useRef(false);
  const photoProcessing = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
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
    if (
      step !== 3 ||
      !scriptReady ||
      !siteKey ||
      success ||
      !container.current ||
      !turnstile
    )
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
      setToken("");
    };
  }, [scriptReady, siteKey, success, step]);
  useEffect(() => {
    function syncConnection() {
      setOffline(!navigator.onLine);
    }
    syncConnection();
    window.addEventListener("online", syncConnection);
    window.addEventListener("offline", syncConnection);
    return () => {
      window.removeEventListener("online", syncConnection);
      window.removeEventListener("offline", syncConnection);
    };
  }, []);
  useEffect(() => {
    if (step > 0 && heading.current) {
      heading.current.focus({ preventScroll: true });
      const target = heading.current.closest("form") || heading.current;
      target.scrollIntoView({ block: "start", behavior: "auto" });
    }
  }, [step, success]);
  function goToStep(next: number) {
    setError("");
    setStep(next);
  }
  useEffect(() => {
    const urls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);
  useEffect(() => {
    if (step !== 3 || !siteKey || scriptReady || success) return;
    const timer = setTimeout(
      () =>
        setSecurityError(
          "The security check is taking longer than expected. Please refresh this page or use an approved contact above.",
        ),
      15000,
    );
    return () => clearTimeout(timer);
  }, [siteKey, scriptReady, success, step]);
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
      (failure) => {
        setError(
          failure.code === 1
            ? "Location access is blocked. Allow location for this site in your browser settings, then try again. You can also send without it."
            : failure.code === 3
              ? "Finding your location took too long. Move to an open area and try again, or send without it."
              : "Your device couldn’t find your location. Check that location services are on, then try again. You can also send without it.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }
  async function addPhotos(files: FileList | null) {
    if (!files || photoProcessing.current) return;
    photoProcessing.current = true;
    setError("");
    setPreparing(true);
    try {
      if (photos.length + files.length > 3)
        throw new Error(
          "You can add up to three photos. Remove a photo to choose another.",
        );
      // Decode one camera image at a time to limit memory pressure on phones.
      const prepared: File[] = [];
      for (const file of Array.from(files))
        prepared.push(await preparePhoto(file));
      setPhotos((current) => [...current, ...prepared]);
    } catch (e) {
      setError(
        e instanceof DOMException
          ? "This photo could not be opened. Choose another JPEG, PNG or WebP photo."
          : e instanceof Error
            ? e.message
            : "Could not prepare photos. Please choose another photo.",
      );
    } finally {
      setPreparing(false);
      photoProcessing.current = false;
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending.current || step !== 3) return;
    if (!navigator.onLine) {
      setError(
        "You're offline. Your report hasn't been sent. Reconnect and try again; your details are still here.",
      );
      return;
    }
    if (!consent || !token || !siteKey || preparing || locating) {
      setError(
        "Please agree to share your report and complete the security check before sending.",
      );
      return;
    }
    if (
      location &&
      Date.now() - Date.parse(location.capturedAt) > 5 * 60000 &&
      !retryPending
    ) {
      setError(
        "Your shared location is no longer recent. Go back to update it or remove it before sending.",
      );
      return;
    }
    sending.current = true;
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
        signal: AbortSignal.timeout(45000),
      });
      const body = await res.json();
      // Only start a fresh request after the server confirms the previous write failed.
      // An ambiguous network error keeps the same ID so a saved report is never duplicated.
      if (body.code === "REPORT_RETRY") {
        requestId.current = undefined;
        setRetryPending(false);
      }
      if (!res.ok || !body.recorded)
        throw new Error(
          body.error || "We couldn’t send your report. Please try again.",
        );
      setSuccess(
        body.notificationQueued
          ? "Your report was received. The owner notification is queued; delivery may take a moment."
          : "Your report was received.",
      );
      if (typeof body.id === "string")
        setReference(
          `RPT-••••${body.id
            .replace(/[^a-z0-9]/gi, "")
            .slice(-6)
            .toUpperCase()}`,
        );
      setRetryPending(false);
      setPhotos([]);
      setLocation(undefined);
    } catch (e) {
      const interrupted =
        e instanceof Error &&
        (e.name === "TimeoutError" ||
          e.name === "AbortError" ||
          e instanceof TypeError);
      if (interrupted) setRetryPending(true);
      setError(
        interrupted
          ? "We couldn't confirm whether your report was received. Retry with the same details so it won't be sent twice."
          : e instanceof Error
            ? e.message
            : "We couldn’t send your report. Please try again.",
      );
    } finally {
      setBusy(false);
      sending.current = false;
      setToken("");
      if (widget.current) getTurnstile()?.reset(widget.current);
    }
  }
  const locked =
    busy || preparing || locating || offline || !consent || !token || !siteKey;
  const selectedReason = reasons.find((item) => item.value === reason)!;
  const control =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-base font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
  const primary = `${control} border-primary bg-primary text-primary-foreground hover:bg-primary/90`;
  const stepTitle =
    step === 1
      ? "What happened?"
      : step === 2
        ? "Add useful context"
        : "Review your report";
  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, i) => i !== index));
    setPreviewIndex(null);
  }
  return (
    <section
      aria-labelledby={`${formId}-heading`}
      className="qr-report-section scroll-mt-24 min-w-0 rounded-xl border border-border bg-card"
      id="report-issue"
    >
      {step === 0 ? (
        <div className="space-y-3 p-5 sm:p-6">
          <p className="text-sm font-medium text-primary">Need to help?</p>
          <h2
            id={`${formId}-heading`}
            className="font-serif text-2xl font-semibold"
          >
            Report a vehicle issue
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Share useful information with the owner. No sign-in needed.
          </p>
          <button
            type="button"
            className={`${primary} w-full sm:w-auto`}
            onClick={() => goToStep(1)}
          >
            Report an issue <VaahanIcon name="arrow-right" size={18} />
          </button>
          <p className="text-sm text-muted-foreground">
            Immediate danger?{" "}
            <a
              className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
              href="tel:112"
            >
              Call 112
            </a>
            .
          </p>
        </div>
      ) : success ? (
        <div className="space-y-4 p-5 sm:p-6" role="status">
          <VaahanIcon
            name="success"
            size={32}
            className="text-emerald-800 dark:text-emerald-300"
          />
          <h2
            id={`${formId}-heading`}
            ref={heading}
            tabIndex={-1}
            className="font-serif text-2xl font-semibold"
          >
            Report received
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {success}
          </p>
          {reference && (
            <p className="text-sm">
              Reference{" "}
              <span className="font-mono font-semibold">{reference}</span>
            </p>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground">
            For an immediate response, use an approved contact above. In an
            emergency, call 112.
          </p>
          <a href="#verified-vehicle-title" className={control}>
            Done <VaahanIcon name="check" size={18} />
          </a>
        </div>
      ) : (
        <form onSubmit={submit} aria-busy={busy} className="min-w-0">
          <div className="qr-report-context flex items-center gap-2 border-b border-border bg-muted/50 px-5 py-3 sm:px-6">
            <VaahanIcon
              name="car"
              size={18}
              className="shrink-0 text-primary"
            />
            <span className="min-w-0 flex-1 break-words text-sm font-medium">
              {vehicleDisplay}
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-emerald-800 dark:text-emerald-300"
                  type="button"
                  aria-label="View vehicle summary"
                >
                  <VaahanIcon name="shield-check" size={18} />
                </button>
              </DialogTrigger>
              <DialogContent className="qr-safety-dialog">
                <DialogTitle>Verified vehicle</DialogTitle>
                <DialogDescription>{vehicleDisplay}</DialogDescription>
                <p className="break-all font-mono text-sm">
                  VaahanSafe ID: {publicId}
                </p>
                <p className="text-sm text-muted-foreground">
                  This report is for the vehicle linked to this active QR.
                </p>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div aria-label={`Step ${step} of 3`} className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Step {step} of 3 ·{" "}
                {step === 1 ? "Situation" : step === 2 ? "Details" : "Review"}
              </p>
              <div
                role="progressbar"
                aria-label="Report progress"
                aria-valuemin={0}
                aria-valuemax={3}
                aria-valuenow={step}
                className="h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full bg-primary transition-[width] duration-150 motion-reduce:transition-none"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
            <h2
              ref={heading}
              tabIndex={-1}
              id={`${formId}-heading`}
              className="scroll-mt-24 font-serif text-2xl font-semibold focus:outline-none"
            >
              {stepTitle}
            </h2>
            {offline && (
              <p
                role="status"
                className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"
              >
                You’re offline. Your report hasn’t been sent. Reconnect to send;
                your details remain on this page.
              </p>
            )}
            {step === 1 && (
              <fieldset className="space-y-4" disabled={busy}>
                <legend className="sr-only">Report situation</legend>
                <p className="text-base leading-relaxed text-muted-foreground">
                  Choose the option that best describes what you noticed.
                </p>
                <div className="space-y-2">
                  <p
                    id={`${formId}-reason-label`}
                    className="text-sm font-medium"
                  >
                    Situation
                  </p>
                  <RadioGroup
                    value={reason}
                    onValueChange={(value) =>
                      setReason(value as ScanReportReason)
                    }
                    aria-labelledby={`${formId}-reason-label`}
                    aria-describedby={`${formId}-reason-hint`}
                    disabled={busy}
                    className="gap-2"
                  >
                    {reasons.map((item) => (
                      <label
                        key={item.value}
                        htmlFor={`${formId}-${item.value}`}
                        className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${reason === item.value ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted"}`}
                      >
                        <RadioGroupItem
                          id={`${formId}-${item.value}`}
                          value={item.value}
                          className="qr-report-radio"
                        />
                        <VaahanIcon
                          name={
                            item.value === "LIGHTS_ON"
                              ? "info"
                              : item.value === "DAMAGE" ||
                                  item.value === "EMERGENCY"
                                ? "alert"
                                : item.value === "PARKING"
                                  ? "car"
                                  : "shield"
                          }
                          size={18}
                          className="shrink-0 text-primary"
                        />
                        <span className="min-w-0 text-base font-medium">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                  <p
                    id={`${formId}-reason-hint`}
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {selectedReason.hint}
                  </p>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor={`${formId}-note`}
                    className="block text-sm font-medium"
                  >
                    Add a short note{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id={`${formId}-note`}
                    aria-describedby={`${formId}-note-limit`}
                    value={note}
                    maxLength={300}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    className="block w-full resize-y rounded-lg border border-border bg-background p-3 text-base leading-relaxed focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Describe what you noticed and where to look."
                  />
                  <p
                    id={`${formId}-note-limit`}
                    className="text-right text-sm tabular-nums text-muted-foreground"
                  >
                    {note.length} / 300
                  </p>
                </div>
                {reason === "EMERGENCY" && (
                  <p className="text-sm text-muted-foreground">
                    If someone is in immediate danger,{" "}
                    <a
                      href="tel:112"
                      className="font-semibold text-primary underline"
                    >
                      call 112 first
                    </a>
                    .
                  </p>
                )}
              </fieldset>
            )}
            {step === 2 && (
              <fieldset className="space-y-6" disabled={busy || preparing}>
                <legend className="sr-only">Optional report details</legend>
                <p className="text-base leading-relaxed text-muted-foreground">
                  These details are optional. They can help the owner understand
                  the situation.
                </p>
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    <VaahanIcon name="map-pin" size={19} />
                    Location
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Share your current location to help the owner find the
                    vehicle. Used only for this report.
                  </p>
                  {location ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p
                        role="status"
                        className="text-sm text-emerald-800 dark:text-emerald-300"
                      >
                        ✓ Location added · accuracy ±
                        {Math.ceil(location.accuracy)} m
                      </p>
                      <button
                        type="button"
                        className={control}
                        onClick={shareLocation}
                        disabled={locating}
                      >
                        {locating ? "Updating location…" : "Update location"}
                      </button>
                      <button
                        type="button"
                        className={control}
                        onClick={() => setLocation(undefined)}
                        disabled={locating}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={control}
                      onClick={shareLocation}
                      disabled={locating}
                    >
                      <VaahanIcon
                        name={locating ? "loading" : "map-pin"}
                        size={18}
                        className={
                          locating
                            ? "animate-spin motion-reduce:animate-none"
                            : ""
                        }
                      />
                      {locating ? "Finding location…" : "Share location"}
                    </button>
                  )}
                  {location && location.accuracy > 1000 && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Your device returned a broad location estimate. Try
                      updating it outdoors for better accuracy.
                    </p>
                  )}
                </div>
                <div className="space-y-3 border-t border-border pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-base font-semibold">
                      <VaahanIcon name="camera" size={19} />
                      Photos
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {photos.length} / 3
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Photograph the vehicle or nearby area. Avoid faces, identity
                    documents and unrelated people.
                  </p>
                  <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                    <label
                      className={`${primary} qr-photo-button relative cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50`}
                    >
                      <VaahanIcon
                        name="camera"
                        size={18}
                        className="shrink-0"
                      />
                      <span>Take photo</span>
                      <input
                        aria-label="Take photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        disabled={preparing || photos.length === 3}
                        onChange={(event) => {
                          void addPhotos(event.target.files);
                          event.target.value = "";
                        }}
                        className="sr-only"
                      />
                    </label>
                    <label
                      className={`${control} qr-photo-button relative cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50`}
                    >
                      <VaahanIcon name="add" size={18} className="shrink-0" />
                      <span>Choose photos</span>
                      <input
                        aria-label="Choose photos"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={preparing || photos.length === 3}
                        onChange={(event) => {
                          void addPhotos(event.target.files);
                          event.target.value = "";
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  {preparing && (
                    <p role="status" className="text-sm text-muted-foreground">
                      Preparing photos and removing metadata…
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    JPEG, PNG or WebP · up to 15 MB each before preparation.
                    Photos are resized and metadata is removed before upload.
                  </p>
                  {photos.length === 3 && (
                    <p
                      role="status"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      3 photos added. Remove a photo to add another.
                    </p>
                  )}
                </div>
              </fieldset>
            )}
            {step === 3 && (
              <div className="space-y-5">
                <dl className="grid min-w-0 gap-4 text-base">
                  <div>
                    <dt className="text-sm text-muted-foreground">Vehicle</dt>
                    <dd className="break-words font-medium">
                      {vehicleDisplay}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Situation</dt>
                    <dd className="font-medium">{selectedReason.label}</dd>
                  </div>
                  {note.trim() && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Note</dt>
                      <dd className="whitespace-pre-wrap break-words">
                        {note.trim()}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-muted-foreground">Location</dt>
                    <dd>
                      {location
                        ? `Shared · accuracy ±${Math.ceil(location.accuracy)} m`
                        : "Not shared"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Photos</dt>
                    <dd>
                      {photos.length
                        ? `${photos.length} attached`
                        : "None added"}
                    </dd>
                  </div>
                </dl>
                <div className="flex items-start gap-3 border-t border-border pt-4">
                  <Checkbox
                    id={`${formId}-consent`}
                    className="qr-report-checkbox mt-1"
                    checked={consent}
                    onCheckedChange={(value) => setConsent(value === true)}
                    disabled={busy}
                  />
                  <label
                    htmlFor={`${formId}-consent`}
                    className="min-h-11 cursor-pointer text-sm leading-relaxed"
                  >
                    I understand this report and any attached photos or location
                    will be shared privately with the vehicle owner.
                  </label>
                </div>
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
                    <p
                      role="status"
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <VaahanIcon
                        name={token ? "shield-check" : "shield"}
                        size={17}
                      />
                      {token
                        ? "Security check complete"
                        : securityError
                          ? "Security check needs attention"
                          : "Complete the security check to send"}
                    </p>
                    <div ref={container} className="min-w-0" />
                    {securityError && (
                      <div
                        role="alert"
                        className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed"
                      >
                        <p>{securityError}</p>
                        {widget.current && (
                          <button
                            type="button"
                            disabled={busy || offline}
                            onClick={() => {
                              setToken("");
                              setSecurityError("");
                              if (widget.current)
                                getTurnstile()?.reset(widget.current);
                            }}
                            className="mt-1 min-h-11 font-semibold text-primary underline"
                          >
                            Retry security check
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p
                    role="status"
                    className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed"
                  >
                    Online reporting is unavailable right now. Please call or
                    message an approved contact above. For immediate danger,
                    call 112.
                  </p>
                )}
              </div>
            )}
            {photos.length > 0 && step > 1 && (
              <div
                className="grid grid-cols-3 gap-2"
                aria-label="Attached report photos"
              >
                {previews.map((src, index) => (
                  <div
                    key={src}
                    className="relative aspect-square min-w-0 overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <button
                      type="button"
                      className="block h-full w-full"
                      onClick={() => setPreviewIndex(index)}
                      aria-label={`Preview photo ${index + 1}`}
                    >
                      {/* Local, metadata-free preview; no external image service. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Report photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      disabled={busy || preparing || retryPending}
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() => removePhoto(index)}
                      className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-lg bg-background/95 text-foreground"
                    >
                      <VaahanIcon name="close" size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive"
              >
                {error}
              </p>
            )}
            {busy && (
              <p role="status" className="text-sm text-muted-foreground">
                {photos.length
                  ? "Uploading photos and saving your report…"
                  : "Saving your report…"}{" "}
                Please keep this page open.
              </p>
            )}
            <div className="qr-report-actions grid grid-cols-[auto_1fr] gap-3 border-t border-border pt-4">
              <button
                type="button"
                className={control}
                disabled={busy || preparing || locating || retryPending}
                onClick={() => goToStep(step - 1)}
              >
                <VaahanIcon name="chevron-left" size={18} />
                <span>Back</span>
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  className={primary}
                  disabled={busy || preparing || locating}
                  onClick={() => goToStep(step + 1)}
                >
                  Continue <VaahanIcon name="arrow-right" size={18} />
                </button>
              ) : (
                <button type="submit" className={primary} disabled={locked}>
                  <VaahanIcon
                    name={busy ? "loading" : "arrow-right"}
                    size={18}
                    className={
                      busy ? "animate-spin motion-reduce:animate-none" : ""
                    }
                  />
                  {busy
                    ? "Sending…"
                    : retryPending
                      ? "Retry send"
                      : "Send report"}
                </button>
              )}
            </div>
            {step === 3 && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {!siteKey
                  ? "Use an approved contact above for help."
                  : !consent
                    ? "Confirm sharing to enable sending."
                    : !token
                      ? "Complete the security check before sending."
                      : "The owner will be notified after your report is saved."}
              </p>
            )}
          </div>
        </form>
      )}
      <Dialog
        open={previewIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewIndex(null);
        }}
      >
        <DialogContent className="qr-safety-dialog">
          <DialogTitle className="pr-10">Photo preview</DialogTitle>
          <DialogDescription>
            {previewIndex !== null
              ? `Photo ${previewIndex + 1} of ${photos.length}. Stored locally until you send the report.`
              : "Report attachment"}
          </DialogDescription>
          {previewIndex !== null && previews[previewIndex] && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previews[previewIndex]}
                alt={`Report photo ${previewIndex + 1}`}
                className="max-h-[55dvh] w-full rounded-lg object-contain"
              />
              <div className="flex flex-wrap justify-between gap-2">
                <button
                  type="button"
                  className={control}
                  disabled={previewIndex === 0}
                  aria-label="Previous photo"
                  onClick={() => setPreviewIndex(previewIndex - 1)}
                >
                  <VaahanIcon name="chevron-left" size={18} />
                </button>
                <button
                  type="button"
                  className={control}
                  disabled={busy || retryPending}
                  onClick={() => removePhoto(previewIndex)}
                >
                  Remove photo
                </button>
                <button
                  type="button"
                  className={control}
                  disabled={previewIndex === photos.length - 1}
                  aria-label="Next photo"
                  onClick={() => setPreviewIndex(previewIndex + 1)}
                >
                  <VaahanIcon name="arrow-right" size={18} />
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
