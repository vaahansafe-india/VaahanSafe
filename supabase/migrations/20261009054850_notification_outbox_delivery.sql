BEGIN;

-- Preserve the server-only query contract and report conditional-write outcomes.
CREATE OR REPLACE FUNCTION public.exec_sql(p_sql text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_result jsonb; v_clean text; v_rows bigint;
BEGIN
  v_clean := regexp_replace(p_sql, '^[ \t\r\n]+', '');
  IF v_clean ~* '^(select|with|values)\s' THEN
    EXECUTE 'SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (' || regexp_replace(p_sql, '[;\s]+$', '') || ') t' INTO v_result;
    RETURN v_result;
  END IF;
  EXECUTE p_sql;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN jsonb_build_object('success',true,'rowsAffected',v_rows);
END; $fn$;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- All shipped apps use server-side projection/verification for these operations.
-- Browser grants otherwise permit forged scan events and self-verified contacts.
REVOKE INSERT,UPDATE,DELETE ON public.qr_scan_events FROM PUBLIC,anon,authenticated;
REVOKE UPDATE ON public.users FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.qr_stickers FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.notification_intents,public.notification_deliveries,public.notification_delivery_attempts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.qr_stickers,public.qr_scan_events,public.users,
  public.notification_intents,public.notification_deliveries,public.notification_delivery_attempts TO service_role;

ALTER TABLE public.notification_intents ADD COLUMN IF NOT EXISTS lease_token uuid;
ALTER TABLE public.notification_intents ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz;
ALTER TABLE public.notification_intents ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz;
ALTER TABLE public.notification_intents ADD COLUMN IF NOT EXISTS failure_code text;
CREATE INDEX IF NOT EXISTS notification_outbox_due ON public.notification_intents (created_at,id)
  WHERE status IN ('PENDING','QUEUED');
CREATE INDEX IF NOT EXISTS notification_provider_reference ON public.notification_deliveries(provider_message_id)
  WHERE provider='MSG91' AND provider_message_id IS NOT NULL;

-- read_at is canonical for domain mutations. Legacy is_read-only callers remain supported.
CREATE OR REPLACE FUNCTION public.sync_notification_columns() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $fn$
BEGIN
  NEW.body_safe := coalesce(NEW.body_safe,NEW.body);
  NEW.body := coalesce(NEW.body,NEW.body_safe);
  NEW.event_type := coalesce(NEW.event_type,NEW.type);
  NEW.type := coalesce(NEW.type,NEW.event_type);
  IF TG_OP='INSERT' THEN
    IF NEW.read_at IS NULL AND NEW.is_read=1 THEN NEW.read_at:=clock_timestamp(); END IF;
  ELSIF NEW.read_at IS NOT DISTINCT FROM OLD.read_at AND NEW.is_read IS DISTINCT FROM OLD.is_read THEN
    NEW.read_at:=CASE WHEN NEW.is_read=1 THEN clock_timestamp() ELSE NULL END;
  END IF;
  NEW.is_read:=CASE WHEN NEW.read_at IS NULL THEN 0 ELSE 1 END;
  NEW.category:=coalesce(NEW.category,'ACCOUNT'); NEW.priority:=coalesce(NEW.priority,'NORMAL');
  RETURN NEW;
END; $fn$;

-- Durable outbox creation occurs in the same transaction as the real domain change.
-- Deterministic IDs are event dedupe identifiers, never authentication credentials.
CREATE OR REPLACE FUNCTION public.enqueue_notification_event(
  p_event text,p_user text,p_source text,p_source_id text,p_payload jsonb,p_dedupe text
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE v_category text; v_template text; v_priority text:='NORMAL';
BEGIN
  CASE p_event
    WHEN 'ACCOUNT_WELCOME' THEN v_category:='ACCOUNT';v_template:='ACCOUNT_WELCOME_V1';
    WHEN 'QR_ACTIVATED' THEN v_category:='SAFETY';v_template:='QR_ACTIVATED_V1';
    WHEN 'PAYMENT_SUCCEEDED' THEN v_category:='COMMERCE';v_template:='PAYMENT_SUCCESS_V1';
    WHEN 'SHIPMENT_UPDATED' THEN v_category:='FULFILMENT';v_template:='SHIPMENT_UPDATE_V1';
    WHEN 'SUBSCRIPTION_RENEWED' THEN v_category:='SUBSCRIPTION';v_template:='SUBSCRIPTION_RENEWED_V1';
    WHEN 'SUBSCRIPTION_RENEWAL_FAILED' THEN v_category:='SUBSCRIPTION';v_template:='SUBSCRIPTION_RENEWAL_FAILED_V1';v_priority:='HIGH';
    WHEN 'REPLACEMENT_APPROVED' THEN v_category:='SAFETY';v_template:='REPLACEMENT_APPROVED_V1';
    WHEN 'EMERGENCY_SCAN_ALERT' THEN v_category:='SAFETY';v_template:='EMERGENCY_SCAN_ALERT_V1';v_priority:='HIGH';
    WHEN 'SECURITY_CHANGED' THEN v_category:='SECURITY';v_template:='SECURITY_CHANGED_V1';v_priority:='CRITICAL';
    WHEN 'SUPPORT_UPDATED' THEN v_category:='SUPPORT';v_template:='SUPPORT_UPDATE_V1';
    ELSE RAISE EXCEPTION 'Unsupported notification event';
  END CASE;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id::text=p_user AND deleted_at IS NULL) THEN RETURN; END IF;
  INSERT INTO public.notification_intents(id,event_type,recipient_user_id,category,priority,template_key,template_version,
    payload_json,source_type,source_id,dedupe_key,status,created_at)
  VALUES ('outbox_'||md5(p_dedupe),p_event,p_user,v_category,v_priority,v_template,1,p_payload::text,p_source,p_source_id,p_dedupe,'PENDING',clock_timestamp())
  ON CONFLICT(dedupe_key) DO NOTHING;
END; $fn$;
REVOKE ALL ON FUNCTION public.enqueue_notification_event(text,text,text,text,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_notification_event(text,text,text,text,jsonb,text) TO service_role;

-- A support case needs a real recipient relationship; never infer identity from its subject.
-- RESTRICT preserves support/audit history when an account is removed.
ALTER TABLE public.admin_support_tickets ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS support_customer_created ON public.admin_support_tickets(customer_user_id,created_at DESC)
  WHERE customer_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.capture_notification_event() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE n jsonb:=to_jsonb(NEW); o jsonb:=CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  r record; v_user text; v_key text; v_payload jsonb; v_event text; v_source text:=TG_TABLE_NAME;
BEGIN
  IF TG_TABLE_NAME='users' THEN
    IF NEW.phone_verified_at IS NOT NULL AND (TG_OP='INSERT' OR OLD.phone_verified_at IS NULL) THEN
      PERFORM public.enqueue_notification_event('ACCOUNT_WELCOME',NEW.id::text,'ACCOUNT',NEW.id::text,
        jsonb_build_object('displayName',left(coalesce(nullif(NEW.full_name,''),'VaahanSafe member'),100),'accountCreatedDate',NEW.created_at::text),'welcome:'||NEW.id::text);
    END IF;
    IF TG_OP='UPDATE' AND (OLD.phone_verified_at IS NOT NULL OR OLD.email_verified_at IS NOT NULL)
      AND (coalesce(NEW.phone,NEW.primary_phone) IS DISTINCT FROM coalesce(OLD.phone,OLD.primary_phone)
        OR coalesce(NEW.email,NEW.primary_email) IS DISTINCT FROM coalesce(OLD.email,OLD.primary_email)) THEN
      PERFORM public.enqueue_notification_event('SECURITY_CHANGED',NEW.id::text,'ACCOUNT',NEW.id::text,
        jsonb_build_object('changeType','Account contact updated','occurredAt',clock_timestamp()::text,
          'actionSummary','A verified account contact was changed','snapshotDestination',jsonb_strip_nulls(jsonb_build_object(
            'phone',CASE WHEN OLD.phone_verified_at IS NOT NULL THEN coalesce(OLD.phone,OLD.primary_phone) END,
            'email',CASE WHEN OLD.email_verified_at IS NOT NULL THEN coalesce(OLD.email,OLD.primary_email) END))),
        'security:'||NEW.id::text||':'||clock_timestamp()::text);
    END IF;
    RETURN NEW;
  ELSIF TG_TABLE_NAME='orders' THEN
    IF NEW.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED') AND (TG_OP='INSERT' OR OLD.status NOT IN ('PAID','PROCESSING','SHIPPED','DELIVERED')) THEN
      SELECT p.id INTO r FROM public.payments p WHERE p.order_id=NEW.id AND p.status IN ('SUCCESS','PAID')
        AND p.provider IN ('RAZORPAY','CASHFREE') AND p.confirmed_at IS NOT NULL
        AND p.amount_minor=NEW.total_minor AND p.currency=NEW.currency LIMIT 1;
      IF FOUND THEN
        PERFORM public.enqueue_notification_event('PAYMENT_SUCCEEDED',NEW.user_id,'ORDER',NEW.id,
          jsonb_build_object('orderId',NEW.id,'orderNumber',NEW.order_number,'paymentId',r.id,
            'amountDisplay',NEW.currency||' '||to_char(NEW.total_minor::numeric/100,'FM999999990.00')),'payment:'||NEW.id);
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_TABLE_NAME='service_entitlements' THEN
    IF NEW.capability='SAFETY_VIEW_ACTIVE' AND NEW.status='ENABLED' AND (TG_OP='INSERT' OR OLD.status<>'ENABLED') THEN
      SELECT q.public_id,v.registration_number INTO r FROM public.qr_stickers q JOIN public.vehicles v ON v.id=NEW.vehicle_id
        WHERE q.id=NEW.qr_sticker_id AND q.vehicle_id=v.id AND q.user_id=NEW.user_id AND v.user_id=NEW.user_id
        AND q.status='ACTIVATED' AND NEW.verified_at IS NOT NULL;
      IF FOUND THEN
        PERFORM public.enqueue_notification_event('QR_ACTIVATED',NEW.user_id,'QR',NEW.qr_sticker_id,
          jsonb_build_object('publicId',r.public_id,'vehicleRegMasked',left(r.registration_number,2)||'••••'||right(r.registration_number,4)),
          'activation:'||NEW.qr_sticker_id);
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_TABLE_NAME='qr_scan_events' THEN
    IF NEW.result='RESOLVED_ACTIVE' THEN
      SELECT a.user_id,v.registration_number INTO r FROM public.qr_assignments a JOIN public.vehicles v ON v.id=a.vehicle_id
        JOIN public.service_entitlements e ON e.qr_sticker_id=a.qr_id AND e.user_id=a.user_id AND e.capability='SCAN_HISTORY_LOGGING'
        AND e.status='ENABLED' AND (e.expires_at IS NULL OR e.expires_at>clock_timestamp())
        JOIN public.qr_stickers q ON q.id=a.qr_id AND q.status='ACTIVATED'
        WHERE a.qr_id=NEW.qr_id AND a.ended_at IS NULL AND v.user_id=a.user_id AND v.status<>'DELETED'
          AND e.vehicle_id=v.id LIMIT 1;
      IF FOUND THEN
        PERFORM public.enqueue_notification_event('EMERGENCY_SCAN_ALERT',r.user_id,'QR_SCAN',NEW.id,
          jsonb_build_object('vehicleMaskedReg',left(r.registration_number,2)||'••••'||right(r.registration_number,4),
            'scannedAtFormatted',to_char(NEW.created_at AT TIME ZONE 'Asia/Kolkata','DD Mon YYYY, HH24:MI')||' IST'),
          'scan:'||NEW.qr_id||':'||floor(extract(epoch FROM NEW.created_at)/900)::text);
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_TABLE_NAME='shipments' THEN
    IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
      SELECT f.user_id INTO r FROM public.fulfilments f WHERE f.id=NEW.fulfilment_id;
      v_user:=coalesce(NEW.user_id,CASE WHEN FOUND THEN r.user_id END);
      IF v_user IS NOT NULL THEN
        PERFORM public.enqueue_notification_event('SHIPMENT_UPDATED',v_user,'SHIPMENT',NEW.id,
          jsonb_build_object('shipmentId',NEW.id,'status',NEW.status,'trackingNumber',coalesce(NEW.tracking_reference,NEW.waybill_number,'Not assigned yet')),
          'shipment:'||NEW.id||':'||NEW.status);
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_TABLE_NAME='subscriptions' THEN
    -- A catalog purchase is not a renewal. Require a new, successful plan payment and period extension.
    IF TG_OP='UPDATE' AND NEW.source_payment_id IS DISTINCT FROM OLD.source_payment_id THEN
      SELECT pl.name INTO r FROM public.plans pl JOIN public.payments p ON p.id=NEW.source_payment_id
        JOIN public.orders ord ON ord.id=p.order_id WHERE pl.id=NEW.plan_id AND ord.user_id=NEW.user_id
        AND p.amount_minor=pl.price_minor AND p.currency=pl.currency AND p.confirmed_at IS NOT NULL AND p.status IN ('SUCCESS','PAID')
        AND EXISTS(SELECT 1 FROM public.order_items oi WHERE oi.order_id=ord.id AND oi.item_type='PLAN' AND oi.plan_id=pl.id AND oi.quantity=1 AND oi.total_price_minor=pl.price_minor);
      IF FOUND AND NEW.status='ACTIVE' AND NEW.current_period_end>OLD.current_period_end THEN
        PERFORM public.enqueue_notification_event('SUBSCRIPTION_RENEWED',NEW.user_id,'SUBSCRIPTION',NEW.id,
          jsonb_build_object('subscriptionId',NEW.id,'planName',r.name,'nextBillingDate',to_char(NEW.current_period_end AT TIME ZONE 'Asia/Kolkata','DD Mon YYYY')),
          'renewal:'||NEW.id||':'||NEW.source_payment_id);
      END IF;
    END IF;
    IF TG_OP='UPDATE' AND NEW.status='PAST_DUE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      SELECT pl.name INTO r FROM public.plans pl JOIN public.payments p ON p.id=NEW.source_payment_id
        JOIN public.orders ord ON ord.id=p.order_id WHERE pl.id=NEW.plan_id AND ord.user_id=NEW.user_id AND p.status='FAILED'
        AND EXISTS(SELECT 1 FROM public.order_items oi WHERE oi.order_id=ord.id AND oi.item_type='PLAN' AND oi.plan_id=pl.id);
      IF FOUND THEN
        PERFORM public.enqueue_notification_event('SUBSCRIPTION_RENEWAL_FAILED',NEW.user_id,'SUBSCRIPTION',NEW.id,
          jsonb_build_object('subscriptionId',NEW.id,'planName',r.name),'renewal-failed:'||NEW.id||':'||NEW.source_payment_id);
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_TABLE_NAME='replacement_requests' THEN
    -- Provider copy promises dispatch: approval or allocation alone is insufficient.
    IF NEW.status IN ('SHIPPED','COMPLETED') AND NEW.approved_at IS NOT NULL
      AND (TG_OP='INSERT' OR OLD.status NOT IN ('SHIPPED','COMPLETED')) THEN
      SELECT public_id INTO r FROM public.qr_stickers WHERE id=NEW.old_qr_sticker_id;
      IF FOUND THEN PERFORM public.enqueue_notification_event('REPLACEMENT_APPROVED',NEW.user_id,'REPLACEMENT',NEW.id,
        jsonb_build_object('replacementRequestId',NEW.id,'originalPublicId',r.public_id),'replacement:'||NEW.id); END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_TABLE_NAME='admin_support_tickets' THEN
    IF NEW.customer_user_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status OR OLD.customer_user_id IS NULL) THEN
      PERFORM public.enqueue_notification_event('SUPPORT_UPDATED',NEW.customer_user_id::text,'SUPPORT',NEW.id,
        jsonb_build_object('ticketId',NEW.reference_code,'ticketSubject',left(NEW.subject,200),'status',NEW.status),
        'support:'||NEW.id||':'||NEW.status||':'||NEW.customer_user_id::text);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END; $fn$;
REVOKE ALL ON FUNCTION public.capture_notification_event() FROM PUBLIC,anon,authenticated;

DO $triggers$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['users','orders','service_entitlements','shipments','subscriptions','replacement_requests','admin_support_tickets'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS vs_notification_event ON public.%I',t);
    EXECUTE format('CREATE TRIGGER vs_notification_event AFTER INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.capture_notification_event()',t);
  END LOOP;
END; $triggers$;
DROP TRIGGER IF EXISTS vs_notification_event ON public.qr_scan_events;
CREATE TRIGGER vs_notification_event AFTER INSERT ON public.qr_scan_events FOR EACH ROW EXECUTE FUNCTION public.capture_notification_event();

-- Browser clients can request replacement, never approve one or edit its risk review.
REVOKE UPDATE ON public.replacement_requests FROM authenticated;
DO $policies$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='replacement_requests' AND cmd IN ('ALL','INSERT','UPDATE') LOOP
    EXECUTE format('DROP POLICY %I ON public.replacement_requests',p.policyname);
  END LOOP;
END; $policies$;
DROP POLICY IF EXISTS replacement_owner_read ON public.replacement_requests;
DROP POLICY IF EXISTS replacement_owner_request ON public.replacement_requests;
CREATE POLICY replacement_owner_read ON public.replacement_requests FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid())::text);
CREATE POLICY replacement_owner_request ON public.replacement_requests FOR INSERT TO authenticated
  WITH CHECK(user_id=(SELECT auth.uid())::text AND status='REQUESTED' AND approved_at IS NULL AND approved_by IS NULL
    AND EXISTS(SELECT 1 FROM public.vehicles v WHERE v.id=vehicle_id AND v.user_id=(SELECT auth.uid())::text)
    AND EXISTS(SELECT 1 FROM public.qr_stickers q WHERE q.id=old_qr_sticker_id AND q.user_id=(SELECT auth.uid())::text AND q.vehicle_id=vehicle_id));

-- Claim a bounded batch in one round trip. Concurrent workers skip locked records.
CREATE OR REPLACE FUNCTION public.claim_notification_batch(p_limit integer DEFAULT 5) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE v_result jsonb;
BEGIN
  WITH candidates AS (
    SELECT id FROM public.notification_intents WHERE status IN ('PENDING','QUEUED')
      AND (lease_expires_at IS NULL OR lease_expires_at<clock_timestamp())
      AND (next_attempt_at IS NULL OR next_attempt_at<=clock_timestamp())
      AND template_key IN ('ACCOUNT_WELCOME_V1','QR_ACTIVATED_V1','PAYMENT_SUCCESS_V1','SHIPMENT_UPDATE_V1','SUBSCRIPTION_RENEWED_V1',
        'SUBSCRIPTION_RENEWAL_FAILED_V1','REPLACEMENT_APPROVED_V1','EMERGENCY_SCAN_ALERT_V1','SECURITY_CHANGED_V1','SUPPORT_UPDATE_V1')
    ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT greatest(1,least(p_limit,10))
  ), claimed AS (
    UPDATE public.notification_intents i SET status='QUEUED',lease_token=gen_random_uuid(),lease_expires_at=clock_timestamp()+interval '2 minutes'
    FROM candidates c WHERE i.id=c.id RETURNING i.*
  ) SELECT coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('profile',jsonb_build_object('userId',u.id::text,
      'verifiedPhone',CASE WHEN u.phone_verified_at IS NOT NULL THEN coalesce(u.phone,u.primary_phone) END,
      'verifiedEmail',CASE WHEN u.email_verified_at IS NOT NULL THEN coalesce(u.email,u.primary_email) END),
      'preferences',(SELECT coalesce(jsonb_agg(jsonb_build_object('userId',p.user_id,'category',p.category,'channel',p.channel,'enabled',p.enabled=1)),'[]')
        FROM public.notification_preferences p WHERE p.user_id=c.recipient_user_id))), '[]') INTO v_result
    FROM claimed c LEFT JOIN public.users u ON u.id::text=c.recipient_user_id AND u.deleted_at IS NULL;
  RETURN v_result;
END; $fn$;

CREATE OR REPLACE FUNCTION public.prepare_notification_delivery(p_intent text,p_lease uuid,p_channel text,p_content jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE i public.notification_intents; d public.notification_deliveries; v_id text;
BEGIN
  SELECT * INTO i FROM public.notification_intents WHERE id=p_intent AND lease_token=p_lease AND lease_expires_at>clock_timestamp() FOR UPDATE;
  IF NOT FOUND OR p_channel NOT IN ('IN_APP','WHATSAPP','EMAIL') THEN RETURN jsonb_build_object('claimed',false); END IF;
  v_id:='delivery_'||md5(p_intent||':'||p_channel);
  INSERT INTO public.notification_deliveries(id,intent_id,channel,provider,status) VALUES(v_id,p_intent,p_channel,
    CASE p_channel WHEN 'IN_APP' THEN 'INTERNAL' WHEN 'WHATSAPP' THEN 'MSG91' ELSE 'EMAIL_PROVIDER' END,'PENDING')
    ON CONFLICT(intent_id,channel) DO NOTHING;
  SELECT * INTO d FROM public.notification_deliveries WHERE intent_id=p_intent AND channel=p_channel FOR UPDATE;
  -- Never resend a crashed/ambiguous external attempt. It may already have reached the provider.
  IF d.status='PROCESSING' AND p_channel<>'IN_APP' THEN
    IF d.provider_message_id IS NULL THEN UPDATE public.notification_deliveries SET status='DEAD_LETTERED',last_failure_code='DELIVERY_OUTCOME_UNKNOWN',updated_at=clock_timestamp() WHERE id=d.id; END IF;
    RETURN jsonb_build_object('claimed',false);
  END IF;
  IF (d.status NOT IN ('PENDING','FAILED_RETRYABLE') AND NOT(p_channel='IN_APP' AND d.status='PROCESSING')) OR (d.next_attempt_at IS NOT NULL AND d.next_attempt_at>clock_timestamp()) THEN
    RETURN jsonb_build_object('claimed',false);
  END IF;
  IF p_channel='IN_APP' THEN
    INSERT INTO public.notifications(id,user_id,intent_id,event_type,category,priority,title,body_safe,action_type,action_target)
      VALUES('notice_'||md5(p_intent),i.recipient_user_id,i.id,i.event_type,i.category,i.priority,p_content->>'title',p_content->>'body',
        coalesce(p_content->>'actionType','NONE'),p_content->>'actionTarget') ON CONFLICT(id) DO NOTHING;
  END IF;
  UPDATE public.notification_deliveries SET status='PROCESSING',attempt_count=attempt_count+1,updated_at=clock_timestamp(),next_attempt_at=NULL
    WHERE id=d.id RETURNING * INTO d;
  RETURN jsonb_build_object('claimed',true,'id',d.id,'attempt',d.attempt_count);
END; $fn$;

CREATE OR REPLACE FUNCTION public.finish_notification_delivery(p_intent text,p_lease uuid,p_delivery text,p_status text,p_reference text DEFAULT NULL,p_error text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE d public.notification_deliveries;
BEGIN
  IF p_status NOT IN ('PROCESSING','DELIVERED','FAILED_RETRYABLE','FAILED_PERMANENT','DEAD_LETTERED') THEN RAISE EXCEPTION 'Invalid delivery outcome'; END IF;
  PERFORM 1 FROM public.notification_intents WHERE id=p_intent AND lease_token=p_lease FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Notification lease lost'; END IF;
  SELECT * INTO d FROM public.notification_deliveries WHERE id=p_delivery AND intent_id=p_intent FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Notification delivery missing'; END IF;
  -- A callback can race the send response. Preserve its delivered outcome.
  UPDATE public.notification_deliveries SET status=CASE WHEN status='DELIVERED' THEN status ELSE p_status END,
    provider_message_id=coalesce(provider_message_id,p_reference),last_failure_code=p_error,
    next_attempt_at=CASE WHEN p_status='FAILED_RETRYABLE' THEN clock_timestamp()+make_interval(secs=>least(300,30*(2^greatest(d.attempt_count-1,0))::integer)) END,
    delivered_at=CASE WHEN p_status='DELIVERED' THEN coalesce(delivered_at,clock_timestamp()) ELSE delivered_at END,updated_at=clock_timestamp() WHERE id=d.id;
  INSERT INTO public.notification_delivery_attempts(id,delivery_id,attempt_number,started_at,finished_at,result,normalized_error_code,provider_reference)
    VALUES('attempt_'||md5(d.id||':'||d.attempt_count),d.id,d.attempt_count,d.updated_at,clock_timestamp(),
      CASE WHEN p_status IN ('PROCESSING','DELIVERED') THEN 'SUCCESS' WHEN p_status='FAILED_RETRYABLE' THEN 'RETRYABLE_FAILURE' ELSE 'PERMANENT_FAILURE' END,p_error,p_reference)
    ON CONFLICT(id) DO NOTHING;
END; $fn$;

CREATE OR REPLACE FUNCTION public.finish_notification_intent(p_intent text,p_lease uuid,p_error text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
BEGIN
  UPDATE public.notification_intents i SET status=CASE WHEN p_error IS NOT NULL THEN 'FAILED'
    WHEN EXISTS(SELECT 1 FROM public.notification_deliveries d WHERE d.intent_id=i.id AND d.status='FAILED_RETRYABLE') THEN 'PENDING' ELSE 'PROCESSED' END,
    failure_code=p_error,next_attempt_at=(SELECT min(d.next_attempt_at) FROM public.notification_deliveries d WHERE d.intent_id=i.id AND d.status='FAILED_RETRYABLE'),
    dispatched_at=clock_timestamp(),lease_token=NULL,lease_expires_at=NULL WHERE id=p_intent AND lease_token=p_lease;
END; $fn$;

-- Correlate authenticated provider reports with our exact request and delivery identity.
CREATE OR REPLACE FUNCTION public.record_whatsapp_report(p_delivery text,p_reference text,p_status text,p_occurred_at timestamptz) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE v_rows bigint;
BEGIN
  IF p_status NOT IN ('sent','delivered','read','failed') THEN RETURN false; END IF;
  UPDATE public.notification_deliveries SET status=CASE WHEN p_status IN ('delivered','read') THEN 'DELIVERED'
      WHEN p_status='failed' AND status<>'DELIVERED' THEN 'FAILED_PERMANENT' ELSE status END,
    provider_message_id=coalesce(provider_message_id,p_reference),
    delivered_at=CASE WHEN p_status IN ('delivered','read') THEN coalesce(delivered_at,p_occurred_at) ELSE delivered_at END,
    last_failure_code=CASE WHEN p_status='failed' AND status<>'DELIVERED' THEN 'MSG91_REPORTED_FAILURE' ELSE last_failure_code END,
    updated_at=clock_timestamp()
    WHERE id=p_delivery AND channel='WHATSAPP' AND provider='MSG91'
      AND (provider_message_id=p_reference OR (provider_message_id IS NULL AND status='PROCESSING'));
  GET DIAGNOSTICS v_rows=ROW_COUNT; RETURN v_rows>0;
END; $fn$;

REVOKE ALL ON FUNCTION public.claim_notification_batch(integer),public.prepare_notification_delivery(text,uuid,text,jsonb),
  public.finish_notification_delivery(text,uuid,text,text,text,text),public.finish_notification_intent(text,uuid,text),
  public.record_whatsapp_report(text,text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_batch(integer),public.prepare_notification_delivery(text,uuid,text,jsonb),
  public.finish_notification_delivery(text,uuid,text,text,text,text),public.finish_notification_intent(text,uuid,text),
  public.record_whatsapp_report(text,text,text,timestamptz) TO service_role;
CREATE OR REPLACE FUNCTION public.admin_console_mutate(p_session uuid,p_module text,p_id text,p_values jsonb,p_reason text,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor public.admin_users; ses public.admin_sessions; target text; allowed text[]; column_list text; set_list text; before_row jsonb; after_row jsonb;
BEGIN
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL AND expires_at>now() AND phone_verified_at IS NOT NULL FOR UPDATE;
 SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE';
 IF actor.id IS NULL OR actor.role='READ_ONLY_ANALYST' THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF length(trim(p_reason))<10 OR length(p_reason)>500 THEN RAISE EXCEPTION 'Reason required'; END IF;
 CASE p_module
 WHEN 'distributors','retailers' THEN
  IF actor.role NOT IN ('SUPER_ADMIN','OPS_ADMIN') THEN RAISE EXCEPTION 'Access denied'; END IF;
  target:='admin_partners'; allowed:=ARRAY['reference_code','name','kind','city','status'];
 WHEN 'support' THEN
  IF actor.role NOT IN ('SUPER_ADMIN','SUPPORT_AGENT','OPS_ADMIN') THEN RAISE EXCEPTION 'Access denied'; END IF;
  target:='admin_support_tickets'; allowed:=ARRAY['reference_code','subject','priority','status','assigned_to','customer_user_id'];
 WHEN 'incidents' THEN
  IF actor.role NOT IN ('SUPER_ADMIN','STATUS_MANAGER') THEN RAISE EXCEPTION 'Access denied'; END IF;
  target:='admin_incidents';allowed:=ARRAY['title','summary','impact','status'];
 WHEN 'documents' THEN
  IF actor.role NOT IN ('SUPER_ADMIN','CONTENT_EDITOR') THEN RAISE EXCEPTION 'Access denied'; END IF;
  target:='admin_documents';allowed:=ARRAY['title','asset_key','status'];
 WHEN 'flags' THEN
  IF actor.role<>'SUPER_ADMIN' OR ses.step_up_at IS NULL OR ses.step_up_at<now()-interval '10 minutes' THEN RAISE EXCEPTION 'Step-up required'; END IF;
  target:='admin_feature_flags';allowed:=ARRAY['name','description','enabled'];
 ELSE RAISE EXCEPTION 'Unsupported operation'; END CASE;
 IF jsonb_typeof(p_values)<>'object' OR p_values='{}'::jsonb OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_values) k WHERE NOT(k=ANY(allowed))) THEN RAISE EXCEPTION 'Invalid fields'; END IF;
 IF p_module='support' AND p_values ? 'customer_user_id' AND NOT EXISTS(SELECT 1 FROM public.users WHERE id=(p_values->>'customer_user_id')::uuid AND deleted_at IS NULL) THEN RAISE EXCEPTION 'Customer account not found'; END IF;
 EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE',target) INTO before_row USING p_id;
 IF before_row IS NULL THEN
  SELECT string_agg(format('%I',k),',' ORDER BY k) INTO column_list FROM jsonb_object_keys(p_values) k;
  EXECUTE format('INSERT INTO public.%I (id,%s) SELECT $1,%s FROM jsonb_populate_record(NULL::public.%I,$2) RETURNING to_jsonb(%I)',target,column_list,column_list,target,target) INTO after_row USING p_id,p_values;
 ELSE
  SELECT string_agg(format('%I=r.%I',k,k),',') INTO set_list FROM jsonb_object_keys(p_values) k;
  EXECUTE format('UPDATE public.%I t SET %s,updated_at=now() FROM jsonb_populate_record(NULL::public.%I,$2) r WHERE t.id=$1 RETURNING to_jsonb(t)',target,set_list,target) INTO after_row USING p_id,p_values;
 END IF;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(actor.id,CASE WHEN before_row IS NULL THEN 'CREATE' ELSE 'UPDATE' END,p_module,p_id,p_reason,p_request,COALESCE(before_row,'{}'),after_row);
 RETURN after_row;
END; $$;
REVOKE ALL ON FUNCTION public.admin_console_mutate(uuid,text,text,jsonb,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_console_mutate(uuid,text,text,jsonb,text,uuid) TO service_role;
COMMIT;

