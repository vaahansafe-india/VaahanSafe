"use client";
import { memo } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@vaahansafe/ui/components/dropdown-menu";
import type { InventoryRow, InventorySelection } from "../inventory.types";
import { isSelected } from "../inventory.selection";
import { stateLabel } from "./InventoryFilters";
export const INVENTORY_COLUMNS = [
  "identity",
  "batch",
  "lifecycle",
  "print",
  "activation",
  "created",
] as const;
export type InventoryColumn = (typeof INVENTORY_COLUMNS)[number];
function RowActions({
  row,
  write,
  onInspect,
  onPrint,
  onBlock,
  onNotice,
}: {
  row: InventoryRow;
  write: boolean;
  onInspect: (id: string) => void;
  onPrint: (s: InventorySelection) => void;
  onBlock: (s: InventorySelection) => void;
  onNotice: (s: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inventory-row-menu"
          aria-label={`Actions for ${row.visibleCode}`}
        >
          •••
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onInspect(row.id)}>
          Inspect identity
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/inventory/${row.id}`}>Open full details</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onInspect(row.id)}>
          Preview sticker
        </DropdownMenuItem>
        {write && ["INVENTORY", "PRINTED"].includes(row.status) && (
          <DropdownMenuItem
            onSelect={() => onPrint({ mode: "ids", ids: [row.id] })}
          >
            Print / check reprint eligibility
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => {
            void navigator.clipboard
              .writeText(row.publicId)
              .then(() => onNotice("Public ID copied."))
              .catch(() =>
                onNotice(
                  "Copy is unavailable. Open details to select the public ID.",
                ),
              );
          }}
        >
          Copy public ID
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`/batches?q=${encodeURIComponent(row.batchReference || "")}`}
          >
            View batch
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/inventory/${row.id}#scans`}>View scan history</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/inventory/${row.id}#audit`}>View audit trail</Link>
        </DropdownMenuItem>
        {write && row.status !== "BLOCKED" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onBlock({ mode: "ids", ids: [row.id] })}
            >
              Review blocking this QR
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export const InventoryGrid = memo(function InventoryGrid({
  rows,
  selection,
  columns,
  compact,
  write,
  onToggle,
  onInspect,
  onPrint,
  onBlock,
  onNotice,
}: {
  rows: InventoryRow[];
  selection: InventorySelection;
  columns: InventoryColumn[];
  compact: boolean;
  write: boolean;
  onToggle: (id: string) => void;
  onInspect: (id: string) => void;
  onPrint: (s: InventorySelection) => void;
  onBlock: (s: InventorySelection) => void;
  onNotice: (s: string) => void;
}) {
  const show = (c: InventoryColumn) => columns.includes(c);
  const date = (at: string) =>
    new Date(at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  const check = (r: InventoryRow) => (
    <input
      type="checkbox"
      aria-label={`Select ${r.visibleCode}`}
      checked={isSelected(selection, r.id)}
      onChange={() => onToggle(r.id)}
    />
  );
  const actions = (r: InventoryRow) => (
    <RowActions
      row={r}
      write={write}
      onInspect={onInspect}
      onPrint={onPrint}
      onBlock={onBlock}
      onNotice={onNotice}
    />
  );
  return (
    <>
      <div className={`inventory-grid-wrap ${compact ? "compact" : ""}`}>
        <table className="inventory-grid">
          <caption className="sr-only">
            QR inventory identities and physical lifecycle
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Select</span>
              </th>
              <th scope="col">VaahanSafe ID</th>
              {show("identity") && <th scope="col">Public ID</th>}
              {show("batch") && <th scope="col">Batch</th>}
              <th scope="col">State</th>
              {show("lifecycle") && <th scope="col">Lifecycle</th>}
              {show("print") && <th scope="col">Print evidence</th>}
              {show("activation") && <th scope="col">Activation</th>}
              {show("created") && <th scope="col">Created · IST</th>}
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className={isSelected(selection, r.id) ? "selected" : ""}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest("a,button,input"))
                    onInspect(r.id);
                }}
              >
                <td>{check(r)}</td>
                <th scope="row">
                  <button
                    className="inventory-identity"
                    onClick={() => onInspect(r.id)}
                  >
                    {r.visibleCode}
                  </button>
                  {r.failedAttempts > 0 && (
                    <small className="inventory-risk">
                      {r.failedAttempts} failed attempts
                    </small>
                  )}
                </th>
                {show("identity") && (
                  <td className="inventory-mono">{r.publicId}</td>
                )}
                {show("batch") && (
                  <td>
                    <strong>{r.batchReference || "Unbatched"}</strong>
                    <small>
                      {r.channel === "OFFLINE_RETAIL"
                        ? "Offline retail"
                        : "Online system"}
                    </small>
                  </td>
                )}
                <td>
                  <span
                    className={`inventory-state state-${r.status.toLowerCase()}`}
                  >
                    {stateLabel(r.status)}
                  </span>
                </td>
                {show("lifecycle") && <td>{stateLabel(r.lifecycle)}</td>}
                {show("print") && (
                  <td>
                    <span
                      className="inventory-print-dot"
                      data-recorded={r.printState === "RECORDED"}
                    />
                    {r.printState === "RECORDED" ? "Recorded" : "Unrecorded"}
                  </td>
                )}
                {show("activation") && (
                  <td>{r.activatedAt ? "Activated" : "Not activated"}</td>
                )}
                {show("created") && (
                  <td>
                    {date(r.createdAt)}
                    <small>
                      {new Date(r.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Kolkata",
                      })}
                    </small>
                  </td>
                )}
                <td>{actions(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="inventory-mobile-grid">
        {rows.map((r) => (
          <article
            key={r.id}
            className={isSelected(selection, r.id) ? "selected" : ""}
          >
            <div className="inventory-mobile-heading">
              {check(r)}
              <button
                className="inventory-identity"
                onClick={() => onInspect(r.id)}
              >
                {r.visibleCode}
              </button>
              {actions(r)}
            </div>
            <div className="inventory-mobile-data">
              <span
                className={`inventory-state state-${r.status.toLowerCase()}`}
              >
                {stateLabel(r.status)}
              </span>
              <span>{r.batchReference || "Unbatched"}</span>
              <span>
                {r.printState === "RECORDED"
                  ? "Printing recorded"
                  : "No print evidence"}
              </span>
              <span>{r.activatedAt ? "Activated" : "Not activated"}</span>
              <span>{date(r.createdAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
});
