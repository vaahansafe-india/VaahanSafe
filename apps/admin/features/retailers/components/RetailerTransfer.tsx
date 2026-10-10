"use client";
import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@vaahansafe/ui/components/sonner";
import { AdminDialog } from "../../../components/AdminDialog";
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
import { mutateNetwork } from "../../network/mutation";
import type { RetailerRow } from "../retailer.types";
export function RetailerTransfer({
  retailer: r,
  onClose,
  onChanged,
}: {
  retailer: RetailerRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [search, setSearch] = useState(""),
    [term, setTerm] = useState(""),
    [batch, setBatch] = useState<{
      id: string;
      reference_code: string;
      available: number;
    } | null>(null),
    [open, setOpen] = useState(false),
    [quantity, setQuantity] = useState(""),
    [reason, setReason] = useState(""),
    [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    id = useId();
  useEffect(() => {
    const t = setTimeout(() => setTerm(search.trim().slice(0, 100)), 300);
    return () => clearTimeout(t);
  }, [search]);
  const query = useQuery({
    queryKey: ["retailers", "stock-options", r.id, term],
    queryFn: ({ signal }) =>
      getAdminData<{ id: string; reference_code: string; available: number }[]>(
        `/api/retailers/${r.id}/operations?q=${encodeURIComponent(term)}`,
        signal,
      ),
    staleTime: 0,
  });
  const n = Number(quantity),
    valid =
      !!batch &&
      Number.isInteger(n) &&
      n > 0 &&
      n <= Math.min(5000, batch.available) &&
      reason.trim().length >= 10 &&
      !!r.parent_distributor_id;
  const save = async () => {
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      await mutateNetwork(`/api/retailers/${r.id}/operations`, {
        action: "request-transfer",
        source: r.parent_distributor_id,
        batch: batch!.id,
        quantity: n,
        reason,
      });
      toast.success("Stock transfer requested", {
        description: `${n} identities reserved from ${r.distributor_name}.`,
      });
      onChanged();
      onClose();
    } catch (e) {
      setReview(false);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <AdminDialog
        title="Send stock to retailer"
        description="Reserve eligible printed inventory from the supplying distributor."
        className="dist-form-dialog"
        onClose={() => {
          if (!busy) onClose();
        }}
        footer={
          <div className="dist-actions">
            <button disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <button
              className="dist-primary"
              disabled={busy || !valid}
              onClick={() => setReview(true)}
            >
              Review transfer
            </button>
          </div>
        }
      >
        <div className="dist-form">
          <h3>From {r.distributor_name || "Supply network not configured"}</h3>
          <p>
            To {r.name} · {r.city}. Stock must be printed, unowned and currently
            held by this distributor.
          </p>
          <div className="dist-field retail-wide">
            <label id={`${id}-batch`}>Eligible batch *</label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  role="combobox"
                  aria-labelledby={`${id}-batch`}
                  aria-expanded={open}
                >
                  {batch
                    ? `${batch.reference_code} · ${batch.available} available`
                    : "Search eligible batches…"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="dist-combobox-popover retail-command">
                <Command shouldFilter={false}>
                  <CommandInput
                    aria-label="Search eligible batches"
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {query.isError
                        ? "Stock could not load. Close and try again."
                        : query.isFetching
                          ? "Loading stock…"
                          : "No eligible printed stock. Review distributor inventory."}
                    </CommandEmpty>
                    {query.data?.map((o) => (
                      <CommandItem
                        key={o.id}
                        value={o.id}
                        onSelect={() => {
                          setBatch(o);
                          setOpen(false);
                        }}
                      >
                        {o.reference_code} · {o.available} available
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="dist-field">
            <label htmlFor={`${id}-quantity`}>Quantity *</label>
            <input
              id={`${id}-quantity`}
              type="number"
              min={1}
              max={batch ? Math.min(5000, batch.available) : 5000}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          {batch && Number.isInteger(n) && n > 0 && (
            <p>
              Batch availability after reservation:{" "}
              {Math.max(0, batch.available - n)}
              <br />
              Incoming after dispatch: +{n}
            </p>
          )}
          <div className="dist-field retail-wide">
            <label htmlFor={`${id}-reason`}>Reason / reference *</label>
            <textarea
              id={`${id}-reason`}
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
        </div>
      </AdminDialog>
      <AlertDialog
        open={review}
        onOpenChange={(o) => {
          if (!busy) setReview(o);
        }}
      >
        <AlertDialogContent className="dist-alert">
          <AlertDialogTitle>Confirm stock transfer request?</AlertDialogTitle>
          <AlertDialogDescription>
            {n} QR identities from {r.distributor_name} to {r.name}, batch{" "}
            {batch?.reference_code}. The server rechecks stock and creates a
            reservation. Dispatch and acknowledged receipt are recorded
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
              {busy ? "Reserving…" : "Confirm transfer"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
