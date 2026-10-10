import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { executeAdminSql } from "./admin-service.mjs";
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^\w+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")];
    }),
);
const eligible = `SELECT q.public_id FROM public.qr_stickers q
 JOIN public.qr_assignments a ON a.qr_id=q.id AND a.ended_at IS NULL
 JOIN public.vehicles v ON v.id=a.vehicle_id AND v.user_id=a.user_id AND v.status='ACTIVE'
 JOIN public.users u ON u.id::text=a.user_id AND u.status='ACTIVE' AND u.deleted_at IS NULL AND u.phone_verified_at IS NOT NULL
 WHERE q.status='ACTIVATED'
 AND NOT EXISTS (SELECT 1 FROM public.qr_assignments other WHERE other.qr_id=q.id AND other.ended_at IS NULL AND other.id<>a.id)
 AND NOT EXISTS (SELECT 1 FROM public.qr_scan_reports r WHERE r.qr_id=q.id AND r.created_at>clock_timestamp()-interval '5 minutes')
 AND (SELECT count(DISTINCT e.capability) FROM public.service_entitlements e WHERE e.qr_sticker_id=q.id AND e.vehicle_id=v.id
  AND e.user_id=a.user_id AND e.capability IN ('EMERGENCY_ROUTING','SCAN_HISTORY_LOGGING','SAFETY_VIEW_ACTIVE') AND e.status='ENABLED'
  AND e.verified_at IS NOT NULL AND (e.expires_at IS NULL OR e.expires_at>clock_timestamp()))=3 LIMIT 1`;
const [{ available }] = await executeAdminSql(
  `SELECT EXISTS(${eligible}) AS available`,
);
if (available) {
  await executeAdminSql(`DO $check$ DECLARE public_id text; reservation jsonb; report_id text; saved jsonb; BEGIN BEGIN
  ${eligible.replace("SELECT q.public_id", "SELECT q.public_id INTO public_id")};
  reservation:=public.begin_qr_scan_report(public_id,gen_random_uuid(),encode(sha256(gen_random_uuid()::text::bytea),'hex'));
  IF reservation->>'status'<>'NEW' THEN RAISE EXCEPTION 'Reservation verification failed'; END IF;
  report_id:=reservation->>'id';
  IF NOT public.complete_qr_scan_report(report_id,NULL,'[]'::jsonb,'PARKING','') THEN RAISE EXCEPTION 'Completion verification failed'; END IF;
  IF NOT public.complete_qr_scan_report(report_id,NULL,'[]'::jsonb,'PARKING','') THEN RAISE EXCEPTION 'Idempotency verification failed'; END IF;
  SELECT public.begin_qr_scan_report(public_id,request_id,ip_hash) INTO saved FROM public.qr_scan_reports WHERE id=report_id;
  IF saved->>'status'<>'READY' THEN RAISE EXCEPTION 'Replay verification failed'; END IF;
  IF (SELECT count(*) FROM public.notification_intents WHERE dedupe_key='report:'||report_id)<>1 THEN RAISE EXCEPTION 'Outbox deduplication verification failed'; END IF;
  IF (SELECT count(*) FROM public.qr_scan_events WHERE id=(SELECT scan_event_id FROM public.qr_scan_reports WHERE id=report_id) AND referrer_class='FINDER_REPORT' AND scan_type='PUBLIC_RESOLVE')<>1 THEN RAISE EXCEPTION 'Scan verification failed'; END IF;
  RAISE EXCEPTION 'VS_REPORT_ROLLBACK';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'VS_REPORT_ROLLBACK' THEN RAISE; END IF; END; END; $check$;`);
  console.log(
    "Real Supabase reservation, completion, replay and notification deduplication passed; all verification writes rolled back. No messages sent.",
  );
} else
  console.log(
    "No eligible existing QR for completion verification. No synthetic customer or QR created.",
  );
console.log(
  "invalid gates",
  await executeAdminSql(
    "SELECT public.begin_qr_scan_report('unrecognized-check-only',gen_random_uuid(),repeat('0',64)) AS reservation,public.complete_qr_scan_report('missing-report',NULL,'[]','PARKING','') AS completion",
  ),
);
if (process.argv.includes("--storage")) {
  const base = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/vaahansafe-prod-private/objects`;
  const key = `healthchecks/scan-report-${randomUUID()}.txt`,
    url = `${base}/${key}`;
  const headers = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` };
  const marker = `VaahanSafe private storage verification ${randomUUID()}`;
  try {
    const put = await fetch(url, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "text/plain" },
      body: marker,
      signal: AbortSignal.timeout(10000),
    });
    if (!put.ok) throw new Error(`Storage PUT failed: ${put.status}`);
    const get = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    if (!get.ok || (await get.text()) !== marker)
      throw new Error("Storage round trip failed");
    console.log("Private R2 upload/download round trip passed.");
  } finally {
    const removed = await fetch(url, {
      method: "DELETE",
      headers,
      signal: AbortSignal.timeout(10000),
    });
    if (!removed.ok)
      throw new Error("Could not remove the dedicated health-check object");
    console.log("Dedicated health-check object removed.");
  }
}
