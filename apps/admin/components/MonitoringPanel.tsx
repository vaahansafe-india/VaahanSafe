"use client";
import { useQuery } from "@tanstack/react-query";
import { VaahanIcon } from "@vaahansafe/icons";
import { getAdminData } from "../lib/client-api";
import type { AdminHealth } from "../lib/contracts";
export function MonitoringPanel({ expanded = false }: { expanded?: boolean }) {
  const health = useQuery({
    queryKey: ["admin-health"],
    queryFn: ({ signal }) =>
      getAdminData<AdminHealth>("/api/workspace/health", signal),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const monitoring = health.data?.monitoring;
  const lastRun = monitoring?.checkedAt
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }).format(new Date(monitoring.checkedAt))
    : "No recorded check";
  return (
    <section className="admin-monitoring" aria-label="Service monitoring">
      <div className="admin-monitoring-heading">
        <div>
          <span className="admin-eyebrow">Service monitoring</span>
          <h2>Platform pulse</h2>
        </div>
        <div className="admin-actions">
          <a
            className="admin-link"
            href="https://status.vaahansafe.com"
            target="_blank"
            rel="noreferrer"
          >
            Public status <VaahanIcon name="arrow-right" size={13} />
          </a>
          <button
            className="admin-icon-button"
            aria-label="Refresh service checks"
            onClick={() => void health.refetch()}
            disabled={health.isFetching}
          >
            <VaahanIcon name="refresh" size={15} />
          </button>
        </div>
      </div>
      {health.isError ? (
        <div className="admin-notice error" role="alert">
          Service checks are temporarily unavailable.{" "}
          <button className="admin-link" onClick={() => void health.refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="admin-pulse-grid">
            <div>
              <span>Cloudflare scheduled check</span>
              <strong>
                {health.isPending
                  ? "Checking…"
                  : monitoring?.unavailable
                    ? "Unavailable"
                    : monitoring?.overdue
                      ? "Overdue"
                      : "Recorded"}
              </strong>
              <small>{lastRun} · IST</small>
            </div>
            <div>
              <span>Database round trip</span>
              <strong>
                {monitoring?.latencyMs == null
                  ? "—"
                  : `${Math.round(monitoring.latencyMs)} ms`}
              </strong>
              <small>
                {monitoring?.status
                  ? `Last recorded state: ${monitoring.status}`
                  : "Awaiting recorded telemetry"}
              </small>
            </div>
            <div>
              <span>Recorded runs · 24 hours</span>
              <strong>
                {monitoring?.runs24h == null
                  ? "—"
                  : monitoring.runs24h.toLocaleString("en-IN")}
              </strong>
              <small>Completed checks in Supabase</small>
            </div>
          </div>
          {expanded && (
            <div className="admin-service-grid">
              {health.data?.connections.map((c) => (
                <div key={c.name}>
                  <span className={`admin-service-dot ${c.state}`} />
                  <strong>{c.name}</strong>
                  <span>
                    {c.state === "connected"
                      ? "Connection verified"
                      : c.state === "configured"
                        ? "Configured"
                        : c.state === "unconfigured"
                          ? "Not configured"
                          : "Unavailable"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="admin-monitoring-note">
            Cloudflare runs the scheduled checks; Supabase stores the results. A
            run becomes overdue after 25 minutes without a recorded check.
            {expanded &&
              " Database and R2 connections use read-only probes. Other services show configuration presence; delivery is verified by their workflows."}
          </p>
        </>
      )}
    </section>
  );
}
