"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components/dialog";
import { getAdminData } from "../../../lib/client-api";
import { mutateNetwork } from "../../network/mutation";
import { AdminSelect } from "../../../components/AdminSelect";
import type { AdminIdentity } from "../../../lib/contracts";
import {
  riskLabel,
  RISK_OUTCOMES,
  type RiskDetail as Detail,
  type RiskCaseDetail,
} from "../risk.types";
import {
  RiskBadge,
  RiskError,
  RiskSkeleton,
  SignalIdentity,
  Fingerprint,
  riskDate,
  riskKeys,
} from "./RiskShared";
import { EvidenceGraph, RiskTimeline, CaseEvidenceGraph } from "./RiskEvidence";
const canReview = (i: AdminIdentity) =>
  ["SUPER_ADMIN", "OPS_ADMIN"].includes(i.role);
function useSignal(i: AdminIdentity, id: string, initial?: Detail | null) {
  return useQuery({
    queryKey: riskKeys.detail(i, id),
    queryFn: ({ signal }) =>
      getAdminData<Detail>(
        `/api/risk/signals/${encodeURIComponent(id)}`,
        signal,
      ),
    initialData: initial || undefined,
    staleTime: 30000,
  });
}
export function RiskInspect({
  identity,
  id,
}: {
  identity: AdminIdentity;
  id: string;
}) {
  const q = useSignal(identity, id);
  if (q.isPending) return <RiskSkeleton />;
  if (q.isError)
    return (
      <RiskError message="Signal evidence unavailable." retry={q.refetch} />
    );
  const d = q.data,
    s = d.signal;
  return (
    <div className="risk-inspect-body">
      <div className="risk-card-top">
        <span className="risk-reference">{s.reference_code}</span>
        <RiskBadge severity value={s.severity} />
      </div>
      <h2>{s.title}</h2>
      <SignalIdentity signal={s} />
      <p className="risk-muted">
        Observed {riskDate(s.observed_at)} · {riskLabel(s.qr_status)}
      </p>
      <Fingerprint signal={s} />
      <h3>Why this was flagged</h3>
      <p>{s.evidence_summary}</p>
      <RiskTimeline
        events={d.events.slice(0, 5)}
        truncated={d.events.length > 5 || d.evidenceTruncated}
      />
      <p className="risk-muted">
        {s.case_reference || "Not assigned to an investigation"}
      </p>
      <Link className="risk-button primary" href={`/fraud/${s.id}`}>
        Open full signal & investigation
      </Link>
    </div>
  );
}
export function RiskSignalDetail({
  identity,
  id,
  initial,
}: {
  identity: AdminIdentity;
  id: string;
  initial: Detail | null;
}) {
  const q = useSignal(identity, id, initial),
    [action, setAction] = useState(""),
    client = useQueryClient();
  if (q.isPending)
    return (
      <div className="risk-workspace">
        <RiskSkeleton />
      </div>
    );
  if (q.isError)
    return (
      <div className="risk-workspace">
        <RiskError message="Signal evidence unavailable." retry={q.refetch} />
      </div>
    );
  const d = q.data,
    s = d.signal;
  const refresh = () =>
    client.invalidateQueries({ queryKey: riskKeys.scope(identity) });
  return (
    <div className="risk-workspace">
      <Link className="risk-link" href="/fraud">
        ← Risk Intelligence
      </Link>
      <header className="risk-heading">
        <div>
          <span className="risk-kicker">Signal / {s.reference_code}</span>
          <h1>{s.title}</h1>
          <p>
            Observed {riskDate(s.observed_at)} · {riskLabel(s.category)}
          </p>
          <div className="risk-actions">
            <RiskBadge severity value={s.severity} />
            <RiskBadge value={s.review_status} />
          </div>
        </div>
        <button className="risk-button" onClick={() => void q.refetch()}>
          Refresh evidence
        </button>
      </header>
      <div className="risk-detail-layout">
        <main>
          <section className="risk-panel">
            <span className="risk-kicker">Why this was flagged</span>
            <h2>Explainable evidence</h2>
            <p>{s.evidence_summary}</p>
            <Fingerprint signal={s} />
            <p className="risk-muted">
              Rule {s.rule_key} · version {s.rule_version}. This observation
              requires review; it does not establish wrongdoing.
            </p>
          </section>
          <EvidenceGraph detail={d} />
          <RiskTimeline
            events={d.events}
            truncated={d.evidenceTruncated || d.contextTruncated}
          />
          {d.related.length > 0 && (
            <section className="risk-panel">
              <h2>Related signals</h2>
              <div className="risk-related">
                {d.related.map((r) => (
                  <Link href={`/fraud/${r.id}`} key={r.id}>
                    <strong>{r.reference_code}</strong>
                    <span>{r.title}</span>
                    <RiskBadge severity value={r.severity} />
                  </Link>
                ))}
              </div>
            </section>
          )}
          <Audit rows={d.audit} />
        </main>
        <aside>
          <section className="risk-panel">
            <span className="risk-kicker">Entity context</span>
            <SignalIdentity signal={s} />
            <p className="risk-muted">QR lifecycle: {riskLabel(s.qr_status)}</p>
            <p className="risk-muted">
              Safety service availability is determined by the authoritative QR
              entitlement service.
            </p>
            {s.qr_id && (
              <Link className="risk-button" href={`/inventory/${s.qr_id}`}>
                Review QR lifecycle
              </Link>
            )}
            {s.vehicle_id && (
              <Link className="risk-link" href={`/vehicles/${s.vehicle_id}`}>
                Open vehicle context
              </Link>
            )}
          </section>
          <section className="risk-panel">
            <span className="risk-kicker">Investigation</span>
            <h2>{s.case_reference || "No case assigned"}</h2>
            <p className="risk-muted">
              {s.assigned_name || "Unassigned investigator"}
            </p>
            {s.case_id && (
              <Link className="risk-button" href={`/fraud/cases/${s.case_id}`}>
                Open case
              </Link>
            )}
            {canReview(identity) && (
              <div className="risk-investigation-actions">
                {!["RESOLVED", "DISMISSED"].includes(s.review_status) && (
                  <>
                    {s.review_status === "UNREVIEWED" && (
                      <button
                        className="risk-button primary"
                        onClick={() => setAction("review")}
                      >
                        Start review
                      </button>
                    )}
                    {!s.case_id && (
                      <>
                        <button
                          className="risk-button"
                          onClick={() => setAction("create_case")}
                        >
                          Open investigation
                        </button>
                        <button
                          className="risk-button"
                          onClick={() => setAction("attach_case")}
                        >
                          Attach to existing case
                        </button>
                      </>
                    )}
                    <button
                      className="risk-button"
                      onClick={() => setAction("monitor")}
                    >
                      Monitor signal
                    </button>
                    <button
                      className="risk-button"
                      onClick={() => setAction("resolve")}
                    >
                      Record decision
                    </button>
                    <button
                      className="risk-button"
                      onClick={() => setAction("dismiss")}
                    >
                      Dismiss signal
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
          {d.resolution && (
            <section className="risk-panel">
              <span className="risk-kicker">Recorded decision</span>
              <h2>{riskLabel(d.resolution)}</h2>
              <p>{d.resolutionReason}</p>
            </section>
          )}
        </aside>
      </div>
      {action && (
        <RiskAction
          identity={identity}
          kind="signal"
          id={s.id}
          revision={s.revision}
          action={action}
          onClose={() => setAction("")}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
export function RiskCaseWorkspace({
  identity,
  id,
  initial,
}: {
  identity: AdminIdentity;
  id: string;
  initial: RiskCaseDetail | null;
}) {
  const client = useQueryClient(),
    [action, setAction] = useState(""),
    q = useQuery({
      queryKey: riskKeys.case(identity, id),
      queryFn: ({ signal }) =>
        getAdminData<RiskCaseDetail>(
          `/api/risk/cases/${encodeURIComponent(id)}`,
          signal,
        ),
      initialData: initial || undefined,
      staleTime: 30000,
    });
  if (q.isPending)
    return (
      <div className="risk-workspace">
        <RiskSkeleton />
      </div>
    );
  if (q.isError)
    return (
      <div className="risk-workspace">
        <RiskError message="Investigation unavailable." retry={q.refetch} />
      </div>
    );
  const d = q.data,
    c = d.record;
  return (
    <div className="risk-workspace">
      <Link className="risk-link" href="/fraud?workspace=cases">
        ← Investigation cases
      </Link>
      <header className="risk-heading">
        <div>
          <span className="risk-kicker">
            Investigation / {c.reference_code}
          </span>
          <h1>{c.title}</h1>
          <div className="risk-actions">
            <RiskBadge severity value={c.priority} />
            <RiskBadge value={c.status} />
          </div>
          <p>
            {d.signals.length} related signals ·{" "}
            {c.assigned_name || "Unassigned"} · Opened {riskDate(c.opened_at)}
          </p>
        </div>
        <button className="risk-button" onClick={() => void q.refetch()}>
          Refresh investigation
        </button>
      </header>
      <div className="risk-detail-layout">
        <main>
          <section className="risk-panel">
            <span className="risk-kicker">Correlated signals</span>
            <h2>Evidence in this case</h2>
            <div className="risk-related">
              {d.signals.map((s) => (
                <Link key={s.id} href={`/fraud/${s.id}`}>
                  <strong>{s.reference_code}</strong>
                  <span>{s.title}</span>
                  <span>{s.visible_code || "No QR context"}</span>
                  <RiskBadge severity value={s.severity} />
                </Link>
              ))}
            </div>
            {d.truncated && (
              <p className="risk-muted">
                Latest 50 signals displayed. Search the signal workspace by this
                case reference for additional records.
              </p>
            )}
          </section>
          <CaseEvidenceGraph detail={d} />
          <RiskTimeline events={d.events} truncated={d.truncated} />
          <Audit rows={d.audit} />
        </main>
        <aside>
          <section className="risk-panel">
            <span className="risk-kicker">Controlled review</span>
            <h2>Investigation actions</h2>
            <p className="risk-muted">
              Decisions remain in the audit history. Closing a case requires all
              linked signals to be reviewed.
            </p>
            {canReview(identity) && c.status !== "CLOSED" && (
              <div className="risk-investigation-actions">
                {[
                  "assign",
                  "note",
                  "monitor",
                  "resolve",
                  ...(c.status === "RESOLVED" ? ["close"] : []),
                ].map((a) => (
                  <button
                    key={a}
                    className="risk-button"
                    onClick={() => setAction(a)}
                  >
                    {a === "assign"
                      ? "Assign investigator"
                      : a === "note"
                        ? "Add investigation note"
                        : a === "resolve"
                          ? "Record case decision"
                          : riskLabel(a) + " case"}
                  </button>
                ))}
              </div>
            )}
          </section>
          {c.resolution && (
            <section className="risk-panel">
              <span className="risk-kicker">Case decision</span>
              <h2>{riskLabel(c.resolution)}</h2>
              <p>{c.resolution_reason}</p>
            </section>
          )}
        </aside>
      </div>
      {action && (
        <RiskAction
          identity={identity}
          kind="case"
          id={c.id}
          revision={c.revision}
          action={action}
          onClose={() => setAction("")}
          onChanged={() =>
            client.invalidateQueries({ queryKey: riskKeys.scope(identity) })
          }
        />
      )}
    </div>
  );
}
function Audit({ rows }: { rows: Detail["audit"] }) {
  return (
    <section className="risk-panel">
      <span className="risk-kicker">Preserved history</span>
      <h2>Investigation audit</h2>
      {rows.length ? (
        <ol className="risk-audit">
          {rows.map((r, i) => (
            <li key={i}>
              <strong>{riskLabel(r.action)}</strong>
              <span>
                {r.actor} · {riskDate(r.occurred_at)}
              </span>
              <p>{r.reason}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="risk-muted">No operator decisions have been recorded.</p>
      )}
    </section>
  );
}
function RiskAction({
  identity,
  kind,
  id,
  revision,
  action,
  onClose,
  onChanged,
}: {
  identity: AdminIdentity;
  kind: "signal" | "case";
  id: string;
  revision: number;
  action: string;
  onClose: () => void;
  onChanged: () => Promise<unknown>;
}) {
  const [reason, setReason] = useState(""),
    [outcome, setOutcome] = useState(""),
    [target, setTarget] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    request = useRef<{ payload: string; id: string } | null>(null);
  const options = useQuery({
    queryKey: [...riskKeys.scope(identity), "options", action],
    queryFn: ({ signal }) =>
      getAdminData<{ id: string; label: string }[]>(
        `/api/risk/options?kind=${action === "assign" ? "investigators" : "cases"}`,
        signal,
      ),
    enabled: ["assign", "attach_case"].includes(action),
    staleTime: 10000,
  });
  const submit = async () => {
    setBusy(true);
    setError("");
    const payload = JSON.stringify({
      action,
      revision,
      reason,
      outcome,
      target,
    });
    if (!request.current || request.current.payload !== payload)
      request.current = { payload, id: crypto.randomUUID() };
    try {
      await mutateNetwork(
        `/api/risk/${kind === "signal" ? "signals" : "cases"}/${id}`,
        {
          action,
          revision,
          reason,
          outcome,
          target,
          requestId: request.current.id,
        },
      );
      await onChanged();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to record this decision.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="risk-dialog">
        <DialogTitle>
          {action === "create_case"
            ? "Open investigation"
            : action === "attach_case"
              ? "Attach to case"
              : riskLabel(action) + " " + kind}
        </DialogTitle>
        <DialogDescription>
          Record an evidence-backed decision. This action is audited and
          preserves the source history.
        </DialogDescription>
        <div className="risk-action-form">
          {["resolve", "dismiss", "monitor"].includes(action) && (
            <div>
              <label>Reviewed outcome</label>
              <AdminSelect
                value={outcome}
                label="Reviewed outcome"
                options={[
                  { value: "", label: "Choose an outcome" },
                  ...RISK_OUTCOMES.map((v) => ({
                    value: v,
                    label: riskLabel(v),
                  })),
                ]}
                onValueChange={setOutcome}
              />
            </div>
          )}
          {["assign", "attach_case"].includes(action) && (
            <div>
              <label>
                {action === "assign" ? "Investigator" : "Existing case"}
              </label>
              <AdminSelect
                value={target}
                label="Investigation target"
                disabled={options.isPending || options.isError}
                options={[
                  {
                    value: "",
                    label: options.isPending ? "Loading…" : "Choose a target",
                  },
                  ...(options.data || []).map((o) => ({
                    value: o.id,
                    label: o.label,
                  })),
                ]}
                onValueChange={setTarget}
              />
              {options.isError && (
                <RiskError
                  message="Investigation options unavailable."
                  retry={options.refetch}
                />
              )}
            </div>
          )}
          <label htmlFor="risk-action-reason">
            {action === "note" ? "Investigation note" : "Reason / evidence"}
          </label>
          <textarea
            id="risk-action-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Explain the observation and why this action is appropriate (at least 10 characters)."
          />
          {error && (
            <p role="alert" className="risk-action-error">
              {error}
            </p>
          )}
          <p className="risk-muted">
            Review actions do not change QR entitlement or lifecycle.
          </p>
          <div className="risk-actions">
            <button className="risk-button" disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <button
              className="risk-button primary"
              disabled={
                busy ||
                reason.trim().length < 10 ||
                (["resolve", "dismiss", "monitor"].includes(action) &&
                  !outcome) ||
                (["assign", "attach_case"].includes(action) && !target)
              }
              onClick={() => void submit()}
            >
              {busy
                ? "Recording…"
                : "Confirm " + riskLabel(action).toLowerCase()}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
