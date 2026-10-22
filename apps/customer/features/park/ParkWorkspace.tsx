"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { ParkData, ParkLocation, ParkSession } from "./model";
import { parkClock, parkingDirectionsUrl } from "./model";
import { ParkMap } from "./ParkMap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatTime = (time: string) =>
  new Date(time).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
async function requestPark<T>(
  path = "/api/park",
  options?: RequestInit,
): Promise<T> {
  const r = await fetch(path, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  let body: Record<string, unknown>;
  try {
    body = await r.json();
  } catch {
    throw new Error(
      "We couldn’t open your parking notebook. Please try again.",
    );
  }
  if (!r.ok)
    throw new Error(
      typeof body.error === "string" ? body.error : "Please try again.",
    );
  return body as T;
}
export function ParkWorkspace({ phoneVerified }: { phoneVerified: boolean }) {
  const [data, setData] = useState<ParkData | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [vehicle, setVehicle] = useState(""),
    [location, setLocation] = useState<ParkLocation | null>(null);
  const [floor, setFloor] = useState(""),
    [bay, setBay] = useState(""),
    [notes, setNotes] = useState(""),
    [duration, setDuration] = useState("120");
  const [consent, setConsent] = useState(false),
    [gpsBusy, setGpsBusy] = useState(false),
    [gpsError, setGpsError] = useState("");
  const [now, setNow] = useState<number | null>(null),
    [notice, setNotice] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const requestId = useRef<string | null>(null),
    deleteDialog = useRef<HTMLDialogElement>(null);
  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const v = await requestPark<ParkData>();
      setData(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (phoneVerified) void load();
    else setLoading(false);
  }, [load, phoneVerified]);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (deleteId) deleteDialog.current?.showModal();
    else deleteDialog.current?.close();
  }, [deleteId]);
  const active = data?.sessions.filter((s) => s.status === "PARKED") || [];
  const history = data?.sessions.filter((s) => s.status === "ENDED") || [];
  const available =
    data?.vehicles.filter((v) => !active.some((s) => s.vehicle_id === v.id)) ||
    [];
  const chosen = active.find((s) => s.id === selected) || active[0];
  useEffect(() => {
    if (available.length && !available.some((v) => v.id === vehicle))
      setVehicle(available[0]!.id);
    if (!available.length) setVehicle("");
  }, [data, vehicle]); // Values only originate from the authoritative vehicle response.
  const getGps = () => {
    if (!consent) {
      setGpsError("Please confirm location sharing below first.");
      return;
    }
    if (!navigator.geolocation) {
      setGpsError(
        "This browser cannot share location. Open Park in a supported browser.",
      );
      return;
    }
    setGpsError("");
    setGpsBusy(true);
    setLocation(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
          capturedAt: new Date(p.timestamp).toISOString(),
        });
        setGpsBusy(false);
      },
      (e) => {
        setGpsBusy(false);
        setGpsError(
          e.code === 1
            ? "Location permission is blocked. Allow location in your browser settings and try again."
            : e.code === 3
              ? "Your phone couldn’t find a location in time. Move near an open area and try again."
              : "Your location is unavailable. Turn on location services and try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !location || !consent || !vehicle) return;
    setBusy(true);
    setError("");
    setNotice("");
    requestId.current ??= crypto.randomUUID();
    try {
      const r = await requestPark<{ session: ParkSession }>("/api/park", {
        method: "POST",
        body: JSON.stringify({
          id: requestId.current,
          vehicleId: vehicle,
          location,
          locationConsent: consent,
          floor,
          bay,
          notes,
          durationMinutes: duration ? Number(duration) : null,
        }),
      });
      setSelected(r.session.id);
      setLocation(null);
      setFloor("");
      setBay("");
      setNotes("");
      requestId.current = null;
      setNotice("Your parking spot is saved. Carry on with your day.");
      await load();
      // Address enrichment runs after save. Reload the persisted label without repeating creation.
      setTimeout(() => void load(), 5000);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your spot could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const mutate = async (id: string, action: "end" | "delete") => {
    setBusy(true);
    setError("");
    try {
      await requestPark(`/api/park/${id}`, {
        method: action === "end" ? "PATCH" : "DELETE",
      });
      setDeleteId(null);
      setNotice(
        action === "end"
          ? "Back at your car. Your parking session has ended."
          : "The parking record and its saved location have been deleted.",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const plate = (id: string) =>
    data?.vehicles.find((v) => v.id === id)?.registration_number ||
    "Your vehicle";
  const clock = chosen && now ? parkClock(chosen, now) : null;
  return (
    <div className="park-workspace min-h-screen">
      <header className="park-top">
        <a
          href="https://park.vaahansafe.com"
          className="park-wordmark"
          aria-label="Park by VaahanSafe home"
        >
          <img src="/images/park/icon.svg" width={44} height={44} alt="" />
          <span className="park-brand-text">
            park<small>BY VAAHANSAFE</small>
          </span>
        </a>
        <nav className="park-top-links" aria-label="Park navigation">
          <a className="park-nav-current" href="/park" aria-current="page">
            <VaahanIcon name="location" size={16} />
            My notebook
          </a>
          <a href="/dashboard">
            <VaahanIcon name="arrow-left" size={16} /> My VaahanSafe
          </a>
          <a href="/help" aria-label="Help">
            <VaahanIcon name="help" size={20} />
          </a>
        </nav>
      </header>
      <main className="park-main">
        <div className="park-intro">
          <div>
            <p className="park-eyebrow">A LITTLE LESS TO REMEMBER</p>
            <h1>
              Your parking <em>notebook.</em>
            </h1>
            <p>Leave a pin. Keep the little details. Find your way back.</p>
          </div>
          <div className="park-private">
            <VaahanIcon name="lock" size={17} />
            <span>
              PRIVATE TO YOUR ACCOUNT
              <br />
              <small>Never shown on your public QR page</small>
            </span>
          </div>
        </div>
        {!phoneVerified ? (
          <section className="park-empty">
            <VaahanIcon name="phone" size={32} />
            <h2>A small step before you park.</h2>
            <p>Verify your mobile number in VaahanSafe to save your parking.</p>
            <a
              className="park-button"
              href="/onboarding/phone?returnUrl=%2Fpark"
            >
              Verify mobile number <VaahanIcon name="arrow-right" size={16} />
            </a>
          </section>
        ) : (
          <>
            {notice && (
              <div className="park-notice" role="status">
                <VaahanIcon name="check" size={18} />
                {notice}
                <button
                  aria-label="Dismiss notice"
                  onClick={() => setNotice("")}
                >
                  <VaahanIcon name="close" size={16} />
                </button>
              </div>
            )}
            {error && (
              <div className="park-error" role="alert">
                <VaahanIcon name="alert" size={18} />
                <span>{error}</span>
                <button onClick={() => void load()} disabled={loading}>
                  Try again
                </button>
              </div>
            )}
            {loading && !data ? (
              <div className="park-loading" role="status">
                <span />
                <p>Opening your parking notebook…</p>
              </div>
            ) : data ? (
              <>
                <div className="park-stats">
                  <span>
                    <VaahanIcon name="vehicle" size={18} />
                    {data.vehicles.length}{" "}
                    {data.vehicles.length === 1 ? "vehicle" : "vehicles"}
                  </span>
                  <span>
                    <span className="park-dot" />
                    {active.length} currently parked
                  </span>
                  <button
                    onClick={() => void load()}
                    disabled={loading || busy}
                  >
                    <VaahanIcon name="refresh" size={15} />
                    {loading ? "Refreshing…" : "Refresh notebook"}
                  </button>
                </div>
                <div className="park-columns">
                  <section className="park-current">
                    <div className="park-section-title">
                      <span className="park-eyebrow">01 / YOUR SAVED SPOT</span>
                      <span className="park-status">
                        {active.length ? "PARKED" : "READY WHEN YOU ARE"}
                      </span>
                    </div>
                    {chosen ? (
                      <>
                        <div
                          className="park-tabs"
                          role="group"
                          aria-label="Parked vehicles"
                        >
                          {active.map((s) => (
                            <button
                              key={s.id}
                              className={
                                s.id === chosen.id ? "is-selected" : ""
                              }
                              onClick={() => setSelected(s.id)}
                            >
                              {plate(s.vehicle_id)}
                            </button>
                          ))}
                        </div>
                        <div className="park-ticket">
                          <div>
                            <p className="park-eyebrow">
                              {plate(chosen.vehicle_id)}
                            </p>
                            <h2>
                              {chosen.place_name || "Your saved parking spot"}
                            </h2>
                            <p className="park-captured">
                              Saved {formatTime(chosen.started_at)}
                            </p>
                          </div>
                          <div className="park-ticket-clock">
                            <span>
                              {chosen.return_at
                                ? clock?.overdue
                                  ? "PAST YOUR RETURN TIME"
                                  : "RETURN IN"
                                : "PARKED FOR"}
                            </span>
                            <strong
                              className={clock?.overdue ? "is-overdue" : ""}
                            >
                              {chosen.return_at
                                ? clock?.remaining || "--:--:--"
                                : clock?.elapsed || "--:--:--"}
                            </strong>
                            <small>
                              {chosen.return_at
                                ? `Return by ${formatTime(chosen.return_at)}`
                                : "Take your time. Your spot is saved."}
                            </small>
                          </div>
                        </div>
                        <ParkMap
                          key={chosen.id}
                          id={chosen.id}
                          place={chosen.place_name}
                          accuracy={chosen.accuracy_m}
                        />
                        <p className="park-map-note">
                          Map and address by Ola Maps. Your phone’s accuracy can
                          vary, especially indoors.
                        </p>
                        <div className="park-location-details">
                          <div>
                            <span>FLOOR / LEVEL</span>
                            <strong>{chosen.floor_label || "Not noted"}</strong>
                          </div>
                          <div>
                            <span>BAY / SLOT</span>
                            <strong>{chosen.bay_label || "Not noted"}</strong>
                          </div>
                          <div>
                            <span>PARKED FOR</span>
                            <strong>{clock?.elapsed || "--:--:--"}</strong>
                          </div>
                        </div>
                        {chosen.notes && (
                          <div className="park-note">
                            <VaahanIcon name="edit" size={18} />
                            <p>{chosen.notes}</p>
                          </div>
                        )}
                        <div className="park-actions">
                          <a
                            className="park-button"
                            href={parkingDirectionsUrl(
                              chosen.latitude,
                              chosen.longitude,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Walking directions{" "}
                            <VaahanIcon name="external-link" size={16} />
                          </a>
                          <button
                            className="park-button park-button-outline"
                            disabled={busy}
                            onClick={() => void mutate(chosen.id, "end")}
                          >
                            I’m back at my car{" "}
                            <VaahanIcon name="check" size={16} />
                          </button>
                          <button
                            className="park-delete"
                            disabled={busy}
                            onClick={() => setDeleteId(chosen.id)}
                            aria-label="Delete active parking record"
                          >
                            <VaahanIcon name="trash" size={18} />
                          </button>
                        </div>
                        <p className="park-small-print">
                          The countdown updates while this page is open.
                          Background alarms are not enabled.
                        </p>
                      </>
                    ) : (
                      <div className="park-empty-current">
                        <div className="park-empty-art" aria-hidden="true">
                          <img
                            src="/images/park/park-hero.webp"
                            width={1400}
                            height={934}
                            alt=""
                          />
                          <span>
                            <VaahanIcon name="location" size={18} /> A PLACE FOR
                            YOUR NEXT PAUSE
                          </span>
                        </div>
                        <div className="park-empty-symbol">
                          <VaahanIcon name="location" size={42} />
                        </div>
                        <h2>
                          A little place
                          <br />
                          <em>to remember.</em>
                        </h2>
                        <p>
                          Your saved parking spot will appear here.
                          <br />
                          Choose a vehicle and leave a pin to get started.
                        </p>
                        <span>THE PIN. THE FLOOR. THAT LITTLE DETAIL.</span>
                      </div>
                    )}
                  </section>
                  <section className="park-save">
                    <p className="park-eyebrow">02 / LEAVE A PIN</p>
                    <h2>Parked somewhere?</h2>
                    <p>Let’s keep your spot safe in your notebook.</p>
                    {!data.vehicles.length ? (
                      <div className="park-form-empty">
                        <VaahanIcon name="vehicle" size={28} />
                        <p>
                          Add a vehicle to your VaahanSafe account to save a
                          parking spot.
                        </p>
                        <a className="park-button" href="/vehicles">
                          Add a vehicle <VaahanIcon name="plus" size={16} />
                        </a>
                      </div>
                    ) : !available.length ? (
                      <div className="park-form-empty">
                        <VaahanIcon name="check" size={28} />
                        <p>
                          All your vehicles have a saved spot. End an open
                          session before parking again.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={save}>
                        <div className="park-field">
                          <label htmlFor="park-vehicle">YOUR VEHICLE</label>
                          <Select
                            required
                            value={vehicle}
                            onValueChange={(value) => {
                              setVehicle(value);
                              requestId.current = null;
                            }}
                          >
                            <SelectTrigger
                              id="park-vehicle"
                              className="park-select-trigger"
                            >
                              <VaahanIcon name="vehicle" size={20} />
                              <SelectValue placeholder="Choose a vehicle" />
                            </SelectTrigger>
                            <SelectContent
                              className="park-select-menu"
                              position="popper"
                              sideOffset={6}
                            >
                              {available.map((v) => (
                                <SelectItem
                                  className="park-select-option"
                                  value={v.id}
                                  key={v.id}
                                  textValue={`${v.registration_number} ${v.make} ${v.model}`}
                                >
                                  <span className="park-vehicle-option">
                                    <strong>{v.registration_number}</strong>
                                    <small>
                                      {v.make} {v.model}
                                    </small>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="park-field-row">
                          <label className="park-field">
                            FLOOR / LEVEL <span>OPTIONAL</span>
                            <input
                              maxLength={40}
                              placeholder="e.g. Basement 2"
                              value={floor}
                              onChange={(e) => setFloor(e.target.value)}
                            />
                          </label>
                          <label className="park-field">
                            BAY / SLOT <span>OPTIONAL</span>
                            <input
                              maxLength={40}
                              placeholder="e.g. C-14"
                              value={bay}
                              onChange={(e) => setBay(e.target.value)}
                            />
                          </label>
                        </div>
                        <label className="park-field">
                          A LITTLE NOTE <span>OPTIONAL</span>
                          <textarea
                            rows={3}
                            maxLength={500}
                            placeholder="Beside the lift, near the green pillar…"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </label>
                        <div className="park-field">
                          <label htmlFor="park-duration">
                            RETURN-BY COUNTDOWN
                          </label>
                          <Select
                            value={duration || "none"}
                            onValueChange={(v) =>
                              setDuration(v === "none" ? "" : v)
                            }
                          >
                            <SelectTrigger
                              id="park-duration"
                              className="park-select-trigger park-duration-trigger"
                            >
                              <VaahanIcon name="clock" size={20} />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                              className="park-select-menu"
                              position="popper"
                              sideOffset={6}
                            >
                              {[
                                ["none", "No countdown"],
                                ["30", "30 minutes"],
                                ["60", "1 hour"],
                                ["120", "2 hours"],
                                ["180", "3 hours"],
                                ["240", "4 hours"],
                                ["480", "8 hours"],
                                ["1440", "24 hours"],
                              ].map(([value, label]) => (
                                <SelectItem
                                  key={value}
                                  value={value!}
                                  className="park-select-option"
                                >
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <label className="park-consent">
                          <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => {
                              setConsent(e.target.checked);
                              if (!e.target.checked) setLocation(null);
                            }}
                          />
                          <span>
                            Save my current location privately in my account.
                            Use Ola Maps to display my saved spot and look up
                            its address when available.
                          </span>
                        </label>
                        <p className="park-small-print">
                          Maps & address lookup:{" "}
                          <a
                            href="https://maps.olakrutrim.com/legal-docs/terms-conditions-2026.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ola Maps terms
                          </a>{" "}
                          ·{" "}
                          <a
                            href="https://maps.olakrutrim.com/legal-docs/platform-privacy-policy-2026.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ola Maps privacy
                          </a>
                        </p>
                        <button
                          className={`park-gps ${location ? "is-ready" : ""}`}
                          type="button"
                          disabled={gpsBusy || !consent || busy}
                          onClick={getGps}
                        >
                          <VaahanIcon
                            name={
                              gpsBusy
                                ? "refresh"
                                : location
                                  ? "check"
                                  : "location"
                            }
                            size={20}
                          />
                          <span>
                            {gpsBusy
                              ? "Finding your location…"
                              : location
                                ? "Location captured"
                                : "Use my current location"}
                            {location && (
                              <small>
                                GPS accuracy ±{Math.ceil(location.accuracy)} m ·
                                capture again to refresh
                              </small>
                            )}
                          </span>
                        </button>
                        {location && location.accuracy > 100 && (
                          <p className="park-gps-warning">
                            Your location is approximate. Add a floor or
                            landmark note to make returning easier.
                          </p>
                        )}
                        {gpsError && (
                          <p className="park-error-inline" role="alert">
                            {gpsError}
                          </p>
                        )}
                        <button
                          className="park-button park-save-button"
                          type="submit"
                          disabled={busy || !location || !consent || !vehicle}
                        >
                          {busy ? "Saving your spot…" : "Save my parking"}
                          <VaahanIcon name="arrow-right" size={17} />
                        </button>
                        <p className="park-small-print">
                          Location is captured once when you ask. Park does not
                          continuously track your vehicle.
                        </p>
                      </form>
                    )}
                  </section>
                </div>
                <section className="park-history">
                  <div className="park-section-title">
                    <div>
                      <p className="park-eyebrow">03 / PLACES YOU PAUSED</p>
                      <h2>Recent stops.</h2>
                    </div>
                    <span>YOUR LATEST 50 RECORDS</span>
                  </div>
                  {history.length ? (
                    <div className="park-history-list">
                      {history.map((s) => (
                        <article key={s.id}>
                          <VaahanIcon name="location" size={19} />
                          <div>
                            <strong>
                              {s.place_name ||
                                [s.floor_label, s.bay_label]
                                  .filter(Boolean)
                                  .join(" · ") ||
                                "Saved parking spot"}
                            </strong>
                            <p>
                              {plate(s.vehicle_id)} · {formatTime(s.started_at)}
                            </p>
                          </div>
                          <span className="park-history-duration">
                            {parkClock(s, now || Date.now()).elapsed}
                            <small>SESSION ENDED</small>
                          </span>
                          <button
                            className="park-delete"
                            disabled={busy}
                            onClick={() => setDeleteId(s.id)}
                            aria-label={`Delete parking record from ${formatTime(s.started_at)}`}
                          >
                            <VaahanIcon name="trash" size={17} />
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="park-history-empty">
                      Your completed parking sessions will be kept here. You can
                      delete any record and its location.
                    </p>
                  )}
                </section>
              </>
            ) : !error ? (
              <div className="park-empty">
                <h2>Your notebook is ready.</h2>
                <button className="park-button" onClick={() => void load()}>
                  Open my notebook
                </button>
              </div>
            ) : null}
          </>
        )}
        <footer className="park-workspace-footer">
          <span>Park by VaahanSafe</span>
          <p>For every journey. And the pauses in between.</p>
          <a href="https://vaahansafe.com/privacy">Privacy</a>
        </footer>
      </main>
      <dialog
        ref={deleteDialog}
        className="park-dialog"
        onCancel={() => setDeleteId(null)}
      >
        <VaahanIcon name="trash" size={27} />
        <h2>Let this stop go?</h2>
        <p>
          This permanently deletes this parking record, its notes and saved
          location. You cannot undo this.
        </p>
        {error && (
          <p role="alert" className="park-error-inline">
            {error}
          </p>
        )}
        <div>
          <button
            className="park-button park-button-outline"
            disabled={busy}
            onClick={() => setDeleteId(null)}
          >
            Keep record
          </button>
          <button
            className="park-button"
            disabled={busy}
            onClick={() => deleteId && void mutate(deleteId, "delete")}
          >
            {busy ? "Deleting…" : "Delete record"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
