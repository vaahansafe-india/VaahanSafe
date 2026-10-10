// Neutralize spreadsheet formulas even when they are preceded by whitespace.
// RFC 4180 quoting alone does not prevent formula execution in spreadsheet apps.
export function csvCell(value: string | number | null | undefined) {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value !== "number" && /^[\s\u0000-\u001f]*[=+@-]/.test(text))
    text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function storageCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
) {
  return (
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") +
    "\r\n"
  );
}
