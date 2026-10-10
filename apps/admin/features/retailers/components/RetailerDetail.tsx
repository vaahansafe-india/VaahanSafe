"use client";
import { useState } from "react";
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
  return (
    <dl className="dist-summary retail-detail-summary">
      {[
        ["Available", r.available],
        ["Incoming", r.in_transit],
        ["Activations / 30d", r.activations_30d],
        ["Variance", r.unresolved_variance],
      ].map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{Number(value).toLocaleString("en-IN")}</dd>
        </div>
      ))}
    </dl>
  );
}
function SupplyCard({ detail }: { detail: Detail }) {
  const p = detail.parent;
  return (
    <>
      <h2>Supplied by</h2>
      {p ? (
        <>
          <p>
            <strong>{p.name}</strong>
            <br />
            {p.reference_code}
            <br />
            {p.city} · {p.state_name}
            <br />
            {p.status === "ACTIVE" ? "Active" : "Distributor unavailable"}
          </p>
          <p>
            {detail.territory_match
              ? "Outlet is within the configured service territory."
              : "Outlet territory needs review against current distributor coverage."}
          </p>
          <Link href={`/distributors/${p.id}`}>Open distributor →</Link>
        </>
      ) : (
        <p>Supply network setup required.</p>
      )}
    </>
  );
}
function ContactCard({ detail }: { detail: Detail }) {
  const r = detail.retailer;
  return (
    <>
      <h2>Primary contact</h2>
      {detail.contacts_allowed ? (
        <p>
          {r.contact_name || "Contact setup required"}
          <br />
          {r.contact_phone}
          <br />
          {r.contact_email || "Email not provided"}
        </p>
      ) : (
        <p>Contact information is restricted to operations administrators.</p>
      )}
    </>
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
            <p>
              No {section === "activity" ? "audit events" : section} recorded
              yet.
            </p>
          )}
          {rows.map((row) => (
            <div className="dist-history-row" key={row.id}>
              <div>
                {section === "inventory" ? (
                  <Link href={`/inventory/${row.id}`}>
                    {row.visible_code || "QR identity"}
                  </Link>
                ) : (
                  <strong>
                    {row.action?.replaceAll(".", " · ").replaceAll("_", " ") ||
                      row.reference_code ||
                      row.visible_code ||
                      "Physical stock count"}
                  </strong>
                )}
                <p>
                  {row.status}
                  {row.quantity !== undefined
                    ? ` · ${row.quantity} identities`
                    : ""}
                  {row.variance !== undefined
                    ? ` · Expected ${row.expected_quantity} · Counted ${row.counted_quantity} · Variance ${row.variance}`
                    : ""}
                </p>
                {row.source_partner_id && (
                  <p>
                    From{" "}
                    <Link href={`/distributors/${row.source_partner_id}`}>
                      {row.source_name}
                    </Link>{" "}
                    · {row.batch_reference}
                  </p>
                )}
                <small>
                  {timeLabel(row.created_at)}
                  {row.actor_name ? " · " + row.actor_name : ""}
                </small>
                {row.reason && <p>{row.reason}</p>}
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
  "activations",
  "reconciliation",
  "location",
  "contacts",
  "activity",
  "audit",
];
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
    [statusAction, setStatusAction] = useState<
      "status" | "verification" | null
    >(null),
    manage = canManageRetailers(identity.role);
  const changed = () => {
    void Promise.all([
      client.invalidateQueries({ queryKey: ["retailers"] }),
      client.invalidateQueries({ queryKey: ["distributors"] }),
      client.invalidateQueries({ queryKey: ["retailer-distributor"] }),
    ]);
  };
  const nextStatus = r.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  return (
    <section className="dist-workspace retail-workspace">
      <Link href="/retailers">← Retailers</Link>
      <header className="dist-header">
        <div>
          <p className="dist-eyebrow">Local fulfilment partner</p>
          <h1>{r.name}</h1>
          <small>{r.reference_code}</small>
          <p>
            {r.city} · {r.district_name} · {r.state_name}
          </p>
          <p>Supplied by {r.distributor_name || "Supply setup required"}</p>
          <RetailerStatus row={r} />
        </div>
        <div className="dist-actions">
          <button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {query.isFetching ? "Refreshing…" : "Refresh"}
          </button>
          {manage && (
            <>
              <button
                className="dist-primary"
                disabled={
                  r.status !== "ACTIVE" ||
                  r.verification_status !== "VERIFIED" ||
                  r.distributor_status !== "ACTIVE"
                }
                onClick={() => setTransfer(true)}
              >
                Send stock
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button>More ⌄</button>
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
        <TabsList className="dist-tabs">
          {TABS.map((t) => (
            <TabsTrigger value={t} key={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <div className="dist-detail-grid">
            <section>
              <SupplyCard detail={detail} />
            </section>
            <section>
              <h2>Local operations</h2>
              <p>
                {r.on_hand} on hand · {r.reserved} reserved
                <br />
                {r.available} available · {r.in_transit} incoming
              </p>
              <p>
                Low stock threshold: {r.stock_threshold || "Not configured"}
                <br />
                Last receipt: {timeLabel(r.last_receipt_at)}
              </p>
              <Link href={`/retailers/${r.id}?tab=transfers`}>
                View replenishment →
              </Link>
            </section>
            <section>
              <h2>Activation activity</h2>
              <p>
                {r.activations_today} today · {r.activations_7d} / 7d ·{" "}
                {r.activations_30d} / 30d
              </p>
              <p>Last activation: {timeLabel(r.last_activation_at)}</p>
              <p>
                Attributed from retained retailer custody on offline retail
                identities. Sales and customer orders are not inferred from
                activations.
              </p>
            </section>
          </div>
        </TabsContent>
        <TabsContent value="inventory">
          <section className="dist-detail-panel">
            <h2>Inventory custody</h2>
            <p>
              {r.available} available · {r.reserved} reserved · {r.in_transit}{" "}
              incoming
            </p>
            <div className="dist-actions">
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
            <h2>Replenishment and stock movement</h2>
            <p>
              Reservations, dispatch and physical receipt are recorded
              separately. Transfers without identity reservations require
              operational review.
            </p>
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
            <h2>Attributed activations</h2>
            <p>
              {r.activations_today} today · {r.activations_7d} / 7d ·{" "}
              {r.activations_30d} / 30d. Owner contact and vehicle information
              are excluded from this operational history.
            </p>
            <History
              id={r.id}
              section="activations"
              manage={false}
              onChanged={changed}
            />
          </section>
        </TabsContent>
        <TabsContent value="reconciliation">
          <section className="dist-detail-panel">
            <h2>Physical stock reconciliation</h2>
            <p>
              {r.reconciliation_issues} open discrepancies ·{" "}
              {r.unresolved_variance} identities in unresolved variance.
              Recorded counts preserve custody; review does not automatically
              adjust inventory.
            </p>
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
            <h2>Outlet location</h2>
            <p>
              {r.address_line_1}
              <br />
              {r.address_line_2}
              <br />
              {r.city} · {r.district_name}
              <br />
              {r.state_name} · {r.postal_code || "Postal code not provided"}
            </p>
            <p>Landmark: {r.landmark || "Not recorded"}</p>
            <SupplyCard detail={detail} />
          </section>
        </TabsContent>
        <TabsContent value="contacts">
          <section className="dist-detail-panel">
            <ContactCard detail={detail} />
            {detail.contacts_allowed && (
              <p>Internal note: {r.notes || "Not recorded"}</p>
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
