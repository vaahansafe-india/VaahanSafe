"use client";
import { useEffect, useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@vaahansafe/ui/components/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@vaahansafe/ui/components/command";
import { getAdminData } from "../../../lib/client-api";
import { mutateDistributor } from "./DistributorForm";
import type { DistributorDetail } from "../distributor.types";
function OperationConfirm({
  id,
  label,
  description,
  body,
  onChanged,
}: {
  id: string;
  label: string;
  description: string;
  body: Record<string, unknown>;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await mutateDistributor(`/api/distributors/${id}/operations`, {
        ...body,
        reason,
      });
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
          <label>
            Operational reason
            <textarea
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          {error && (
            <p className="dist-error" role="alert">
              {error}
            </p>
          )}
          <div className="dist-actions">
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
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
export function TransferActions({
  id,
  transfer,
  onChanged,
}: {
  id: string;
  transfer: DistributorDetail["transfers"][number];
  onChanged: () => void;
}) {
  return (
    <div className="dist-actions">
      {transfer.status === "REQUESTED" ? (
        <>
          <OperationConfirm
            id={id}
            label="Record dispatch"
            description="Confirm the reserved identities have physically left central inventory. This records in-transit custody."
            body={{
              action: "transfer-status",
              transfer: transfer.id,
              from: "REQUESTED",
              to: "IN_TRANSIT",
            }}
            onChanged={onChanged}
          />
          <OperationConfirm
            id={id}
            label="Cancel request"
            description="Cancel this undispatched request and release its inventory reservation."
            body={{
              action: "transfer-status",
              transfer: transfer.id,
              from: "REQUESTED",
              to: "CANCELLED",
            }}
            onChanged={onChanged}
          />
        </>
      ) : (
        <OperationConfirm
          id={id}
          label="Acknowledge receipt"
          description="Confirm all reserved identities were received by the distributor. This updates recorded custody and preserves lifecycle history."
          body={{
            action: "transfer-status",
            transfer: transfer.id,
            from: "IN_TRANSIT",
            to: "RECEIVED",
          }}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}
export function ReconciliationForm({
  id,
  expected,
  manage,
  onChanged,
}: {
  id: string;
  expected: number;
  manage: boolean;
  onChanged: () => void;
}) {
  const [counted, setCounted] = useState("");
  if (!manage) return null;
  return (
    <div className="dist-inline-form">
      <div className="dist-field">
        <label htmlFor="dist-counted">
          Physical count (expected {expected})
        </label>
        <input
          type="number"
          id="dist-counted"
          min={0}
          max={10000000}
          value={counted}
          onChange={(e) => setCounted(e.target.value)}
        />
      </div>
      {counted !== "" &&
        Number.isInteger(Number(counted)) &&
        Number(counted) >= 0 && (
          <OperationConfirm
            id={id}
            label="Record stock count"
            description={`Expected ${expected}; counted ${Number(counted)}. Variance is recorded for review; this does not adjust QR custody.`}
            body={{ action: "reconcile", expected, counted: Number(counted) }}
            onChanged={() => {
              setCounted("");
              onChanged();
            }}
          />
        )}
    </div>
  );
}
export function ReconciliationAction({
  id,
  record,
  onChanged,
}: {
  id: string;
  record: DistributorDetail["reconciliations"][number];
  onChanged: () => void;
}) {
  return (
    <OperationConfirm
      id={id}
      label={
        record.status === "OPEN" ? "Mark reviewed" : "Close reconciliation"
      }
      description={
        record.status === "OPEN"
          ? "Record your review of the discrepancy. Custody quantities will remain unchanged."
          : "Document the resolution and close this reconciliation. Custody quantities are not changed by this action."
      }
      body={{
        action: "review-reconciliation",
        record: record.id,
        updatedAt: record.updated_at,
        to: record.status === "OPEN" ? "REVIEWED" : "CLOSED",
      }}
      onChanged={onChanged}
    />
  );
}
export function RetailerManager({
  id,
  manage,
  onChanged,
}: {
  id: string;
  manage: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [q, setQ] = useState(""),
    [retailer, setRetailer] = useState<{ id: string; name: string } | null>(
      null,
    );
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const query = useQuery({
    queryKey: ["distributors", "retailer-options", q],
    queryFn: ({ signal }) =>
      getAdminData<{ id: string; name: string; reference_code: string }[]>(
        `/api/distributors/${id}/operations?kind=retailers&q=${encodeURIComponent(q)}`,
        signal,
      ),
    enabled: manage && open && q.length >= 2,
  });
  if (!manage) return null;
  return (
    <div className="dist-inline-form">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button role="combobox" aria-expanded={open}>
            {retailer?.name || "+ Link an existing retailer"}
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search unassigned retailer…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {q.length < 2
                  ? "Enter at least two characters."
                  : query.isError
                    ? "Could not load retailers."
                    : query.isFetching
                      ? "Searching…"
                      : "No unassigned retailers match."}
              </CommandEmpty>
              {query.data?.map((r) => (
                <CommandItem
                  key={r.id}
                  onSelect={() => {
                    setRetailer(r);
                    setOpen(false);
                  }}
                >
                  {r.name} · {r.reference_code}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {retailer && (
        <OperationConfirm
          id={id}
          label="Link retailer"
          description={`${retailer.name} will be associated with this distributor. This does not move inventory.`}
          body={{ action: "link-retailer", retailer: retailer.id }}
          onChanged={() => {
            setRetailer(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
