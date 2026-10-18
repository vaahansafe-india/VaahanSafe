"use client";
import { useState } from "react";
import Link from "next/link";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import type {
  RiskDetail,
  RiskEvent,
  RiskPulse as Pulse,
  RiskCaseDetail,
} from "../risk.types";
import { riskLabel } from "../risk.types";
import { riskDate, riskTime, RiskBadge } from "./RiskShared";
interface Node {
  id: string;
  kind: string;
  label: string;
  detail: string;
  relation: string;
  icon: VaahanIconName;
  href?: string;
}
export function CaseEvidenceGraph({ detail: d }: { detail: RiskCaseDetail }) {
  const [selected, setSelected] = useState<string | null>(null);
  const shown = d.signals.slice(0, 12),
    active = shown.find((s) => s.id === selected);
  return (
    <section className="risk-panel">
      <span className="risk-kicker">Related entities / investigation</span>
      <h2>Case evidence graph</h2>
      <p className="risk-muted">
        Each branch connects a source-backed signal to its QR identity. Cases
        can span several QRs.
      </p>
      <div className="risk-graph">
        <div className="risk-node">
          <VaahanIcon name="file" size={18} />
          <span>
            <small>Investigation case</small>
            <strong>{d.record.reference_code}</strong>
          </span>
        </div>
        <div className="risk-edge">
          groups observations<span>↓</span>
        </div>
        <div className="risk-graph-events">
          {shown.map((s) => (
            <div key={s.id}>
              <button
                className={`risk-node ${selected === s.id ? "selected" : ""}`}
                aria-pressed={selected === s.id}
                onClick={() => setSelected(s.id)}
              >
                <VaahanIcon name="shield" size={18} />
                <span>
                  <small>{s.reference_code}</small>
                  <strong>{s.title}</strong>
                </span>
              </button>
              <div className="risk-edge">
                observed on<span>↓</span>
              </div>
              <div className="risk-node">
                <VaahanIcon name="qr" size={18} />
                <span>
                  <small>QR identity</small>
                  <strong>{s.visible_code || "Identity unavailable"}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {active && (
        <aside className="risk-node-inspect" aria-live="polite">
          <h3>{active.reference_code}</h3>
          <p>{active.evidence_summary}</p>
          <Link href={`/fraud/${active.id}`} className="risk-link">
            Inspect signal evidence <VaahanIcon name="arrow-right" size={14} />
          </Link>
        </aside>
      )}
      {d.signals.length > 12 && (
        <p className="risk-muted">
          Twelve branches shown. All loaded signals are listed below.
        </p>
      )}
    </section>
  );
}
export function EvidenceGraph({ detail: d }: { detail: RiskDetail }) {
  const s = d.signal,
    [selected, setSelected] = useState<string | null>(null);
  const context: Node[] = [];
  if (s.customer_reference)
    context.push({
      id: "customer",
      kind: "Customer",
      label: s.customer_reference,
      detail:
        "Customer associated with the QR vehicle. Identity details are masked.",
      relation: "owns",
      icon: "user",
    });
  if (s.vehicle_id)
    context.push({
      id: "vehicle",
      kind: "Vehicle",
      label: s.vehicle_label || "Associated vehicle",
      detail: s.registration_masked || "Registration not recorded",
      relation: "assigned QR",
      icon: "car",
      href: `/vehicles/${s.vehicle_id}`,
    });
  if (s.qr_id)
    context.push({
      id: "qr",
      kind: "QR identity",
      label: s.visible_code || "QR identity",
      detail: `Current lifecycle: ${riskLabel(s.qr_status)}. A lifecycle label alone does not establish service entitlement.`,
      relation: "related activity",
      icon: "qr",
      href: `/inventory/${s.qr_id}`,
    });
  const evidence = d.events
    .filter((e) => e.source !== "ADMIN")
    .slice(0, 6)
    .map((e) => ({
      id: e.id,
      kind: riskLabel(e.source),
      label: e.title,
      detail: `${e.description} · ${riskDate(e.occurred_at)}`,
      relation: e.relation,
      icon: (e.source === "SCAN"
        ? "scan"
        : e.source === "REPLACEMENT"
          ? "refresh"
          : "activity") as VaahanIconName,
      href: e.href || undefined,
    }));
  const signal: Node = {
    id: "signal",
    kind: "Risk signal",
    label: s.reference_code,
    detail: s.evidence_summary,
    relation: "",
    icon: "shield-alert",
  };
  const nodes = [...context, ...evidence, signal],
    active = nodes.find((n) => n.id === selected);
  return (
    <section className="risk-panel">
      <div className="risk-panel-heading">
        <div>
          <span className="risk-kicker">Evidence, connected</span>
          <h2>Risk evidence graph</h2>
        </div>
        <span className="risk-muted">Observed links only</span>
      </div>
      <p className="risk-muted">
        Select a relationship to inspect its evidence. Related activity provides
        context; it does not establish wrongdoing.
      </p>
      <div className="risk-graph" aria-label="Evidence relationships">
        <div className="risk-graph-context">
          {context.map((n, i) => (
            <div key={n.id}>
              <GraphNode
                node={n}
                active={selected === n.id}
                select={setSelected}
              />
              <div className="risk-edge" aria-hidden="true">
                {n.relation}
                <span>↓</span>
              </div>
            </div>
          ))}
        </div>
        {evidence.length > 0 && (
          <>
            <svg
              className="risk-graph-branches"
              viewBox="0 0 600 32"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M300 0V12M50 12H550M50 12V32M300 12V32M550 12V32" />
            </svg>
            <div className="risk-graph-events">
              {evidence.map((n) => (
                <div key={n.id}>
                  <GraphNode
                    node={n}
                    active={selected === n.id}
                    select={setSelected}
                  />
                  <span className="risk-edge">{n.relation}</span>
                </div>
              ))}
            </div>
            <div className="risk-edge" aria-hidden="true">
              <span>↓</span>
            </div>
          </>
        )}
        <GraphNode
          node={signal}
          active={selected === "signal"}
          select={setSelected}
        />
      </div>
      {active && (
        <aside className="risk-node-inspect" aria-live="polite">
          <span className="risk-kicker">{active.kind}</span>
          <h3>{active.label}</h3>
          <p>{active.detail}</p>
          {active.href && (
            <Link href={active.href} className="risk-link">
              Open {active.kind.toLowerCase()}{" "}
              <VaahanIcon name="arrow-right" size={14} />
            </Link>
          )}
        </aside>
      )}
      {d.events.length > 6 && (
        <p className="risk-muted">
          The graph shows up to six related events. The timeline below contains
          the remaining loaded evidence.
        </p>
      )}
    </section>
  );
}
function GraphNode({
  node: n,
  active,
  select,
}: {
  node: Node;
  active: boolean;
  select: (id: string) => void;
}) {
  return (
    <button
      className={`risk-node ${active ? "selected" : ""}`}
      onClick={() => select(n.id)}
      aria-pressed={active}
      aria-label={`${n.kind}: ${n.label}. ${n.detail}`}
    >
      <VaahanIcon name={n.icon} size={18} />
      <span>
        <small>{n.kind}</small>
        <strong>{n.label}</strong>
      </span>
    </button>
  );
}
export function RiskTimeline({
  events,
  truncated = false,
}: {
  events: RiskEvent[];
  truncated?: boolean;
}) {
  return (
    <section className="risk-panel">
      <span className="risk-kicker">Chronological evidence</span>
      <h2>Investigation timeline</h2>
      {!events.length ? (
        <p className="risk-muted">No related source events are available.</p>
      ) : (
        <ol className="risk-timeline">
          {events.map((e) => (
            <li key={`${e.source}-${e.id}`}>
              <time dateTime={e.occurred_at}>{riskDate(e.occurred_at)}</time>
              <div className="risk-timeline-mark">
                <VaahanIcon
                  name={
                    e.source === "SCAN"
                      ? "scan"
                      : e.source === "ADMIN"
                        ? "shield"
                        : "activity"
                  }
                  size={15}
                />
              </div>
              <div>
                <span className="risk-kicker">
                  {riskLabel(e.source)} · {e.relation}
                </span>
                <h3>{e.title}</h3>
                <p>{e.description}</p>
                {e.reference && <small>{e.reference}</small>}
                {e.href && (
                  <Link className="risk-link" href={e.href}>
                    Open source <VaahanIcon name="arrow-right" size={12} />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {truncated && (
        <p className="risk-muted">
          Showing a bounded set of the latest events. Source history remains
          available in the linked operations workspaces.
        </p>
      )}
    </section>
  );
}
export function RiskPulse({
  pulse,
  inspect,
}: {
  pulse: Pulse;
  inspect: (id: string) => void;
}) {
  const from = Date.parse(pulse.from),
    span = Math.max(1, Date.parse(pulse.to) - from);
  return (
    <section className="risk-panel risk-pulse">
      <div className="risk-panel-heading">
        <div>
          <span className="risk-kicker">Risk pulse · last 24 hours</span>
          <h2>Attention over time</h2>
        </div>
        <span className="risk-muted">
          {pulse.events.length}
          {pulse.truncated ? "+" : ""} observations
        </span>
      </div>
      {!pulse.events.length ? (
        <div className="risk-pulse-empty">
          <VaahanIcon name="shield-check" size={18} />
          <p>No eligible risk signals observed in the last 24 hours.</p>
        </div>
      ) : (
        <>
          <svg
            className="risk-pulse-svg"
            viewBox="0 0 1000 100"
            role="group"
            aria-label={`${pulse.events.length} recent risk signals. Focus or select a marker to inspect.`}
          >
            <line x1="20" x2="980" y1="50" y2="50" />
            {pulse.events.map((e, i) => {
              const x =
                20 +
                960 *
                  Math.max(
                    0,
                    Math.min(1, (Date.parse(e.observed_at) - from) / span),
                  );
              return (
                <g
                  key={e.id}
                  tabIndex={0}
                  role="button"
                  className={`risk-pulse-dot severity-${e.severity.toLowerCase()}`}
                  aria-label={`${e.reference_code}, ${e.title}, ${riskLabel(e.severity)}, ${riskTime(e.observed_at)}`}
                  onClick={() => inspect(e.id)}
                  onKeyDown={(k) => {
                    if (k.key === "Enter" || k.key === " ") {
                      k.preventDefault();
                      inspect(e.id);
                    }
                  }}
                >
                  <title>{`${e.title} · ${riskLabel(e.severity)} · ${riskTime(e.observed_at)}`}</title>
                  <line x1={x} x2={x} y1="50" y2={i % 2 ? 70 : 30} />
                  <circle cx={x} cy="50" r="6" />
                  <circle cx={x} cy="50" r="14" className="risk-hit" />
                </g>
              );
            })}
          </svg>
          <div className="risk-pulse-axis">
            <span>{riskTime(pulse.from)} IST</span>
            <span>Now</span>
          </div>
          <details className="risk-pulse-alternative">
            <summary>Recent signal activity · {pulse.events.length}</summary>
            <ol>
              {pulse.events.map((e) => (
                <li key={e.id}>
                  <button onClick={() => inspect(e.id)}>
                    <time dateTime={e.observed_at}>
                      {riskTime(e.observed_at)}
                    </time>
                    <RiskBadge value={e.severity} severity />
                    <strong>{e.title}</strong>
                    <span>{e.reference_code}</span>
                  </button>
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
      {pulse.truncated && (
        <p className="risk-muted">
          Latest 100 signals shown. Use the signal workspace to inspect older
          observations.
        </p>
      )}
    </section>
  );
}
