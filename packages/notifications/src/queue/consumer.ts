/**
 * Idempotent Notification Queue Consumer
 *
 * Implements the authoritative 11-step delivery pipeline across all channels.
 *
 * NON-NEGOTIABLE INVARIANTS:
 * 1. Idempotent: Redelivery of the same queue message never creates duplicate sends.
 * 2. Channel Failure Isolation: WhatsApp failure NEVER cancels or rolls back In-App or Email.
 * 3. Minimal Queue Message: Only intentId is transmitted in queue; intent is resolved from D1.
 * 4. Bounded Retries: Transient failures back off; permanent failures transition directly to DLQ.
 */

import { validateQueueMessageV1, NotificationQueueMessageV1 } from "./contract";
import { NotificationIntentRepository } from "../ports/notification-intent-repository";
import { NotificationRepository } from "../ports/notification-repository";
import { NotificationDeliveryRepository } from "../ports/delivery-repository";
import { DeliveryAttemptRepository } from "../ports/delivery-attempt-repository";
import { NotificationPreferenceRepository } from "../ports/notification-preference-repository";
import { WhatsAppProvider } from "../ports/whatsapp-provider";
import { EmailProvider } from "../ports/email-provider";
import { DeadLetterHandler } from "./dead-letter";
import { getTemplateDefinition } from "../templates/registry";
import { renderTemplate } from "../templates/renderer";
import { evaluateNotificationChannels } from "../preferences/evaluator";
import { resolveTrustedDestination, AccountContactProfile } from "../destination/trusted-destination";
import { createNotificationDelivery } from "../domain/delivery";
import { createDeliveryAttempt } from "../domain/delivery-attempt";
import { createNotification } from "../domain/notification";
import { classifyError, calculateNextAttemptAt, isRetryLimitExceeded, RetryPolicyConfig, DEFAULT_RETRY_POLICY } from "./retry";
import { NotificationLogger } from "../errors/notification-errors";

export interface ConsumerDependencies {
  intentRepo: NotificationIntentRepository;
  notificationRepo: NotificationRepository;
  deliveryRepo: NotificationDeliveryRepository;
  attemptRepo: DeliveryAttemptRepository;
  preferenceRepo?: NotificationPreferenceRepository;
  whatsappProvider: WhatsAppProvider;
  emailProvider: EmailProvider;
  deadLetterHandler?: DeadLetterHandler;
  retryConfig?: RetryPolicyConfig;
  /**
   * Resolver to look up recipient's verified phone and email from the identity database.
   */
  loadRecipientProfile: (userId: string) => Promise<AccountContactProfile | null>;
}

export interface ConsumerExecutionResult {
  intentId: string;
  success: boolean;
  channelResults: Record<string, { status: string; providerMessageId?: string; error?: string }>;
}

export class NotificationQueueConsumer {
  private retryConfig: RetryPolicyConfig;

  constructor(private deps: ConsumerDependencies) {
    this.retryConfig = deps.retryConfig || DEFAULT_RETRY_POLICY;
  }

  /**
   * Processes a single Cloudflare Queue message envelope.
   */
  async processMessage(rawMessage: unknown): Promise<ConsumerExecutionResult> {
    // Step 1: Validate queue message envelope schema
    const msg = validateQueueMessageV1(rawMessage);

    NotificationLogger.info("Consumer received queue message", {
      intentId: msg.intentId,
      eventType: msg.eventType,
      messageId: msg.messageId,
    });

    // Step 2: Obtain authoritative intent from D1
    const intent = await this.deps.intentRepo.findById(msg.intentId);
    if (!intent) {
      NotificationLogger.error("Queue message references non-existent intent", {
        intentId: msg.intentId,
        eventType: msg.eventType,
      });
      throw new Error(`Authoritative intent "${msg.intentId}" not found in database`);
    }

    // Step 3: Verify not already fully processed (idempotency check)
    if (intent.status === "PROCESSED") {
      NotificationLogger.info("Intent already marked PROCESSED; skipping duplicate processing", {
        intentId: intent.id,
      });
      return {
        intentId: intent.id,
        success: true,
        channelResults: {},
      };
    }

    // Step 4: Resolve recipient profile and trusted destinations
    const profile = await this.deps.loadRecipientProfile(intent.recipientUserId);
    const resolvedDest = resolveTrustedDestination(
      profile || { userId: intent.recipientUserId },
      intent.category,
      intent.payload.snapshotDestination as { phone?: string; email?: string } | undefined
    );

    // Step 5: Evaluate channels against matrix & preferences
    const userPrefs = this.deps.preferenceRepo
      ? await this.deps.preferenceRepo.findByUserId(intent.recipientUserId)
      : [];

    const eligibleChannels = evaluateNotificationChannels({
      eventType: intent.eventType,
      category: intent.category,
      userPreferences: userPrefs,
      capabilities: {
        hasPhone: !!resolvedDest.phone,
        hasEmail: !!resolvedDest.email,
      },
    });

    // Step 6: Render template
    const template = getTemplateDefinition(intent.templateKey);
    const rendered = renderTemplate(template, intent.payload);

    const channelResults: Record<string, { status: string; providerMessageId?: string; error?: string }> = {};

    // Step 7-11: Process each eligible channel independently
    for (const channel of eligibleChannels) {
      // Create or load delivery record
      let delivery = await this.deps.deliveryRepo.findByIntentAndChannel(intent.id, channel);
      if (!delivery) {
        delivery = createNotificationDelivery({
          intentId: intent.id,
          channel,
          provider: channel === "IN_APP" ? "INTERNAL" : channel === "WHATSAPP" ? "MSG91" : "EMAIL_PROVIDER",
        });
        await this.deps.deliveryRepo.save(delivery);
      }

      // Idempotency: Skip if already delivered
      if (delivery.status === "DELIVERED") {
        channelResults[channel] = { status: "DELIVERED", providerMessageId: delivery.providerMessageId };
        continue;
      }

      // Channel execution
      const attemptNumber = delivery.attemptCount + 1;
      const startedAt = new Date().toISOString();

      try {
        if (channel === "IN_APP") {
          // In-App delivery (first-party D1 write)
          const inAppNotif = createNotification({
            userId: intent.recipientUserId,
            intentId: intent.id,
            eventType: intent.eventType,
            category: intent.category,
            priority: intent.priority,
            title: rendered.inApp.title,
            bodySafe: rendered.inApp.body,
            actionType: rendered.inApp.actionType,
            actionTarget: rendered.inApp.actionTarget,
          });

          await this.deps.notificationRepo.save(inAppNotif);

          await this.deps.deliveryRepo.updateStatus(delivery.id, "DELIVERED", {
            deliveredAt: new Date().toISOString(),
            attemptCount: attemptNumber,
          });

          await this.deps.attemptRepo.record(
            createDeliveryAttempt({
              deliveryId: delivery.id,
              attemptNumber,
              startedAt,
              finishedAt: new Date().toISOString(),
              result: "SUCCESS",
            })
          );

          channelResults[channel] = { status: "DELIVERED" };
        } else if (channel === "WHATSAPP") {
          if (!resolvedDest.phone) {
            throw new Error("INVALID_PHONE_NUMBER: Recipient has no verified phone");
          }

          const sendResult = await this.deps.whatsappProvider.sendWhatsApp({
            recipientPhone: resolvedDest.phone,
            templateName: rendered.whatsApp.templateName,
            parameters: rendered.whatsApp.parameters,
            correlationId: intent.id,
          });

          if (sendResult.success) {
            await this.deps.deliveryRepo.updateStatus(delivery.id, "DELIVERED", {
              providerMessageId: sendResult.providerMessageId,
              deliveredAt: new Date().toISOString(),
              attemptCount: attemptNumber,
            });

            await this.deps.attemptRepo.record(
              createDeliveryAttempt({
                deliveryId: delivery.id,
                attemptNumber,
                startedAt,
                finishedAt: new Date().toISOString(),
                result: "SUCCESS",
                providerReference: sendResult.providerMessageId,
              })
            );

            channelResults[channel] = {
              status: "DELIVERED",
              providerMessageId: sendResult.providerMessageId,
            };
          } else {
            await this.handleDeliveryFailure(
              delivery.id,
              channel,
              attemptNumber,
              startedAt,
              sendResult.errorCode || "WHATSAPP_SEND_FAILED",
              intent.id,
              channelResults
            );
          }
        } else if (channel === "EMAIL") {
          if (!resolvedDest.email) {
            throw new Error("INVALID_EMAIL_ADDRESS: Recipient has no verified email");
          }

          const sendResult = await this.deps.emailProvider.sendEmail({
            to: resolvedDest.email,
            subject: rendered.email.subject,
            html: rendered.email.html,
            text: rendered.email.text,
            correlationId: intent.id,
          });

          if (sendResult.success) {
            await this.deps.deliveryRepo.updateStatus(delivery.id, "DELIVERED", {
              providerMessageId: sendResult.providerMessageId,
              deliveredAt: new Date().toISOString(),
              attemptCount: attemptNumber,
            });

            await this.deps.attemptRepo.record(
              createDeliveryAttempt({
                deliveryId: delivery.id,
                attemptNumber,
                startedAt,
                finishedAt: new Date().toISOString(),
                result: "SUCCESS",
                providerReference: sendResult.providerMessageId,
              })
            );

            channelResults[channel] = {
              status: "DELIVERED",
              providerMessageId: sendResult.providerMessageId,
            };
          } else {
            await this.handleDeliveryFailure(
              delivery.id,
              channel,
              attemptNumber,
              startedAt,
              sendResult.errorCode || "EMAIL_SEND_FAILED",
              intent.id,
              channelResults
            );
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await this.handleDeliveryFailure(
          delivery.id,
          channel,
          attemptNumber,
          startedAt,
          errorMsg,
          intent.id,
          channelResults
        );
      }
    }

    // Step 12: Check if all deliveries are resolved to terminal states
    const deliveries = await this.deps.deliveryRepo.findByIntentId(intent.id);
    const hasPendingRetries = deliveries.some((d) => d.status === "FAILED_RETRYABLE");

    if (!hasPendingRetries) {
      await this.deps.intentRepo.updateStatus(intent.id, "PROCESSED", new Date().toISOString());
    }

    return {
      intentId: intent.id,
      success: !hasPendingRetries,
      channelResults,
    };
  }

  private async handleDeliveryFailure(
    deliveryId: string,
    channel: any,
    attemptNumber: number,
    startedAt: string,
    errorCode: string,
    intentId: string,
    channelResults: Record<string, any>
  ): Promise<void> {
    const classification = classifyError(errorCode);
    const finishedAt = new Date().toISOString();

    if (classification === "PERMANENT" || isRetryLimitExceeded(attemptNumber, this.retryConfig)) {
      const finalStatus = classification === "PERMANENT" ? "FAILED_PERMANENT" : "DEAD_LETTERED";

      await this.deps.deliveryRepo.updateStatus(deliveryId, finalStatus, {
        attemptCount: attemptNumber,
        lastFailureCode: errorCode,
      });

      await this.deps.attemptRepo.record(
        createDeliveryAttempt({
          deliveryId,
          attemptNumber,
          startedAt,
          finishedAt,
          result: "PERMANENT_FAILURE",
          normalizedErrorCode: errorCode,
        })
      );

      if (this.deps.deadLetterHandler) {
        await this.deps.deadLetterHandler.recordDeadLetter({
          intentId,
          deliveryId,
          channel,
          normalizedError: errorCode,
          attemptCount: attemptNumber,
          lastAttemptAt: finishedAt,
        });
      }

      channelResults[channel] = { status: finalStatus, error: errorCode };
    } else {
      // Retryable failure within retry limits
      const nextAttemptAt = calculateNextAttemptAt(attemptNumber, this.retryConfig);

      await this.deps.deliveryRepo.updateStatus(deliveryId, "FAILED_RETRYABLE", {
        attemptCount: attemptNumber,
        lastFailureCode: errorCode,
        nextAttemptAt,
      });

      await this.deps.attemptRepo.record(
        createDeliveryAttempt({
          deliveryId,
          attemptNumber,
          startedAt,
          finishedAt,
          result: "RETRYABLE_FAILURE",
          normalizedErrorCode: errorCode,
        })
      );

      channelResults[channel] = { status: "FAILED_RETRYABLE", error: errorCode };
    }
  }
}
