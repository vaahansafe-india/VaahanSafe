"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@vaahansafe/ui/components/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@vaahansafe/ui/components/dropdown-menu";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import type { AdminIdentity } from "../../../lib/contracts";
import { AdminDialog } from "../../../components/AdminDialog";
import { getAdminData } from "../../../lib/client-api";
import type {
  RetailerDetail as Detail,
  RetailerHistoryRow,
} from "../retailer.types";
import {
  canManageRetailers,
  canReadRetailerContacts,
} from "../retailer.filters";
import { uniqueDistributorRows } from "../../distributors/distributor.filters";
import { RetailerForm } from "./RetailerForm";
import { RetailerTransfer } from "./RetailerTransfer";
import { RetailerSaleDialog, RetailerSales } from "./RetailerSale";
import {
  RetailerConfirm,
  RetailerReconcile,
  RetailerHistoryActions,
} from "./RetailerOperations";
import { RetailerStatus, timeLabel } from "./RetailerWorkspace";
export function RetailerSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="dist-skeleton" role="status" aria-label="Loading retailers">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} />
      ))}
    </div>
  );
}
function useDetail(id: string | null, initial?: Detail) {
  return useQuery({
    queryKey: ["retailers", "detail", id],
    queryFn: ({ signal }) =>
      getAdminData<Detail>(`/api/retailers/${id}`, signal),
    enabled: !!id,
    initialData: initial,
    staleTime: 20000,
  });
}
function Metrics({ detail }: { detail: Detail }) {
  const r = detail.retailer;
  const items: {
    label: string;
    value: number;
    icon: VaahanIconName;
    tone: "neutral" | "info" | "success" | "warning";
  }[] = [
    {
      label: "Available",
      value: r.available,
      icon: "package",
      tone: "neutral",
    },
    {
      label: "Incoming",
      value: r.in_transit,
      icon: "route",
      tone: r.in_transit > 0 ? "info" : "neutral",
    },
    {
      label: "Activations / 30d",
      value: r.activations_30d,
      icon: "package-check",
      tone: r.activations_30d > 0 ? "success" : "neutral",
    },
    {
      label: "Variance",
      value: r.unresolved_variance,
      icon: "alert",
      tone: r.unresolved_variance > 0 ? "warning" : "neutral",
    },
  ];
  return (
    <div className="retail-metrics-grid" role="region" aria-label="Inventory metrics">
      {items.map((item) => (
        <div
          key={item.label}
          className={`retail-metric-card retail-metric-${item.tone}${item.value > 0 && item.tone !== "neutral" ? " retail-metric-active" : ""}`}
        >
          <div className="retail-metric-header">
            <span className="retail-metric-label">{item.label}</span>
            <span className="retail-metric-icon-wrap" aria-hidden>
              <VaahanIcon name={item.icon} size={13} className="shrink-0" />
            </span>
          </div>
          <strong className="retail-metric-value">
            {Number(item.value).toLocaleString("en-IN")}
          </strong>
        </div>
      ))}
    </div>
  );
}
function SupplyCard({ detail }: { detail: Detail }) {
  const p = detail.parent;
  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="inline-flex items-center gap-2">
          <VaahanIcon name="route" size={16} className="text-amber-900 shrink-0" />
          <h2 className="!mb-0">Supplied by</h2>
        </div>
        {p && (
          <span
            className={`dist-badge ${p.status === "ACTIVE" ? "success" : "attention"}`}
          >
            {p.status === "ACTIVE" ? "Active distributor" : "Inactive distributor"}
          </span>
        )}
      </div>
      {p ? (
        <>
          <p className="!my-1.5">
            <strong className="text-sm font-semibold text-stone-900 block">
              {p.name}
            </strong>
            <span className="text-xs text-stone-500 block">
              {p.reference_code}
            </span>
            <span className="text-xs text-stone-600 block">
              {p.city} · {p.state_name}
            </span>
          </p>
          <p className="text-xs text-stone-600 !my-2">
            {detail.territory_match
              ? "✓ Outlet is within the confirmed service territory."
              : "⚠ Outlet territory needs review against current distributor coverage."}
          </p>
          <Link
            href={`/distributors/${p.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 hover:underline mt-1"
          >
            <span>Open distributor</span>
            <VaahanIcon name="arrow-right" size={12} />
          </Link>
        </>
      ) : (
        <p className="text-xs text-stone-500">Supply network setup required.</p>
      )}
    </>
  );
}
function ContactCard({ detail }: { detail: Detail }) {
  const r = detail.retailer;
  return (
    <div className="dist-contact-card mt-3">
      <div className="dist-contact-info">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider !mb-1">
          Primary contact
        </h3>
        <strong className="text-sm font-semibold text-stone-900 block">
          {r.contact_name || "Contact setup required"}
        </strong>
        {detail.contacts_allowed ? (
          <div className="dist-contact-links mt-2">
            {r.contact_phone && (
              <a
                href={`tel:${r.contact_phone}`}
                className="dist-contact-link inline-flex items-center gap-1.5"
              >
                <VaahanIcon name="phone" size={13} />
                <span>{r.contact_phone}</span>
              </a>
            )}
            {r.contact_email && (
              <a
                href={`mailto:${r.contact_email}`}
                className="dist-contact-link inline-flex items-center gap-1.5"
              >
                <VaahanIcon name="mail" size={13} />
                <span>{r.contact_email}</span>
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-stone-500 mt-1">
            Contact information is restricted to operations administrators.
          </p>
        )}
      </div>
    </div>
  );
}
export function RetailerPreview({
  id,
  onClose,
  identity,
}: {
  id: string | null;
  onClose: () => void;
  identity: AdminIdentity;
}) {
  const query = useDetail(id);
  return (
    <Sheet
      open={!!id}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent className="dist-sheet">
        <SheetTitle>
          {query.data?.retailer.name || "Retailer preview"}
        </SheetTitle>
        <SheetDescription>
          Local supply network and recorded QR custody.
        </SheetDescription>
        {query.isPending ? (
          <RetailerSkeleton />
        ) : query.isError ? (
          <div role="alert" className="dist-error">
            Could not load this retailer.{" "}
            <button onClick={() => void query.refetch()}>Retry</button>
          </div>
        ) : (
          query.data && (
            <>
              <small>{query.data.retailer.reference_code}</small>
              <RetailerStatus row={query.data.retailer} />
              <p>
                {query.data.retailer.city} · {query.data.retailer.district_name}
                <br />
                {query.data.retailer.state_name}
              </p>
              <Metrics detail={query.data} />
              <SupplyCard detail={query.data} />
              <h3>Inventory</h3>
              <p>
                {query.data.retailer.on_hand} on hand ·{" "}
                {query.data.retailer.reserved} reserved
                <br />
                Last receipt: {timeLabel(query.data.retailer.last_receipt_at)}
              </p>
              <h3>Activation activity</h3>
              <p>
                {query.data.retailer.activations_today} today ·{" "}
                {query.data.retailer.activations_7d} / 7 days
                <br />
                Last activation:{" "}
                {timeLabel(query.data.retailer.last_activation_at)}
              </p>
              {canReadRetailerContacts(identity.role) && (
                <ContactCard detail={query.data} />
              )}
              <Link
                href={`/retailers/${id}?tab=inventory`}
                className="dist-link-button"
              >
                View inventory
              </Link>
              <Link
                href={`/retailers/${id}`}
                className="dist-link-button dist-primary"
              >
                Open retailer
              </Link>
            </>
          )
        )}
      </SheetContent>
    </Sheet>
  );
}
export function RetailerEditor({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const query = useDetail(id);
  return query.data ? (
    <RetailerForm open detail={query.data} onClose={onClose} />
  ) : (
    <AdminDialog
      title="Edit retailer"
      description="Loading the current retailer version."
      onClose={onClose}
    >
      {query.isError ? (
        <div className="dist-error" role="alert">
          Could not load this retailer.{" "}
          <button onClick={() => void query.refetch()}>Retry</button>
        </div>
      ) : (
        <RetailerSkeleton />
      )}
    </AdminDialog>
  );
}
function History({
  id,
  section,
  manage,
  onChanged,
}: {
  id: string;
  section: string;
  manage: boolean;
  onChanged: () => void;
}) {
  const query = useInfiniteQuery({
    queryKey: ["retailers", "history", id, section],
    queryFn: ({ signal, pageParam }) =>
      getAdminData<{ rows: RetailerHistoryRow[]; nextCursor: string | null }>(
        `/api/retailers/${id}/history?section=${section}${pageParam ? "&cursor=" + encodeURIComponent(pageParam) : ""}`,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor,
    staleTime: 20000,
  });
  const rows = uniqueDistributorRows(
    query.data?.pages.map((p) => p.rows) || [],
  );
  return (
    <>
      {query.isPending ? (
        <RetailerSkeleton rows={3} />
      ) : (
        <>
          {query.isError && (
            <div role="alert" className="dist-error">
              Could not refresh this section.{" "}
              <button onClick={() => void query.refetch()}>Retry</button>
            </div>
          )}
          {rows.length === 0 && !query.isError && (
            <div className="dist-empty-state">
              <div className="dist-empty-icon">
                <VaahanIcon name="package" size={24} className="shrink-0" />
              </div>
              <h3>No {section === "activity" ? "audit events" : section} recorded</h3>
              <p>Entries will appear here as operational movements and events occur.</p>
            </div>
          )}
          <div className="retail-history-list">
            {rows.map((row) => (
              <div className="dist-history-row retail-history-row" key={row.id}>
                <div className="retail-history-main">
                  <div className="retail-history-title-row">
                    {section === "inventory" ? (
                      <Link href={`/inventory/${row.id}`} className="retail-history-code-link">
                        <VaahanIcon name="qr" size={13} className="shrink-0 opacity-70" />
                        <span>{row.visible_code || "QR identity"}</span>
                      </Link>
                    ) : (
                      <strong className="retail-history-title">
                        {row.action?.replaceAll(".", " · ").replaceAll("_", " ") ||
                          row.reference_code ||
                          row.visible_code ||
                          "Physical stock count"}
                      </strong>
                    )}
                    {row.status && (
                      <span className="dist-badge retail-history-badge">
                        {row.status}
                      </span>
                    )}
                    {row.quantity !== undefined && (
                      <span className="retail-history-qty">
                        <VaahanIcon name="tag" size={11} className="shrink-0 opacity-70" />
                        <span>{row.quantity} identities</span>
                      </span>
                    )}
                  </div>
                  {row.variance !== undefined && (
                    <p className="retail-history-variance">
                      Expected <strong>{row.expected_quantity}</strong> · Counted{" "}
                      <strong>{row.counted_quantity}</strong> · Variance{" "}
                      <span className={row.variance !== 0 ? "text-amber-800 font-semibold" : ""}>
                        {row.variance}
                      </span>
                    </p>
                  )}
                  {row.source_partner_id && (
                    <p className="retail-history-source">
                      <VaahanIcon name="route" size={12} className="shrink-0 opacity-70" />
                      <span>
                        From{" "}
                        <Link href={`/distributors/${row.source_partner_id}`}>
                          {row.source_name}
                        </Link>{" "}
                        {row.batch_reference ? `· ${row.batch_reference}` : ""}
                      </span>
                    </p>
                  )}
                  <div className="retail-history-meta">
                    <span className="retail-history-time">
                      <VaahanIcon name="clock" size={11} className="shrink-0 opacity-70" />
                      <span>{timeLabel(row.created_at)}</span>
                    </span>
                    {row.actor_name && (
                      <>
                        <span className="retail-meta-dot">·</span>
                        <span className="retail-history-actor">{row.actor_name}</span>
                      </>
                    )}
                  </div>
                  {row.reason && <p className="retail-history-reason">{row.reason}</p>}
                </div>
                {manage && (
                  <RetailerHistoryActions
                    row={row}
                    id={id}
                    section={section}
                    onChanged={onChanged}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {query.isFetchingNextPage && <RetailerSkeleton rows={2} />}
      <div className="dist-load-more">
        {query.hasNextPage && (
          <button
            disabled={query.isFetching}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchingNextPage ? "Loading more…" : "Load more records"}
          </button>
        )}
      </div>
    </>
  );
}
const TABS = [
  "overview",
  "inventory",
  "transfers",
  "sales",
  "activations",
  "reconciliation",
  "location",
  "contacts",
  "activity",
  "audit",
];
const RETAILER_TAB_ICONS: Record<string, VaahanIconName> = {
  overview: "home",
  inventory: "package",
  transfers: "route",
  sales: "cart",
  activations: "package-check",
  reconciliation: "shield-check",
  location: "map-pin",
  contacts: "user",
  activity: "activity",
  audit: "history",
};
export function RetailerDetail({
  initial,
  identity,
}: {
  initial: Detail;
  identity: AdminIdentity;
}) {
  const query = useDetail(initial.retailer.id, initial),
    detail = query.data || initial,
    r = detail.retailer,
    p = useSearchParams(),
    tab = TABS.includes(p.get("tab") || "") ? p.get("tab")! : "overview",
    client = useQueryClient(),
    [edit, setEdit] = useState(false),
    [transfer, setTransfer] = useState(false),
    [sale, setSale] = useState(false),
    [statusAction, setStatusAction] = useState<
      "status" | "verification" | null
    >(null),
    manage = canManageRetailers(identity.role),
    tabsListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tabsListRef.current) return;
    const activeEl = tabsListRef.current.querySelector<HTMLElement>(
      `[data-tab-name="${tab}"]`,
    );
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [tab]);
  const changed = () => {
    void Promise.all([
      client.invalidateQueries({ queryKey: ["retailers"] }),
      client.invalidateQueries({ queryKey: ["distributors"] }),
      client.invalidateQueries({ queryKey: ["retailer-distributor"] }),
      client.invalidateQueries({ queryKey: ["inventory"] }),
      client.invalidateQueries({ queryKey: ["transfers"] }),
    ]);
  };
  const nextStatus = r.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  return (
    <section className="dist-workspace retail-workspace">
      <Link href="/retailers" className="dist-back-link retail-back-link">
        <VaahanIcon name="arrow-left" size={14} className="shrink-0" />
        <span>Retailers</span>
      </Link>
      <header className="dist-header retail-header">
        <div className="retail-header-main">
          <div className="retail-eyebrow-wrap">
            <span className="retail-eyebrow-badge">
              <VaahanIcon name="shield-check" size={11} className="shrink-0" />
              <span>LOCAL FULFILMENT PARTNER</span>
            </span>
          </div>
          <div className="retail-title-wrap">
            <h1 className="retail-title">{r.name}</h1>
            <span className="retail-reference-pill">{r.reference_code}</span>
          </div>
          <div className="retail-meta-line">
            <span className="retail-meta-item">
              <VaahanIcon name="map-pin" size={13} className="shrink-0" />
              <span>
                {r.city} · {r.district_name} · {r.state_name}
              </span>
            </span>
            <span className="retail-meta-dot" aria-hidden="true">
              ·
            </span>
            <span className="retail-meta-item">
              <VaahanIcon name="route" size={13} className="shrink-0" />
              <span>
                Supplied by{" "}
                <strong>{r.distributor_name || "Supply setup required"}</strong>
              </span>
            </span>
          </div>
          <div className="retail-header-badges">
            <RetailerStatus row={r} />
          </div>
        </div>
        <div className="dist-actions retail-header-actions">
          <button
            type="button"
            className="dist-btn retail-refresh-btn"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            title="Refresh retailer details"
          >
            <VaahanIcon
              name="refresh"
              size={13}
              className={`shrink-0 ${query.isFetching ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          {manage && (
            <>
              <button
                type="button"
                className="dist-btn retail-action-btn"
                disabled={
                  r.status !== "ACTIVE" ||
                  r.verification_status !== "VERIFIED" ||
                  r.distributor_status !== "ACTIVE"
                }
                onClick={() => setSale(true)}
                title="Record retail sale"
              >
                <VaahanIcon name="receipt" size={13} className="shrink-0" />
                <span>Record retail sale</span>
              </button>
              <button
                type="button"
                className="dist-btn dist-primary retail-action-btn"
                disabled={
                  r.status !== "ACTIVE" ||
                  r.verification_status !== "VERIFIED" ||
                  r.distributor_status !== "ACTIVE"
                }
                onClick={() => setTransfer(true)}
                title="Send stock to retailer"
              >
                <VaahanIcon name="plus" size={13} className="shrink-0" />
                <span>Send stock</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="dist-btn retail-more-btn" title="More actions">
                    <span>More</span>
                    <VaahanIcon name="chevron-down" size={11} className="opacity-60 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEdit(true)}>
                    Edit retailer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setStatusAction("verification")}
                  >
                    {r.verification_status === "VERIFIED"
                      ? "Require verification correction"
                      : "Verify retailer"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setStatusAction("status")}>
                    {nextStatus === "SUSPENDED"
                      ? "Suspend retailer"
                      : "Reactivate retailer"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </header>
      <Metrics detail={detail} />
      {query.isError && (
        <div className="dist-error" role="alert">
          Could not refresh the retailer. Existing records remain visible.{" "}
          <button onClick={() => void query.refetch()}>Retry</button>
        </div>
      )}
      {manage &&
        (r.status !== "ACTIVE" ||
          r.verification_status !== "VERIFIED" ||
          r.distributor_status !== "ACTIVE") && (
          <p className="dist-error">
            Stock requests and dispatch require an active, verified retailer and
            an active supplying distributor. Use More to review verification or
            status.
          </p>
        )}
      {statusAction && (
        <div className="retail-status-review">
          <RetailerConfirm
            key={statusAction}
            id={r.id}
            status
            label={
              statusAction === "status"
                ? nextStatus === "SUSPENDED"
                  ? "Suspend retailer"
                  : "Reactivate retailer"
                : r.verification_status === "VERIFIED"
                  ? "Require verification correction"
                  : "Verify retailer"
            }
            description={
              statusAction === "status"
                ? `${r.name} currently holds ${r.on_hand} identities with ${r.in_transit} incoming. Suspension prevents new stock requests and dispatch. Receipt of already-dispatched stock remains recordable.`
                : "Record the verification decision after checking the business, supplying distributor, outlet location and contact information."
            }
            body={{
              updatedAt: r.updated_at,
              ...(statusAction === "status"
                ? { status: nextStatus }
                : {
                    verification:
                      r.verification_status === "VERIFIED"
                        ? "REQUIRES_CORRECTION"
                        : "VERIFIED",
                  }),
            }}
            onChanged={() => {
              setStatusAction(null);
              changed();
            }}
          />
          <button onClick={() => setStatusAction(null)}>Dismiss</button>
        </div>
      )}
      <Tabs
        value={tab}
        onValueChange={(value) =>
          window.history.pushState(null, "", `/retailers/${r.id}?tab=${value}`)
        }
      >
        <div className="retail-tabs-container">
          <TabsList ref={tabsListRef} className="dist-tabs retail-tabs">
            {TABS.map((t) => (
              <TabsTrigger
                value={t}
                key={t}
                data-tab-name={t}
                className="retail-tab-trigger"
              >
                <VaahanIcon
                  name={RETAILER_TAB_ICONS[t] || "circle"}
                  size={14}
                  className="shrink-0 opacity-80"
                />
                <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview">
          <div className="dist-detail-grid">
            <section>
              <SupplyCard detail={detail} />
            </section>
            <section>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="inline-flex items-center gap-2">
                  <VaahanIcon name="package" size={16} className="text-amber-900 shrink-0" />
                  <h2 className="!mb-0">Local operations</h2>
                </div>
                <span className="dist-badge">{r.available} available</span>
              </div>
              <p className="!my-1.5 text-xs leading-relaxed text-stone-700">
                <strong>{r.on_hand}</strong> on hand · <strong>{r.reserved}</strong> reserved
                <br />
                <strong>{r.available}</strong> available · <strong>{r.in_transit}</strong> incoming
              </p>
              <p className="text-xs text-stone-500 !my-2">
                Low stock threshold: {r.stock_threshold || "Not configured"}
                <br />
                Last receipt: {timeLabel(r.last_receipt_at)}
              </p>
              <Link
                href={`/retailers/${r.id}?tab=transfers`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 hover:underline mt-1"
              >
                <span>View replenishment</span>
                <VaahanIcon name="arrow-right" size={12} />
              </Link>
            </section>
            <section>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="inline-flex items-center gap-2">
                  <VaahanIcon name="package-check" size={16} className="text-amber-900 shrink-0" />
                  <h2 className="!mb-0">Activation activity</h2>
                </div>
                <span className="dist-badge success">{r.activations_today} today</span>
              </div>
              <p className="!my-1.5 text-xs leading-relaxed text-stone-700">
                <strong>{r.activations_today}</strong> today · <strong>{r.activations_7d}</strong> / 7d · <strong>{r.activations_30d}</strong> / 30d
              </p>
              <p className="text-xs text-stone-500 !my-2">
                Last activation: {timeLabel(r.last_activation_at)}
              </p>
              <p className="text-[11px] text-stone-500 leading-normal">
                Attributed from retained retailer custody on offline retail
                identities. Sales and customer orders are not inferred from
                activations.
              </p>
            </section>
          </div>
        </TabsContent>
        <TabsContent value="inventory">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <div className="inline-flex items-center gap-2 mb-1">
                  <VaahanIcon name="package" size={17} className="text-amber-900 shrink-0" />
                  <h2 className="!mb-0">Inventory custody</h2>
                </div>
                <p className="dist-panel-desc">
                  {r.available} available · {r.reserved} reserved · {r.in_transit} incoming
                </p>
              </div>
            </div>
            <div className="dist-actions" style={{ marginBottom: 16 }}>
              {detail.inventory.map((v) => (
                <span className="dist-badge" key={v.status}>
                  {v.status.replaceAll("_", " ")} · {v.quantity}
                </span>
              ))}
            </div>
            <History
              id={r.id}
              section="inventory"
              manage={false}
              onChanged={changed}
            />
          </section>
        </TabsContent>
        <TabsContent value="transfers">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <div className="inline-flex items-center gap-2 mb-1">
                  <VaahanIcon name="route" size={17} className="text-amber-900 shrink-0" />
                  <h2 className="!mb-0">Replenishment and stock movement</h2>
                </div>
                <p className="dist-panel-desc">
                  Reservations, dispatch and physical receipt are recorded
                  separately. Transfers without identity reservations require
                  operational review.
                </p>
              </div>
            </div>
            <History
              id={r.id}
              section="transfers"
              manage={manage}
              onChanged={changed}
            />
          </section>
        </TabsContent>
        <TabsContent value="activations">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <div className="inline-flex items-center gap-2 mb-1">
                  <VaahanIcon name="package-check" size={17} className="text-amber-900 shrink-0" />
                  <h2 className="!mb-0">Attributed activations</h2>
                </div>
                <p className="dist-panel-desc">
                  {r.activations_today} today · {r.activations_7d} / 7d ·{" "}
                  {r.activations_30d} / 30d. Owner contact and vehicle information
                  are excluded from this operational history.
                </p>
              </div>
            </div>
            <History
              id={r.id}
              section="activations"
              manage={false}
              onChanged={changed}
            />
          </section>
        </TabsContent>
        <TabsContent value="sales"><RetailerSales id={r.id} /></TabsContent>
        <TabsContent value="reconciliation">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <div className="inline-flex items-center gap-2 mb-1">
                  <VaahanIcon name="shield-check" size={17} className="text-amber-900 shrink-0" />
                  <h2 className="!mb-0">Physical stock reconciliation</h2>
                </div>
                <p className="dist-panel-desc">
                  {r.reconciliation_issues} open discrepancies ·{" "}
                  {r.unresolved_variance} identities in unresolved variance.
                  Recorded counts preserve custody; review does not automatically
                  adjust inventory.
                </p>
              </div>
            </div>
            {manage && (
              <RetailerReconcile detail={detail} onChanged={changed} />
            )}
            <History
              id={r.id}
              section="reconciliations"
              manage={manage}
              onChanged={changed}
            />
          </section>
        </TabsContent>
        <TabsContent value="location">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <div className="inline-flex items-center gap-2 mb-1">
                  <VaahanIcon name="map-pin" size={17} className="text-amber-900 shrink-0" />
                  <h2 className="!mb-0">Outlet location</h2>
                </div>
                <p className="dist-panel-desc">
                  Physical store address, landmark, and territory mapping.
                </p>
              </div>
            </div>
            <div className="retail-location-grid">
              <div className="dist-contact-card">
                <div className="dist-contact-badge">
                  <VaahanIcon name="map-pin" size={16} />
                </div>
                <div className="dist-contact-info">
                  <strong>Retail store location</strong>
                  <p className="text-xs text-stone-700 my-1 leading-relaxed">
                    {r.address_line_1}
                    {r.address_line_2 && (
                      <>
                        <br />
                        {r.address_line_2}
                      </>
                    )}
                    <br />
                    {r.city} · {r.district_name}
                    <br />
                    {r.state_name} · {r.postal_code || "Postal code not provided"}
                  </p>
                  {r.landmark && (
                    <p className="dist-landmark-text mt-1">
                      Landmark: {r.landmark}
                    </p>
                  )}
                </div>
              </div>
              <div className="dist-contact-card retail-parent-contact-card">
                <div className="dist-contact-badge secondary">
                  <VaahanIcon name="route" size={16} />
                </div>
                <div className="dist-contact-info w-full">
                  <SupplyCard detail={detail} />
                </div>
              </div>
            </div>
          </section>
        </TabsContent>
        <TabsContent value="contacts">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <h2>Primary contact</h2>
                <p className="dist-panel-desc">
                  Direct retail outlet liaison and operational point of contact.
                </p>
              </div>
              {manage && (
                <div className="dist-panel-actions">
                  <button
                    type="button"
                    className="dist-btn"
                    onClick={() => setEdit(true)}
                  >
                    <VaahanIcon name="edit" size={13} />
                    <span>Update contact</span>
                  </button>
                </div>
              )}
            </div>
            {detail.contacts_allowed ? (
              <div className="retail-contacts-grid">
                <div className="dist-contact-card">
                  <div className="dist-contact-badge">
                    <VaahanIcon name="user" size={16} />
                  </div>
                  <div className="dist-contact-info">
                    <strong>{r.contact_name || "Contact setup required"}</strong>
                    <span className="dist-contact-role">
                      Retail Outlet Manager / Primary Liaison
                    </span>
                    <div className="dist-contact-links">
                      {r.contact_phone && (
                        <a
                          href={`tel:${r.contact_phone}`}
                          className="dist-contact-link inline-flex items-center gap-1.5"
                        >
                          <VaahanIcon name="phone" size={13} />
                          <span>{r.contact_phone}</span>
                        </a>
                      )}
                      {r.contact_email && (
                        <a
                          href={`mailto:${r.contact_email}`}
                          className="dist-contact-link inline-flex items-center gap-1.5"
                        >
                          <VaahanIcon name="mail" size={13} />
                          <span>{r.contact_email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {detail.parent && (
                  <div className="dist-contact-card retail-parent-contact-card">
                    <div className="dist-contact-badge secondary">
                      <VaahanIcon name="route" size={16} />
                    </div>
                    <div className="dist-contact-info">
                      <strong>{detail.parent.name}</strong>
                      <span className="dist-contact-role">
                        Supplying Regional Distributor ({detail.parent.reference_code})
                      </span>
                      <p className="text-xs text-stone-600 my-1">
                        {detail.parent.city} · {detail.parent.state_name}
                      </p>
                      <Link
                        href={`/distributors/${detail.parent.id}?tab=contacts`}
                        className="dist-contact-link inline-flex items-center gap-1.5"
                      >
                        <span>View distributor contacts</span>
                        <VaahanIcon name="arrow-right" size={11} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="dist-contact-restricted">
                <VaahanIcon name="shield-alert" size={16} />
                <p>Contact information is restricted to operations administrators.</p>
              </div>
            )}
            {detail.contacts_allowed && (
              <div className="dist-notes-box">
                <h3>Internal administrative notes</h3>
                <p>{r.notes || "No internal administrative notes recorded."}</p>
              </div>
            )}
          </section>
        </TabsContent>
        {["activity", "audit"].map((t) => (
          <TabsContent key={t} value={t}>
            <section className="dist-detail-panel">
              <h2>{t === "audit" ? "Audit trail" : "Operational activity"}</h2>
              <History
                id={r.id}
                section="activity"
                manage={false}
                onChanged={changed}
              />
            </section>
          </TabsContent>
        ))}
      </Tabs>
      {edit && (
        <RetailerForm
          open
          detail={detail}
          onClose={() => setEdit(false)}
          onSaved={changed}
        />
      )}{" "}
      {sale && <RetailerSaleDialog retailer={r} onClose={() => setSale(false)} onChanged={changed} />}
      {transfer && (
        <RetailerTransfer
          retailer={r}
          onClose={() => setTransfer(false)}
          onChanged={changed}
        />
      )}
    </section>
  );
}
