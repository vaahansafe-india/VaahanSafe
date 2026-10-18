"use client";
import { VaahanIcon } from "@vaahansafe/icons";
import { replacementLabel, type ReplacementRow } from "../replacement.types";
export const replacementKeys = (i: {
  id: string;
  role: string;
  sessionId: string;
}) => ["replacements", i.id, i.role, i.sessionId] as const;
export const replacementDate = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }).format(new Date(v)) + " IST"
    : "Not recorded";
export function ReplacementError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div className="rp-notice" role="alert">
      <VaahanIcon name="alert" size={18} />
      <div>
        <strong>Replacements are temporarily unavailable</strong>
        <p>
          {error instanceof Error
            ? error.message
            : "We couldn't load these records right now."}
        </p>
        <button className="rp-button" onClick={retry}>
          Try again
        </button>
      </div>
    </div>
  );
}
export function ReplacementIdentity({ row: r }: { row: ReplacementRow }) {
  return (
    <div className="rp-identity">
      <div>
        <span className="rp-kicker">Original QR</span>
        <strong>{r.old_visible_code}</strong>
        <small>{replacementLabel(r.old_qr_status)}</small>
      </div>
      <VaahanIcon name="arrow-right" size={20} />
      <div>
        <span className="rp-kicker">Replacement QR</span>
        <strong>{r.new_visible_code || "Awaiting allocation"}</strong>
        <small>
          {r.new_qr_status
            ? replacementLabel(r.new_qr_status)
            : "Verified payment required"}
        </small>
      </div>
    </div>
  );
}
export function ReplacementBadge({ row: r }: { row: ReplacementRow }) {
  return (
    <span
      className={`rp-badge ${r.stage === "CLOSED" || r.stage === "ACTIVATED" ? "rp-green" : r.attention ? "rp-amber" : ""}`}
    >
      {replacementLabel(r.stage)}
    </span>
  );
}
