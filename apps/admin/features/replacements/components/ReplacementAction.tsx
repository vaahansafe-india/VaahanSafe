"use client";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@vaahansafe/ui/components/alert-dialog";
import { AdminSelect } from "../../../components/AdminSelect";
import { EmailVerification } from "../../../components/EmailVerification";
import { getAdminData } from "../../../lib/client-api";
import type { AdminIdentity } from "../../../lib/contracts";
import { mutateNetwork } from "../../network/mutation";
import {
  replacementLabel,
  type ReplacementDetail,
  type ReplacementOptions,
} from "../replacement.types";
import { replacementKeys } from "./ReplacementShared";
const descriptions: Record<string, string> = {
  review: "Start the review and record your findings.",
  approve:
    "Approve eligibility after reviewing the owner and risk signals. A paid replacement order is still required.",
  reject:
    "Reject this request with an actionable reason. The current QR remains unchanged.",
  allocate:
    "Reserve one verified printed QR from central online inventory against an unused paid replacement order. This does not activate it.",
  retire:
    "Permanently retire the original QR. Its public safety view and digital access stop now. The new QR stays inactive until delivery and owner possession verification. Vehicle details and historical records are preserved.",
  pack: "Confirm the allocated physical kit has been packed. Carrier shipment and delivery remain authoritative.",
  sync_shipment:
    "Synchronize this request with its existing dispatched carrier shipment.",
  close:
    "Close the completed handover after verified delivery and owner activation.",
  cancel:
    "Cancel this request before original retirement. Reserved hardware is released; the existing QR stays active. Payment refunds remain a separate financial workflow.",
};
export function ReplacementAction({
  detail,
  identity,
  action,
  onClose,
  onChanged,
}: {
  detail: ReplacementDetail;
  identity: AdminIdentity;
  action: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const r = detail.record,
    [reason, setReason] = useState(""),
    [order, setOrder] = useState(""),
    [batch, setBatch] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [risk, setRisk] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [stepUp, setStepUp] = useState(false),
    request = useRef<{ key: string; id: string } | null>(null);
  const options = useQuery({
    queryKey: [...replacementKeys(identity), "options", r.id],
    queryFn: ({ signal }) =>
      getAdminData<ReplacementOptions>(
        `/api/replacements/${r.id}/options`,
        signal,
      ),
    enabled: action === "allocate",
    staleTime: 0,
  });
  const title =
      action === "retire"
        ? "Retire original QR permanently"
        : `${replacementLabel(action)} replacement`,
    danger = ["retire", "cancel", "reject"].includes(action);
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const values =
        action === "allocate"
          ? { order, batch }
          : action === "approve"
            ? { riskAcknowledged: risk }
            : {};
      const key = JSON.stringify({
        action,
        revision: r.revision,
        reason: reason.trim(),
        values,
      });
      if (request.current?.key !== key)
        request.current = { key, id: crypto.randomUUID() };
      await mutateNetwork(`/api/replacements/${r.id}`, {
        action,
        revision: r.revision,
        reason: reason.trim(),
        values,
        confirmed: true,
        requestId: request.current.id,
      });
      await onChanged();
      onClose();
    } catch (e) {
      if ((e as { code?: string }).code === "STEP_UP_REQUIRED") setStepUp(true);
      else
        setError(
          e instanceof Error
            ? e.message
            : "This action could not be completed.",
        );
    } finally {
      setBusy(false);
    }
  };
  const ready =
    confirmed &&
    reason.trim().length >= 10 &&
    reason.trim().length <= 500 &&
    (action !== "approve" || risk) &&
    (action !== "allocate" || (!!order && !!options.data?.batches.length));
  const body = (
    <div className="rp-command">
      {stepUp ? (
        <EmailVerification
          stepUp
          onVerified={() => {
            setStepUp(false);
            setError("Email verified. Review and confirm the action again.");
          }}
        />
      ) : (
        <>
          <div className="rp-command-summary">
            <strong>{r.reference_code}</strong>
            <p>
              {r.old_visible_code} →{" "}
              {r.new_visible_code || "Awaiting allocation"}
            </p>
          </div>
          {action === "allocate" && (
            <>
              {options.isPending ? (
                <p>Loading verified orders and eligible inventory…</p>
              ) : options.isError ? (
                <p role="alert">
                  We couldn’t load allocation options.{" "}
                  <button onClick={() => void options.refetch()}>
                    Try again
                  </button>
                </p>
              ) : (
                <>
                  <label className="rp-field">
                    <span>Verified paid replacement order</span>
                    <AdminSelect
                      label="Verified paid replacement order"
                      value={order}
                      onValueChange={setOrder}
                      options={options.data.orders.map((o) => ({
                        value: o.id,
                        label: `${o.order_number} · ${new Intl.NumberFormat("en-IN", { style: "currency", currency: o.currency }).format(o.total_minor / 100)}`,
                      }))}
                      placeholder="Choose a paid replacement order"
                    />
                  </label>
                  {!options.data.orders.length && (
                    <p className="rp-notice">
                      The owner must purchase the replacement kit through
                      customer checkout. No unused paid replacement order is
                      available.
                    </p>
                  )}
                  <label className="rp-field">
                    <span>Eligible printed batch</span>
                    <AdminSelect
                      label="Eligible printed batch"
                      value={batch}
                      onValueChange={setBatch}
                      options={[
                        {
                          value: "",
                          label: "Automatically select oldest eligible stock",
                        },
                        ...options.data.batches.map((b) => ({
                          value: b.id,
                          label: `${b.reference_code} · ${b.available} available`,
                        })),
                      ]}
                    />
                  </label>
                  {!options.data.batches.length && (
                    <p className="rp-notice">
                      No eligible central online stock. Complete printing and
                      release verified stock in QR Inventory.
                    </p>
                  )}
                </>
              )}
            </>
          )}
          {action === "approve" && (
            <label className="rp-checkbox">
              <input
                type="checkbox"
                checked={risk}
                onChange={(e) => setRisk(e.target.checked)}
              />
              <span>
                I reviewed the owner, entitlement and risk signals:{" "}
                {r.risk_signals.map(replacementLabel).join(", ") ||
                  "no elevated signals"}
                .
              </span>
            </label>
          )}
          <label className="rp-field">
            <span>Operational reason / reference</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={10}
              maxLength={500}
              rows={4}
              placeholder="Explain the evidence and reason for this operation."
            />
          </label>
          <small className="rp-muted">
            10–500 characters. Saved in the protected operational and security
            trail.
          </small>
          <label className="rp-checkbox">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              {action === "retire"
                ? `I understand ${r.old_visible_code} will stop serving safety information immediately and cannot be restored by this workflow.`
                : "I checked the request, verified records and consequences."}
            </span>
          </label>
          {error && (
            <p className="rp-notice" role="alert">
              {error}
            </p>
          )}
          <div className="rp-actions">
            <button className="rp-button" onClick={onClose} disabled={busy}>
              Go back
            </button>
            <button
              className={`rp-button ${danger ? "rp-danger" : "rp-primary"}`}
              disabled={busy || !ready}
              onClick={() => void submit()}
            >
              {busy
                ? "Saving…"
                : `Confirm ${replacementLabel(action).toLowerCase()}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
  return danger ? (
    <AlertDialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <AlertDialogContent className="rp-dialog">
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{descriptions[action]}</AlertDialogDescription>
        {body}
        {stepUp && <AlertDialogCancel>Go back</AlertDialogCancel>}
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="rp-dialog">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{descriptions[action]}</DialogDescription>
        {body}
      </DialogContent>
    </Dialog>
  );
}
