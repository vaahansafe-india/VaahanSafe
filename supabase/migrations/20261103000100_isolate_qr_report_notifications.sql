BEGIN;

-- A resolver visit or test scan records analytics only. Finder report completion
-- creates separate, report-ID-keyed owner/contact intents after validation.
DROP TRIGGER IF EXISTS vs_notification_event ON public.qr_scan_events;

-- Preserve existing intents and delivery history. Cancel outstanding retries
-- from the retired scan-notice path without changing submitted report alerts.
UPDATE public.notification_intents
SET status='FAILED', failure_code='UNCONFIRMED_SCAN_NOTICE',
    lease_token=NULL, lease_expires_at=NULL, next_attempt_at=NULL
WHERE template_key='EMERGENCY_SCAN_ALERT_V1' AND status IN ('PENDING','QUEUED');

-- The original enqueue trigger excluded the owner's phone at report creation.
-- Recheck it at claim and prepare in case the account phone changed since then.
CREATE OR REPLACE FUNCTION public.qr_report_contact_phone(p_intent text) RETURNS text
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $fn$
  SELECT i.recipient_phone FROM public.notification_intents i
    JOIN public.qr_scan_reports r ON r.id=i.source_id AND r.owner_user_id::text=i.recipient_user_id
    JOIN public.emergency_contacts c ON c.id=i.emergency_contact_id
    JOIN public.emergency_profiles p ON p.id=c.emergency_profile_id AND p.vehicle_id=r.vehicle_id AND p.status='ACTIVE'
    JOIN public.vehicles v ON v.id=r.vehicle_id AND v.user_id=r.owner_user_id::text AND v.status='ACTIVE'
    JOIN public.users u ON u.id=r.owner_user_id AND u.status='ACTIVE' AND u.deleted_at IS NULL AND u.phone_verified_at IS NOT NULL
    JOIN public.qr_stickers q ON q.id=r.qr_id AND q.status='ACTIVATED'
    JOIN public.qr_assignments a ON a.qr_id=q.id AND a.vehicle_id=v.id AND a.user_id=v.user_id AND a.ended_at IS NULL
  WHERE i.id=p_intent AND i.recipient_kind='EMERGENCY_CONTACT' AND i.template_key='EMERGENCY_CONTACT_REPORT_V1'
    AND r.status='READY' AND r.reason='EMERGENCY' AND r.created_at>now()-interval '15 minutes' AND r.expires_at>now()
    AND c.is_enabled=1 AND c.allow_message=1 AND public.qr_alert_phone(c.phone)=i.recipient_phone
    AND i.recipient_phone IS DISTINCT FROM public.qr_alert_phone(coalesce(u.phone,u.primary_phone))
    AND NOT EXISTS(SELECT 1 FROM public.qr_assignments other WHERE other.qr_id=q.id AND other.ended_at IS NULL AND other.id<>a.id)
    AND NOT EXISTS (SELECT 1 FROM (VALUES ('EMERGENCY_ROUTING'),('SCAN_HISTORY_LOGGING'),('SAFETY_VIEW_ACTIVE')) needed(capability)
      WHERE NOT EXISTS (SELECT 1 FROM public.service_entitlements e WHERE e.qr_sticker_id=q.id AND e.vehicle_id=v.id
        AND e.user_id=a.user_id AND e.capability=needed.capability AND e.status='ENABLED' AND e.verified_at IS NOT NULL
        AND (e.expires_at IS NULL OR e.expires_at>now()))) LIMIT 1;
$fn$;

COMMIT;
