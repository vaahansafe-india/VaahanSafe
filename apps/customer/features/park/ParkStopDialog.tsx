"use client";
import { useEffect, useId, useRef } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { parkClock, parkingDirectionsUrl, type ParkSession } from "./model";
import { ParkMap } from "./ParkMap";
const date = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export function ParkStopDialog({
  session,
  vehicle,
  onClose,
}: {
  session: ParkSession | null;
  vehicle: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    title = useId();
  useEffect(() => {
    if (session && !dialog.current?.open) dialog.current?.showModal();
    if (!session && dialog.current?.open) dialog.current.close();
  }, [session]);
  return (
    <dialog
      ref={dialog}
      className="park-stop-dialog"
      aria-labelledby={title}
      onCancel={onClose}
      onClose={onClose}
    >
      {session && (
        <>
          <header className="park-stop-header">
            <div>
              <span className="park-eyebrow">FROM YOUR PARKING NOTEBOOK</span>
              <h2 id={title}>A place you paused.</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close previous stop"
            >
              <VaahanIcon name="close" size={20} />
            </button>
          </header>
          <div className="park-stop-place">
            <VaahanIcon name="location" size={22} />
            <div>
              <h3>{session.place_name || "Your saved parking spot"}</h3>
              <p>{vehicle}</p>
            </div>
            <span className="park-status">SESSION ENDED</span>
          </div>
          <dl className="park-stop-times">
            <div>
              <dt>PARKED</dt>
              <dd>{date(session.started_at)}</dd>
            </div>
            <div>
              <dt>RETURNED</dt>
              <dd>
                {session.ended_at ? date(session.ended_at) : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt>TIME PARKED</dt>
              <dd>{parkClock(session).elapsed}</dd>
            </div>
          </dl>
          <ParkMap
            key={session.id}
            id={session.id}
            place={session.place_name}
            accuracy={session.accuracy_m}
            directionsUrl={parkingDirectionsUrl(
              session.latitude,
              session.longitude,
            )}
            expandable={false}
          />
          <dl className="park-stop-details">
            <div>
              <dt>FLOOR / LEVEL</dt>
              <dd>{session.floor_label || "Not noted"}</dd>
            </div>
            <div>
              <dt>BAY / SLOT</dt>
              <dd>{session.bay_label || "Not noted"}</dd>
            </div>
          </dl>
          <div className="park-stop-note">
            <VaahanIcon name="edit" size={18} />
            <div>
              <span className="park-eyebrow">YOUR NOTE</span>
              <p>{session.notes || "No note was added to this stop."}</p>
            </div>
          </div>
          <footer>
            <span>
              <VaahanIcon name="lock" size={14} /> Only visible in your account
            </span>
            <button
              type="button"
              className="park-button park-button-outline"
              onClick={onClose}
            >
              Back to notebook
            </button>
          </footer>
        </>
      )}
    </dialog>
  );
}
