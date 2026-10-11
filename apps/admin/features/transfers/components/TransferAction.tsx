"use client";
import { useState, useId, useRef } from "react";
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
import { toast } from "@vaahansafe/ui/components/sonner";
import { EmailVerification } from "../../../components/EmailVerification";
import { AdminDatePicker } from "../../../components/AdminDatePicker";
import type { TransferRow } from "../transfer.types";
import { transferLabel } from "../transfer.types";
import {
  parseReceiptCodes,
  receiptField,
  pendingReceiptUnits,
  receiptSelectionError,
} from "../receipt-validation";
export async function sendTransfer(url: string, body: unknown) {
  let r: Response;
  try {
    r = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw Error("We couldn't reach the service. Please try again.");
  }
  let b;
  try {
    b = await r.json();
  } catch {
    throw Error("We couldn't complete this action. Please try again.");
  }
  if (!r.ok || !b.success)
    throw Object.assign(
      new Error(
        b.error?.message || "We couldn't save this action. Please try again.",
      ),
      { code: b.error?.code },
    );
  return b.data as { id: string };
}
export function TransferAction({
  row,
  action,
  onClose,
  onChanged,
  onResolveMissing,
}: {
  row: TransferRow;
  action: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onResolveMissing?: () => void;
}) {
  const [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [stepUp, setStepUp] = useState(false),
    [carrier, setCarrier] = useState(""),
    [tracking, setTracking] = useState(""),
    [arrival, setArrival] = useState(""),
    [received, setReceived] = useState(""),
    [damaged, setDamaged] = useState(""),
    [missing, setMissing] = useState(""),
    [lost, setLost] = useState(""),
    [finalReceipt, setFinalReceipt] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    id = useId(),
    request = useRef<{ fingerprint: string; id: string } | null>(null);
  const destructive = ["cancel", "reject"].includes(action),
    title =
      action === "receive"
        ? "Record physical receipt"
        : action === "resolve"
          ? "Resolve missing identities"
          : `${transferLabel(action)} transfer`;
  const descriptions: Record<string, string> = {
    approve: `Approve ${row.quantity} reserved QR units for this route. Stock and partner eligibility are checked again.`,
    dispatch: `Dispatch ${row.quantity} reserved QR units. Destination custody is acknowledged only when receipt is recorded.`,
    receive:
      "Enter the printed VaahanSafe IDs starting with VS-, one per line. Record received, damaged and missing stickers separately. Put condition notes in Operational reason.",
    resolve:
      "Record recovered QR codes as found, or confirm that specific missing identities are lost. Lost identities become unavailable for activation.",
    reconcile:
      "Confirm the reconciled quantity ledger. Every unit must be accounted for. Damaged and lost identities remain unavailable; no new usable stock is created.",
    close:
      "Close this reconciled transfer and retain its custody and audit trail.",
    cancel:
      "Release reserved inventory and cancel this request. No dispatched stock can be cancelled.",
    reject:
      "Reject this request and release its reserved inventory. Record the operational reason.",
  };
  const values =
    action === "dispatch"
      ? {
          carrier,
          tracking,
          expectedArrival: arrival ? `${arrival}T18:00:00+05:30` : null,
        }
      : action === "receive"
        ? {
            received: parseReceiptCodes(received),
            damaged: parseReceiptCodes(damaged),
            missing: parseReceiptCodes(missing),
            finalReceipt,
          }
        : action === "resolve"
          ? {
              found: parseReceiptCodes(received),
              lost: parseReceiptCodes(lost),
            }
          : {};
  const receivedInput = receiptField(received),
    damagedInput = receiptField(damaged),
    missingInput = receiptField(missing),
    lostInput = receiptField(lost);
  const pending = pendingReceiptUnits(row);
  const groups =
    action === "receive"
      ? [receivedInput.codes, damagedInput.codes, missingInput.codes]
      : [receivedInput.codes, lostInput.codes];
  const receiptError = ["receive", "resolve"].includes(action)
    ? receiptSelectionError(
        groups,
        action === "receive" ? pending : row.missing_quantity,
        action === "receive" && finalReceipt,
      )
    : "";
  const implicitMissing = Math.max(0, pending - groups.flat().length);
  const save = async () => {
    if (busy || !confirmed || reason.trim().length < 10 || receiptError) return;
    setBusy(true);
    setError("");
    const base = { action, revision: row.revision, values, reason },
      fingerprint = JSON.stringify(base);
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, id: crypto.randomUUID() };
    try {
      await sendTransfer(`/api/transfers/${row.id}`, {
        ...base,
        requestId: request.current.id,
      });
      await onChanged();
      toast.success(
        action === "receive"
          ? "Receipt recorded."
          : action === "resolve"
            ? "Identity resolution recorded."
            : `${transferLabel(action)} recorded.`,
      );
      onClose();
    } catch (e) {
      if ((e as { code?: string }).code === "STEP_UP_REQUIRED") setStepUp(true);
      else setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const content = (
    <>
      <div className="tr-action-reference">
        <strong>{row.reference_code}</strong>
        <span>
          {row.source_name} → {row.destination_name}
        </span>
      </div>
      {stepUp ? (
        <EmailVerification stepUp onVerified={() => setStepUp(false)} />
      ) : (
        <>
          {action === "dispatch" && (
            <div className="tr-form-grid">
              <div className="tr-field">
                <label htmlFor={`${id}-carrier`}>Carrier (optional)</label>
                <input
                  id={`${id}-carrier`}
                  maxLength={100}
                  placeholder="e.g. Blue Dart, Delhivery"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                />
              </div>
              <div className="tr-field">
                <label htmlFor={`${id}-tracking`}>
                  Waybill / handover reference (optional)
                </label>
                <input
                  id={`${id}-tracking`}
                  maxLength={150}
                  placeholder="Tracking or consignment ID"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                />
              </div>
              <div className="tr-field tr-field-full">
                <label id={`${id}-arrival-label`} htmlFor={`${id}-arrival`}>
                  Expected arrival (optional, 6pm IST)
                </label>
                <AdminDatePicker
                  id={`${id}-arrival`}
                  value={arrival}
                  onChange={setArrival}
                  label="Expected arrival"
                />
              </div>
            </div>
          )}
          {["receive", "resolve"].includes(action) && (
            <div className="tr-receipt-fields">
              {action === "receive" && pending === 0 && (
                <div className="tr-attention" role="status">
                  <strong>No pending stickers to receive</strong>
                  <p>
                    The shipment is already accounted for. Record a recovered
                    missing sticker through Resolve missing identities.
                  </p>
                  {row.missing_quantity > 0 && onResolveMissing && (
                    <button
                      type="button"
                      className="tr-primary"
                      onClick={onResolveMissing}
                    >
                      Resolve missing identities
                    </button>
                  )}
                </div>
              )}
              <p className="tr-muted">
                Copy the VaahanSafe ID printed on each sticker or listed under
                View QR identities. A condition note is not a QR ID.
                {action === "resolve" && " Enter a recovered sticker under Found only. Use Lost only for a different sticker confirmed lost; leave that field empty when all stickers were recovered."}
              </p>
              <label>
                {action === "resolve"
                  ? "Found and received QR codes"
                  : "QR IDs received in good condition"}
                <textarea
                  placeholder="Paste printed IDs starting with VS-, one per line"
                  value={received}
                  aria-invalid={!!receivedInput.error}
                  aria-describedby={`${id}-received-help`}
                  maxLength={150000}
                  onChange={(e) => {
                    setReceived(e.target.value);
                    setConfirmed(false);
                  }}
                />
                <small id={`${id}-received-help`}>
                  {receivedInput.error ||
                    `${receivedInput.validCount} QR IDs entered`}
                </small>
              </label>
              {action === "receive" ? (
                <>
                  <label>
                    Damaged QR codes
                    <textarea
                      value={damaged}
                      placeholder="Printed VS- IDs of damaged stickers"
                      aria-invalid={!!damagedInput.error}
                      aria-describedby={`${id}-damaged-help`}
                      maxLength={150000}
                      onChange={(e) => {
                        setDamaged(e.target.value);
                        setConfirmed(false);
                      }}
                    />
                    <small id={`${id}-damaged-help`}>
                      {damagedInput.error ||
                        `${damagedInput.validCount} QR IDs · excluded from usable stock`}
                    </small>
                  </label>
                  <label>
                    Missing QR codes
                    <textarea
                      value={missing}
                      placeholder="Printed VS- IDs not received"
                      aria-invalid={!!missingInput.error}
                      aria-describedby={`${id}-missing-help`}
                      maxLength={150000}
                      onChange={(e) => {
                        setMissing(e.target.value);
                        setConfirmed(false);
                      }}
                    />
                    <small id={`${id}-missing-help`}>
                      {missingInput.error ||
                        `${missingInput.validCount} QR IDs entered`}
                    </small>
                  </label>
                  <label className="tr-check">
                    <input
                      type="checkbox"
                      checked={finalReceipt}
                      disabled={pending === 0}
                      onChange={(e) => {
                        setFinalReceipt(e.target.checked);
                        setConfirmed(false);
                      }}
                    />
                    Close this delivery and mark every unlisted pending QR ID
                    missing.
                  </label>
                  {finalReceipt && !receiptError && implicitMissing > 0 && (
                    <p className="tr-attention" role="alert">
                      <strong>
                        {implicitMissing} additional sticker
                        {implicitMissing === 1 ? "" : "s"} will be recorded
                        missing.
                      </strong>{" "}
                      These stickers will remain unavailable for retailer stock
                      and activation until recovered. Leave this unchecked if
                      you are still expecting delivery.
                    </p>
                  )}
                </>
              ) : (
                <label>
                  Confirmed lost QR codes (optional)
                  <textarea
                    value={lost}
                    placeholder="Printed VS- IDs confirmed lost"
                    aria-invalid={!!lostInput.error}
                    aria-describedby={`${id}-lost-help`}
                    maxLength={150000}
                    onChange={(e) => {
                      setLost(e.target.value);
                      setConfirmed(false);
                    }}
                  />
                  <small id={`${id}-lost-help`}>
                    {lostInput.error ||
                      `${lostInput.validCount} QR IDs entered. Leave empty for recovered stickers.`}
                  </small>
                </label>
              )}
              <p>
                Already accounted: {row.received_quantity} received ·{" "}
                {row.damaged_quantity} damaged · {row.missing_quantity} missing.
                Requested: {row.quantity}.
              </p>
              {receiptError && (
                <p className="tr-error" role="alert">
                  {receiptError}
                </p>
              )}
            </div>
          )}
          <div className="tr-field tr-field-full">
            <label htmlFor={`${id}-reason`}>
              Operational reason / reference *
            </label>
            <textarea
              id={`${id}-reason`}
              value={reason}
              maxLength={500}
              minLength={10}
              placeholder="Provide operational context for this transfer (min. 10 chars)"
              onChange={(e) => setReason(e.target.value)}
            />
            <small>
              10–500 characters. Saved in the protected operational trail.
            </small>
          </div>
          <label className="tr-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            {action === "receive" &&
            finalReceipt &&
            !receiptError &&
            implicitMissing > 0
              ? `I confirm the receipt and that ${implicitMissing} unlisted sticker${implicitMissing === 1 ? "" : "s"} should be recorded missing.`
              : "I checked the route, physical quantities and consequences."}
          </label>
          {error && (
            <p role="alert" className="tr-error">
              {error}
            </p>
          )}
          <div className="tr-actions">
            {destructive ? (
              <AlertDialogCancel disabled={busy} onClick={onClose}>
                Go back
              </AlertDialogCancel>
            ) : (
              <button type="button" disabled={busy} onClick={onClose}>
                Go back
              </button>
            )}
            <button
              className={destructive ? "tr-danger" : "tr-primary"}
              disabled={
                busy ||
                !confirmed ||
                reason.trim().length < 10 ||
                !!receiptError
              }
              onClick={() => void save()}
            >
              {busy
                ? "Saving…"
                : `Confirm ${transferLabel(action).toLowerCase()}`}
            </button>
          </div>
        </>
      )}
    </>
  );
  return destructive ? (
    <AlertDialog
      open
      onOpenChange={(o) => {
        if (!o && !busy) onClose();
      }}
    >
      <AlertDialogContent className="tr-dialog admin-radix-dialog">
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{descriptions[action]}</AlertDialogDescription>
        {content}
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !busy) onClose();
      }}
    >
      <DialogContent
        className="tr-dialog admin-radix-dialog"
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{descriptions[action]}</DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  );
}
