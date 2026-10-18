"use client";
import { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import type { AdminIdentity } from "../../../lib/contracts";
import { getAdminData } from "../../../lib/client-api";
import {
  reconciliationActions,
  reconciliationLabel,
  type ReconciliationDetail,
  type ReconciliationPage,
  type ReconciliationHistory,
} from "../reconciliation.types";
import {
  reconciliationKeys,
  ReconciliationError,
  ReconciliationSkeleton,
  StockBalance,
  ReconciliationBadge,
  custodianLocation,
  reconciliationDate,
  canManageReconciliation,
  useReconciliationRefresh,
} from "./ReconciliationShared";
import { ReconciliationAction } from "./ReconciliationAction";
export function ReconciliationDetailView({
  identity,
  id,
  compact = false,
}: {
  identity: AdminIdentity;
  id: string;
  compact?: boolean;
}) {
  const detail = useQuery({
      queryKey: reconciliationKeys.detail(identity, id),
      queryFn: ({ signal }) =>
        getAdminData<ReconciliationDetail>(`/api/reconciliation/${id}`, signal),
      staleTime: 15000,
      retry: 1,
    }),
    [tab, setTab] = useState("timeline"),
    [audit, setAudit] = useState(false),
    [action, setAction] = useState<string | null>(null),
    refresh = useReconciliationRefresh(identity);
  if (detail.isPending) return <ReconciliationSkeleton />;
  if (!detail.data)
    return (
      <ReconciliationError
        message="Unable to load reconciliation details."
        retry={detail.refetch}
      />
    );
  const d = detail.data,
    r = d.record;
  return (
    <article className={`rc-detail ${compact ? "compact" : ""}`}>
      {!compact && (
        <Link href="/reconciliation" className="rc-back">
          ← Stock Reconciliation
        </Link>
      )}
      <header className="rc-detail-heading">
        <div>
          <p className="rc-eyebrow">INVENTORY CONTROL / RECONCILIATION</p>
          <h1>{r.reference_code}</h1>
          <ReconciliationBadge row={r} />
          <span className="rc-outcome">{reconciliationLabel(r.outcome)}</span>
        </div>
      </header>
      <StockBalance row={r} large />
      <section className="rc-detail-scope">
        <h2>Scope & custodian</h2>
        <strong>{r.custodian_name}</strong>
        <p>
          {reconciliationLabel(r.custodian_kind)} · {custodianLocation(r)}
        </p>
        {r.partner_id && (
          <Link
            href={`/${r.custodian_kind === "RETAILER" ? "retailers" : "distributors"}/${r.partner_id}`}
          >
            Open custodian →
          </Link>
        )}
        <dl>
          <dt>Snapshot</dt>
          <dd>{reconciliationDate(r.snapshot_at)}</dd>
          <dt>Reserved at snapshot</dt>
          <dd>{d.hasSnapshot ? r.snapshot_reserved : "Not recorded"}</dd>
          <dt>Physical count completed</dt>
          <dd>{reconciliationDate(r.count_completed_at)}</dd>
          <dt>Counted by</dt>
          <dd>{d.countedBy || "Not recorded"}</dd>
          <dt>Approved by</dt>
          <dd>{d.approvedBy || "Not recorded"}</dd>
          <dt>Created · IST</dt>
          <dd>{reconciliationDate(r.created_at)}</dd>
        </dl>
      </section>
      {r.transfer_id && (
        <aside className="rc-notice">
          <strong>Shipment reconciliation</strong>
          <p>
            Physical receipt, missing identities and custody are controlled by
            the related transfer.
          </p>
          <Link className="rc-button" href={`/transfers/${r.transfer_id}`}>
            {r.transfer_reference} ·{" "}
            {reconciliationLabel(r.transfer_status || "")} →
          </Link>
        </aside>
      )}
      <section>
        <h2>Variance & resolution</h2>
        <div className="rc-classification">
          <span>
            Missing <b>{r.missing_quantity ?? "Not classified"}</b>
          </span>
          <span>
            Unexpected <b>{r.extra_quantity ?? "Not classified"}</b>
          </span>
          <span>
            Damaged <b>{r.damaged_quantity ?? "Not classified"}</b>
          </span>
        </div>
        <p>{d.resolution || "No reconciliation resolution is recorded."}</p>
        <p className="rc-muted">
          {d.adjustmentAppliedAt
            ? `Authoritative identities adjusted on ${reconciliationDate(d.adjustmentAppliedAt)}.`
            : "This reconciliation has not recorded an authoritative inventory adjustment. Closing a record does not make its counts match."}
        </p>
        {!d.hasSnapshot && !r.transfer_id && (
          <p className="rc-notice">
            Historical count: identity-level snapshot and batch breakdown were
            not recorded. Start a new physical count before an inventory
            adjustment.
          </p>
        )}
      </section>
      {!compact && (
        <>
          <div
            className="rc-tabs"
            role="tablist"
            aria-label="Reconciliation detail panels"
          >
            {["timeline", "batches", "identities"].map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                aria-controls={`rc-${t}`}
                onClick={() => setTab(t)}
              >
                {t === "identities" ? "QR identities" : reconciliationLabel(t)}
              </button>
            ))}
            <button className="rc-button" onClick={() => setAudit(true)}>
              Security audit
            </button>
          </div>
          <div role="tabpanel" id={`rc-${tab}`}>
            <ReconciliationPanel identity={identity} id={id} section={tab} />
          </div>
          <section>
            <h2>Evidence</h2>
            <p className="rc-muted">
              No reconciliation evidence upload is recorded in the current
              system. Operational references are preserved in the timeline;
              private files are not inferred from notes.
            </p>
          </section>
        </>
      )}
      {r.attention && (
        <p className="rc-notice">
          Next step · {reconciliationLabel(r.attention)}
        </p>
      )}
      {canManageReconciliation(identity) && (
        <div className="rc-actions">
          {reconciliationActions(r)
            .filter((a) => a !== "adjust" || !d.adjustmentAppliedAt)
            .map((a) => (
              <button
                className={`rc-button ${a === "complete" || a === "resolve" || a === "approve" ? "rc-primary" : ""}`}
                key={a}
                onClick={() => setAction(a)}
              >
                {a === "save"
                  ? "Save draft"
                  : a === "complete"
                    ? "Complete count"
                    : a === "adjust"
                      ? "Apply stock adjustment"
                      : reconciliationLabel(a)}
              </button>
            ))}
        </div>
      )}
      {compact && (
        <Link className="rc-button rc-primary" href={`/reconciliation/${id}`}>
          Open full reconciliation →
        </Link>
      )}
      <Sheet open={audit} onOpenChange={setAudit}>
        <SheetContent className="rc-sheet">
          <SheetTitle>Security audit</SheetTitle>
          <SheetDescription>
            Privileged actions for {r.reference_code}.
          </SheetDescription>
          {audit && (
            <ReconciliationPanel identity={identity} id={id} section="audit" />
          )}
        </SheetContent>
      </Sheet>
      {action && (
        <ReconciliationAction
          detail={d}
          action={action}
          onClose={() => setAction(null)}
          onChanged={async (inventory) => {
            await refresh(inventory);
          }}
        />
      )}
    </article>
  );
}
function ReconciliationPanel({
  identity,
  id,
  section,
}: {
  identity: AdminIdentity;
  id: string;
  section: string;
}) {
  const [search, setSearch] = useState(""),
    [q, setQ] = useState("");
  const query = useInfiniteQuery({
    queryKey: reconciliationKeys.history(identity, id, section, q),
    queryFn: ({ pageParam, signal }) =>
      getAdminData<ReconciliationPage<ReconciliationHistory>>(
        `/api/reconciliation/${id}/history?section=${section}&q=${encodeURIComponent(q)}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor,
    staleTime: 15000,
    retry: 1,
  });
  const rows = query.data?.pages.flatMap((p) => p.rows) || [];
  return (
    <section className="rc-panel">
      {section === "identities" && (
        <form
          className="rc-search"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search.trim().toUpperCase());
          }}
        >
          <label className="sr-only" htmlFor="rc-identity-search">
            Search printed QR identity
          </label>
          <input
            id="rc-identity-search"
            placeholder="Search printed VaahanSafe ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="rc-button">Search</button>
        </form>
      )}
      {query.isPending ? (
        <ReconciliationSkeleton view="rows" />
      ) : query.isError ? (
        <ReconciliationError
          message="This panel is temporarily unavailable."
          retry={query.refetch}
        />
      ) : !rows.length ? (
        <p className="rc-muted">
          {section === "timeline"
            ? "No reconciliation events are recorded. Historical creation and update timestamps are not presented as a timeline."
            : section === "batches"
              ? "No batch snapshot is recorded for this reconciliation."
              : "No records in this panel."}
        </p>
      ) : section === "batches" ? (
        <div className="rc-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Ledger units</th>
                <th>Physical by batch</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/batches/${r.id}`}>{r.reference_code}</Link>
                  </td>
                  <td>{r.expected}</td>
                  <td>Not recorded</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : section === "identities" ? (
        <div className="rc-table-wrap">
          <table>
            <thead>
              <tr>
                <th>VaahanSafe ID</th>
                <th>Batch</th>
                <th>Current lifecycle</th>
                <th>Recorded source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/inventory/${r.id}`}>{r.visible_code}</Link>
                  </td>
                  <td>{r.batch_reference || "Not recorded"}</td>
                  <td>{reconciliationLabel(r.status || "")}</td>
                  <td>{reconciliationLabel(r.receipt_state || "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ol className="rc-timeline">
          {rows.map((r) => (
            <li key={r.id}>
              <strong>{reconciliationLabel(r.action || "")}</strong>
              <small>
                {r.actor_name || "Actor not recorded"} ·{" "}
                {reconciliationDate(r.created_at || null)} IST
              </small>
              <p>{r.reason}</p>
              {r.quantities && (
                <div className="rc-event-quantities">
                  {Object.entries(r.quantities)
                    .filter(([, v]) => typeof v === "number")
                    .map(([k, v]) => (
                      <span key={k}>
                        {reconciliationLabel(k)} {v}
                      </span>
                    ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      {query.hasNextPage && (
        <button
          className="rc-button"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </section>
  );
}
