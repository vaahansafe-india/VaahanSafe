import { columnLabel, displayValue } from "../lib/presentation";
import type { AdminRow } from "../lib/contracts";
export function StatusTag({ value }: { value: unknown }) {
  const v = String(value || "Unknown");
  const warning =
      /PENDING|PROCESS|WAIT|INVESTIGAT|CREATED|DRAFT|TRANSIT|REQUEST/i.test(v),
    error = /FAIL|BLOCK|INVALID|LOCK|REJECT|SUSPEND|EXPIRED/i.test(v);
  return (
    <span className={`admin-tag ${error ? "error" : warning ? "warning" : ""}`}>
      {v.replaceAll("_", " ")}
    </span>
  );
}
export function RecordTable({
  rows,
  fields,
  onInspect,
  selected,
  onSelect,
}: {
  rows: AdminRow[];
  fields: string[];
  onInspect?: (row: AdminRow) => void;
  selected?: string[];
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {onSelect && <th>Select</th>}
            {fields.map((key) => (
              <th key={key}>{columnLabel(key)}</th>
            ))}
            {onInspect && (
              <th>
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id)}>
              {onSelect && (
                <td>
                  <input
                    type="checkbox"
                    checked={selected?.includes(String(row.id)) || false}
                    onChange={() => onSelect(String(row.id))}
                    aria-label={`Select ${row.visible_code || row.id}`}
                  />
                </td>
              )}
              {fields.map((key) => (
                <td
                  key={key}
                  title={displayValue(key, row[key], row)}
                  className={
                    key === "id" || key.endsWith("_id") ? "admin-mono" : ""
                  }
                >
                  {key === "status" ||
                  key === "payment_state" ||
                  key === "outcome" ||
                  key === "lifecycle_state" ? (
                    <StatusTag value={row[key]} />
                  ) : (
                    displayValue(key, row[key], row)
                  )}
                </td>
              ))}
              {onInspect && (
                <td>
                  <button className="admin-link" onClick={() => onInspect(row)}>
                    Inspect →
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
