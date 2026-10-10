"use client";
import { useId, useState } from "react";
import { toast } from "@vaahansafe/ui/components/sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui/components/alert-dialog";
import { mutateNetwork } from "../../network/mutation";
import type { RetailerDetail, RetailerHistoryRow } from "../retailer.types";
export function RetailerConfirm({
  id,
  label,
  description,
  body,
  onChanged,
  status = false,
}: {
  id: string;
  label: string;
  description: string;
  body: Record<string, unknown>;
  onChanged: () => void;
  status?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    fieldId = useId();
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await mutateNetwork(
        `/api/retailers/${id}${status ? "" : "/operations"}`,
        { ...body, reason },
        status ? "PATCH" : "POST",
      );
      toast.success(label);
      setOpen(false);
      setReason("");
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        {label}
      </button>
      <AlertDialog
        open={open}
        onOpenChange={(o) => {
          if (!busy) {
            setOpen(o);
            setError("");
          }
        }}
      >
        <AlertDialogContent className="dist-alert">
          <AlertDialogTitle>{label}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          <div className="dist-field">
            <label htmlFor={fieldId}>Reason / reference *</label>
            <textarea
              id={fieldId}
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="dist-error">
              {error}
            </p>
          )}
          <div className="dist-actions">
            <AlertDialogCancel disabled={busy}>Go back</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || reason.trim().length < 10}
              onClick={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              {busy ? "Saving…" : "Confirm"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
export function RetailerReconcile({
  detail,
  onChanged,
}: {
  detail: RetailerDetail;
  onChanged: () => void;
}) {
  const [counted, setCounted] = useState(""),
    id = useId(),
    r = detail.retailer;
  const n = Number(counted),
    valid = counted !== "" && Number.isInteger(n) && n >= 0 && n <= 10000000;
  return (
    <div className="dist-inline-form">
      <div className="dist-field">
        <label htmlFor={id}>Physical count</label>
        <input
          id={id}
          type="number"
          min={0}
          max={10000000}
          value={counted}
          onChange={(e) => setCounted(e.target.value)}
        />
      </div>
      {valid && (
        <>
          <p>
            Expected {r.on_hand} · counted {n} · variance {n - r.on_hand}
          </p>
          <RetailerConfirm
            id={r.id}
            label="Record physical count"
            description="Record a reconciliation discrepancy for review. This preserves the observed count and does not adjust inventory."
            body={{ action: "reconcile", expected: r.on_hand, counted: n }}
            onChanged={onChanged}
          />
        </>
      )}
    </div>
  );
}
export function RetailerHistoryActions({
  row,
  id,
  section,
  onChanged,
}: {
  row: RetailerHistoryRow;
  id: string;
  section: string;
  onChanged: () => void;
}) {
  return (
    <div className="dist-actions">
      {section === "transfers" && row.status === "REQUESTED" && (
        <>
          <RetailerConfirm
            id={id}
            label="Dispatch"
            description={`Dispatch ${row.quantity} identities from ${row.source_name || "the recorded distributor"}. Availability, verification and custody are rechecked on the server.`}
            body={{
              action: "transfer-status",
              transfer: row.id,
              from: row.status,
              to: "IN_TRANSIT",
            }}
            onChanged={onChanged}
          />
          <RetailerConfirm
            id={id}
            label="Cancel request"
            description="Release the reservation without moving stock."
            body={{
              action: "transfer-status",
              transfer: row.id,
              from: row.status,
              to: "CANCELLED",
            }}
            onChanged={onChanged}
          />
        </>
      )}
      {section === "transfers" && row.status === "IN_TRANSIT" && (
        <RetailerConfirm
          id={id}
          label="Acknowledge receipt"
          description={`Record physical receipt of ${row.quantity} identities. Retailer custody is recorded; owner activation and entitlements remain separate.`}
          body={{
            action: "transfer-status",
            transfer: row.id,
            from: row.status,
            to: "RECEIVED",
          }}
          onChanged={onChanged}
        />
      )}
      {section === "reconciliations" && row.status !== "CLOSED" && (
        <RetailerConfirm
          id={id}
          label={row.status === "OPEN" ? "Review discrepancy" : "Close review"}
          description="Preserve the counted quantity and record the review decision. No QR custody adjustment is performed."
          body={{
            action: "review-reconciliation",
            record: row.id,
            updatedAt: row.updated_at,
            to: row.status === "OPEN" ? "REVIEWED" : "CLOSED",
          }}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}
