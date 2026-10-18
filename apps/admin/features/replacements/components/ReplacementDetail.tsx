"use client";
import { useState } from "react";
import Link from "next/link";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { AdminIdentity } from "../../../lib/contracts";
import { getAdminData } from "../../../lib/client-api";
import { canReadModule } from "../../../lib/modules";
import {
  replacementActions,
  replacementLabel,
  type ReplacementDetail,
  type ReplacementHistory,
  type ReplacementPage,
} from "../replacement.types";
import {
  ReplacementBadge,
  ReplacementError,
  ReplacementIdentity,
  replacementKeys,
  replacementDate,
} from "./ReplacementShared";
import { ReplacementAction } from "./ReplacementAction";
function useDetail(
  i: AdminIdentity,
  id: string,
  initial?: ReplacementDetail | null,
) {
  return useQuery({
    queryKey: [...replacementKeys(i), "detail", id],
    queryFn: ({ signal }) =>
      getAdminData<ReplacementDetail>(
        `/api/replacements/${encodeURIComponent(id)}`,
        signal,
      ),
    initialData: initial || undefined,
    staleTime: 30000,
  });
}
export function ReplacementInspect({
  identity,
  id,
}: {
  identity: AdminIdentity;
  id: string;
}) {
  const q = useDetail(identity, id);
  if (q.isPending)
    return <div className="rp-skeleton" aria-label="Loading replacement" />;
  if (q.isError)
    return <ReplacementError error={q.error} retry={() => void q.refetch()} />;
  const r = q.data.record;
  return (
    <div className="rp-inspect-body">
      <span className="rp-kicker">{r.reference_code}</span>
      <h2>
        {r.make} {r.model}
      </h2>
      <p>
        {r.customer_name} · {r.registration_masked}
      </p>
      <ReplacementBadge row={r} />
      <ReplacementIdentity row={r} />
      <dl className="rp-facts">
        <div>
          <dt>Reason</dt>
          <dd>{replacementLabel(r.reason)}</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>{replacementLabel(r.risk_level)}</dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>
            {r.payment_state
              ? replacementLabel(r.payment_state)
              : "Verified paid order required"}
          </dd>
        </div>
        <div>
          <dt>Shipment</dt>
          <dd>
            {r.shipment_status
              ? replacementLabel(r.shipment_status)
              : "Not recorded"}
          </dd>
        </div>
      </dl>
      {r.attention && (
        <p className="rp-notice">{replacementLabel(r.attention)}</p>
      )}
      <Link className="rp-button rp-primary" href={`/replacements/${id}`}>
        Open replacement →
      </Link>
    </div>
  );
}
function HistoryPanel({
  identity,
  id,
  section,
}: {
  identity: AdminIdentity;
  id: string;
  section: string;
}) {
  const q = useInfiniteQuery({
    queryKey: [...replacementKeys(identity), "history", id, section],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      getAdminData<ReplacementPage<ReplacementHistory>>(
        `/api/replacements/${encodeURIComponent(id)}/history?section=${section}${pageParam ? "&cursor=" + encodeURIComponent(pageParam) : ""}`,
        signal,
      ),
    getNextPageParam: (p) => p.nextCursor || undefined,
    staleTime: 30000,
  });
  if (q.isPending) return <div className="rp-skeleton" />;
  if (q.isError)
    return <ReplacementError error={q.error} retry={() => void q.refetch()} />;
  const rows = q.data.pages.flatMap((p) => p.rows);
  return (
    <>
      <ol className="rp-timeline">
        {rows.map((r) => (
          <li key={r.id}>
            <strong>
              {r.old_visible_code
                ? `${r.old_visible_code} → ${r.new_visible_code}`
                : replacementLabel(r.action || "Event")}
            </strong>
            <span>
              {r.actor_name || "Preserved identity lineage"} ·{" "}
              {replacementDate(r.created_at)}
            </span>
            <p>{r.reason}</p>
            {r.to_status && <small>{replacementLabel(r.to_status)}</small>}
          </li>
        ))}
      </ol>
      {!rows.length && (
        <p className="rp-muted">
          No{" "}
          {section === "lineage"
            ? "previous replacement lineage"
            : section === "audit"
              ? "admin security events"
              : "operational events"}{" "}
          recorded.
        </p>
      )}
      {q.hasNextPage && (
        <button
          className="rp-button"
          disabled={q.isFetchingNextPage}
          onClick={() => void q.fetchNextPage()}
        >
          Load older events
        </button>
      )}
    </>
  );
}
export function ReplacementDetailView({
  identity,
  id,
  initial,
}: {
  identity: AdminIdentity;
  id: string;
  initial: ReplacementDetail | null;
}) {
  const q = useDetail(identity, id, initial),
    client = useQueryClient(),
    [action, setAction] = useState<string | null>(null),
    [section, setSection] = useState("timeline");
  if (q.isPending)
    return (
      <main className="rp-workspace">
        <div className="rp-skeleton" />
      </main>
    );
  if (q.isError)
    return (
      <main className="rp-workspace">
        <Link href="/replacements">← Replacements</Link>
        <ReplacementError error={q.error} retry={() => void q.refetch()} />
      </main>
    );
  const d = q.data,
    r = d.record,
    actions = ["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role)
      ? replacementActions(r)
      : [];
  return (
    <main className="rp-workspace">
      <Link className="rp-back" href="/replacements">
        ← Replacement operations
      </Link>
      <header className="rp-heading">
        <div>
          <span className="rp-kicker">
            Identity continuity / {r.reference_code}
          </span>
          <h1>
            {r.make} {r.model}
          </h1>
          <p>
            {r.customer_name} · {r.registration_masked} · Requested{" "}
            {replacementDate(r.requested_at)}
          </p>
        </div>
        <ReplacementBadge row={r} />
      </header>
      <section className="rp-handover">
        <ReplacementIdentity row={r} />
        <div className="rp-handover-note">
          <strong>
            {r.activated_at
              ? "Replacement verified by owner"
              : r.retired_at
                ? "Original retired · replacement awaiting owner activation"
                : "Original identity preserved until confirmed retirement"}
          </strong>
          <p>
            {r.retired_at
              ? "The original resolver remains safely retired. Vehicle details and historical scan records stay attached to the same vehicle."
              : "Allocation reserves hardware only. A verified paid replacement order, deliberate retirement and delivered-kit possession verification are required."}
          </p>
        </div>
      </section>
      {r.attention && (
        <div className="rp-notice">
          <strong>{replacementLabel(r.attention)}</strong>
          <span>Review the current evidence before continuing.</span>
        </div>
      )}
      <div className="rp-detail-grid">
        <section className="rp-panel">
          <span className="rp-kicker">01 / Review & eligibility</span>
          <h2>Request and risk review</h2>
          <dl className="rp-facts">
            <div>
              <dt>Request reason</dt>
              <dd>{replacementLabel(r.reason)}</dd>
            </div>
            <div>
              <dt>Current eligibility</dt>
              <dd>
                {r.eligible
                  ? "Verified ownership and continuity"
                  : "Review required · action blocked"}
              </dd>
            </div>
            <div>
              <dt>Risk level</dt>
              <dd className={r.risk_level === "HIGH" ? "rp-risk" : ""}>
                {replacementLabel(r.risk_level)}
              </dd>
            </div>
            <div>
              <dt>Approved by</dt>
              <dd>{d.approvedBy || "Awaiting approval"}</dd>
            </div>
          </dl>
          {r.risk_signals.length ? (
            <ul className="rp-signals">
              {r.risk_signals.map((s) => (
                <li key={s}>{replacementLabel(s)}</li>
              ))}
            </ul>
          ) : (
            <p className="rp-muted">
              No elevated signals detected by the configured checks.
            </p>
          )}
          <p className="rp-muted">
            {r.scans_after_report} scans after loss report ·{" "}
            {r.prior_replacements} prior requests in 90 days ·{" "}
            {r.failed_attempts} recent failed activation attempts
          </p>
          {canReadModule(identity.role, "analytics") && (
            <Link
              className="rp-text"
              href={`/analytics?q=${encodeURIComponent(r.old_qr_sticker_id)}`}
            >
              Open original QR scan records →
            </Link>
          )}
          <h3>Owner’s notes</h3>
          <p className="rp-note">{d.notes || "No notes provided."}</p>
          {d.reviewNote && (
            <>
              <h3>Review findings</h3>
              <p className="rp-note">{d.reviewNote}</p>
            </>
          )}
          {d.rejectionReason && (
            <p className="rp-notice">{d.rejectionReason}</p>
          )}
          <p className="rp-muted">{d.evidence}</p>
        </section>
        <section className="rp-panel">
          <span className="rp-kicker">02 / Verified acquisition</span>
          <h2>Payment and fulfilment</h2>
          <dl className="rp-facts">
            <div>
              <dt>Replacement order</dt>
              <dd>
                {r.order_id ? (
                  <Link href={`/orders/${r.order_id}`}>{r.order_number}</Link>
                ) : (
                  "Select a verified paid replacement order during allocation"
                )}
              </dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                {r.payment_state
                  ? replacementLabel(r.payment_state)
                  : "Required before allocation"}
              </dd>
            </div>
            <div>
              <dt>Fulfilment</dt>
              <dd>
                {r.fulfilment_status
                  ? replacementLabel(r.fulfilment_status)
                  : "Not created"}
              </dd>
            </div>
            <div>
              <dt>Carrier</dt>
              <dd>{r.courier_code || "Not recorded"}</dd>
            </div>
            <div>
              <dt>Shipment</dt>
              <dd>
                {r.shipment_status
                  ? replacementLabel(r.shipment_status)
                  : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt>Tracking / waybill</dt>
              <dd>
                {r.tracking_reference || r.waybill_number || "Not recorded"}
              </dd>
            </div>
            <div>
              <dt>Dispatched</dt>
              <dd>{replacementDate(r.shipped_at)}</dd>
            </div>
            <div>
              <dt>Delivered</dt>
              <dd>{replacementDate(r.delivered_at)}</dd>
            </div>
          </dl>
          <p className="rp-muted">
            Payment and carrier delivery are verified by their configured
            services. Allocation and packing do not enable the replacement QR.
          </p>
          <h3>Owner activation</h3>
          <p>
            {r.activated_at
              ? `Verified ${replacementDate(r.activated_at)}`
              : r.delivered_at
                ? "Delivered · waiting for the owner to enter the replacement’s private activation code."
                : "Available after verified delivery."}
          </p>
        </section>
      </div>
      <section className="rp-panel rp-history">
        <div className="rp-panel-heading">
          <h2>Continuity record</h2>
          <div
            className="rp-tabs"
            role="tablist"
            aria-label="Replacement history"
          >
            {["timeline", "lineage", "audit"].map((s) => (
              <button
                role="tab"
                id={`rp-tab-${s}`}
                aria-controls={`rp-panel-${s}`}
                aria-selected={section === s}
                key={s}
                onClick={() => setSection(s)}
              >
                {s === "audit" ? "Security audit" : replacementLabel(s)}
              </button>
            ))}
          </div>
        </div>
        <div
          role="tabpanel"
          id={`rp-panel-${section}`}
          aria-labelledby={`rp-tab-${section}`}
        >
          <HistoryPanel
            key={section}
            identity={identity}
            id={id}
            section={section}
          />
        </div>
      </section>
      <footer className="rp-next">
        <div>
          <span className="rp-kicker">Next operation</span>
          <p>
            {actions.length
              ? "Review the consequences before confirming an audited action."
              : r.status === "COMPLETED"
                ? "This identity transition is closed."
                : r.status === "MIGRATED" || r.status === "SHIPPED"
                  ? "Waiting for the shipping service or owner verification."
                  : "This request has no actions available for your role."}
          </p>
        </div>
        <div className="rp-actions">
          {actions.map((a) => (
            <button
              className={`rp-button ${a === "retire" ? "rp-danger" : a === actions[0] ? "rp-primary" : ""}`}
              key={a}
              onClick={() => setAction(a)}
            >
              {a === "retire"
                ? "Retire original QR"
                : a === "allocate"
                  ? "Allocate paid replacement"
                  : a === "sync_shipment"
                    ? "Sync shipment"
                    : replacementLabel(a)}
            </button>
          ))}
        </div>
      </footer>
      {action && (
        <ReplacementAction
          detail={d}
          identity={identity}
          action={action}
          onClose={() => setAction(null)}
          onChanged={async () => {
            await client.invalidateQueries({
              queryKey: replacementKeys(identity),
            });
            await client.invalidateQueries({ queryKey: ["inventory"] });
            await client.invalidateQueries({ queryKey: ["orders"] });
          }}
        />
      )}
    </main>
  );
}
