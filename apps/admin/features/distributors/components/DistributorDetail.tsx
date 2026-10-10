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
        <Link href="/distributors">← Distributors</Link>
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
      <Link href="/distributors">← Distributors</Link>
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
          <button onClick={refresh} disabled={query.isFetching}>
            Refresh
          </button>
          {manage && (
            <>
              <button onClick={() => setEditing(true)}>Edit distributor</button>
              <button
                className="dist-primary"
                disabled={p.status !== "ACTIVE"}
                onClick={() => setTransfer(true)}
              >
                Transfer stock
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
          ).map((s) => (
            <TabsTrigger key={s} value={s}>
              {s[0]!.toUpperCase() + s.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <div className="dist-detail-grid">
            <section>
              <h2>Physical location</h2>
              <p>
                {p.address_line_1 || "Address setup required"}
                <br />
                {p.address_line_2}
                <br />
                {p.city}, {p.district_name}
                <br />
                {p.state_name} {p.postal_code}
              </p>
              {p.landmark && <p>Nearby landmark: {p.landmark}</p>}
              <p>Legal name: {p.legal_name || "Not recorded"}</p>
            </section>
            <section>
              <h2>Service territory</h2>
              {detail.territories.map((t) => (
                <TerritoryLabel key={t.district_code} area={t} />
              ))}
              {!detail.territories.length && (
                <p>Service territory setup required.</p>
              )}
              <p>
                {p.open_transfers} open transfers · {p.retailer_count}{" "}
                associated retailers
              </p>
            </section>
            <section>
              <h2>Operational review</h2>
              <p>
                {p.reconciliation_issues
                  ? p.reconciliation_issues + " reconciliations require review."
                  : "No recorded open stock discrepancy."}
              </p>
              <p>
                Verification:{" "}
                {p.verification_status.replaceAll("_", " ").toLowerCase()}
              </p>
              {manage && (
                <div className="dist-actions">
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
            </section>
          </div>
        </TabsContent>
        <TabsContent value="inventory">
          <section className="dist-detail-panel">
            <h2>Recorded custody</h2>
            <p>
              Counts reflect current custody records. QR activation and service
              entitlement remain separate.
            </p>
            <dl className="dist-summary">
              {detail.inventory.map((v) => (
                <div key={v.status}>
                  <dt>{v.status.replaceAll("_", " ").toLowerCase()}</dt>
                  <dd>{v.quantity.toLocaleString("en-IN")}</dd>
                </div>
              ))}
            </dl>
            {!detail.inventory.length && (
              <p>
                No QR inventory is currently recorded in this distributor’s
                custody.
              </p>
            )}
            <p>
              {p.in_transit} identities incoming · {p.open_transfers} open
              transfers
            </p>
          </section>
        </TabsContent>
        <TabsContent value="transfers">
          <section className="dist-detail-panel">
            <h2>Stock movements</h2>
            <p>
              Request, dispatch, and acknowledge receipt through the verified
              custody workflow.
            </p>
            {detail.transfers.length ? (
              detail.transfers.map((t) => (
                <article className="dist-history-row" key={t.id}>
                  <div>
                    <strong>{t.reference_code}</strong>
                    <p>
                      {t.source_name || "VaahanSafe central inventory"} →{" "}
                      {t.destination_name}
                    </p>
                    <small>
                      {t.quantity} identities · {t.status} ·{" "}
                      {new Date(t.created_at).toLocaleDateString("en-IN")}
                    </small>
                  </div>
                  {manage &&
                    t.destination_partner_id === id &&
                    ["REQUESTED", "IN_TRANSIT"].includes(t.status) && (
                      <TransferActions
                        id={id}
                        transfer={t}
                        onChanged={refresh}
                      />
                    )}
                </article>
              ))
            ) : (
              <p>No recorded transfers.</p>
            )}
            <DistributorHistoryMore query={transfers} />
          </section>
        </TabsContent>
        <TabsContent value="retailers">
          <section className="dist-detail-panel">
            <h2>Retailer network</h2>
            <RetailerManager id={id} manage={manage} onChanged={refresh} />
            {detail.retailers.map((r) => (
              <article key={r.id} className="dist-history-row">
                <div>
                  <strong>{r.name}</strong>
                  <p>
                    {r.reference_code} · {r.city} · {r.status}
                  </p>
                </div>
                <span>{r.stock} in custody</span>
              </article>
            ))}
            {!detail.retailers.length && (
              <p>No retailers are associated with this distributor yet.</p>
            )}
            <DistributorHistoryMore query={retailers} />
          </section>
        </TabsContent>
        <TabsContent value="territory">
          <section className="dist-detail-panel">
            <h2>Service territory</h2>
            <p>
              Coverage is separate from the physical address. District coverage
              is non-exclusive.
            </p>
            {detail.territories.map((t) => (
              <TerritoryLabel key={t.district_code} area={t} />
            ))}
            {manage && (
              <button onClick={() => setEditing(true)}>
                Manage territories
              </button>
            )}
          </section>
        </TabsContent>
        <TabsContent value="reconciliation">
          <section className="dist-detail-panel">
            <h2>Stock reconciliation</h2>
            <ReconciliationForm
              id={id}
              expected={p.on_hand}
              manage={manage}
              onChanged={refresh}
            />
            {detail.reconciliations.map((r) => (
              <article key={r.id} className="dist-history-row">
                <div>
                  <strong>
                    {r.status} ·{" "}
                    {new Date(r.updated_at).toLocaleDateString("en-IN")}
                  </strong>
                  <p>
                    Expected {r.expected_quantity} · Counted{" "}
                    {r.counted_quantity} · Variance {r.variance}
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
            {!detail.reconciliations.length && (
              <p>No stock counts have been recorded.</p>
            )}
            <DistributorHistoryMore query={reconciliations} />
          </section>
        </TabsContent>
        {canReadDistributorContacts(identity.role) && (
          <TabsContent value="contacts">
            <section className="dist-detail-panel">
              <h2>Primary contact</h2>
              <p>
                {p.contact_name || "Contact setup required"}
                <br />
                {p.contact_role}
                <br />
                {p.contact_phone}
                <br />
                {p.contact_email}
              </p>
              {manage && (
                <button onClick={() => setEditing(true)}>Update contact</button>
              )}
              <h3>Internal notes</h3>
              <p>{p.notes || "None recorded."}</p>
            </section>
          </TabsContent>
        )}
        <TabsContent value="activity">
          <section className="dist-detail-panel">
            <h2>Recent activity</h2>
            <Activity detail={detail} />
            <DistributorHistoryMore query={activity} />
          </section>
        </TabsContent>
        <TabsContent value="audit">
          <section className="dist-detail-panel">
            <h2>Audit history</h2>
            <p>
              Material changes retain the administrator, reason and timestamp.
              Private contact fields are excluded from audit payloads.
            </p>
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
    <ol className="dist-activity">
      {detail.activity.slice(0, compact ? 3 : 20).map((e) => (
        <li key={e.id}>
          <strong>
            {e.action.replaceAll("distributor.", "").replaceAll("_", " ")}
          </strong>
          <small>
            {e.actor_name} · {new Date(e.created_at).toLocaleString("en-IN")}
          </small>
          {e.reason && <p>{e.reason}</p>}
        </li>
      ))}
    </ol>
  ) : (
    <p>No distributor activity recorded yet.</p>
  );
}
import {
  TransferActions,
  ReconciliationForm,
  ReconciliationAction,
  RetailerManager,
} from "./DistributorOperations";
