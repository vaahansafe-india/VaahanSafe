import { createHmac, timingSafeEqual } from "node:crypto";
import { SupabaseNotificationOutbox } from "@vaahansafe/database";
import {
  Msg91WhatsAppAdapter,
  SmtpEmailAdapter,
  drainNotificationOutbox,
} from "@vaahansafe/notifications";

export function verifyNotificationSchedule(request: Request, now = Date.now()) {
  const key = process.env.NOTIFICATION_DISPATCH_SECRET;
  const timestamp = request.headers.get("x-vaahansafe-timestamp") || "";
  const signature = request.headers.get("x-vaahansafe-signature") || "";
  if (
    !key ||
    key.length < 32 ||
    !/^\d{10}$/.test(timestamp) ||
    !/^[a-f0-9]{64}$/.test(signature) ||
    Math.abs(now / 1000 - Number(timestamp)) > 120
  )
    return false;
  const expected = createHmac("sha256", key)
    .update(`notification-drain:${timestamp}`)
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export async function runNotificationDelivery() {
  const smtp = new SmtpEmailAdapter();
  return drainNotificationOutbox({
    store: new SupabaseNotificationOutbox(),
    whatsapp: new Msg91WhatsAppAdapter(),
    email: {
      sendEmail: async (options) => {
        const result = await smtp.sendEmail(options);
        return {
          success: result.success,
          providerMessageId: result.messageId,
          errorCode: result.success ? undefined : result.error,
          isRetryable: false,
        };
      },
    },
  });
}
