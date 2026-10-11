export const normalizeReceiptCode = (code: string) =>
  code
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .replace(/[\u2010-\u2015\u2212]/g, "-");
export const isReceiptCode = (code: string) =>
  /^VS-[A-Z0-9-]{4,90}$/.test(code);
export const parseReceiptCodes = (text: string) =>
  text
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(normalizeReceiptCode);
export function receiptField(text: string) {
  const codes = parseReceiptCodes(text),
    validCount = codes.filter(isReceiptCode).length;
  const error = codes.some((c) => !isReceiptCode(c))
    ? "Enter printed VaahanSafe IDs starting with VS-. Put notes in Operational reason."
    : new Set(codes).size !== codes.length
      ? "Each QR ID can appear only once."
      : "";
  return { codes, validCount, error };
}
export function pendingReceiptUnits(row: {
  quantity: number;
  received_quantity: number;
  damaged_quantity: number;
  missing_quantity: number;
}) {
  return Math.max(
    0,
    row.quantity -
      row.received_quantity -
      row.damaged_quantity -
      row.missing_quantity,
  );
}
export function receiptSelectionError(
  groups: string[][],
  available: number,
  allowEmpty = false,
) {
  const codes = groups.flat();
  if (codes.some((c) => !isReceiptCode(c)))
    return "Enter the printed QR IDs, not a description of their condition.";
  if (new Set(codes).size !== codes.length)
    return "A QR ID can appear in only one receipt category.";
  if (available === 0)
    return "There are no pending units to receive. Use Resolve missing identities to record recovered stickers.";
  if (codes.length > available)
    return `This action can account for at most ${available} QR ID${available === 1 ? "" : "s"}.`;
  if (!codes.length && !allowEmpty) return "Enter at least one printed QR ID.";
  return "";
}
