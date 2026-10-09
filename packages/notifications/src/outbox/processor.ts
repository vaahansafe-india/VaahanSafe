import { getTemplateDefinition } from "../templates/registry";
import { renderTemplate } from "../templates/renderer";
import { evaluateNotificationChannels } from "../preferences/evaluator";
import {
  resolveTrustedDestination,
  type AccountContactProfile,
} from "../destination/trusted-destination";
import type { UserNotificationPreference } from "../preferences/policy";
import type { NotificationEventType } from "../domain/notification-event";
import type { NotificationCategory } from "../domain/category";
import type { NotificationChannel } from "../domain/channel";
import type { WhatsAppProvider } from "../ports/whatsapp-provider";
import type { EmailProvider } from "../ports/email-provider";
import type { InAppRenderResult } from "../templates/definition";

export interface ClaimedNotification {
  id: string;
  lease_token: string;
  event_type: NotificationEventType;
  category: NotificationCategory;
  template_key: string;
  payload_json: string;
  profile: AccountContactProfile;
  preferences: UserNotificationPreference[];
}
export type DeliveryOutcome =
  | "PROCESSING"
  | "DELIVERED"
  | "FAILED_RETRYABLE"
  | "FAILED_PERMANENT"
  | "DEAD_LETTERED";
export interface NotificationOutboxStore {
  claimBatch(limit: number): Promise<ClaimedNotification[]>;
  prepare(
    intent: ClaimedNotification,
    channel: NotificationChannel,
    content: InAppRenderResult,
  ): Promise<{ claimed: boolean; id?: string; attempt?: number }>;
  finishDelivery(
    intent: ClaimedNotification,
    id: string,
    status: DeliveryOutcome,
    reference?: string,
    error?: string,
  ): Promise<void>;
  finishIntent(intent: ClaimedNotification, error?: string): Promise<void>;
}

/** Short database claims surround provider calls; no network calls occur under a DB lock. */
export async function drainNotificationOutbox(
  deps: {
    store: NotificationOutboxStore;
    whatsapp: WhatsAppProvider;
    email: EmailProvider;
  },
  limit = 5,
) {
  const intents = await deps.store.claimBatch(Math.max(1, Math.min(limit, 5)));
  let processed = 0;
  let failed = 0;
  await Promise.all(
    intents.map(async (intent) => {
      let rendered: ReturnType<typeof renderTemplate>;
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(intent.payload_json);
        rendered = renderTemplate(
          getTemplateDefinition(intent.template_key),
          payload,
        );
      } catch {
        await deps.store.finishIntent(intent, "TEMPLATE_VALIDATION_FAILED");
        failed++;
        return;
      }
      const dest = resolveTrustedDestination(
        intent.profile,
        intent.category,
        payload.snapshotDestination as
          { phone?: string; email?: string } | undefined,
      );
      const channels = evaluateNotificationChannels({
        eventType: intent.event_type,
        category: intent.category,
        userPreferences: intent.preferences,
        capabilities: { hasPhone: !!dest.phone, hasEmail: !!dest.email },
      });
      // The first-party channel is completed even when a provider is unavailable.
      for (const channel of channels) {
        const claim = await deps.store.prepare(intent, channel, rendered.inApp);
        if (!claim.claimed || !claim.id) continue;
        if (channel === "IN_APP") {
          await deps.store.finishDelivery(intent, claim.id, "DELIVERED");
          continue;
        }
        let result;
        try {
          result =
            channel === "WHATSAPP"
              ? await deps.whatsapp.sendWhatsApp({
                  recipientPhone: dest.phone!,
                  ...rendered.whatsApp,
                  correlationId: claim.id,
                })
              : await deps.email.sendEmail({
                  to: dest.email!,
                  ...rendered.email,
                  correlationId: claim.id,
                });
        } catch {
          // We cannot know whether an external service accepted a crashed request.
          result = {
            success: false,
            errorCode: "DELIVERY_OUTCOME_UNKNOWN",
            isRetryable: false,
          };
        }
        const unknown = result.errorCode?.includes("OUTCOME_UNKNOWN");
        // An SMTP or MSG91 acceptance is not proof that the recipient received it.
        const status: DeliveryOutcome = result.success
          ? "PROCESSING"
          : unknown
            ? "DEAD_LETTERED"
            : result.isRetryable && (claim.attempt || 1) < 3
              ? "FAILED_RETRYABLE"
              : "FAILED_PERMANENT";
        await deps.store.finishDelivery(
          intent,
          claim.id,
          status,
          result.providerMessageId,
          result.errorCode,
        );
      }
      await deps.store.finishIntent(intent);
      processed++;
    }),
  );
  return { claimed: intents.length, processed, failed };
}
