"use client";
import { VaahanIcon } from "@vaahansafe/icons";
import { Skeleton } from "@vaahansafe/ui/components/skeleton";
import type { AdminIdentity } from "../../../lib/contracts";
import { riskLabel, type RiskSignal } from "../risk.types";
export const riskKeys = {
  scope: (i: AdminIdentity) =>
    ["admin", "risk", i.id, i.role, i.sessionId] as const,
  list: (i: AdminIdentity, workspace: string, filters: string) => [
    ...riskKeys.scope(i),
    workspace,
    "list",
    filters,
  ],
  detail: (i: AdminIdentity, id: string) => [
    ...riskKeys.scope(i),
    "signal",
    "detail",
    id,
  ],
  case: (i: AdminIdentity, id: string) => [
    ...riskKeys.scope(i),
    "case",
    "detail",
    id,
  ],
};
export const riskDate = (v: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(v));
export const riskTime = (v: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(v));
export function RiskBadge({
  value,
  severity = false,
}: {
  value: string;
  severity?: boolean;
}) {
  return (
    <span
      className={`risk-badge ${severity ? "severity-" : ""}${value.toLowerCase()}`}
    >
      <VaahanIcon
        name={
          value === "HIGH_ATTENTION" || value === "CRITICAL_SECURITY"
            ? "shield-alert"
            : value === "RESOLVED"
              ? "check"
              : severity
                ? "shield"
                : "circle"
        }
        size={13}
      />
      {riskLabel(value)}
    </span>
  );
}
export function RiskError({
  message,
  retry,
}: {
  message: string;
  retry: () => unknown;
}) {
  return (
    <div className="risk-error" role="alert">
      <VaahanIcon name="info" size={20} />
      <div>
        <strong>{message}</strong>
        <p>Your current filters are preserved.</p>
      </div>
      <button className="risk-button" onClick={() => void retry()}>
        Retry
      </button>
    </div>
  );
}
export function RiskSkeleton() {
  return (
    <div className="risk-grid" role="status" aria-label="Loading risk evidence">
      {[1, 2, 3].map((i) => (
        <div key={i} className="risk-panel risk-skeleton">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
export function SignalIdentity({ signal: s }: { signal: RiskSignal }) {
  return (
    <div className="risk-identity">
      <strong>{s.visible_code || "QR identity unavailable"}</strong>
      <span>{s.vehicle_label || "Vehicle not associated"}</span>
      {s.registration_masked && <small>{s.registration_masked}</small>}
    </div>
  );
}
export function Fingerprint({ signal: s }: { signal: RiskSignal }) {
  const window = Math.max(
    0,
    Math.round(
      (Date.parse(s.observed_at) - Date.parse(s.first_observed_at)) / 60000,
    ),
  );
  return (
    <div className="risk-fingerprint">
      <span className="risk-kicker">Signal fingerprint</span>
      <div>
        <strong>{s.event_count}</strong>
        <span>source event{s.event_count === 1 ? "" : "s"}</span>
        <span className="risk-fingerprint-window">
          {window > 0 ? `${window} min window` : "Single observation"}
        </span>
      </div>
      <p>{s.evidence_summary}</p>
    </div>
  );
}
