import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { verifyScratchSecret } from "@vaahansafe/qr-core";
export interface CustomerReplacement {
  id: string;
  reference: string;
  vehicleId: string;
  vehicle: string;
  status: string;
  oldCode: string;
  newCode: string | null;
  payment: string | null;
  orderNumber: string | null;
  shipment: string | null;
  activatedAt: string | null;
  canActivate: boolean;
}
async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabaseAdminClient()
    .rpc(name, args)
    .abortSignal(AbortSignal.timeout(20000));
  if (error) {
    console.error("[replacement] operation failed", {
      operation: name,
      code: error.code,
    });
    throw Error(
      "We couldn't complete this replacement operation right now. Check its status and try again.",
    );
  }
  return data as T;
}
export const getCustomerReplacement = (session: string, id: string) =>
  rpc<CustomerReplacement>("customer_replacement_context", {
    p_session: session,
    p_id: id,
  });
export async function requestCustomerReplacement(
  session: string,
  qr: string,
  reason: string,
  notes: string,
) {
  return rpc<string>("customer_request_replacement", {
    p_session: session,
    p_qr: qr,
    p_reason: reason,
    p_notes: notes,
    p_request: crypto.randomUUID(),
  });
}
export async function activateCustomerReplacement(
  session: string,
  id: string,
  proof: string,
) {
  const candidate = proof.toUpperCase().replace(/[\s\-‐‑–—]/g, "");
  if (!/^[A-Z0-9]{6,32}$/.test(candidate))
    return {
      success: false,
      error:
        "Enter the complete private activation code printed on the replacement kit.",
    };
  const current = await getCustomerReplacement(session, id);
  if (current.activatedAt) return { success: true };
  if (!current.canActivate)
    return {
      success: false,
      error:
        "Activation becomes available after verified payment, original QR retirement and carrier delivery.",
    };
  // This RPC reserves a rate-limited attempt before server-side hash verification.
  // The hash is private and never returned in page props or action results.
  const secret = await rpc<{ hash: string; version: string } | null>(
    "customer_replacement_proof_attempt",
    { p_session: session, p_id: id },
  );
  if (
    !secret ||
    !(await verifyScratchSecret(candidate, secret.hash, secret.version))
  ) {
    if (secret)
      await rpc<void>("customer_replacement_proof_failed", {
        p_session: session,
        p_id: id,
      });
    return {
      success: false,
      error:
        "We couldn’t verify this activation code. Check the complete code and try again. Repeated attempts are temporarily restricted.",
    };
  }
  await rpc<string>("customer_activate_replacement", {
    p_session: session,
    p_id: id,
    p_verified_hash: secret.hash,
  });
  return { success: true };
}
