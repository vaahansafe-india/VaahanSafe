// Printed separators are presentation only; hashing still verifies the full secret.
export const MAX_ACTIVATION_PROOF_INPUT_LENGTH = 128;
export function normalizeActivationProofInput(value: string): string {
  return value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[\s\-\u2010-\u2015\u2212]/g, "");
}
export function isActivationProofInput(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_ACTIVATION_PROOF_INPUT_LENGTH &&
    /^[A-Z0-9]{6,64}$/.test(normalizeActivationProofInput(value))
  );
}
