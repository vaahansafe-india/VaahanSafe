import { getSupabaseAdminClient } from "../repositories/supabase-auth.repository";
import type {
  ClaimedNotification,
  NotificationOutboxStore,
  DeliveryOutcome,
  NotificationChannel,
  InAppRenderResult,
} from "@vaahansafe/notifications";

/** Each RPC is a bounded, service-role-only database operation. */
export class SupabaseNotificationOutbox implements NotificationOutboxStore {
  constructor(private client = getSupabaseAdminClient()) {}
  private async rpc<T>(
    name: string,
    args: Record<string, unknown>,
  ): Promise<T> {
    const { data, error } = await this.client.rpc(name, args);
    if (error) throw new Error("Notification persistence unavailable");
    return data as T;
  }
  claimBatch(limit: number) {
    return this.rpc<ClaimedNotification[]>("claim_notification_batch", {
      p_limit: limit,
    });
  }
  prepare(
    intent: ClaimedNotification,
    channel: NotificationChannel,
    content: InAppRenderResult,
  ) {
    return this.rpc<{ claimed: boolean; id?: string; attempt?: number }>(
      "prepare_notification_delivery",
      {
        p_intent: intent.id,
        p_lease: intent.lease_token,
        p_channel: channel,
        p_content: content,
      },
    );
  }
  finishDelivery(
    intent: ClaimedNotification,
    id: string,
    status: DeliveryOutcome,
    reference?: string,
    error?: string,
  ) {
    return this.rpc<void>("finish_notification_delivery", {
      p_intent: intent.id,
      p_lease: intent.lease_token,
      p_delivery: id,
      p_status: status,
      p_reference: reference || null,
      p_error: error || null,
    });
  }
  finishIntent(intent: ClaimedNotification, error?: string) {
    return this.rpc<void>("finish_notification_intent", {
      p_intent: intent.id,
      p_lease: intent.lease_token,
      p_error: error || null,
    });
  }
  recordReport(
    delivery: string,
    reference: string,
    status: string,
    occurredAt: string,
  ) {
    return this.rpc<boolean>("record_whatsapp_report", {
      p_delivery: delivery,
      p_reference: reference,
      p_status: status,
      p_occurred_at: occurredAt,
    });
  }
}
