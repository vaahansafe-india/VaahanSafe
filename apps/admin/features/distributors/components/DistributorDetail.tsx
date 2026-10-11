"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui/components/alert-dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@vaahansafe/ui/components/tabs";
import { toast } from "@vaahansafe/ui/components/sonner";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { getAdminData } from "../../../lib/client-api";
import type { AdminIdentity } from "../../../lib/contracts";
import type { DistributorDetail as Detail } from "../distributor.types";
import {
  canManageDistributors,
  canReadDistributorContacts,
} from "../distributor.permissions";
import {
  DistributorForm,
  mutateDistributor,
  TerritoryLabel,
} from "./DistributorForm";
import { DistributorStatus } from "./DistributorWorkspace";
import { TransferDialog } from "./DistributorTransfer";
import {
  useDistributorHistory,
  DistributorHistoryMore,
} from "./DistributorHistory";
export function DistributorSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading distributors"
      className="dist-skeleton"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} />
      ))}
    </div>
  );
}
export function DistributorPreview({
  id,
  onClose,
  identity,
}: {
  id: string | null;
  onClose: () => void;
  identity: AdminIdentity;
}) {
  const query = useQuery({
    queryKey: ["distributors", "detail", id],
    queryFn: ({ signal }) =>
      getAdminData<Detail>(`/api/distributors/${id}`, signal),
    enabled: !!id,
    staleTime: 20000,
  });
  return (
    <Sheet
      open={!!id}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="dist-sheet dist-preview">
        <SheetTitle>
          {query.data?.distributor.name || "Distributor preview"}
        </SheetTitle>
        <SheetDescription>
          Regional operation and recorded inventory custody.
        </SheetDescription>
        {query.isPending ? (
          <DistributorSkeleton />
        ) : query.isError ? (
          <div role="alert" className="dist-error">
            <p>Could not load this distributor.</p>
            <button onClick={() => void query.refetch()}>Retry</button>
          </div>
        ) : (
          query.data && (
            <>
              <small>{query.data.distributor.reference_code}</small>
              <DistributorStatus row={query.data.distributor} />
              <p>
                {query.data.distributor.city}
                <br />
                {query.data.distributor.district_name} ·{" "}
                {query.data.distributor.state_name}
              </p>
              <DetailMetrics detail={query.data} />
              <h3>Service territory</h3>
              {query.data.territories.length ? (
                query.data.territories.map((t) => (
                  <TerritoryLabel key={t.district_code} area={t} />
                ))
              ) : (
                <p>Territory setup required.</p>
              )}
              {canReadDistributorContacts(identity.role) && (
                <>
                  <h3>Primary contact</h3>
                  <p>
                    {query.data.distributor.contact_name || "Not recorded"}
                    <br />
                    {query.data.distributor.contact_phone}
                    <br />
                    {query.data.distributor.contact_email}
                  </p>
                </>
              )}
              <h3>Recent activity</h3>
              <Activity detail={query.data} compact />
              <Link
                className="dist-primary dist-link-button"
                href={`/distributors/${id}`}
              >
                Open distributor
              </Link>
            </>
          )
        )}
      </SheetContent>
    </Sheet>
  );
}
const SECTIONS = [
  "overview",
  "inventory",
  "transfers",
  "retailers",
  "territory",
  "reconciliation",
  "contacts",
  "activity",
  "audit",
];
const TAB_ICONS: Record<string, VaahanIconName> = {
  overview: "home",
  inventory: "package",
  transfers: "route",
  retailers: "layers",
  territory: "map-pin",
  reconciliation: "shield-check",
  contacts: "user",
  activity: "activity",
  audit: "history",
};
export function DistributorDetailWorkspace({
  identity,
  initial,
  id,
}: {
  identity: AdminIdentity;
  initial: Detail | null;
  id: string;
}) {
  const client = useQueryClient(),
    params = useSearchParams(),
    tab =
      SECTIONS.includes(params.get("tab") || "") &&
      (params.get("tab") !== "contacts" ||
        canReadDistributorContacts(identity.role))
        ? params.get("tab")!
        : "overview";
  const query = useQuery({
    queryKey: ["distributors", "detail", id],
    queryFn: ({ signal }) =>
      getAdminData<Detail>(`/api/distributors/${id}`, signal),
    initialData: initial || undefined,
    staleTime: 20000,
  });
  const [editing, setEditing] = useState(false),
    [statusAction, setStatusAction] = useState<{
      status?: string;
      verification?: string;
      label: string;
    } | null>(null),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [transfer, setTransfer] = useState(false);
  const transfers = useDistributorHistory(id, "transfers", tab, query.data);
  const retailers = useDistributorHistory(id, "retailers", tab, query.data);
  const reconciliations = useDistributorHistory(
    id,
    "reconciliations",
    tab,
    query.data,
  );
  const activity = useDistributorHistory(id, "activity", tab, query.data);
  const refresh = () =>
    void client.invalidateQueries({ queryKey: ["distributors"] });
  const changeStatus = async () => {
    if (!query.data || !statusAction) return;
    setBusy(true);
    setError("");
    try {
      await mutateDistributor(
        `/api/distributors/${id}`,
        {
          action: "status",
          updatedAt: query.data.distributor.updated_at,
          reason,
          ...statusAction,
        },
        "PATCH",
      );
      toast.success(statusAction.label);
      setStatusAction(null);
      setReason("");
      refresh();
    } catch (e) {
      setError((e as Error).message);
      toast.error("Could not update distributor", {
        description: (e as Error).message,
      });
    } finally {
      setBusy(false);
    }
  };
  if (query.isPending) return <DistributorSkeleton />;
  if (!query.data)
    return (
      <section className="dist-workspace dist-error" role="alert">
        <Link href="/distributors" className="dist-back-link">
          <VaahanIcon name="arrow-left" size={14} />
          <span>Distributors</span>
        </Link>
        <h1>Could not load this distributor.</h1>
        <button onClick={() => void query.refetch()}>Retry</button>
      </section>
    );
  const detail = {
      ...query.data,
      transfers: transfers.rows,
      retailers: retailers.rows,
      reconciliations: reconciliations.rows,
      activity: activity.rows,
    },
    p = detail.distributor,
    manage = canManageDistributors(identity.role);
  return (
    <section className="dist-workspace">
      <Link href="/distributors" className="dist-back-link">
        <VaahanIcon name="arrow-left" size={14} />
        <span>Distributors</span>
      </Link>
      <header className="dist-header">
        <div>
          <p className="dist-eyebrow">Regional distribution</p>
          <h1>{p.name}</h1>
          <p>
            {p.reference_code} · {p.city} ·{" "}
            {p.state_name || "Location setup required"}
          </p>
          <DistributorStatus row={p} />
        </div>
        <div className="dist-actions">
          <button
            type="button"
            className="dist-btn"
            onClick={refresh}
            disabled={query.isFetching}
            title="Refresh distributor details"
          >
            <VaahanIcon
              name="refresh"
              size={13}
              className={query.isFetching ? "animate-spin" : ""}
            />
            <span>Refresh</span>
          </button>
          {manage && (
            <>
              <button
                type="button"
                className="dist-btn"
                onClick={() => setEditing(true)}
                title="Edit distributor details"
              >
                <VaahanIcon name="edit" size={13} />
                <span>Edit distributor</span>
              </button>
              <button
                type="button"
                className="dist-btn dist-primary"
                disabled={p.status !== "ACTIVE"}
                onClick={() => setTransfer(true)}
                title="Transfer stock to distributor"
              >
                <VaahanIcon name="plus" size={13} />
                <span>Transfer stock</span>
              </button>
            </>
          )}
        </div>
      </header>
      {p.status === "SUSPENDED" && (
        <p className="dist-attention">
          New stock transfers are restricted while this distributor is
          suspended. Existing custody and history are retained.
        </p>
      )}
      {query.isError && (
        <p role="status" className="dist-error">
          Could not refresh. Showing the last loaded record.
        </p>
      )}
      <DetailMetrics detail={detail} />
      <Tabs
        value={tab}
        onValueChange={(value) =>
          window.history.pushState(null, "", `/distributors/${id}?tab=${value}`)
        }
      >
        <TabsList className="dist-tabs">
          {SECTIONS.filter(
            (s) =>
              s !== "contacts" || canReadDistributorContacts(identity.role),
          ).map((s) => {
            const count =
              s === "transfers"
                ? detail.transfers.length
                : s === "retailers"
                  ? p.retailer_count
                  : s === "territory"
                    ? detail.territories.length
                    : s === "reconciliation" && p.reconciliation_issues > 0
                      ? p.reconciliation_issues
                      : null;
            return (
              <TabsTrigger key={s} value={s}>
                <VaahanIcon
                  name={TAB_ICONS[s] || "circle"}
                  size={13}
                  className="opacity-70"
                />
                <span>{s[0]!.toUpperCase() + s.slice(1)}</span>
                {count !== null && count !== undefined && (
                  <span
                    className={`dist-tab-pill${s === "reconciliation" && p.reconciliation_issues > 0 ? " alert" : ""}`}
                  >
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <TabsContent value="overview">
          <div className="dist-detail-grid">
            <section className="dist-card-section">
              <div className="dist-card-header">
                <h2>Physical location</h2>
              </div>
              <div className="dist-card-body">
                <p className="dist-address-text">
                  <strong>{p.address_line_1 || "Address setup required"}</strong>
                  {p.address_line_2 && (
                    <>
                      <br />
                      {p.address_line_2}
                    </>
                  )}
                  <br />
                  {p.city}, {p.district_name}
                  <br />
                  {p.state_name} {p.postal_code}
                </p>
                {p.landmark && (
                  <p className="dist-landmark-text">
                    Nearby landmark: {p.landmark}
                  </p>
                )}
                <div className="dist-meta-row">
                  <span>Legal entity</span>
                  <strong>{p.legal_name || "Not recorded"}</strong>
                </div>
              </div>
            </section>
            <section className="dist-card-section">
              <div className="dist-card-header">
                <h2>Service territory</h2>
              </div>
              <div className="dist-card-body">
                <div className="dist-territory-chips">
                  {detail.territories.map((t) => (
                    <TerritoryLabel key={t.district_code} area={t} />
                  ))}
                  {!detail.territories.length && (
                    <p className="dist-panel-desc">Service territory setup required.</p>
                  )}
                </div>
                <div className="dist-meta-row">
                  <span>Open transfers</span>
                  <strong>{p.open_transfers}</strong>
                </div>
                <div className="dist-meta-row">
                  <span>Associated retailers</span>
                  <strong>{p.retailer_count}</strong>
                </div>
              </div>
            </section>
            <section className="dist-card-section">
              <div className="dist-card-header">
                <h2>Operational review</h2>
              </div>
              <div className="dist-card-body">
                <div className="dist-meta-row">
                  <span>Verification status</span>
                  <strong>{p.verification_status.replaceAll("_", " ").toLowerCase()}</strong>
                </div>
                <p className="dist-panel-desc">
                  {p.reconciliation_issues
                    ? `${p.reconciliation_issues} reconciliations require review.`
                    : "No recorded open stock discrepancy."}
                </p>
                {manage && (
                  <div className="dist-actions dist-card-actions">
                    <button
                      onClick={() =>
                        setStatusAction({
                          status: p.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                          label:
                            p.status === "ACTIVE"
                              ? "Distributor suspended"
                              : "Distributor reactivated",
                        })
                      }
                    >
                      {p.status === "ACTIVE"
                        ? "Suspend distributor"
                        : "Reactivate distributor"}
                    </button>
                    {p.verification_status !== "VERIFIED" ? (
                      <button
                        className="dist-primary"
                        onClick={() =>
                          setStatusAction({
                            verification: "VERIFIED",
                            label: "Distributor verified",
                          })
                        }
                      >
                        Verify distributor
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setStatusAction({
                            verification: "REQUIRES_CORRECTION",
                            label: "Verification requires correction",
                          })
                        }
                      >
                        Revoke verification
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </TabsContent>
        <TabsContent value="inventory">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <h2>Recorded custody</h2>
                <p className="dist-panel-desc">
                  Counts reflect current physical custody records. QR activation and service entitlement remain separate.
                </p>
              </div>
              {manage && p.status === "ACTIVE" && (
                <div className="dist-panel-actions">
                  <button className="dist-primary" onClick={() => setTransfer(true)}>
                    <VaahanIcon name="plus" size={13} />
                    <span>Transfer stock</span>
                  </button>
                </div>
              )}
            </div>
            <div className="dist-inventory-stats">
              <div className="dist-stat-card">
                <span className="dist-stat-label">On hand</span>
                <strong className="dist-stat-value">{p.on_hand.toLocaleString("en-IN")}</strong>
                <small className="dist-stat-hint">Physical stock in node</small>
              </div>
              <div className="dist-stat-card">
                <span className="dist-stat-label">Variance units</span>
                <strong className="dist-stat-value">{p.unresolved_variance.toLocaleString("en-IN")}</strong>
                <small className="dist-stat-hint">Unresolved variance</small>
              </div>
              <div className="dist-stat-card">
                <span className="dist-stat-label">In transit</span>
                <strong className="dist-stat-value">{p.in_transit.toLocaleString("en-IN")}</strong>
                <small className="dist-stat-hint">Incoming movements</small>
              </div>
              <div className="dist-stat-card">
                <span className="dist-stat-label">Open transfers</span>
                <strong className="dist-stat-value">{p.open_transfers.toLocaleString("en-IN")}</strong>
                <small className="dist-stat-hint">Pending movements</small>
              </div>
            </div>
            {detail.inventory.length ? (
              <dl className="dist-summary">
                {detail.inventory.map((v) => (
                  <div key={v.status}>
                    <dt>{v.status.replaceAll("_", " ").toLowerCase()}</dt>
                    <dd>{v.quantity.toLocaleString("en-IN")}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="dist-empty-state">
                <div className="dist-empty-icon">
                  <VaahanIcon name="package" size={24} />
                </div>
                <h3>No QR inventory recorded</h3>
                <p>
                  No physical QR sticker stock is currently recorded in this distributor’s custody.
                </p>
                {manage && p.status === "ACTIVE" && (
                  <button className="dist-primary" onClick={() => setTransfer(true)}>
                    <VaahanIcon name="plus" size={13} />
                    <span>Transfer stock into custody</span>
                  </button>
                )}
              </div>
            )}
          </section>
        </TabsContent>
        <TabsContent value="transfers">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <h2>Stock movements</h2>
                <p className="dist-panel-desc">
                  Request, dispatch, and acknowledge receipt through the verified custody workflow.
                </p>
              </div>
              {manage && p.status === "ACTIVE" && (
                <div className="dist-panel-actions">
                  <button className="dist-primary" onClick={() => setTransfer(true)}>
                    <VaahanIcon name="plus" size={13} />
                    <span>Request stock transfer</span>
                  </button>
                </div>
              )}
            </div>
            {detail.transfers.length ? (
              <div className="dist-transfers-list">
                {detail.transfers.map((t) => (
                  <article className="dist-transfer-card" key={t.id}>
                    <div>
                      <div className="dist-transfer-top">
                        <span className="dist-code-pill">{t.reference_code}</span>
                        <span
                          className={`dist-transfer-badge ${
                            t.status === "IN_TRANSIT"
                              ? "in-transit"
                              : t.status === "RECEIVED"
                                ? "received"
                                : "requested"
                          }`}
                        >
                          {t.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <div className="dist-transfer-route">
                        <span>{t.source_name || "VaahanSafe central inventory"}</span>
                        <VaahanIcon name="arrow-right" size={13} className="opacity-60" />
                        <span>{t.destination_name}</span>
                      </div>
                      <div className="dist-transfer-meta">
                        <span><strong>{t.quantity.toLocaleString("en-IN")}</strong> identities</span>
                        <span>·</span>
                        <span>{new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                    {manage &&
                      t.destination_partner_id === id &&
                      ["REQUESTED", "IN_TRANSIT"].includes(t.status) && (
                        <div className="dist-transfer-actions">
                          <TransferActions
                            id={id}
                            transfer={t}
                            onChanged={refresh}
                          />
                        </div>
                      )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="dist-empty-state">
                <div className="dist-empty-icon">
                  <VaahanIcon name="route" size={24} />
                </div>
                <h3>No recorded stock movements</h3>
                <p>
                  QR stock dispatched from central inventory or transferred between nodes
                  will appear here with lot references, custody timeline, and receipt acknowledgement.
                </p>
                {manage && p.status === "ACTIVE" && (
                  <button className="dist-primary" onClick={() => setTransfer(true)}>
                    <VaahanIcon name="plus" size={13} />
                    <span>Request stock transfer</span>
                  </button>
                )}
              </div>
            )}
            <DistributorHistoryMore query={transfers} />
          </section>
        </TabsContent>
        <TabsContent value="retailers">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <h2>Retailer network</h2>
                <p className="dist-panel-desc">
                  Associated local fulfilment outlets supplied by this distributor.
                </p>
              </div>
              <div className="dist-panel-actions">
                <RetailerManager id={id} manage={manage} onChanged={refresh} />
              </div>
            </div>
            {detail.retailers.length ? (
              <div className="dist-retailers-grid">
                {detail.retailers.map((r) => (
                  <article key={r.id} className="dist-history-card">
                    <div>
                      <strong>{r.name}</strong>
                      <p>
                        {r.reference_code} · {r.city} · {r.status}
                      </p>
                    </div>
                    <span className="dist-stat-chip">{r.stock} in custody</span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dist-empty-state">
                <div className="dist-empty-icon">
                  <VaahanIcon name="layers" size={24} />
                </div>
                <h3>No retailers associated yet</h3>
                <p>
                  Link local retailer partners to this distributor to enable verified dispatch and offline retail activations.
                </p>
              </div>
            )}
            <DistributorHistoryMore query={retailers} />
          </section>
        </TabsContent>
        <TabsContent value="territory">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <h2>Service territory</h2>
                <p className="dist-panel-desc">
                  Coverage is separate from physical address. District coverage is non-exclusive.
                </p>
              </div>
              {manage && (
                <div className="dist-panel-actions">
                  <button onClick={() => setEditing(true)}>
                    Manage territories
                  </button>
                </div>
              )}
            </div>
            {detail.territories.length ? (
              <div className="dist-territory-chips">
                {detail.territories.map((t) => (
                  <TerritoryLabel key={t.district_code} area={t} />
                ))}
              </div>
            ) : (
              <div className="dist-empty-state">
                <div className="dist-empty-icon">
                  <VaahanIcon name="map-pin" size={24} />
                </div>
                <h3>No service territory configured</h3>
                <p>Assign states and districts to authorize fulfilment operations.</p>
                {manage && (
                  <button onClick={() => setEditing(true)}>Assign territory</button>
                )}
              </div>
            )}
          </section>
        </TabsContent>
        <TabsContent value="reconciliation">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <h2>Stock reconciliation</h2>
                <p className="dist-panel-desc">
                  Compare physical counts against system recorded custody. Review does not overwrite custody without verified reason.
                </p>
              </div>
            </div>
            <ReconciliationForm
              id={id}
              expected={p.on_hand}
              manage={manage}
              onChanged={refresh}
            />
            {detail.reconciliations.length ? (
              <div className="dist-reconciliations-list">
                {detail.reconciliations.map((r) => (
                  <article key={r.id} className="dist-history-card">
                    <div>
                      <div className="dist-transfer-top">
                        <span className={`dist-transfer-badge ${r.status === "CLOSED" ? "received" : "requested"}`}>
                          {r.status}
                        </span>
                        <small>{new Date(r.updated_at).toLocaleDateString("en-IN")}</small>
                      </div>
                      <p className="dist-reconcile-counts">
                        Expected <strong>{r.expected_quantity}</strong> · Counted{" "}
                        <strong>{r.counted_quantity}</strong> · Variance{" "}
                        <strong className={r.variance !== 0 ? "text-amber-700" : ""}>
                          {r.variance > 0 ? `+${r.variance}` : r.variance}
                        </strong>
                      </p>
                    </div>
                    {manage && r.status !== "CLOSED" && (
                      <ReconciliationAction
                        id={id}
                        record={r}
                        onChanged={refresh}
                      />
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="dist-empty-state">
                <div className="dist-empty-icon">
                  <VaahanIcon name="shield-check" size={24} />
                </div>
                <h3>No stock counts recorded</h3>
                <p>Periodic physical counts help verify custody integrity and flag variances.</p>
              </div>
            )}
            <DistributorHistoryMore query={reconciliations} />
          </section>
        </TabsContent>
        {canReadDistributorContacts(identity.role) && (
          <TabsContent value="contacts">
            <section className="dist-detail-panel">
              <div className="dist-panel-head">
                <div>
                  <h2>Primary contact</h2>
                  <p className="dist-panel-desc">Direct business liaison and operational point of contact.</p>
                </div>
                {manage && (
                  <div className="dist-panel-actions">
                    <button onClick={() => setEditing(true)}>
                      <VaahanIcon name="edit" size={13} />
                      <span>Update contact</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="dist-contact-card">
                <div className="dist-contact-info">
                  <strong>{p.contact_name || "Contact setup required"}</strong>
                  <span className="dist-contact-role">{p.contact_role || "Operations Liaison"}</span>
                  <div className="dist-contact-links">
                    {p.contact_phone && (
                      <a href={`tel:${p.contact_phone}`} className="dist-contact-link">
                        <VaahanIcon name="phone" size={13} />
                        <span>{p.contact_phone}</span>
                      </a>
                    )}
                    {p.contact_email && (
                      <a href={`mailto:${p.contact_email}`} className="dist-contact-link">
                        <VaahanIcon name="mail" size={13} />
                        <span>{p.contact_email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="dist-notes-box">
                <h3>Internal notes</h3>
                <p>{p.notes || "No internal administrative notes recorded."}</p>
              </div>
            </section>
          </TabsContent>
        )}
        <TabsContent value="activity">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <h2>Recent activity</h2>
                <p className="dist-panel-desc">Operational timeline and custody updates.</p>
              </div>
            </div>
            <Activity detail={detail} />
            <DistributorHistoryMore query={activity} />
          </section>
        </TabsContent>
        <TabsContent value="audit">
          <section className="dist-detail-panel">
            <div className="dist-panel-head">
              <div>
                <h2>Audit history</h2>
                <p className="dist-panel-desc">
                  Material changes retain the administrator, reason and timestamp.
                  Private contact fields are excluded from audit payloads.
                </p>
              </div>
            </div>
            <Activity detail={detail} />
            <DistributorHistoryMore query={activity} />
          </section>
        </TabsContent>
      </Tabs>
      {editing && (
        <DistributorForm
          detail={detail}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            refresh();
          }}
        />
      )}
      {transfer && (
        <TransferDialog
          distributor={p}
          onClose={() => setTransfer(false)}
          onSaved={() => {
            setTransfer(false);
            refresh();
          }}
        />
      )}
      <AlertDialog
        open={!!statusAction}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setStatusAction(null);
            setError("");
            setReason("");
          }
        }}
      >
        <AlertDialogContent className="dist-alert">
          <AlertDialogTitle>{statusAction?.label}</AlertDialogTitle>
          <AlertDialogDescription>
            This changes the distributor’s operational access. Inventory and
            audit history are retained. Provide the reason for this decision.
          </AlertDialogDescription>
          <label htmlFor="dist-status-reason">Operational reason</label>
          <textarea
            id="dist-status-reason"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
          />
          {error && (
            <p role="alert" className="dist-error">
              {error}
            </p>
          )}
          <div className="dist-actions">
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || reason.trim().length < 10}
              onClick={(e) => {
                e.preventDefault();
                void changeStatus();
              }}
            >
              {busy ? "Saving…" : "Confirm change"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
function DetailMetrics({ detail }: { detail: Detail }) {
  const p = detail.distributor;
  return (
    <dl className="dist-summary">
      {[
        ["On hand", p.on_hand],
        ["In transit", p.in_transit],
        ["Retailers", p.retailer_count],
        ["Open variance units", p.unresolved_variance],
      ].map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{Number(value).toLocaleString("en-IN")}</dd>
        </div>
      ))}
    </dl>
  );
}
function Activity({
  detail,
  compact = false,
}: {
  detail: Detail;
  compact?: boolean;
}) {
  return detail.activity.length ? (
    <ul className="dist-activity-feed">
      {detail.activity.slice(0, compact ? 3 : 20).map((e) => (
        <li key={e.id} className="dist-activity-item">
          <div className="dist-activity-indicator" />
          <div className="dist-activity-content">
            <div className="dist-activity-header">
              <strong>
                {e.action.replaceAll("distributor.", "").replaceAll("_", " ")}
              </strong>
              <small>{new Date(e.created_at).toLocaleString("en-IN")}</small>
            </div>
            {e.reason && <p>{e.reason}</p>}
            {e.actor_name && <small className="dist-actor-badge">{e.actor_name}</small>}
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <div className="dist-empty-state">
      <div className="dist-empty-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 14 14"/>
        </svg>
      </div>
      <h3>No distributor activity recorded</h3>
      <p>Operational updates and verified status changes will be recorded here.</p>
    </div>
  );
}
import {
  TransferActions,
  ReconciliationForm,
  ReconciliationAction,
  RetailerManager,
} from "./DistributorOperations";
