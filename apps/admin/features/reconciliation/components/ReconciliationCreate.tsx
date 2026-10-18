"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@vaahansafe/ui/components/sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components/dialog";
import type { AdminIdentity } from "../../../lib/contracts";
import { EmailVerification } from "../../../components/EmailVerification";
import { getAdminData } from "../../../lib/client-api";
import { mutateNetwork } from "../../network/mutation";
import type {
  LedgerSnapshot,
  ReconciliationDetail,
  CustodianOption,
} from "../reconciliation.types";
import {
  CustodianPicker,
  reconciliationKeys,
  ReconciliationError,
  reconciliationDate,
  useReconciliationRefresh,
} from "./ReconciliationShared";
export function ReconciliationCreate({
  identity,
}: {
  identity: AdminIdentity;
}) {
  const [step, setStep] = useState(0),
    [partner, setPartner] = useState("central"),
    [chosen, setChosen] = useState<CustodianOption | null>(null),
    [selectedOnly, setSelectedOnly] = useState(false),
    [batches, setBatches] = useState<string[]>([]),
    [counted, setCounted] = useState(""),
    [reason, setReason] = useState(""),
    [confirm, setConfirm] = useState(false),
    [stepUp, setStepUp] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [created, setCreated] = useState<ReconciliationDetail | null>(null),
    createRequest = useRef<{ key: string; id: string } | null>(null),
    countRequest = useRef<{ key: string; id: string } | null>(null),
    refresh = useReconciliationRefresh(identity);
  const all = useQuery({
    queryKey: [
      ...reconciliationKeys.scope(identity),
      "snapshot-options",
      partner,
    ],
    queryFn: ({ signal }) =>
      getAdminData<LedgerSnapshot>(
        `/api/reconciliation/snapshot?partner=${encodeURIComponent(partner)}`,
        signal,
      ),
    enabled: step === 0 && selectedOnly,
    staleTime: 0,
    retry: 1,
  });
  const snapshot = useQuery({
    queryKey: [
      ...reconciliationKeys.scope(identity),
      "snapshot",
      partner,
      batches,
    ],
    queryFn: ({ signal }) =>
      getAdminData<LedgerSnapshot>(
        `/api/reconciliation/snapshot?partner=${encodeURIComponent(partner)}${(selectedOnly ? batches : []).map((b) => `&batch=${encodeURIComponent(b)}`).join("")}`,
        signal,
      ),
    enabled: step >= 1,
    staleTime: 0,
    retry: 1,
  });
  const ledger = snapshot.data,
    name = chosen?.name || "VaahanSafe central inventory";
  const save = async (draft: boolean) => {
    setBusy(true);
    setError("");
    try {
      let record = created;
      if (!record) {
        if (!ledger) throw Error("Load the snapshot before continuing.");
        const values = {
            partner,
            batches: selectedOnly ? batches : [],
            expected: ledger.expected,
          },
          key = JSON.stringify({ values, reason });
        if (createRequest.current?.key !== key)
          createRequest.current = { key, id: crypto.randomUUID() };
        const result = await mutateNetwork("/api/reconciliation", {
          action: "create",
          values,
          reason,
          requestId: createRequest.current.id,
        });
        record = await getAdminData<ReconciliationDetail>(
          `/api/reconciliation/${result.id}`,
        );
        setCreated(record);
      }
      const body = {
          action: draft ? "save" : "complete",
          revision: record.record.revision,
          values: { counted: Number(counted) },
          reason,
        },
        key = JSON.stringify(body);
      if (countRequest.current?.key !== key)
        countRequest.current = { key, id: crypto.randomUUID() };
      await mutateNetwork(`/api/reconciliation/${record.record.id}`, {
        ...body,
        requestId: countRequest.current.id,
      });
      toast.success(
        draft ? "Physical count draft saved." : "Physical count completed.",
      );
      await refresh();
      window.location.assign(`/reconciliation/${record.record.id}`);
    } catch (e) {
      if ((e as { code?: string }).code === "STEP_UP_REQUIRED") setStepUp(true);
      setError(e instanceof Error ? e.message : "Could not save this count.");
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };
  return (
    <div className="rc-workspace">
      <Link href="/reconciliation" className="rc-back">
        ← Stock Reconciliation
      </Link>
      <header className="rc-header">
        <div>
          <p className="rc-eyebrow">NEW PHYSICAL STOCK CHECK</p>
          <h1>New reconciliation</h1>
          <p>
            Preserve a real custody snapshot, then compare it with your physical
            count.
          </p>
        </div>
      </header>
      <ol className="rc-wizard-steps">
        {["Scope", "Ledger snapshot", "Physical count", "Review"].map(
          (s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined}>
              <span>{i + 1}</span>
              {s}
            </li>
          ),
        )}
      </ol>
      <section className="rc-wizard">
        <p className="rc-eyebrow">STEP {step + 1} OF 4</p>
        <h2>
          {
            [
              "What are you counting?",
              "Authoritative ledger snapshot",
              "Record the physical count",
              "Review reconciliation",
            ][step]
          }
        </h2>
        {step === 0 && (
          <>
            <label className="rc-field">
              Custodian
              <CustodianPicker
                identity={identity}
                value={partner}
                onChange={(id, item) => {
                  setPartner(id);
                  setChosen(item);
                  setBatches([]);
                }}
              />
            </label>
            <p>
              {chosen
                ? `${chosen.kind.toLowerCase()} · ${chosen.city}`
                : "Warehouse · location not recorded"}
            </p>
            {chosen?.status !== undefined && chosen.status !== "ACTIVE" && (
              <p className="rc-error">Choose an active custodian.</p>
            )}
            <label className="rc-confirm">
              <input
                type="radio"
                checked={!selectedOnly}
                onChange={() => {
                  setSelectedOnly(false);
                  setBatches([]);
                }}
              />
              All eligible physical stock
            </label>
            <label className="rc-confirm">
              <input
                type="radio"
                checked={selectedOnly}
                onChange={() => setSelectedOnly(true)}
              />
              Selected batches
            </label>
            {selectedOnly &&
              (all.isPending ? (
                <p>Loading real stock batches…</p>
              ) : all.isError ? (
                <ReconciliationError
                  message="Unable to load batches."
                  retry={all.refetch}
                />
              ) : (
                <div className="rc-batch-options">
                  {all.data?.batches.map((b) => (
                    <label key={b.id} className="rc-confirm">
                      <input
                        type="checkbox"
                        checked={batches.includes(b.id)}
                        disabled={
                          !batches.includes(b.id) && batches.length >= 20
                        }
                        onChange={() =>
                          setBatches((s) =>
                            s.includes(b.id)
                              ? s.filter((v) => v !== b.id)
                              : [...s, b.id],
                          )
                        }
                      />
                      {b.reference_code} · {b.expected} ledger units
                    </label>
                  ))}
                  {!all.data?.batches.length && (
                    <p>No eligible batches at this custodian.</p>
                  )}
                </div>
              ))}
          </>
        )}
        {step > 0 &&
          (snapshot.isPending ? (
            <p role="status">Reading authoritative stock…</p>
          ) : snapshot.isError ? (
            <ReconciliationError
              message="Unable to load the ledger snapshot."
              retry={snapshot.refetch}
            />
          ) : (
            ledger && (
              <>
                <div className="rc-snapshot">
                  <strong>{name}</strong>
                  <span>{reconciliationDate(ledger.snapshotAt)} IST</span>
                  <div>
                    <b>{ledger.expected.toLocaleString("en-IN")}</b> physical
                    ledger units · {ledger.batches.length} batches ·{" "}
                    {ledger.reserved} reserved
                  </div>
                </div>
                <p className="rc-muted">
                  Scope: unsold, unassigned physical stock at this custodian.
                  In-transit, sold and active vehicle QR identities are
                  excluded. Reserved identities cannot be adjusted.
                </p>
                {step === 1 && (
                  <div className="rc-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Batch</th>
                          <th>Ledger units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.batches.map((b) => (
                          <tr key={b.id}>
                            <td>{b.reference_code}</td>
                            <td>{b.expected}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {step >= 2 && (
                  <>
                    <label className="rc-field">
                      Observed physical quantity
                      <input
                        type="number"
                        min="0"
                        max="100000"
                        value={counted}
                        disabled={step === 3}
                        onChange={(e) => setCounted(e.target.value)}
                      />
                    </label>
                    <p className="rc-variance">
                      Difference{" "}
                      {counted === "" ? "—" : Number(counted) - ledger.expected}
                    </p>
                    <label className="rc-field">
                      Operational reason / count-sheet reference
                      <textarea
                        maxLength={500}
                        value={reason}
                        disabled={busy}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Where, when and how this count was performed"
                      />
                    </label>
                  </>
                )}
                {step === 3 && (
                  <aside className="rc-notice">
                    {Number(counted) === ledger.expected
                      ? "The count matches the snapshot. Review and approval are still required before closure."
                      : "Completing this count opens a variance investigation. Inventory will remain unchanged."}
                  </aside>
                )}
              </>
            )
          ))}
        {stepUp && (
          <EmailVerification
            stepUp
            onVerified={() => {
              setStepUp(false);
              setError("");
            }}
          />
        )}
        {error && (
          <div className="rc-error" role="alert">
            {error}
          </div>
        )}
        {created && (
          <p>
            A draft snapshot was created.{" "}
            <Link href={`/reconciliation/${created.record.id}`}>
              Continue {created.record.reference_code} →
            </Link>
          </p>
        )}
        <footer className="rc-actions">
          <button
            className="rc-button"
            disabled={step === 0 || busy || !!created}
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
          {step < 3 ? (
            <button
              className="rc-button rc-primary"
              disabled={
                busy ||
                (step === 0 &&
                  (chosen?.status === "SUSPENDED" ||
                    (selectedOnly && !batches.length))) ||
                (step > 0 && !ledger) ||
                (step === 2 &&
                  (counted === "" ||
                    !Number.isInteger(Number(counted)) ||
                    Number(counted) < 0 ||
                    Number(counted) > 100000 ||
                    reason.trim().length < 10))
              }
              onClick={() => setStep(step + 1)}
            >
              Continue
            </button>
          ) : (
            <>
              <button
                className="rc-button"
                disabled={busy || stepUp}
                onClick={() => void save(true)}
              >
                Save draft
              </button>
              <button
                className="rc-button rc-primary"
                disabled={busy || stepUp || reason.trim().length < 10}
                onClick={() => setConfirm(true)}
              >
                Complete count
              </button>
            </>
          )}
        </footer>
      </section>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="rc-dialog">
          <DialogTitle>Complete physical count?</DialogTitle>
          <DialogDescription>
            The saved snapshot and actual count become an auditable record. This
            does not adjust inventory.
          </DialogDescription>
          <p>
            Ledger {ledger?.expected} · Physical {counted} · Variance{" "}
            {Number(counted) - (ledger?.expected || 0)}
          </p>
          <div className="rc-actions">
            <button
              className="rc-button"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="rc-button rc-primary"
              disabled={busy}
              onClick={() => void save(false)}
            >
              {busy ? "Saving…" : "Confirm count"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
