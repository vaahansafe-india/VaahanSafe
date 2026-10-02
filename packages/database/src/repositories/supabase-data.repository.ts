/**
 * @vaahansafe/database
 * Authoritative Supabase Production Repository & Scalable Domain Logic
 */

import { getSupabaseClient, TypedSupabaseClient } from "../client/supabase";
import type { Database } from "../client/supabase-types";

export type PublicSafetyProfile = Database["public"]["Views"]["public_safety_view"]["Row"];
export type VehicleRecord = Database["public"]["Tables"]["vehicles"]["Row"];
export type QrStickerRecord = Database["public"]["Tables"]["qr_stickers"]["Row"];
export type SubscriptionRecord = Database["public"]["Tables"]["subscriptions"]["Row"];

export class SupabaseDataRepository {
  private client: TypedSupabaseClient;

  constructor(client?: TypedSupabaseClient) {
    this.client = client || getSupabaseClient();
  }

  /**
   * Authoritative public QR resolver enforcing entitlement boundaries.
   * Calls PostgreSQL stored function public.resolve_public_qr.
   */
  async resolvePublicQr(publicCode: string): Promise<{
    state: "ACTIVE" | "ACTIVATION_REQUIRED" | "UNAVAILABLE" | "UNRECOGNIZED";
    vehicle?: {
      registrationNumber: string;
      type: string;
      make: string;
      model: string;
      color?: string;
    };
  }> {
    const { data, error } = await this.client.rpc("resolve_public_qr", {
      p_public_code: publicCode,
    });

    if (error) {
      console.error(`[Supabase] Failed to resolve public QR ${publicCode}:`, error);
      return { state: "UNAVAILABLE" };
    }

    return data as {
      state: "ACTIVE" | "ACTIVATION_REQUIRED" | "UNAVAILABLE" | "UNRECOGNIZED";
      vehicle?: {
        registrationNumber: string;
        type: string;
        make: string;
        model: string;
        color?: string;
      };
    };
  }

  /**
   * High-speed public resolver query for emergency responders and passerby scans.
   * Leverages public_safety_view with zero PII exposure (no address, no email).
   */
  async getPublicSafetyProfile(publicCode: string): Promise<PublicSafetyProfile | null> {
    const { data, error } = await this.client
      .from("public_safety_view")
      .select("*")
      .eq("public_code", publicCode)
      .maybeSingle();

    if (error) {
      console.error(`[Supabase] Failed to resolve public QR profile ${publicCode}:`, error);
      throw new Error(`Failed to resolve QR safety profile.`);
    }

    return data;
  }

  /**
   * Atomic QR scan recorder with scanner IP hash and device telemetry.
   * Calls PostgreSQL stored procedure public.record_qr_scan.
   */
  async recordScanEvent(params: {
    publicCode: string;
    eventType: Database["public"]["Enums"]["scan_event_type"];
    scannerIpHash: string;
    userAgent: string;
    city?: string;
    state?: string;
    metadata?: Database["public"]["Tables"]["scan_events"]["Insert"]["metadata"];
  }): Promise<{ success: boolean; scanId?: string; vehicleId?: string; error?: string }> {
    const { data, error } = await this.client.rpc("record_qr_scan", {
      p_public_code: params.publicCode,
      p_event_type: params.eventType,
      p_scanner_ip_hash: params.scannerIpHash,
      p_user_agent: params.userAgent,
      p_city: params.city,
      p_state: params.state,
      p_metadata: params.metadata || {},
    });

    if (error) {
      console.error("[Supabase] Failed to record scan event:", error);
      throw new Error("Unable to record safety scan.");
    }

    return data as { success: boolean; scanId?: string; vehicleId?: string; error?: string };
  }

  /**
   * Cryptographically verified Retail QR claim & binding.
   * Enforces 5-attempt brute-force protection, locks record with FOR UPDATE in Postgres,
   * binds QR to authenticated owner and vehicle, and initializes subscription entitlements.
   */
  async claimRetailQr(params: {
    publicCode: string;
    secretHash: string;
    userId: string;
    vehicleId: string;
  }): Promise<{ success: boolean; qrId?: string; error?: string }> {
    const { data, error } = await this.client.rpc("claim_retail_qr", {
      p_public_code: params.publicCode,
      p_secret_hash: params.secretHash,
      p_user_id: params.userId,
      p_vehicle_id: params.vehicleId,
    });

    if (error) {
      console.error("[Supabase] Failed to claim retail QR:", error);
      throw new Error("Retail activation could not be completed.");
    }

    return data as { success: boolean; qrId?: string; error?: string };
  }

  /**
   * Checks subscription plan boundaries and specific capability entitlements.
   */
  async checkSubscriptionEntitlement(
    userId: string,
    capability: string
  ): Promise<{ hasEntitlement: boolean; tier: string }> {
    const { data, error } = await this.client
      .from("subscriptions")
      .select("tier, plan_entitlements(capability, is_enabled)")
      .eq("user_id", userId)
      .gt("current_period_end", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { hasEntitlement: false, tier: "TIER_FREE" };
    }

    const entitlements = data.plan_entitlements as Array<{ capability: string; is_enabled: boolean }> | null;
    const capabilityEnabled = entitlements?.some(
      (e) => e.capability === capability && e.is_enabled
    ) ?? false;

    return {
      hasEntitlement: capabilityEnabled,
      tier: data.tier,
    };
  }

  /**
   * Uptime Keep-Alive Ping.
   * Calls PostgreSQL public.ping_heartbeat stored procedure to keep Supabase pool warm
   * and record live operational telemetry.
   */
  async pingUptimeHeartbeat(latencyMs: number = 0, message?: string): Promise<{ success: boolean; heartbeatId?: string }> {
    const { data, error } = await this.client.rpc("ping_heartbeat", {
      p_service_name: "supabase_database",
      p_latency_ms: latencyMs,
      p_message: message || "Uptime keep-alive ping",
    });

    if (error) {
      console.error("[Supabase] Failed to ping heartbeat:", error);
      throw new Error("Heartbeat check failed.");
    }

    return data as { success: boolean; heartbeatId?: string };
  }
}
