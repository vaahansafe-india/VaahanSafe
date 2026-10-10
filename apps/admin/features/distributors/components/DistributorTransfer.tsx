"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@vaahansafe/ui/components/sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui/components/alert-dialog";
import { AdminDialog } from "../../../components/AdminDialog";
import { AdminSelect } from "../../../components/AdminSelect";
import { getAdminData } from "../../../lib/client-api";
import { mutateDistributor } from "./DistributorForm";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DistributorRow } from "../distributor.types";
export function TransferDialog({
  distributor,
  onClose,
  onSaved,
}: {
  distributor: DistributorRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [batch, setBatch] = useState(""),
    [quantity, setQuantity] = useState(""),
    [reason, setReason] = useState(""),
    [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const options = useQuery({
    queryKey: ["distributors", "transfer-options"],
    queryFn: ({ signal }) =>
      getAdminData<{ id: string; reference_code: string; available: number }[]>(
        `/api/distributors/${distributor.id}/operations`,
        signal,
      ),
    staleTime: 0,
  });
  const selected = options.data?.find((b) => b.id === batch),
    amount = Number(quantity),
    valid =
      !!selected &&
      Number.isInteger(amount) &&
      amount > 0 &&
      amount <= Math.min(5000, selected.available) &&
      reason.trim().length >= 10;
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await mutateDistributor(
        `/api/distributors/${distributor.id}/operations`,
        { action: "request-transfer", batch, quantity: amount, reason },
      );
      toast.success("Transfer requested", {
        description: `${amount.toLocaleString("en-IN")} identities reserved for dispatch review.`,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setReview(false);
      toast.error("Could not request transfer", {
        description: (e as Error).message,
      });
      void options.refetch();
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <AdminDialog
        title="Transfer stock"
        description="Reserve printed retail inventory from VaahanSafe central custody. Services remain disabled until owner activation."
        onClose={() => {
          if (!busy) onClose();
        }}
        footer={
          <div className="dist-dialog-footer">
            <button
              type="button"
              className="dist-btn dist-dialog-cancel"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dist-btn dist-primary dist-dialog-continue"
              disabled={!valid || busy || distributor.status !== "ACTIVE"}
              onClick={() => setReview(true)}
            >
              <span>Review transfer</span>
              <VaahanIcon name="chevron-right" size={13} />
            </button>
          </div>
        }
      >
        <div className="dist-form">
          <h3>{distributor.name}</h3>
          <p>
            Source: VaahanSafe central inventory
            <br />
            Destination: {distributor.reference_code} · {distributor.city}
          </p>
          {options.isError ? (
            <p role="alert" className="dist-error">
              Available stock could not load.{" "}
              <button onClick={() => void options.refetch()}>Retry</button>
            </p>
          ) : options.isPending ? (
            <p role="status">Loading available printed batches…</p>
          ) : !options.data?.length ? (
            <p>
              No printed retail inventory is currently available for transfer.
              Complete batch printing before requesting stock.
            </p>
          ) : (
            <div className="dist-field">
              <label>Printed batch</label>
              <AdminSelect
                label="Printed batch"
                value={batch}
                onValueChange={setBatch}
                options={[
                  { value: "", label: "Select batch" },
                  ...options.data.map((b) => ({
                    value: b.id,
                    label: `${b.reference_code} · ${b.available} available`,
                  })),
                ]}
              />
            </div>
          )}
          <div className="dist-field">
            <label htmlFor="dist-transfer-quantity">Quantity *</label>
            <input
              id="dist-transfer-quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={selected ? Math.min(5000, selected.available) : 5000}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="dist-field">
            <label htmlFor="dist-transfer-reason">Operational reason *</label>
            <input
              id="dist-transfer-reason"
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          {selected && valid && (
            <p>
              After reservation: {selected.available - amount} identities remain
              available in this batch. Incoming stock increases only after
              dispatch.
            </p>
          )}
          {error && (
            <p role="alert" className="dist-error">
              {error}
            </p>
          )}
        </div>
      </AdminDialog>
      <AlertDialog
        open={review}
        onOpenChange={(open) => {
          if (!busy) setReview(open);
        }}
      >
        <AlertDialogContent className="dist-alert">
          <AlertDialogTitle>Confirm stock transfer request</AlertDialogTitle>
          <AlertDialogDescription>
            {amount.toLocaleString("en-IN")} QR identities from{" "}
            {selected?.reference_code} will be reserved for {distributor.name}.
            This creates a custody request. Dispatch and receipt are recorded
            separately.
          </AlertDialogDescription>
          <div className="dist-actions">
            <AlertDialogCancel disabled={busy}>Go back</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || !valid}
              onClick={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              {busy ? "Reserving…" : "Confirm request"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
