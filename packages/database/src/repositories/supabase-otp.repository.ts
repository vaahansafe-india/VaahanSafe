import { getSupabaseAdminClient } from "./supabase-auth.repository";

/** Server-only, typed RPCs. Never sends arbitrary SQL or challenges to the browser. */
export class SupabaseOtpRequestStore {
  private async rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await getSupabaseAdminClient().rpc(name, args);
    if (error) {
      console.error("[OTP STORE] Operation unavailable", { operation: name, code: /^[A-Z0-9]{5}$/.test(error.code || "") ? error.code : "DATABASE_ERROR" });
      throw new Error("OTP request storage unavailable");
    }
    return data;
  }
  async reserve(input: { id: string; tokenHash: string; phoneHash: string; ipHash: string; surface: "CUSTOMER" | "ACTIVATE" | "API" | "ADMIN"; channel: "SMS" | "WHATSAPP" }) {
    return (await this.rpc("auth_otp_reserve", { p_id: input.id, p_token_hash: input.tokenHash, p_phone_hash: input.phoneHash, p_ip_hash: input.ipHash, p_surface: input.surface, p_channel: input.channel })) === true;
  }
  async finishDispatch(id: string, success: boolean, requestId?: string) {
    return (await this.rpc("auth_otp_finish_dispatch", { p_id: id, p_success: success, p_request_id: success ? requestId || null : null })) === true;
  }
  async claimVerification(input: { tokenHash: string; phoneHash: string; surface: "CUSTOMER" | "ACTIVATE" | "API" | "ADMIN" }) {
    const rows = await this.rpc("auth_otp_claim_verification", { p_token_hash: input.tokenHash, p_phone_hash: input.phoneHash, p_surface: input.surface });
    if (!Array.isArray(rows) || rows.length !== 1) return null;
    const row = rows[0];
    if (typeof row.id !== "string" || (row.channel !== "SMS" && row.channel !== "WHATSAPP") || (row.provider_request_id !== null && typeof row.provider_request_id !== "string")) throw new Error("OTP challenge unavailable");
    return row as { id: string; channel: "SMS" | "WHATSAPP"; provider_request_id: string | null };
  }
  async finishVerification(id: string, success: boolean) {
    return (await this.rpc("auth_otp_finish_verification", { p_id: id, p_success: success })) === true;
  }
}
