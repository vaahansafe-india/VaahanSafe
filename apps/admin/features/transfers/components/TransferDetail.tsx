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
          <VaahanIcon name="arrow-left" size={13} className="shrink-0" />
          <span>Transfers</span>
        </Link>
      )}
      <header className="tr-header">
        <div>
          <p className="tr-eyebrow">CUSTODY RECORD</p>
          <h1>{t.reference_code}</h1>
          <p>
            Physical inventory custody · Updated {transferDate(t.updated_at)}{" "}
            IST
          </p>
        </div>
        <div className="tr-actions">
          <TransferBadge row={t} />
          <button
            type="button"
            disabled={query.isFetching}
            onClick={() => void refresh()}
          >
            <VaahanIcon
              name="refresh"
              size={13}
              className={query.isFetching ? "animate-spin" : ""}
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
          <div>
            <small>{t.source_partner_id ? "DISTRIBUTOR" : "VAAHANSAFE"}</small>
            {t.source_partner_id ? (
              <Link href={`/distributors/${t.source_partner_id}`}>
                {t.source_name}
              </Link>
            ) : (
              <strong>Central inventory</strong>
            )}
            <span>{t.source_reference || "Printed, unassigned QR stock"}</span>
          </div>
          <span className="tr-route-arrow" aria-hidden>
            <VaahanIcon name="arrow-right" size={14} className="opacity-60 shrink-0" />
          </span>
          <div>
            <small>{t.destination_kind}</small>
            <Link
              href={`/${t.destination_kind === "RETAILER" ? "retailers" : "distributors"}/${t.destination_partner_id}`}
            >
              {t.destination_name}
            </Link>
            <span>{t.destination_reference}</span>
          </div>
        </div>
        <TransferRail row={t} />
        <p className="tr-custody-copy">
          {t.status === "CANCELLED" || t.status === "REJECTED"
            ? "Reservation released. No custody moved."
            : !dispatched
              ? "Stock remains with the source and is reserved for this request."
              : pending || t.missing_quantity > t.resolved_quantity
                ? "Received identities belong to the destination. Pending and unresolved missing identities retain their last acknowledged custody and stay reserved."
                : "Receipt is accounted for at the destination. Damaged or lost stock remains unavailable."}
        </p>
      </section>
      <section aria-labelledby={`ledger-${id}`} className="tr-section">
        <h2 id={`ledger-${id}`}>Quantity ledger</h2>
        <div className="tr-ledger">
          {[
            ["Requested", t.quantity],
            [
              "Reserved",
              !dispatched && !["CANCELLED", "REJECTED"].includes(t.status)
                ? t.quantity
                : 0,
            ],
            ["Dispatched", dispatched ? t.quantity : 0],
            ["Received", t.received_quantity],
            ["Damaged", t.damaged_quantity],
            ["Missing / lost", t.missing_quantity],
          ].map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <strong>{Number(v).toLocaleString("en-IN")}</strong>
            </div>
          ))}
        </div>
        {dispatched && (
          <p className="tr-equation">
            {t.quantity} dispatched = {t.received_quantity} received +{" "}
            {t.damaged_quantity} damaged + {t.missing_quantity} missing / lost +{" "}
            {pending} pending.
          </p>
        )}
      </section>
      {t.attention && (
        <section className="tr-attention">
          <h2>Action required</h2>
          <p>
            {t.overdue ? "The recorded expected arrival has passed. " : ""}
            {t.damaged_quantity || t.missing_quantity
              ? `${t.damaged_quantity} damaged and ${t.missing_quantity} missing / lost units require an accountable resolution.`
              : "Record the remaining physical receipt."}
          </p>
          {d.reconciliation && (
            <Link
              href={`/reconciliation?q=${encodeURIComponent(d.reconciliation.id)}`}
            >
              Reconciliation · {transferLabel(d.reconciliation.status)} ·
              variance {d.reconciliation.variance}
            </Link>
          )}
        </section>
      )}
      <div className="tr-detail-columns">
        <section className="tr-section">
          <h2>Transfer contents</h2>
          <div className="tr-contents-batches">
            {d.allocations.map((a) => (
              <div key={a.batch_id}>
                <Link href={`/batches/${a.batch_id}`}>{a.reference_code}</Link>
                <span>{a.quantity} units</span>
              </div>
            ))}
          </div>
          <button onClick={() => setDrawer("contents")}>
            View QR identities
          </button>
          <p className="tr-muted">
            Load a bounded manifest with current lifecycle, receipt and custody.
          </p>
        </section>
        <section className="tr-section">
          <h2>Movement details</h2>
          <dl className="tr-facts">
            <div>
              <dt>Requested</dt>
              <dd>{transferDate(t.created_at)} IST</dd>
            </div>
            <div>
              <dt>Dispatched</dt>
              <dd>{transferDate(t.dispatched_at)}</dd>
            </div>
            <div>
              <dt>Expected arrival</dt>
              <dd>{transferDate(t.expected_arrival)}</dd>
            </div>
            <div>
              <dt>Carrier</dt>
              <dd>{t.carrier || "Not recorded"}</dd>
            </div>
            <div>
              <dt>Handover / waybill</dt>
              <dd>{t.tracking_reference || "Not recorded"}</dd>
            </div>
            <div>
              <dt>Final receipt</dt>
              <dd>{transferDate(t.received_at)}</dd>
            </div>
          </dl>
        </section>
      </div>
      <section className="tr-section">
        <div className="tr-section-title">
          <h2>Operational timeline</h2>
          <button onClick={() => setDrawer("audit")}>Security audit</button>
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
        <SheetContent className="tr-sheet">
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
            Find visible QR code
            <input
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Visible QR code"
            />
          </label>
          <button>Search</button>
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
            <div key={r.id}>
              <Link href={`/inventory/${r.id}`}>{r.visible_code}</Link>
              <span>{r.batch_reference}</span>
              <span>
                {transferLabel(r.receipt_state || "PENDING")} ·{" "}
                {transferLabel(r.status || "")}
              </span>
              <small>{r.custodian}</small>
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
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetching ? "Loading…" : "Load more records"}
        </button>
      )}
    </div>
  );
}
