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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@vaahansafe/ui/components/dropdown-menu";
import { VaahanIcon } from "@vaahansafe/icons";
import type { AdminIdentity } from "../../../lib/contracts";
import { getAdminData } from "../../../lib/client-api";
import type {
  TransferDetail as Detail,
  TransferHistory,
  TransferPage,
} from "../transfer.types";
import { transferActions, transferLabel } from "../transfer.types";
import {
  transferScope,
  TransferRail,
  TransferBadge,
  TransferError,
  TransferSkeleton,
  transferDate,
  canManageTransfers,
  useTransferRefresh,
} from "./TransferShared";
import { TransferAction } from "./TransferAction";
export function TransferDetail({
  identity,
  id,
  initial = null,
  preview = false,
}: {
  identity: AdminIdentity;
  id: string;
  initial?: Detail | null;
  preview?: boolean;
}) {
  const [action, setAction] = useState<string | null>(null),
    [drawer, setDrawer] = useState<"contents" | "audit" | null>(null),
    refresh = useTransferRefresh(identity);
  const query = useQuery({
    queryKey: [...transferScope(identity), "detail", id],
    queryFn: ({ signal }) =>
      getAdminData<Detail>(`/api/transfers/${id}`, signal),
    initialData: initial || undefined,
    staleTime: 20000,
    retry: 1,
  });
  if (query.isPending) return <TransferSkeleton />;
  if (query.isError && !query.data)
    return (
      <TransferError
        message="Unable to load transfer details."
        retry={query.refetch}
      />
    );
  const d = query.data!,
    t = d.transfer,
    accounted = t.received_quantity + t.damaged_quantity + t.missing_quantity,
    dispatched = [
      "IN_TRANSIT",
      "PARTIALLY_RECEIVED",
      "DISCREPANCY",
      "RECEIVED",
      "RECONCILED",
      "CLOSED",
    ].includes(t.status),
    pending = dispatched ? Math.max(0, t.quantity - accounted) : 0,
    actions = canManageTransfers(identity) ? transferActions(t.status, t) : [];
  return (
    <div className="tr-workspace tr-detail">
      {!preview && (
        <Link href="/transfers" className="tr-back">
          <VaahanIcon name="arrow-left" size={14} className="shrink-0" />
          <span>Back to transfers</span>
        </Link>
      )}
      <header className="tr-header">
        <div className="tr-header-main">
          <div className="tr-eyebrow-wrap">
            <span className="tr-eyebrow-badge">
              <VaahanIcon name="shield-check" size={11} className="shrink-0" />
              <span>CUSTODY RECORD</span>
            </span>
          </div>
          <h1 className="tr-title">{t.reference_code}</h1>
          <p className="tr-header-subtitle">
            <VaahanIcon name="clock" size={13} className="shrink-0 opacity-70" />
            <span>
              Physical inventory custody · Updated {transferDate(t.updated_at)} IST
            </span>
          </p>
        </div>
        <div className="tr-actions">
          <TransferBadge row={t} />
          <button
            type="button"
            className="tr-refresh-btn"
            disabled={query.isFetching}
            onClick={() => void refresh()}
          >
            <VaahanIcon
              name="refresh"
              size={13}
              className={`shrink-0 ${query.isFetching ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </header>
      {query.isError && (
        <TransferError
          message="Unable to refresh. This is the last loaded record."
          retry={query.refetch}
        />
      )}
      <section className="tr-route-section" aria-label="Custody route">
        <div className="tr-route">
          <div className="tr-route-card">
            <div className="tr-route-header">
              <VaahanIcon
                name={t.source_partner_id ? "location" : "database"}
                size={13}
                className="tr-route-kicker-icon shrink-0"
              />
              <span className="tr-route-kicker">
                {t.source_partner_id ? "DISTRIBUTOR" : "VAAHANSAFE"}
              </span>
            </div>
            {t.source_partner_id ? (
              <Link
                href={`/distributors/${t.source_partner_id}`}
                className="tr-route-name"
              >
                {t.source_name}
              </Link>
            ) : (
              <strong className="tr-route-name">Central inventory</strong>
            )}
            <span className="tr-route-ref">
              {t.source_reference || "Printed, unassigned QR stock"}
            </span>
          </div>

          <div className="tr-route-connector" aria-hidden>
            <span className="tr-route-arrow-badge">
              <VaahanIcon
                name="arrow-right"
                size={16}
                className="tr-route-arrow-icon shrink-0"
              />
            </span>
          </div>

          <div className="tr-route-card">
            <div className="tr-route-header">
              <VaahanIcon
                name={t.destination_kind === "RETAILER" ? "cart" : "location"}
                size={13}
                className="tr-route-kicker-icon shrink-0"
              />
              <span className="tr-route-kicker">{t.destination_kind}</span>
            </div>
            <Link
              href={`/${t.destination_kind === "RETAILER" ? "retailers" : "distributors"}/${t.destination_partner_id}`}
              className="tr-route-name"
            >
              {t.destination_name}
            </Link>
            <span className="tr-route-ref">{t.destination_reference}</span>
          </div>
        </div>

        <TransferRail row={t} />

        <div className="tr-custody-banner">
          <VaahanIcon name="info" size={14} className="shrink-0 tr-custody-icon" />
          <p className="tr-custody-copy">
            {t.status === "CANCELLED" || t.status === "REJECTED"
              ? "Reservation released. No custody moved."
              : !dispatched
                ? "Stock remains with the source and is reserved for this request."
                : pending || t.missing_quantity > t.resolved_quantity
                  ? "Received identities belong to the destination. Pending and unresolved missing identities retain their last acknowledged custody and stay reserved."
                  : "Receipt is accounted for at the destination. Damaged or lost stock remains unavailable."}
          </p>
        </div>
      </section>
      <section aria-labelledby={`ledger-${id}`} className="tr-section">
        <div className="tr-section-title">
          <div className="tr-title-with-icon">
            <VaahanIcon name="chart" size={17} className="tr-title-icon" />
            <h2 id={`ledger-${id}`}>Quantity ledger</h2>
          </div>
        </div>
        <div className="tr-ledger">
          {[
            {
              label: "Requested",
              value: t.quantity,
              icon: "invoice" as const,
              tone: "neutral" as const,
            },
            {
              label: "Reserved",
              value:
                !dispatched && !["CANCELLED", "REJECTED"].includes(t.status)
                  ? t.quantity
                  : 0,
              icon: "tag" as const,
              tone: "neutral" as const,
            },
            {
              label: "Dispatched",
              value: dispatched ? t.quantity : 0,
              icon: "package" as const,
              tone: dispatched ? ("info" as const) : ("neutral" as const),
            },
            {
              label: "Received",
              value: t.received_quantity,
              icon: "package-check" as const,
              tone: t.received_quantity > 0 ? ("success" as const) : ("neutral" as const),
            },
            {
              label: "Damaged",
              value: t.damaged_quantity,
              icon: "alert" as const,
              tone: t.damaged_quantity > 0 ? ("warning" as const) : ("neutral" as const),
            },
            {
              label: "Missing / lost",
              value: t.missing_quantity,
              icon: "help" as const,
              tone: t.missing_quantity > 0 ? ("danger" as const) : ("neutral" as const),
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`tr-ledger-card tr-ledger-${item.tone}${item.value > 0 && item.tone !== "neutral" ? " tr-ledger-active" : ""}`}
            >
              <div className="tr-ledger-header">
                <span className="tr-ledger-label">{item.label}</span>
                <span className="tr-ledger-icon-wrap" aria-hidden>
                  <VaahanIcon name={item.icon} size={13} />
                </span>
              </div>
              <strong className="tr-ledger-value">
                {Number(item.value).toLocaleString("en-IN")}
              </strong>
            </div>
          ))}
        </div>
        {dispatched && (
          <p className="tr-equation">
            <VaahanIcon name="info" size={13} className="shrink-0 tr-equation-icon" />
            <span>
              <strong>{t.quantity}</strong> dispatched ={" "}
              <strong>{t.received_quantity}</strong> received +{" "}
              <strong>{t.damaged_quantity}</strong> damaged +{" "}
              <strong>{t.missing_quantity}</strong> missing / lost +{" "}
              <strong>{pending}</strong> pending.
            </span>
          </p>
        )}
      </section>
      {t.attention && (
        <section className="tr-attention">
          <div className="tr-attention-header">
            <VaahanIcon name="alert" size={17} className="shrink-0" />
            <h2>Action required</h2>
          </div>
          <p>
            {t.overdue ? "The recorded expected arrival has passed. " : ""}
            {t.damaged_quantity || t.missing_quantity
              ? `${t.damaged_quantity} damaged and ${t.missing_quantity} missing / lost units require an accountable resolution.`
              : "Record the remaining physical receipt."}
          </p>
          {d.reconciliation && (
            <Link
              href={`/reconciliation/${encodeURIComponent(d.reconciliation.id)}`}
              className="tr-attention-link"
            >
              <VaahanIcon name="refresh" size={13} className="shrink-0" />
              <span>
                Reconciliation · {transferLabel(d.reconciliation.status)} · variance {d.reconciliation.variance}
              </span>
            </Link>
          )}
        </section>
      )}
      <div className="tr-detail-columns">
        <section className="tr-section">
          <div className="tr-section-title">
            <div className="tr-title-with-icon">
              <VaahanIcon name="layers" size={17} className="tr-title-icon" />
              <h2>Transfer contents</h2>
            </div>
            <span className="tr-section-badge">
              {d.allocations.reduce((sum, a) => sum + (a.quantity || 0), 0)} units
            </span>
          </div>
          <div className="tr-contents-batches">
            {d.allocations.map((a) => (
              <div key={a.batch_id} className="tr-batch-row">
                <div className="tr-batch-link-wrap">
                  <VaahanIcon name="tag" size={13} className="tr-batch-icon shrink-0" />
                  <Link href={`/batches/${a.batch_id}`}>{a.reference_code}</Link>
                </div>
                <span className="tr-batch-count">{a.quantity} units</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="tr-action-btn"
            onClick={() => setDrawer("contents")}
          >
            <VaahanIcon name="qr" size={14} className="shrink-0" />
            <span>View QR identities</span>
          </button>
          <p className="tr-muted">
            Load a bounded manifest with current lifecycle, receipt and custody.
          </p>
        </section>
        <section className="tr-section">
          <div className="tr-section-title">
            <div className="tr-title-with-icon">
              <VaahanIcon name="route" size={17} className="tr-title-icon" />
              <h2>Movement details</h2>
            </div>
          </div>
          <dl className="tr-facts">
            <div className="tr-fact-row">
              <dt>
                <VaahanIcon name="calendar" size={13} className="shrink-0" />
                <span>Requested</span>
              </dt>
              <dd>{transferDate(t.created_at)} IST</dd>
            </div>
            <div className="tr-fact-row">
              <dt>
                <VaahanIcon name="package" size={13} className="shrink-0" />
                <span>Dispatched</span>
              </dt>
              <dd>{transferDate(t.dispatched_at)}</dd>
            </div>
            <div className="tr-fact-row">
              <dt>
                <VaahanIcon name="clock" size={13} className="shrink-0" />
                <span>Expected arrival</span>
              </dt>
              <dd>{transferDate(t.expected_arrival)}</dd>
            </div>
            <div className="tr-fact-row">
              <dt>
                <VaahanIcon name="location" size={13} className="shrink-0" />
                <span>Carrier</span>
              </dt>
              <dd className={!t.carrier ? "tr-dimmed" : ""}>{t.carrier || "Not recorded"}</dd>
            </div>
            <div className="tr-fact-row">
              <dt>
                <VaahanIcon name="receipt" size={13} className="shrink-0" />
                <span>Handover / waybill</span>
              </dt>
              <dd className={!t.tracking_reference ? "tr-dimmed" : ""}>{t.tracking_reference || "Not recorded"}</dd>
            </div>
            <div className="tr-fact-row">
              <dt>
                <VaahanIcon name="package-check" size={13} className="shrink-0" />
                <span>Final receipt</span>
              </dt>
              <dd>{transferDate(t.received_at)}</dd>
            </div>
          </dl>
        </section>
      </div>
      <section className="tr-section">
        <div className="tr-section-title">
          <div className="tr-title-with-icon">
            <VaahanIcon name="history" size={17} className="tr-title-icon" />
            <h2>Operational timeline</h2>
          </div>
          <button
            type="button"
            className="tr-audit-btn"
            onClick={() => setDrawer("audit")}
          >
            <VaahanIcon name="shield-check" size={13} className="shrink-0" />
            <span>Security audit</span>
          </button>
        </div>
        <TransferHistoryPanel identity={identity} id={id} section="timeline" />
      </section>
      {preview && (
        <Link className="tr-link-button" href={`/transfers/${id}`}>
          <span>Open full transfer</span>
          <VaahanIcon name="arrow-right" size={13} className="shrink-0" />
        </Link>
      )}
      {actions.length > 0 && (
        <footer className="tr-sticky-actions">
          <span>Next step · {t.reference_code}</span>
          <div className="tr-actions">
            <button
              className="tr-primary"
              onClick={() => setAction(actions[0]!)}
            >
              {transferLabel(actions[0]!)}
            </button>
            {actions.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="More transfer actions">
                    <span>More actions</span>
                    <VaahanIcon
                      name="chevron-down"
                      size={11}
                      className="opacity-60 shrink-0"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.slice(1).map((a) => (
                    <DropdownMenuItem key={a} onSelect={() => setAction(a)}>
                      {transferLabel(a)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </footer>
      )}
      {action && (
        <TransferAction
          row={t}
          action={action}
          onClose={() => setAction(null)}
          onChanged={refresh}
          onResolveMissing={() => setAction("resolve")}
        />
      )}
      <Sheet
        open={!!drawer}
        onOpenChange={(o) => {
          if (!o) setDrawer(null);
        }}
      >
        <SheetContent className="tr-sheet tr-drawer-sheet">
          <SheetTitle>
            {drawer === "contents" ? "QR manifest" : "Security audit"}
          </SheetTitle>
          <SheetDescription>
            {t.reference_code} ·{" "}
            {drawer === "contents"
              ? "Current custody and receipt for each identity."
              : "Protected administrative actions, separate from the custody timeline."}
          </SheetDescription>
          {drawer && (
            <TransferHistoryPanel
              key={drawer}
              identity={identity}
              id={id}
              section={drawer}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
export function TransferHistoryPanel({
  identity,
  id,
  section,
}: {
  identity: AdminIdentity;
  id: string;
  section: "timeline" | "contents" | "audit";
}) {
  const [search, setSearch] = useState(""),
    [q, setQ] = useState("");
  const query = useInfiniteQuery({
    queryKey: [...transferScope(identity), section, id, q],
    queryFn: ({ pageParam, signal }) =>
      getAdminData<TransferPage<TransferHistory>>(
        `/api/transfers/${id}/history?section=${section}&q=${encodeURIComponent(q)}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor,
    staleTime: 20000,
    retry: 1,
  });
  const rows = Array.from(
    new Map(
      (query.data?.pages.flatMap((p) => p.rows) || []).map((r) => [r.id, r]),
    ).values(),
  );
  let day = "";
  return (
    <div>
      {section === "contents" && (
        <form
          className="tr-manifest-search"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search.trim());
          }}
        >
          <label>
            <span>Find visible QR code</span>
            <input
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Visible QR code"
            />
          </label>
          <button type="submit">Search</button>
        </form>
      )}
      {query.isPending ? (
        <TransferSkeleton />
      ) : query.isError && rows.length === 0 ? (
        <TransferError
          message={`${section === "timeline" ? "Timeline" : section === "contents" ? "QR manifest" : "Audit"} unavailable.`}
          retry={query.refetch}
        />
      ) : rows.length === 0 ? (
        <p className="tr-muted">
          {section === "timeline"
            ? "No operational events recorded. Earlier custody stages are not inferred from update timestamps."
            : "No matching records."}
        </p>
      ) : section === "contents" ? (
        <div className="tr-manifest">
          {rows.map((r) => (
            <div key={r.id} className="tr-manifest-row">
              <div className="tr-manifest-main">
                <Link href={`/inventory/${r.id}`} className="tr-manifest-code">
                  {r.visible_code}
                </Link>
                <span className="tr-manifest-status">
                  {transferLabel(r.receipt_state || "PENDING")} ·{" "}
                  {transferLabel(r.status || "")}
                </span>
              </div>
              <div className="tr-manifest-meta">
                <span className="tr-manifest-batch">{r.batch_reference}</span>
                <small className="tr-manifest-custodian">{r.custodian}</small>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ol className="tr-timeline">
          {rows.map((r) => {
            const d = new Intl.DateTimeFormat("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              }).format(new Date(r.created_at)),
              today = new Intl.DateTimeFormat("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              }).format(new Date()),
              yesterday = new Intl.DateTimeFormat("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              }).format(new Date(Date.now() - 86400000)),
              heading = d !== day;
            day = d;
            return (
              <li key={r.id}>
                {heading && (
                  <h3>
                    {d === today ? "Today" : d === yesterday ? "Yesterday" : d}
                  </h3>
                )}
                <article>
                  <span className="tr-event-dot" aria-hidden />
                  <div>
                    <strong>
                      {transferLabel(
                        r.action?.replace("transfer.", "") || "Recorded",
                      )}
                      {r.to_status ? ` · ${transferLabel(r.to_status)}` : ""}
                    </strong>
                    <p>
                      {r.actor_name || "Authorized administrator"} ·{" "}
                      {transferDate(r.created_at)} IST
                    </p>
                    {r.reason && <p>{r.reason}</p>}
                    {r.quantities && (
                      <small>
                        {Object.entries(r.quantities)
                          .map(([k, v]) => `${v} ${k}`)
                          .join(" · ")}
                      </small>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
      {query.isError && rows.length > 0 && (
        <TransferError
          message="Unable to load further records."
          retry={query.refetch}
        />
      )}
      {query.hasNextPage && (
        <button
          className="tr-load-more"
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetching ? "Loading…" : "Load more records"}
        </button>
      )}
    </div>
  );
}
