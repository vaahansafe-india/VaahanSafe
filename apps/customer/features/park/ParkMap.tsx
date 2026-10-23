"use client";
import { useEffect, useId, useRef, useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { parkingMapUrl, type ParkingMapType } from "./model";

export function ParkMap({
  id,
  place,
  accuracy,
  directionsUrl,
  floor,
  bay,
  expandable = true,
}: {
  id: string;
  place: string | null;
  accuracy: number;
  directionsUrl?: string;
  floor?: string | null;
  bay?: string | null;
  expandable?: boolean;
}) {
  const titleId = useId(),
    dialog = useRef<HTMLDialogElement>(null);
  const [allowedId, setAllowedId] = useState<string | null>(null);
  const [type, setType] = useState<ParkingMapType>("roadmap");
  const [retry, setRetry] = useState(0),
    [src, setSrc] = useState("");
  const [error, setError] = useState(false),
    [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false),
    [expanded, setExpanded] = useState(false);
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
  }, [allowed, ready, error, src, expanded, retry]);
  const reload = () => {
    setReady(false);
    setRetry((v) => v + 1);
  };
  const open = () => {
    setExpanded(true);
    setReady(false);
    dialog.current?.showModal();
  };
  const close = () => {
    setExpanded(false);
    setReady(false);
  };
  const toolbar = (large = false) => (
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
        {allowed && (
          <button
            type="button"
            aria-label="Reload parking map"
            onClick={reload}
          >
            <VaahanIcon name="refresh" size={17} />
          </button>
        )}
        {!large && expandable && (
          <button type="button" aria-label="Expand parking map" onClick={open}>
            <VaahanIcon name="fullscreen" size={17} />
          </button>
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
  return (
    <div className="park-map-shell park-google-shell">
      <div className="park-map-caption">
        <span>
          <VaahanIcon name="location" size={16} /> YOUR SAVED SPOT
        </span>
        <span>GOOGLE MAPS</span>
      </div>
      {toolbar()}
      {!expanded && map()}
      {!expanded && feedback()}
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
      {expandable && (
        <dialog
          ref={dialog}
          className="park-map-dialog park-google-dialog"
          aria-labelledby={titleId}
          onClose={close}
        >
          <header>
            <div>
              <span className="park-eyebrow">PARK / YOUR WAY BACK</span>
              <h2 id={titleId}>Every return starts here.</h2>
            </div>
            <button
              type="button"
              aria-label="Close map"
              onClick={() => dialog.current?.close()}
            >
              <VaahanIcon name="close" size={21} />
            </button>
          </header>
          <div className="park-map-explorer">
            <div className="park-map-explorer-main">
              {toolbar(true)}
              {expanded && map(true)}
              {expanded && feedback()}
            </div>
            <aside className="park-map-explorer-details">
              <span className="park-map-pin">
                <VaahanIcon name="location" size={25} />
              </span>
              <span className="park-eyebrow">YOUR SAVED LOCATION</span>
              <h3>{place || "Your saved parking spot"}</h3>
              <dl>
                <div>
                  <dt>FLOOR / LEVEL</dt>
                  <dd>{floor || "Not noted"}</dd>
                </div>
                <div>
                  <dt>BAY / SLOT</dt>
                  <dd>{bay || "Not noted"}</dd>
                </div>
              </dl>
              <p>
                GPS accuracy ±{Math.ceil(accuracy)} m. Your phone’s accuracy can
                vary, especially indoors.
              </p>
              {directionsUrl && (
                <a
                  className="park-button"
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <VaahanIcon name="route" size={17} /> Walk to this spot{" "}
                  <VaahanIcon name="external-link" size={14} />
                </a>
              )}
              <small>
                <VaahanIcon name="lock" size={13} /> Visible only in your
                account
              </small>
            </aside>
          </div>
          <footer>
            <span>Interactive maps by Google Maps</span>
            <span>A saved pin, not live vehicle tracking.</span>
          </footer>
        </dialog>
      )}
    </div>
  );
}
