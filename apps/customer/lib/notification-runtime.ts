import { createHmac, timingSafeEqual } from "node:crypto";
import { SupabaseNotificationOutbox, getAuthoritativeDatabaseClient } from "@vaahansafe/database";
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
  const whatsapp = new Msg91WhatsAppAdapter();
  await Promise.all(['vhn_vehicle_report_v1','vhn_vehicle_emergency_report_v1'].map(async name=>{
    let status:string='PENDING';
    try {status=await whatsapp.getTemplateApproval(name as 'vhn_vehicle_report_v1'|'vhn_vehicle_emergency_report_v1');}catch{console.warn('[ScanReport] Template approval check unavailable');}
    await getAuthoritativeDatabaseClient().execute('UPDATE scan_report_template_approvals SET status = ?, checked_at = clock_timestamp() WHERE template_name = ?',[status,name]);
  }));
  return drainNotificationOutbox({
    store: new SupabaseNotificationOutbox(),
    whatsapp,
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
