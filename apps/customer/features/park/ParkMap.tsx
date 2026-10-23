"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  parkClock,
  parkingMapUrl,
  type ParkingMapType,
  type ParkSession,
} from "./model";

export function ParkMap({
  id,
  place,
  accuracy,
  directionsUrl,
  floor,
  bay,
  expandable = true,
  fullPage = false,
  session,
  vehicle,
}: {
  id: string;
  place: string | null;
  accuracy: number;
  directionsUrl?: string;
  floor?: string | null;
  bay?: string | null;
  expandable?: boolean;
  fullPage?: boolean;
  session?: ParkSession;
  vehicle?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [railHidden, setRailHidden] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!fullPage) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [fullPage]);
  const clock = session && now ? parkClock(session, now) : null;
  const [allowedId, setAllowedId] = useState<string | null>(null);
  const [type, setType] = useState<ParkingMapType>("roadmap");
  const [retry, setRetry] = useState(0),
    [src, setSrc] = useState("");
  const [error, setError] = useState(false),
    [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const allowed = allowedId === id;
  useEffect(() => {
    setSrc("");
    setError(false);
    setReady(false);
    setSlow(false);
    if (!allowed) return;
    const abort = new AbortController();
    void (async () => {
      try {
        const response = await fetch(parkingMapUrl(id, 16, type), {
          credentials: "same-origin",
          cache: "no-store",
          signal: abort.signal,
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        const url = new URL(data.embedUrl);
        if (
          url.origin !== "https://www.google.com" ||
          url.pathname !== "/maps/embed/v1/place"
        )
          throw new Error();
        if (!abort.signal.aborted) setSrc(url.toString());
      } catch {
        if (!abort.signal.aborted) setError(true);
      }
    })();
    return () => abort.abort();
  }, [id, allowed, type, retry]);
  useEffect(() => {
    if (!allowed || ready || error) return;
    const timer = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(timer);
  }, [allowed, ready, error, src, retry]);
  const reload = () => {
    setReady(false);
    setRetry((v) => v + 1);
  };
  const toolbar = () => (
    <div className="park-map-toolbar">
      <div className="park-map-types" role="group" aria-label="Map appearance">
        {(["roadmap", "satellite"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={type === value}
            onClick={() => setType(value)}
          >
            <VaahanIcon
              name={value === "roadmap" ? "route" : "globe"}
              size={15}
            />
            {value === "roadmap" ? "Map" : "Satellite"}
          </button>
        ))}
      </div>
      <div className="park-map-tools">
        {fullPage && (
          <button
            type="button"
            className="park-atlas-details-toggle"
            aria-label={
              railHidden ? "Show parking details" : "Hide parking details"
            }
            aria-expanded={!railHidden}
            onClick={() => setRailHidden((value) => !value)}
          >
            <VaahanIcon name="panel-left" size={17} />
            <span>{railHidden ? "Show details" : "Hide details"}</span>
          </button>
        )}
        {allowed && (
          <button
            type="button"
            aria-label="Reload parking map"
            onClick={reload}
          >
            <VaahanIcon name="refresh" size={17} />
          </button>
        )}
        {!fullPage && expandable && (
          <Link
            href={`/park/map/${encodeURIComponent(id)}`}
            prefetch={false}
            aria-label="Open full-page parking map"
          >
            <VaahanIcon name="fullscreen" size={17} />
          </Link>
        )}
      </div>
    </div>
  );
  const map = (large = false) => (
    <div className={`park-google-canvas ${large ? "is-expanded" : ""}`}>
      {!allowed ? (
        <div className="park-map-invitation">
          <span className="park-map-pin">
            <VaahanIcon name="location" size={29} />
          </span>
          <span className="park-eyebrow">A LITTLE HELP FINDING YOUR WAY</span>
          <h3>Your spot. In perspective.</h3>
          <p>
            Load an interactive map of this saved spot. Its coordinates will be
            shared with Google Maps.
          </p>
          <button
            type="button"
            className="park-button"
            onClick={() => setAllowedId(id)}
          >
            Load Google Maps <VaahanIcon name="arrow-right" size={16} />
          </button>
          <small>
            <VaahanIcon name="lock" size={12} /> Your parking record stays
            private.
          </small>
          <div className="park-map-policy">
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google privacy
            </a>
            <span>·</span>
            <a
              href="https://www.google.com/intl/en/help/terms_maps/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Maps terms
            </a>
          </div>
        </div>
      ) : error ? (
        <div className="park-map-invitation" role="alert">
          <span className="park-map-pin">
            <VaahanIcon name="location" size={28} />
          </span>
          <h3>Your spot is still saved.</h3>
          <p>
            We couldn’t open the map right now. Try again, or use the walking
            directions below.
          </p>
          <button type="button" className="park-button" onClick={reload}>
            Try again <VaahanIcon name="refresh" size={16} />
          </button>
        </div>
      ) : src ? (
        <iframe
          key={`${src}:${retry}:${large}`}
          src={src}
          title={`Google Maps: ${place || "your saved parking spot"}`}
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onLoad={() => {
            setReady(true);
            setSlow(false);
          }}
          onError={() => setError(true)}
        />
      ) : (
        <div className="park-map-invitation" role="status">
          <VaahanIcon name="compass" size={30} />
          <h3>Opening your map…</h3>
          <p>Your saved location, in a closer view.</p>
        </div>
      )}
    </div>
  );
  const feedback = () =>
    allowed &&
    !error &&
    !ready && (
      <div className="park-map-feedback" role="status">
        <VaahanIcon name="refresh" size={13} />
        <span>
          {slow
            ? "Taking longer than usual. You can reload or open walking directions."
            : "Loading Google Maps…"}
        </span>
        {slow && (
          <button type="button" onClick={reload}>
            Retry
          </button>
        )}
      </div>
    );
  if (fullPage)
    return (
      <div className="park-atlas">
        <header className="park-atlas-header">
          <Link
            className="park-atlas-back"
            href="/park"
            aria-label="Back to parking notebook"
          >
            <VaahanIcon name="arrow-left" size={19} />
          </Link>
          <Link className="park-atlas-brand" href="/park">
            <img src="/images/park/icon.svg" width={32} height={32} alt="" />
            <span>
              park<small>YOUR SAVED PLACES</small>
            </span>
          </Link>
          <span className="park-atlas-private">
            <VaahanIcon name="lock" size={14} /> Private map
          </span>
        </header>
        <div className={`park-atlas-grid ${railHidden ? "is-map-only" : ""}`}>
          <section
            className="park-atlas-surface"
            aria-label="Saved parking map"
          >
            {toolbar()}
            {map(true)}
            {feedback()}
          </section>
          <aside
            className={`park-atlas-details ${detailsOpen ? "is-open" : ""}`}
          >
            <button
              type="button"
              className="park-atlas-sheet-toggle"
              aria-expanded={detailsOpen}
              aria-controls="parking-map-details"
              onClick={() => setDetailsOpen((v) => !v)}
            >
              <span className="park-atlas-sheet-grip" />
              <span>
                {detailsOpen ? "Less detail, more map" : "Parking details"}
              </span>
              <VaahanIcon
                name={detailsOpen ? "chevron-down" : "chevron-up"}
                size={17}
              />
            </button>
            <div className="park-atlas-place">
              <span className="park-eyebrow">
                {session?.status === "ENDED"
                  ? "FROM YOUR NOTEBOOK"
                  : "YOUR WAY BACK"}
              </span>
              <h1>{place || "Your saved parking spot"}</h1>
              <p>
                <VaahanIcon name="vehicle" size={16} />
                {vehicle}
                <span>
                  {session?.status === "ENDED" ? "COMPLETED" : "PARKED"}
                </span>
              </p>
            </div>
            {directionsUrl && (
              <a
                className="park-atlas-walk"
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <VaahanIcon name="route" size={19} />
                <span>
                  Walk to this spot<small>Open Google Maps directions</small>
                </span>
                <VaahanIcon name="external-link" size={16} />
              </a>
            )}
            <div id="parking-map-details" className="park-atlas-more">
              <dl className="park-atlas-facts">
                <div>
                  <dt>FLOOR / LEVEL</dt>
                  <dd>{floor || "Not noted"}</dd>
                </div>
                <div>
                  <dt>BAY / SLOT</dt>
                  <dd>{bay || "Not noted"}</dd>
                </div>
              </dl>
              {session && (
                <div className="park-atlas-time">
                  <VaahanIcon name="clock" size={21} />
                  <div>
                    <span>
                      {session.status === "ENDED"
                        ? "TIME PARKED"
                        : session.return_at
                          ? clock?.overdue
                            ? "PAST YOUR RETURN TIME"
                            : "TIME TO RETURN"
                          : "PARKED FOR"}
                    </span>
                    <strong className={clock?.overdue ? "is-overdue" : ""}>
                      {session.status === "PARKED" && session.return_at
                        ? clock?.remaining || "—"
                        : clock?.elapsed || "—"}
                    </strong>
                    <small>
                      Saved{" "}
                      {new Date(session.started_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Kolkata",
                      })}
                    </small>
                  </div>
                </div>
              )}
              {session?.notes && (
                <div className="park-atlas-note">
                  <VaahanIcon name="edit" size={17} />
                  <p>{session.notes}</p>
                </div>
              )}
              <div className="park-atlas-accuracy">
                <VaahanIcon name="location" size={18} />
                <div>
                  <strong>GPS accuracy ±{Math.ceil(accuracy)} m</strong>
                  <p>
                    A saved pin, not live tracking. Your phone’s accuracy can
                    vary, especially indoors.
                  </p>
                </div>
              </div>
              <p className="park-atlas-attribution">
                Interactive maps by Google Maps.
                <br />
                Address lookup by Ola Maps.
              </p>
            </div>
          </aside>
        </div>
      </div>
    );
  return (
    <div className="park-map-shell park-google-shell">
      <div className="park-map-caption">
        <span>
          <VaahanIcon name="location" size={16} /> YOUR SAVED SPOT
        </span>
        <span>GOOGLE MAPS</span>
      </div>
      {toolbar()}
      {map()}
      {feedback()}
      <div className="park-map-place">
        <VaahanIcon name="location" size={18} />
        <div>
          <strong>{place || "Your saved parking spot"}</strong>
          <span>
            GPS accuracy ±{Math.ceil(accuracy)} m · Saved by your phone
          </span>
        </div>
      </div>
      {directionsUrl && (
        <a
          className="park-map-directions"
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <VaahanIcon name="route" size={17} />
          <span>Walking directions</span>
          <VaahanIcon name="external-link" size={15} />
        </a>
      )}
    </div>
  );
}
