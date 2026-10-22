"use client";
import { useEffect, useId, useRef, useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { parkingMapUrl } from "./model";

export function ParkMap({
  id,
  place,
  accuracy,
  expandable = true,
}: {
  id: string;
  place: string | null;
  accuracy: number;
  expandable?: boolean;
}) {
  const titleId = useId();
  const [zoom, setZoom] = useState(16),
    [retry, setRetry] = useState(0);
  const [image, setImage] = useState(""),
    [error, setError] = useState(false),
    [loading, setLoading] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const abort = new AbortController();
    let objectUrl = "";
    setLoading(true);
    setError(false);
    setImage("");
    void (async () => {
      try {
        const r = await fetch(parkingMapUrl(id, zoom), {
          credentials: "same-origin",
          cache: "no-store",
          signal: abort.signal,
        });
        if (!r.ok || !r.headers.get("content-type")?.startsWith("image/png"))
          throw new Error();
        const blob = await r.blob();
        if (abort.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setImage(objectUrl);
      } catch {
        if (!abort.signal.aborted) setError(true);
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    })();
    return () => {
      abort.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, zoom, retry]);
  const preview = (expanded = false) => (
    <div
      className={`park-map ${expanded ? "park-map-expanded" : ""}`}
      aria-busy={loading}
    >
      {image && (
        <img
          src={image}
          alt={`Ola Maps preview of ${place || "your saved parking location"}`}
          onError={() => setError(true)}
        />
      )}
      {(loading || error) && (
        <div className="park-map-state" role={error ? "alert" : "status"}>
          <VaahanIcon name={error ? "location" : "refresh"} size={28} />
          <strong>
            {error
              ? "Your map is taking a pause."
              : "Finding your place on the map…"}
          </strong>
          <p>
            {error
              ? "Your spot is still saved. Try loading the map again."
              : "A closer look, powered by Ola Maps."}
          </p>
          {error && (
            <button type="button" onClick={() => setRetry((v) => v + 1)}>
              Reload map <VaahanIcon name="refresh" size={15} />
            </button>
          )}
        </div>
      )}
      <div className="park-map-controls" aria-label="Map controls">
        <button
          type="button"
          aria-label="Zoom in"
          disabled={zoom === 19 || loading}
          onClick={() => setZoom((v) => v + 1)}
        >
          <VaahanIcon name="zoom-in" size={18} />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          disabled={zoom === 12 || loading}
          onClick={() => setZoom((v) => v - 1)}
        >
          <VaahanIcon name="zoom-out" size={18} />
        </button>
        {!expanded && expandable && (
          <button
            type="button"
            aria-label="Expand parking map"
            onClick={() => dialog.current?.showModal()}
          >
            <VaahanIcon name="fullscreen" size={18} />
          </button>
        )}
      </div>
    </div>
  );
  return (
    <div className="park-map-shell">
      <div className="park-map-caption">
        <span>
          <VaahanIcon name="location" size={16} /> YOUR SAVED LOCATION
        </span>
        <span>OLA MAPS</span>
      </div>
      {preview()}
      <div className="park-map-meta">
        <span>GPS accuracy ±{Math.ceil(accuracy)} m</span>
        <span>Map preview · Zoom {zoom}</span>
      </div>
      {expandable && (
        <dialog
          ref={dialog}
          className="park-map-dialog"
          aria-labelledby={titleId}
        >
          <header>
            <div>
              <span className="park-eyebrow">YOUR WAY BACK</span>
              <h2 id={titleId}>{place || "Your saved parking spot"}</h2>
            </div>
            <button
              type="button"
              aria-label="Close map"
              onClick={() => dialog.current?.close()}
            >
              <VaahanIcon name="close" size={22} />
            </button>
          </header>
          {preview(true)}
          <p>
            © Ola Maps · GPS accuracy ±{Math.ceil(accuracy)} m · Your pin marks
            the location saved by your phone.
          </p>
        </dialog>
      )}
    </div>
  );
}
