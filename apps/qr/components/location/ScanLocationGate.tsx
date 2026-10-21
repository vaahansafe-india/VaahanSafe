"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SharedScanLocation } from "@vaahansafe/qr-core";
import { VaahanIcon } from "@vaahansafe/icons";

const ScanLocationContext = createContext<SharedScanLocation | undefined>(
  undefined,
);
export const useScanLocation = () => useContext(ScanLocationContext);

export function ScanLocationGate({
  ticket,
  children,
}: {
  ticket: string;
  children: ReactNode;
}) {
  const [location, setLocation] = useState<SharedScanLocation>();
  const [pendingLocation, setPendingLocation] = useState<SharedScanLocation>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  async function save(value: SharedScanLocation) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/scan-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, location: value, consent: true }),
        signal: AbortSignal.timeout(15000),
      });
      const body = await response.json();
      if (!response.ok || body.recorded !== true)
        throw new Error(body.error || "Please retry sharing your location.");
      setLocation(value);
      setPendingLocation(undefined);
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name === "Error"
          ? failure.message
          : "We couldn’t save your location. Check your connection and retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  function requestLocation() {
    if (busy) return;
    setError("");
    if (!ticket) {
      setError(
        "Location capture is unavailable. Refresh this page and try again.",
      );
      return;
    }
    if (!navigator.geolocation) {
      setError(
        "This browser cannot share location. Open this QR in Safari or Chrome with location services enabled.",
      );
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        };
        setPendingLocation(value);
        void save(value);
      },
      (failure) => {
        setBusy(false);
        setError(
          failure.code === 1
            ? "Location permission is blocked. In your browser’s site settings, allow location for qr.vaahansafe.com, turn on device location services, then retry."
            : failure.code === 3
              ? "Finding your location took too long. Move to an open area and retry."
              : "Your device couldn’t find its location. Turn on location services and retry.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  }
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    requestLocation();
    // One browser permission request per page visit; retries are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (location)
    return (
      <ScanLocationContext.Provider value={location}>
        {children}
      </ScanLocationContext.Provider>
    );
  return (
    <section
      className="w-full space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-8"
      aria-labelledby="scan-location-title"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        <VaahanIcon name="map-pin" size={25} />
      </span>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Location required
        </p>
        <h1
          id="scan-location-title"
          className="font-serif text-3xl sm:text-4xl"
        >
          Help them find the right place.
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Allow your current location to continue to this vehicle’s safety page.
          Its approximate city and state are recorded with this scan. If you
          send a report, your GPS location is shared with its recipients.
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Only this visit is captured. VaahanSafe does not track your movement.
          Approximate coordinates are used to look up the place name with
          OpenStreetMap / Photon.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          pendingLocation &&
          Date.now() - Date.parse(pendingLocation.capturedAt) < 300000
            ? void save(pendingLocation)
            : requestLocation()
        }
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        <VaahanIcon
          name={busy ? "loading" : "map-pin"}
          size={19}
          className={busy ? "animate-spin motion-reduce:animate-none" : ""}
        />
        {busy
          ? "Finding and saving location…"
          : pendingLocation
            ? "Retry saving location"
            : "Allow location and continue"}
      </button>
      <p role="status" className="text-xs text-muted-foreground">
        {busy
          ? "Choose Allow when your browser asks for location permission."
          : "Location permission is needed to continue."}
      </p>
      <div className="border-t border-border pt-4 text-sm leading-relaxed">
        <p>If someone is in immediate danger, call emergency services now.</p>
        <a
          className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4"
          href="tel:112"
        >
          <VaahanIcon name="phone" size={18} /> Call 112
        </a>
      </div>
    </section>
  );
}
