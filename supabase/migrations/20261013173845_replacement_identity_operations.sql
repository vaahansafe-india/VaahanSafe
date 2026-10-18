-- Existing replacement states, inventory, orders and carrier records remain authoritative.
BEGIN;
ALTER TABLE public.replacement_requests
 ADD COLUMN reference_code text NOT NULL DEFAULT ('VS-REP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 ADD COLUMN revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
 ADD COLUMN new_qr_sticker_id text REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
 ADD COLUMN order_id text UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
 ADD COLUMN fulfilment_id text UNIQUE REFERENCES public.fulfilments(id) ON DELETE RESTRICT,
 ADD COLUMN allocated_at timestamptz,ADD COLUMN retired_at timestamptz,ADD COLUMN activated_at timestamptz,ADD COLUMN closed_at timestamptz,
 ADD COLUMN review_note text,
 ADD CONSTRAINT replacement_status_valid CHECK(status IN ('REQUESTED','UNDER_REVIEW','APPROVED','REJECTED','QR_ALLOCATED','MIGRATED','SHIPPED','COMPLETED','CANCELLED')),
 ADD CONSTRAINT replacement_reason_valid CHECK(reason IN ('LOST','DAMAGED','PRINT_DEFECT','DELIVERY_DAMAGE','OTHER')),
 ADD CONSTRAINT replacement_distinct_identity CHECK(new_qr_sticker_id IS DISTINCT FROM old_qr_sticker_id);
CREATE UNIQUE INDEX replacement_reference ON public.replacement_requests(reference_code text_pattern_ops);
CREATE UNIQUE INDEX replacement_open_old ON public.replacement_requests(old_qr_sticker_id) WHERE status NOT IN ('REJECTED','COMPLETED','CANCELLED');
CREATE UNIQUE INDEX replacement_open_vehicle ON public.replacement_requests(vehicle_id) WHERE status NOT IN ('REJECTED','COMPLETED','CANCELLED');
CREATE INDEX replacement_requested_cursor ON public.replacement_requests(requested_at DESC,id DESC);
CREATE INDEX replacement_updated_cursor ON public.replacement_requests(updated_at DESC,id DESC);
CREATE INDEX replacement_new_identity ON public.replacement_requests(new_qr_sticker_id) WHERE new_qr_sticker_id IS NOT NULL;
CREATE INDEX replacement_shipment_lookup ON public.shipments(fulfilment_id,created_at DESC,id DESC);
CREATE INDEX replacement_status_cursor ON public.replacement_requests(status,requested_at DESC,id DESC);
CREATE INDEX replacement_customer_history ON public.replacement_requests(user_id,requested_at DESC);
CREATE UNIQUE INDEX replacement_reserved_identity ON public.qr_reservations(qr_sticker_id) WHERE status IN ('RESERVED','ALLOCATED');
CREATE UNIQUE INDEX replacement_reserved_fulfilment ON public.qr_reservations(fulfilment_id) WHERE status IN ('RESERVED','ALLOCATED') AND fulfilment_id IS NOT NULL;
ALTER TABLE public.sticker_replacements ADD CONSTRAINT replacement_link_distinct CHECK(old_qr_sticker_id<>new_qr_sticker_id);
CREATE UNIQUE INDEX replacement_lineage_old ON public.sticker_replacements(old_qr_sticker_id);
CREATE UNIQUE INDEX replacement_lineage_new ON public.sticker_replacements(new_qr_sticker_id);
-- RESTRICT: retain handover evidence when any account, vehicle or QR changes.
CREATE TABLE public.admin_replacement_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),replacement_id text NOT NULL REFERENCES public.replacement_requests(id) ON DELETE RESTRICT,
 actor_type text NOT NULL CHECK(actor_type IN ('CUSTOMER','ADMIN','SYSTEM')),actor_id text,action text NOT NULL,
 from_status text,to_status text,reason text NOT NULL,metadata jsonb NOT NULL DEFAULT '{}',occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX replacement_event_cursor ON public.admin_replacement_events(replacement_id,occurred_at DESC,id DESC);
CREATE TABLE public.admin_replacement_commands (
 request_id uuid PRIMARY KEY,actor_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 replacement_id text NOT NULL REFERENCES public.replacement_requests(id) ON DELETE RESTRICT,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.replacement_entitlement_snapshots (
 replacement_id text NOT NULL REFERENCES public.replacement_requests(id) ON DELETE RESTRICT,capability text NOT NULL,
 expires_at timestamptz,acquisition_source text NOT NULL,original_order_id text REFERENCES public.orders(id) ON DELETE RESTRICT,verified_at timestamptz NOT NULL,
 PRIMARY KEY(replacement_id,capability)
);
DO $$ DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['admin_replacement_events','admin_replacement_commands','replacement_entitlement_snapshots'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT SELECT,INSERT ON public.%I TO service_role',t);EXECUTE format('CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable()',t);
END LOOP;END;$$;
CREATE TRIGGER replacement_link_immutable BEFORE UPDATE OR DELETE ON public.sticker_replacements FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable();
REVOKE INSERT,UPDATE,DELETE ON public.replacement_requests,public.sticker_replacements,public.qr_reservations FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.replacement_requests,public.qr_reservations TO service_role;
GRANT SELECT,INSERT ON public.sticker_replacements TO service_role;
CREATE FUNCTION public.replacement_revision() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NEW.user_id<>OLD.user_id OR NEW.vehicle_id<>OLD.vehicle_id OR NEW.old_qr_sticker_id<>OLD.old_qr_sticker_id OR NEW.reference_code<>OLD.reference_code OR (OLD.new_qr_sticker_id IS NOT NULL AND NEW.new_qr_sticker_id IS DISTINCT FROM OLD.new_qr_sticker_id) THEN RAISE EXCEPTION 'IMMUTABLE_REPLACEMENT_IDENTITY';END IF;
 NEW.revision:=OLD.revision+1;NEW.updated_at:=clock_timestamp();RETURN NEW;END;$$;
CREATE TRIGGER replacement_revision BEFORE UPDATE ON public.replacement_requests FOR EACH ROW EXECUTE FUNCTION public.replacement_revision();

CREATE FUNCTION public.replacement_admin_actor(p_session uuid,p_write boolean DEFAULT false,p_fresh boolean DEFAULT false) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;BEGIN SELECT a.id INTO actor FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.id=p_session AND s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','SUPPORT_AGENT','READ_ONLY_ANALYST') AND (NOT p_write OR a.role IN ('SUPER_ADMIN','OPS_ADMIN')) AND (NOT p_fresh OR s.step_up_at>now()-interval '10 minutes');IF actor IS NULL THEN RAISE EXCEPTION 'ADMIN_REQUIRED';END IF;RETURN actor;END;$$;
CREATE FUNCTION public.replacement_customer_actor(p_session text) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;BEGIN SELECT u.id INTO actor FROM public.sessions s JOIN public.users u ON u.id=s.user_id WHERE s.id::text=p_session AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status='ACTIVE' AND EXISTS(SELECT 1 FROM public.auth_identities ai WHERE ai.user_id=u.id AND ai.provider='PHONE' AND ai.provider_user_id=u.primary_phone AND ai.verified_at IS NOT NULL);IF actor IS NULL THEN RAISE EXCEPTION 'VERIFIED_OWNER_REQUIRED';END IF;RETURN actor;END;$$;
CREATE FUNCTION public.replacement_owner_eligible(p_id text) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.replacement_requests r JOIN public.users u ON u.id::text=r.user_id JOIN public.vehicles v ON v.id=r.vehicle_id AND v.user_id=r.user_id JOIN public.qr_stickers q ON q.id=r.old_qr_sticker_id JOIN public.qr_assignments a ON a.qr_id=q.id AND a.vehicle_id=v.id AND a.user_id=u.id::text AND a.ended_at IS NULL
 WHERE r.id=p_id AND u.status='ACTIVE' AND v.status='ACTIVE' AND q.status='ACTIVATED' AND EXISTS(SELECT 1 FROM public.auth_identities ai WHERE ai.user_id=u.id AND ai.provider='PHONE' AND ai.provider_user_id=u.primary_phone AND ai.verified_at IS NOT NULL)
 AND EXISTS(SELECT 1 FROM public.service_entitlements e WHERE e.user_id=u.id::text AND e.vehicle_id=v.id AND e.qr_sticker_id=q.id AND e.capability='REPLACEMENT_ELIGIBLE' AND e.status='ENABLED' AND (e.expires_at IS NULL OR e.expires_at>now())));
$$;
CREATE FUNCTION public.replacement_order_eligible(p_replacement text,p_order text) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.replacement_requests r JOIN public.orders o ON o.user_id=r.user_id AND o.vehicle_id=r.vehicle_id WHERE r.id=p_replacement AND o.id=p_order AND o.payment_state='PAID' AND o.paid_at IS NOT NULL AND o.currency='INR' AND o.total_minor>0 AND o.status NOT IN ('CANCELLED','REFUNDED','EXPIRED')
 AND EXISTS(SELECT 1 FROM public.order_items i JOIN public.products p ON p.id=i.product_id WHERE i.order_id=o.id AND p.product_type='REPLACEMENT_STICKER' AND i.quantity>=1)
 AND NOT EXISTS(SELECT 1 FROM public.replacement_requests other WHERE other.order_id=o.id AND other.id<>r.id));
$$;
CREATE FUNCTION public.replacement_inventory_eligible(p_qr text) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.qr_stickers q JOIN public.qr_batches b ON b.id=q.batch_id JOIN public.qr_activation_secrets sec ON sec.qr_id=q.id
 WHERE q.id=p_qr AND q.status='PRINTED' AND q.lifecycle_state='PRINTED' AND b.inventory_channel='ONLINE_SYSTEM' AND b.status IN ('PRINTED','RECEIVED','CLOSED')
 AND (b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items pi WHERE pi.qr_id=q.id AND pi.printed_at IS NOT NULL))
 AND q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL AND q.current_distributor_id IS NULL AND q.current_retailer_id IS NULL
 AND sec.consumed_at IS NULL AND sec.secret_hash<>'' AND (sec.locked_until IS NULL OR sec.locked_until<=now())
 AND NOT EXISTS(SELECT 1 FROM public.qr_assignments a WHERE a.qr_id=q.id AND a.ended_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.qr_reservations x WHERE x.qr_sticker_id=q.id AND x.status IN ('RESERVED','ALLOCATED'))
 AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items x WHERE x.qr_id=q.id AND x.released_at IS NULL));
$$;
CREATE FUNCTION public.replacement_delivered(p_fulfilment text) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT coalesce((SELECT s.status='DELIVERED' AND s.delivered_at IS NOT NULL FROM public.shipments s WHERE s.fulfilment_id=p_fulfilment ORDER BY s.created_at DESC,s.id DESC LIMIT 1),false);
$$;

CREATE VIEW public.admin_replacement_projection WITH(security_invoker=true) AS
WITH base AS (
SELECT r.id,r.reference_code,r.user_id,r.vehicle_id,r.old_qr_sticker_id,r.new_qr_sticker_id,r.reason,r.status,r.revision,r.requested_at,r.approved_at,r.allocated_at,r.retired_at,r.activated_at,r.closed_at,r.updated_at,r.created_at,
 coalesce(nullif(u.full_name,''),'Vehicle owner') AS customer_name,v.make,v.model,v.color,v.vehicle_type,
 substr(v.registration_number,1,4)||' •••• '||right(v.registration_number,4) AS registration_masked,
 q.visible_code AS old_visible_code,q.status AS old_qr_status,n.visible_code AS new_visible_code,n.status AS new_qr_status,
 r.order_id,o.order_number,o.payment_state,r.fulfilment_id,f.status AS fulfilment_status,f.packed_at,
 ship.id AS shipment_id,ship.status AS shipment_status,ship.tracking_reference,ship.waybill_number,ship.courier_code,ship.shipped_at,ship.delivered_at,
 CASE WHEN r.status IN ('MIGRATED','SHIPPED','COMPLETED') THEN u.status='ACTIVE' AND v.status='ACTIVE' AND v.user_id=r.user_id AND q.status='REPLACED' AND EXISTS(SELECT 1 FROM public.sticker_replacements sr WHERE sr.replacement_request_id=r.id AND sr.old_qr_sticker_id=q.id AND sr.new_qr_sticker_id=r.new_qr_sticker_id AND sr.vehicle_id=v.id) ELSE public.replacement_owner_eligible(r.id) END AS eligible,
 CASE WHEN r.reason='LOST' THEN (SELECT count(*)::integer FROM public.qr_scan_events se WHERE se.qr_id=q.id AND se.created_at>=r.requested_at) ELSE 0 END AS scans_after_report,
 (SELECT count(*)::integer FROM public.replacement_requests prior WHERE prior.user_id=r.user_id AND prior.requested_at>=r.requested_at-interval '90 days' AND prior.requested_at<r.requested_at AND prior.status NOT IN ('REJECTED','CANCELLED')) AS prior_replacements,
 (SELECT count(*)::integer FROM public.qr_activation_attempts aa WHERE aa.qr_id=q.id AND aa.created_at>=r.requested_at-interval '30 days' AND aa.outcome<>'SUCCESS') AS failed_attempts
FROM public.replacement_requests r JOIN public.users u ON u.id::text=r.user_id JOIN public.vehicles v ON v.id=r.vehicle_id JOIN public.qr_stickers q ON q.id=r.old_qr_sticker_id
LEFT JOIN public.qr_stickers n ON n.id=r.new_qr_sticker_id LEFT JOIN public.orders o ON o.id=r.order_id LEFT JOIN public.fulfilments f ON f.id=r.fulfilment_id
LEFT JOIN LATERAL(SELECT s.id,s.status,s.tracking_reference,s.waybill_number,s.courier_code,coalesce(s.shipped_at,s.dispatched_at) AS shipped_at,s.delivered_at FROM public.shipments s WHERE s.fulfilment_id=f.id ORDER BY s.created_at DESC,s.id DESC LIMIT 1) ship ON true
),risk AS (
 SELECT b.*,CASE WHEN NOT eligible OR scans_after_report>0 THEN 'HIGH' WHEN reason='LOST' OR prior_replacements>=2 OR failed_attempts>0 THEN 'MEDIUM' ELSE 'LOW' END AS risk_level,
 array_remove(ARRAY[CASE WHEN NOT eligible THEN 'OWNERSHIP_OR_ENTITLEMENT_REVIEW' END,CASE WHEN scans_after_report>0 THEN 'OLD_QR_SCANNED_AFTER_REPORT' END,CASE WHEN reason='LOST' THEN 'REPORTED_LOST' END,CASE WHEN prior_replacements>=2 THEN 'REPEATED_REPLACEMENTS' END,CASE WHEN failed_attempts>0 THEN 'ACTIVATION_FAILURES' END],NULL) AS risk_signals,
 CASE WHEN status='COMPLETED' THEN 'CLOSED' WHEN status IN ('REJECTED','CANCELLED') THEN status WHEN activated_at IS NOT NULL THEN 'ACTIVATED' WHEN shipment_status='DELIVERED' THEN 'ACTIVATION_PENDING' WHEN shipment_status IN ('DELIVERY_FAILED','RTO_INITIATED','RTO_DELIVERED','CANCELLED') THEN 'SHIPMENT_EXCEPTION' WHEN status IN ('MIGRATED','SHIPPED') THEN 'FULFILMENT' ELSE status END AS stage FROM base b
)
SELECT x.*,CASE WHEN status IN ('COMPLETED','REJECTED','CANCELLED') THEN NULL WHEN NOT eligible THEN 'ELIGIBILITY_REVIEW_REQUIRED' WHEN scans_after_report>0 AND status IN ('REQUESTED','UNDER_REVIEW') THEN 'OLD_QR_SCANNED_AFTER_REPORT' WHEN stage='SHIPMENT_EXCEPTION' THEN 'SHIPMENT_EXCEPTION' WHEN stage='ACTIVATION_PENDING' AND delivered_at<now()-interval '7 days' THEN 'DELIVERED_NOT_ACTIVATED' WHEN status IN ('REQUESTED','UNDER_REVIEW') AND requested_at<now()-interval '2 days' THEN 'REVIEW_OVERDUE' WHEN status='APPROVED' AND order_id IS NULL THEN 'PAID_REPLACEMENT_ORDER_REQUIRED' ELSE NULL END AS attention FROM risk x;
REVOKE ALL ON public.admin_replacement_projection FROM PUBLIC,anon,authenticated;GRANT SELECT ON public.admin_replacement_projection TO service_role;

CREATE FUNCTION public.replacement_filter_clause(f jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE c text:='true';column_name text;BEGIN
 IF coalesce(f->>'q','')<>'' THEN c:=c||' AND (p.reference_code ILIKE ($1->>''q'')||''%'' OR p.old_visible_code ILIKE ($1->>''q'')||''%'' OR p.new_visible_code ILIKE ($1->>''q'')||''%'' OR p.customer_name ILIKE ($1->>''q'')||''%'' OR p.order_number ILIKE ($1->>''q'')||''%'' OR p.tracking_reference ILIKE ($1->>''q'')||''%'' OR p.waybill_number ILIKE ($1->>''q'')||''%'' OR EXISTS(SELECT 1 FROM public.vehicles v WHERE v.id=p.vehicle_id AND replace(v.registration_number,'' '','''') ILIKE replace($1->>''q'','' '','''')||''%''))';END IF;
 IF coalesce(f->>'status','')<>'' THEN c:=c||' AND p.status=$1->>''status''';END IF;
 IF coalesce(f->>'reason','')<>'' THEN c:=c||' AND p.reason=$1->>''reason''';END IF;
 IF coalesce(f->>'risk','')<>'' THEN c:=c||' AND p.risk_level=$1->>''risk''';END IF;
 IF f->>'scope'='review' THEN c:=c||' AND p.status IN (''REQUESTED'',''UNDER_REVIEW'')';
 ELSIF f->>'scope'='risk' THEN c:=c||' AND p.status NOT IN (''COMPLETED'',''REJECTED'',''CANCELLED'') AND p.risk_level<>''LOW''';
 ELSIF f->>'scope'='issue' THEN c:=c||' AND p.status=''APPROVED''';
 ELSIF f->>'scope'='fulfilment' THEN c:=c||' AND p.stage=''FULFILMENT''';
 ELSIF f->>'scope'='activation' THEN c:=c||' AND p.stage IN (''ACTIVATION_PENDING'',''ACTIVATED'')';
 ELSIF f->>'scope'='attention' THEN c:=c||' AND p.attention IS NOT NULL';
 ELSIF f->>'scope'='closed' THEN c:=c||' AND p.status=''COMPLETED''';END IF;
 IF f->>'qr'='old_active' THEN c:=c||' AND p.old_qr_status=''ACTIVATED''';ELSIF f->>'qr'='old_retired' THEN c:=c||' AND p.old_qr_status=''REPLACED''';ELSIF f->>'qr'='unallocated' THEN c:=c||' AND p.new_qr_sticker_id IS NULL';ELSIF f->>'qr'='allocated' THEN c:=c||' AND p.new_qr_sticker_id IS NOT NULL';ELSIF f->>'qr'='new_active' THEN c:=c||' AND p.new_qr_status=''ACTIVATED''';END IF;
 column_name:=CASE f->>'dateMode' WHEN 'approved' THEN 'p.approved_at' WHEN 'shipped' THEN 'p.shipped_at' WHEN 'delivered' THEN 'p.delivered_at' WHEN 'activated' THEN 'p.activated_at' WHEN 'closed' THEN 'p.closed_at' ELSE 'p.requested_at' END;
 IF coalesce(f->>'from','')<>'' THEN c:=c||' AND '||column_name||'>=(($1->>''from'')::date::timestamp AT TIME ZONE ''Asia/Kolkata'')';END IF;
 IF coalesce(f->>'to','')<>'' THEN c:=c||' AND '||column_name||'<((($1->>''to'')::date+1)::timestamp AT TIME ZONE ''Asia/Kolkata'')';END IF;
 RETURN c;END;$$;
CREATE FUNCTION public.replacement_query(f jsonb,c jsonb DEFAULT NULL,lim integer DEFAULT 51,ids text[] DEFAULT NULL,before_at timestamptz DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE clause text:=public.replacement_filter_clause(f);sort_col text:='p.requested_at';direction text:='DESC';result jsonb;BEGIN
 IF f->>'sort' IN ('oldest','pending') THEN direction:='ASC';END IF;IF f->>'sort'='updated' THEN sort_col:='p.updated_at';END IF;
 IF f->>'sort'='pending' THEN clause:=clause||' AND p.status NOT IN (''COMPLETED'',''REJECTED'',''CANCELLED'')';END IF;
 IF c IS NOT NULL THEN clause:=clause||' AND ('||sort_col||',p.id)'||CASE WHEN direction='ASC' THEN '>' ELSE '<' END||'(($2->>''value'')::timestamptz,$2->>''id'')';END IF;
 IF ids IS NOT NULL THEN clause:=clause||' AND p.id=ANY($3)';END IF;IF before_at IS NOT NULL THEN clause:=clause||' AND p.requested_at<=$4';END IF;
 EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM(SELECT p.id,p.reference_code,p.user_id,p.vehicle_id,p.old_qr_sticker_id,p.new_qr_sticker_id,p.reason,p.status,p.revision,p.stage,p.requested_at,p.updated_at,p.approved_at,p.allocated_at,p.retired_at,p.activated_at,p.closed_at,p.customer_name,p.make,p.model,p.color,p.vehicle_type,p.registration_masked,p.old_visible_code,p.old_qr_status,p.new_visible_code,p.new_qr_status,p.risk_level,p.risk_signals,p.attention,p.eligible,p.scans_after_report,p.prior_replacements,p.failed_attempts,p.order_id,p.order_number,p.payment_state,p.fulfilment_id,p.fulfilment_status,p.shipment_id,p.shipment_status,p.tracking_reference,p.waybill_number,p.courier_code,p.shipped_at,p.delivered_at,'||sort_col||'::text AS sort_value FROM public.admin_replacement_projection p WHERE '||clause||' ORDER BY '||sort_col||' '||direction||',p.id '||direction||' LIMIT '||least(greatest(lim,1),501)||')r' INTO result USING f,c,ids,before_at;RETURN result;END;$$;
CREATE FUNCTION public.admin_replacement_list(p_session uuid,p_filters jsonb DEFAULT '{}',p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN PERFORM public.replacement_admin_actor(p_session);RETURN public.replacement_query(p_filters,p_cursor);END;$$;
CREATE FUNCTION public.admin_replacement_summary(p_session uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.replacement_admin_actor(p_session);SELECT jsonb_build_object('total',count(*),'review',count(*) FILTER(WHERE status IN ('REQUESTED','UNDER_REVIEW')),'risk',count(*) FILTER(WHERE risk_level<>'LOW' AND status NOT IN ('COMPLETED','REJECTED','CANCELLED')),'issue',count(*) FILTER(WHERE status='APPROVED'),'fulfilment',count(*) FILTER(WHERE stage='FULFILMENT'),'activation',count(*) FILTER(WHERE stage IN ('ACTIVATION_PENDING','ACTIVATED')),'attention',count(*) FILTER(WHERE attention IS NOT NULL)) INTO result FROM public.admin_replacement_projection;RETURN result;END;$$;

CREATE FUNCTION public.customer_request_replacement(p_session text,p_qr text,p_reason text,p_notes text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;vehicle text;target text;BEGIN actor:=public.replacement_customer_actor(p_session);
 IF p_request IS NULL OR p_reason NOT IN ('LOST','DAMAGED','PRINT_DEFECT','DELIVERY_DAMAGE','OTHER') OR length(coalesce(p_notes,''))>2000 THEN RAISE EXCEPTION 'INVALID_REPLACEMENT';END IF;
 SELECT v.id INTO vehicle FROM public.qr_stickers q JOIN public.qr_assignments a ON a.qr_id=q.id AND a.ended_at IS NULL JOIN public.vehicles v ON v.id=a.vehicle_id AND v.user_id=actor AND v.status='ACTIVE' WHERE q.id=p_qr AND a.user_id=actor AND q.status='ACTIVATED' FOR UPDATE OF q,v;
 IF vehicle IS NULL OR NOT EXISTS(SELECT 1 FROM public.service_entitlements e WHERE e.user_id=actor AND e.vehicle_id=vehicle AND e.qr_sticker_id=p_qr AND e.capability='REPLACEMENT_ELIGIBLE' AND e.status='ENABLED' AND (e.expires_at IS NULL OR e.expires_at>now())) THEN RAISE EXCEPTION 'REPLACEMENT_INELIGIBLE';END IF;
 SELECT id INTO target FROM public.replacement_requests WHERE vehicle_id=vehicle AND status NOT IN ('REJECTED','COMPLETED','CANCELLED');IF target IS NOT NULL THEN RETURN target;END IF;
 target:='rpr_'||gen_random_uuid()::text;INSERT INTO public.replacement_requests(id,user_id,vehicle_id,old_qr_sticker_id,reason,user_notes,status) VALUES(target,actor,vehicle,p_qr,p_reason,nullif(trim(p_notes),''),'REQUESTED');
 INSERT INTO public.admin_replacement_events(replacement_id,actor_type,actor_id,action,to_status,reason) VALUES(target,'CUSTOMER',actor,'REQUESTED','REQUESTED','Vehicle owner requested a QR replacement: '||p_reason);RETURN target;END;$$;

CREATE FUNCTION public.admin_replacement_detail(p_session uuid,p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.replacement_admin_actor(p_session);
 SELECT jsonb_build_object('record',to_jsonb(p),'notes',r.user_notes,'reviewNote',r.review_note,'rejectionReason',r.rejection_reason,'approvedBy',a.name,'evidence','No replacement evidence has been recorded.') INTO result FROM public.admin_replacement_projection p JOIN public.replacement_requests r ON r.id=p.id LEFT JOIN public.admin_users a ON a.id=r.approved_by WHERE p.id=p_id;
 IF result IS NULL THEN RAISE EXCEPTION 'NOT_FOUND';END IF;RETURN result;END;$$;
CREATE FUNCTION public.admin_replacement_options(p_session uuid,p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.replacement_admin_actor(p_session);
 IF NOT EXISTS(SELECT 1 FROM public.replacement_requests WHERE id=p_id) THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
 SELECT jsonb_build_object('orders',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM(SELECT o.id,o.order_number,o.total_minor,o.currency FROM public.orders o JOIN public.replacement_requests r ON r.user_id=o.user_id WHERE r.id=p_id AND public.replacement_order_eligible(p_id,o.id) AND NOT EXISTS(SELECT 1 FROM public.fulfilments f WHERE f.order_id=o.id) ORDER BY o.created_at DESC LIMIT 50)x),'batches',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM(SELECT b.id,b.reference_code,count(*) AS available FROM public.qr_stickers q JOIN public.qr_batches b ON b.id=q.batch_id WHERE public.replacement_inventory_eligible(q.id) GROUP BY b.id,b.reference_code ORDER BY b.reference_code LIMIT 50)x)) INTO result;RETURN result;END;$$;
CREATE FUNCTION public.admin_replacement_history(p_session uuid,p_id text,p_section text,p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.replacement_admin_actor(p_session);IF NOT EXISTS(SELECT 1 FROM public.replacement_requests WHERE id=p_id) THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
 IF p_section='timeline' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO result FROM(SELECT e.id::text,e.action,e.reason,e.occurred_at AS created_at,coalesce(a.name,CASE WHEN e.actor_type='CUSTOMER' THEN 'Vehicle owner' ELSE 'System' END) AS actor_name,e.from_status,e.to_status,e.metadata FROM public.admin_replacement_events e LEFT JOIN public.admin_users a ON e.actor_type='ADMIN' AND a.id=e.actor_id WHERE e.replacement_id=p_id AND (p_cursor IS NULL OR (e.occurred_at,e.id::text)<((p_cursor->>'value')::timestamptz,p_cursor->>'id')) ORDER BY e.occurred_at DESC,e.id DESC LIMIT 21)x;
 ELSIF p_section='audit' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO result FROM(SELECT l.id::text,l.action,l.reason,l.created_at,a.name AS actor_name,l.after_summary AS metadata FROM public.admin_audit_logs l LEFT JOIN public.admin_users a ON a.id=l.actor_id WHERE l.resource_type='replacements' AND l.resource_id=p_id AND (p_cursor IS NULL OR (l.created_at,l.id::text)<((p_cursor->>'value')::timestamptz,p_cursor->>'id')) ORDER BY l.created_at DESC,l.id DESC LIMIT 21)x;
 ELSIF p_section='lineage' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO result FROM(SELECT sr.id,oq.visible_code AS old_visible_code,nq.visible_code AS new_visible_code,sr.created_at,sr.migrated_at,sr.reason FROM public.sticker_replacements sr JOIN public.qr_stickers oq ON oq.id=sr.old_qr_sticker_id JOIN public.qr_stickers nq ON nq.id=sr.new_qr_sticker_id WHERE sr.vehicle_id=(SELECT vehicle_id FROM public.replacement_requests WHERE id=p_id) AND (p_cursor IS NULL OR (sr.created_at,sr.id)<((p_cursor->>'value')::timestamptz,p_cursor->>'id')) ORDER BY sr.created_at DESC,sr.id DESC LIMIT 21)x;
 ELSE RAISE EXCEPTION 'INVALID_SECTION';END IF;RETURN result;END;$$;

CREATE FUNCTION public.admin_replacement_command(p_session uuid,p_id text,p_action text,p_revision integer,p_values jsonb,p_reason text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;old public.replacement_requests;prior public.admin_replacement_commands;payload jsonb;new_qr text;new_fulfilment text;chosen_order public.orders;next_status text;old_qr_status text;BEGIN
 actor:=public.replacement_admin_actor(p_session,true,true);
 IF p_request IS NULL OR p_values IS NULL OR length(trim(coalesce(p_reason,''))) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'INVALID_COMMAND';END IF;
 payload:=jsonb_build_object('id',p_id,'action',p_action,'revision',p_revision,'values',p_values,'reason',trim(p_reason));
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));SELECT * INTO prior FROM public.admin_replacement_commands WHERE request_id=p_request;
 IF FOUND THEN IF prior.actor_id<>actor OR prior.payload<>payload THEN RAISE EXCEPTION 'REQUEST_CONFLICT';END IF;RETURN prior.replacement_id;END IF;
 SELECT * INTO old FROM public.replacement_requests WHERE id=p_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
 IF p_revision IS DISTINCT FROM old.revision THEN RAISE EXCEPTION 'STATE_CHANGED';END IF;next_status:=old.status;
 PERFORM id FROM public.vehicles WHERE id=old.vehicle_id AND user_id=old.user_id AND status='ACTIVE' FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_OWNER';END IF;
 PERFORM id FROM public.qr_stickers WHERE id IN (old.old_qr_sticker_id,old.new_qr_sticker_id) ORDER BY id FOR UPDATE;
 IF p_action IN ('review','approve','allocate','retire') AND NOT public.replacement_owner_eligible(p_id) THEN RAISE EXCEPTION 'INVALID_ELIGIBILITY';END IF;
 IF p_action='review' AND old.status='REQUESTED' THEN next_status:='UNDER_REVIEW';UPDATE public.replacement_requests SET status=next_status,review_note=trim(p_reason) WHERE id=p_id;
 ELSIF p_action='approve' AND old.status IN ('REQUESTED','UNDER_REVIEW') THEN
 IF coalesce((p_values->>'riskAcknowledged')::boolean,false) IS NOT TRUE THEN RAISE EXCEPTION 'INVALID_RISK_REVIEW';END IF;
 next_status:='APPROVED';UPDATE public.replacement_requests SET status=next_status,approved_by=actor,approved_at=now(),review_note=trim(p_reason) WHERE id=p_id;
 ELSIF p_action='reject' AND old.status IN ('REQUESTED','UNDER_REVIEW') THEN next_status:='REJECTED';UPDATE public.replacement_requests SET status=next_status,rejection_reason=trim(p_reason),rejected_at=now() WHERE id=p_id;
 ELSIF p_action='allocate' AND old.status='APPROVED' THEN
 SELECT * INTO chosen_order FROM public.orders WHERE id=p_values->>'order' FOR UPDATE;
 IF NOT FOUND OR NOT public.replacement_order_eligible(p_id,chosen_order.id) OR EXISTS(SELECT 1 FROM public.fulfilments WHERE order_id=chosen_order.id) OR (nullif(chosen_order.shipping_address_line1,'') IS NULL OR nullif(chosen_order.shipping_postal_code,'') IS NULL) THEN RAISE EXCEPTION 'INVALID_PAID_ORDER';END IF;
 SELECT q.id INTO new_qr FROM public.qr_stickers q WHERE public.replacement_inventory_eligible(q.id) AND (nullif(p_values->>'batch','') IS NULL OR q.batch_id=p_values->>'batch') ORDER BY q.created_at,q.id FOR UPDATE SKIP LOCKED LIMIT 1;
 IF new_qr IS NULL OR NOT public.replacement_inventory_eligible(new_qr) THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
 new_fulfilment:='ful_'||gen_random_uuid()::text;
 INSERT INTO public.fulfilments(id,order_id,user_id,type,status,shipping_address_snapshot_json,processing_at) VALUES(new_fulfilment,chosen_order.id,old.user_id,'REPLACEMENT_QR','PROCESSING',jsonb_build_object('recipientName',chosen_order.shipping_name,'phone',chosen_order.shipping_phone,'line1',chosen_order.shipping_address_line1,'line2',chosen_order.shipping_address_line2,'city',chosen_order.shipping_city,'state',chosen_order.shipping_state,'postalCode',chosen_order.shipping_postal_code,'countryCode','IN')::text,now());
 INSERT INTO public.qr_reservations(id,qr_sticker_id,fulfilment_id,order_id,status) VALUES('res_'||gen_random_uuid()::text,new_qr,new_fulfilment,chosen_order.id,'RESERVED');
 UPDATE public.qr_stickers SET status='ALLOCATED',lifecycle_state='ALLOCATED',updated_at=now() WHERE id=new_qr;
 INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,changed_by,change_reason,actor_type,actor_id) VALUES('qsh_'||gen_random_uuid()::text,new_qr,'PRINTED','ALLOCATED',actor,trim(p_reason),'ADMIN',actor);
 next_status:='QR_ALLOCATED';UPDATE public.replacement_requests SET status=next_status,new_qr_sticker_id=new_qr,order_id=chosen_order.id,fulfilment_id=new_fulfilment,allocated_at=now() WHERE id=p_id;
 ELSIF p_action='retire' AND old.status='QR_ALLOCATED' THEN
 PERFORM id FROM public.orders WHERE id=old.order_id FOR UPDATE;IF NOT public.replacement_order_eligible(p_id,old.order_id) OR NOT EXISTS(SELECT 1 FROM public.qr_reservations WHERE qr_sticker_id=old.new_qr_sticker_id AND fulfilment_id=old.fulfilment_id AND status='RESERVED') OR NOT EXISTS(SELECT 1 FROM public.qr_stickers WHERE id=old.new_qr_sticker_id AND status='ALLOCATED') THEN RAISE EXCEPTION 'INVALID_HANDOVER';END IF;
 INSERT INTO public.replacement_entitlement_snapshots(replacement_id,capability,expires_at,acquisition_source,original_order_id,verified_at) SELECT p_id,capability,expires_at,acquisition_source,order_id,coalesce(verified_at,now()) FROM public.service_entitlements WHERE qr_sticker_id=old.old_qr_sticker_id AND user_id=old.user_id AND vehicle_id=old.vehicle_id AND status='ENABLED' AND (expires_at IS NULL OR expires_at>now());
 UPDATE public.qr_assignments SET ended_at=now(),end_reason='REPLACED',is_current=0,updated_at=now() WHERE qr_id=old.old_qr_sticker_id AND ended_at IS NULL;
 UPDATE public.service_entitlements SET status='REVOKED',updated_at=now() WHERE qr_sticker_id=old.old_qr_sticker_id AND status='ENABLED';
 UPDATE public.qr_stickers SET status='REPLACED',lifecycle_state='REPLACED',replaced_by_qr_id=old.new_qr_sticker_id,updated_at=now() WHERE id=old.old_qr_sticker_id;
 INSERT INTO public.sticker_replacements(id,replacement_request_id,old_qr_sticker_id,new_qr_sticker_id,vehicle_id,reason,migrated_at) VALUES('rep_'||gen_random_uuid()::text,p_id,old.old_qr_sticker_id,old.new_qr_sticker_id,old.vehicle_id,old.reason,now());
 INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,changed_by,change_reason,actor_type,actor_id) VALUES('qsh_'||gen_random_uuid()::text,old.old_qr_sticker_id,'ACTIVATED','REPLACED',actor,trim(p_reason),'ADMIN',actor);
 next_status:='MIGRATED';UPDATE public.replacement_requests SET status=next_status,retired_at=now() WHERE id=p_id;
 ELSIF p_action='pack' AND old.status='MIGRATED' THEN
 IF NOT public.replacement_order_eligible(p_id,old.order_id) THEN RAISE EXCEPTION 'INVALID_PAID_ORDER';END IF;
 UPDATE public.fulfilments SET status='PACKED',packed_at=now(),updated_at=now() WHERE id=old.fulfilment_id AND status='PROCESSING';IF NOT FOUND THEN RAISE EXCEPTION 'STATE_CHANGED';END IF;
 UPDATE public.replacement_requests SET updated_at=now() WHERE id=p_id;
 ELSIF p_action='sync_shipment' AND old.status IN ('MIGRATED','SHIPPED') THEN
 IF NOT EXISTS(SELECT 1 FROM public.shipments WHERE fulfilment_id=old.fulfilment_id AND status IN ('PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED') AND coalesce(shipped_at,dispatched_at) IS NOT NULL) THEN RAISE EXCEPTION 'INVALID_SHIPMENT';END IF;
 next_status:='SHIPPED';UPDATE public.replacement_requests SET status=next_status WHERE id=p_id;
 ELSIF p_action='close' AND old.status IN ('MIGRATED','SHIPPED') AND old.activated_at IS NOT NULL THEN
 IF NOT public.replacement_order_eligible(p_id,old.order_id) OR NOT EXISTS(SELECT 1 FROM public.qr_stickers q JOIN public.qr_assignments a ON a.qr_id=q.id AND a.vehicle_id=old.vehicle_id AND a.user_id=old.user_id AND a.ended_at IS NULL WHERE q.id=old.new_qr_sticker_id AND q.status='ACTIVATED') OR NOT public.replacement_delivered(old.fulfilment_id) THEN RAISE EXCEPTION 'INVALID_CLOSURE';END IF;
 next_status:='COMPLETED';UPDATE public.replacement_requests SET status=next_status,completed_at=now(),closed_at=now() WHERE id=p_id;
 ELSIF p_action='cancel' AND old.status IN ('REQUESTED','UNDER_REVIEW','APPROVED','QR_ALLOCATED') THEN
 IF old.new_qr_sticker_id IS NOT NULL THEN
 UPDATE public.qr_reservations SET status='RELEASED',released_at=now(),updated_at=now() WHERE fulfilment_id=old.fulfilment_id AND status='RESERVED';
 UPDATE public.qr_stickers SET status='PRINTED',lifecycle_state='PRINTED',updated_at=now() WHERE id=old.new_qr_sticker_id AND status='ALLOCATED';IF NOT FOUND THEN RAISE EXCEPTION 'STATE_CHANGED';END IF;
 UPDATE public.fulfilments SET status='CANCELLED',cancelled_at=now(),updated_at=now() WHERE id=old.fulfilment_id AND status='PROCESSING';IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_FULFILMENT';END IF;END IF;
 next_status:='CANCELLED';UPDATE public.replacement_requests SET status=next_status WHERE id=p_id;
 ELSE RAISE EXCEPTION 'INVALID_TRANSITION';END IF;
 INSERT INTO public.admin_replacement_commands(request_id,actor_id,replacement_id,payload) VALUES(p_request,actor,p_id,payload);
 INSERT INTO public.admin_replacement_events(replacement_id,actor_type,actor_id,action,from_status,to_status,reason,metadata) VALUES(p_id,'ADMIN',actor,upper(p_action),old.status,next_status,trim(p_reason),jsonb_build_object('paymentRequired',true,'oldRetired',p_action='retire'));
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) SELECT actor,'replacement.'||p_action,'replacements',p_id,trim(p_reason),p_request,jsonb_build_object('status',old.status,'revision',old.revision),jsonb_build_object('status',status,'revision',revision) FROM public.replacement_requests WHERE id=p_id;
 RETURN p_id;END;$$;

-- Only the server can supply a verified hash. It must still match the locked current secret.
CREATE FUNCTION public.customer_activate_replacement(p_session text,p_id text,p_verified_hash text) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;r public.replacement_requests;sec public.qr_activation_secrets;BEGIN actor:=public.replacement_customer_actor(p_session);
 SELECT * INTO r FROM public.replacement_requests WHERE id=p_id AND user_id=actor FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
 PERFORM id FROM public.vehicles WHERE id=r.vehicle_id AND user_id=actor AND status='ACTIVE' FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_OWNER';END IF;
 IF r.activated_at IS NOT NULL THEN RETURN r.id;END IF;
 PERFORM id FROM public.orders WHERE id=r.order_id FOR UPDATE;
 PERFORM id FROM public.qr_stickers WHERE id IN (r.old_qr_sticker_id,r.new_qr_sticker_id) ORDER BY id FOR UPDATE;
 SELECT * INTO sec FROM public.qr_activation_secrets WHERE qr_id=r.new_qr_sticker_id FOR UPDATE;
 IF NOT FOUND OR sec.secret_hash IS DISTINCT FROM p_verified_hash OR sec.consumed_at IS NOT NULL OR sec.locked_until>now() OR r.status NOT IN ('MIGRATED','SHIPPED') OR NOT public.replacement_order_eligible(r.id,r.order_id) OR NOT public.replacement_delivered(r.fulfilment_id) OR NOT EXISTS(SELECT 1 FROM public.qr_stickers WHERE id=r.old_qr_sticker_id AND status='REPLACED') OR NOT EXISTS(SELECT 1 FROM public.sticker_replacements WHERE replacement_request_id=r.id AND old_qr_sticker_id=r.old_qr_sticker_id AND new_qr_sticker_id=r.new_qr_sticker_id) OR NOT EXISTS(SELECT 1 FROM public.qr_reservations WHERE qr_sticker_id=r.new_qr_sticker_id AND fulfilment_id=r.fulfilment_id AND status='RESERVED') OR EXISTS(SELECT 1 FROM public.qr_assignments WHERE vehicle_id=r.vehicle_id AND ended_at IS NULL) THEN RAISE EXCEPTION 'INVALID_ACTIVATION';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.replacement_entitlement_snapshots WHERE replacement_id=r.id AND capability='SAFETY_VIEW_ACTIVE' AND (expires_at IS NULL OR expires_at>now())) THEN RAISE EXCEPTION 'INVALID_ENTITLEMENT';END IF;
 UPDATE public.qr_stickers SET status='ACTIVATED',lifecycle_state='ACTIVATED',user_id=actor,vehicle_id=r.vehicle_id,activated_at=now(),updated_at=now() WHERE id=r.new_qr_sticker_id AND status='ALLOCATED';IF NOT FOUND THEN RAISE EXCEPTION 'STATE_CHANGED';END IF;
 INSERT INTO public.qr_assignments(id,qr_id,vehicle_id,user_id,assignment_type,assigned_at,is_current) VALUES('qra_'||gen_random_uuid()::text,r.new_qr_sticker_id,r.vehicle_id,actor,'REPLACEMENT',now(),1);
 INSERT INTO public.service_entitlements(id,user_id,vehicle_id,qr_sticker_id,capability,status,acquisition_source,order_id,verified_at,expires_at) SELECT 'ent_'||gen_random_uuid()::text,actor,r.vehicle_id,r.new_qr_sticker_id,capability,'ENABLED','ONLINE_PURCHASE',r.order_id,now(),expires_at FROM public.replacement_entitlement_snapshots WHERE replacement_id=r.id AND (expires_at IS NULL OR expires_at>now());
 UPDATE public.qr_activation_secrets SET consumed_at=now(),failed_attempts=0,updated_at=now() WHERE qr_id=r.new_qr_sticker_id;
 UPDATE public.qr_reservations SET status='ALLOCATED',allocated_at=now(),updated_at=now() WHERE fulfilment_id=r.fulfilment_id AND status='RESERVED';
 UPDATE public.replacement_requests SET activated_at=now() WHERE id=r.id;
 INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,changed_by,change_reason,actor_type,actor_id) VALUES('qsh_'||gen_random_uuid()::text,r.new_qr_sticker_id,'ALLOCATED','ACTIVATED',actor,'Owner verified delivered replacement.','CUSTOMER',actor);
 INSERT INTO public.qr_activation_attempts(id,qr_id,user_id,outcome) VALUES('aat_'||gen_random_uuid()::text,r.new_qr_sticker_id,actor,'SUCCESS');
 INSERT INTO public.admin_replacement_events(replacement_id,actor_type,actor_id,action,from_status,to_status,reason) VALUES(r.id,'CUSTOMER',actor,'ACTIVATED',r.status,r.status,'Owner verified possession of the delivered replacement.');RETURN r.id;END;$$;

CREATE FUNCTION public.customer_replacement_context(p_session text,p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;result jsonb;BEGIN actor:=public.replacement_customer_actor(p_session);
 SELECT jsonb_build_object('id',r.id,'reference',r.reference_code,'vehicleId',r.vehicle_id,'vehicle',v.make||' '||v.model,'status',r.status,'oldCode',q.visible_code,'newCode',CASE WHEN r.retired_at IS NOT NULL THEN nq.visible_code ELSE NULL END,'payment',o.payment_state,'orderNumber',o.order_number,'shipment',s.status,'activatedAt',r.activated_at,'canActivate',r.status IN ('MIGRATED','SHIPPED') AND r.activated_at IS NULL AND s.status='DELIVERED' AND s.delivered_at IS NOT NULL AND public.replacement_order_eligible(r.id,r.order_id)) INTO result FROM public.replacement_requests r JOIN public.vehicles v ON v.id=r.vehicle_id JOIN public.qr_stickers q ON q.id=r.old_qr_sticker_id LEFT JOIN public.qr_stickers nq ON nq.id=r.new_qr_sticker_id LEFT JOIN public.orders o ON o.id=r.order_id LEFT JOIN LATERAL(SELECT sh.status,sh.delivered_at FROM public.shipments sh WHERE sh.fulfilment_id=r.fulfilment_id ORDER BY sh.created_at DESC LIMIT 1)s ON true WHERE r.id=p_id AND r.user_id=actor;
 IF result IS NULL THEN RAISE EXCEPTION 'NOT_FOUND';END IF;RETURN result;END;$$;
CREATE FUNCTION public.customer_replacement_proof_attempt(p_session text,p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;r public.replacement_requests;sec public.qr_activation_secrets;BEGIN actor:=public.replacement_customer_actor(p_session);
 SELECT * INTO r FROM public.replacement_requests WHERE id=p_id AND user_id=actor FOR UPDATE;
 IF NOT FOUND OR r.activated_at IS NOT NULL OR r.status NOT IN ('MIGRATED','SHIPPED') OR NOT public.replacement_order_eligible(r.id,r.order_id) OR NOT public.replacement_delivered(r.fulfilment_id) THEN RAISE EXCEPTION 'INVALID_ACTIVATION';END IF;
 SELECT * INTO sec FROM public.qr_activation_secrets WHERE qr_id=r.new_qr_sticker_id FOR UPDATE;
 IF NOT FOUND OR sec.consumed_at IS NOT NULL OR sec.locked_until>now() THEN RAISE EXCEPTION 'INVALID_ACTIVATION';END IF;
 -- Count attempts before the expensive hash computation, including concurrent submissions.
 UPDATE public.qr_activation_secrets SET failed_attempts=CASE WHEN locked_until<=now() THEN 1 ELSE failed_attempts+1 END,locked_until=CASE WHEN (CASE WHEN locked_until<=now() THEN 1 ELSE failed_attempts+1 END)>5 THEN now()+interval '30 minutes' ELSE NULL END,updated_at=now() WHERE qr_id=sec.qr_id RETURNING * INTO sec;
 IF sec.locked_until IS NOT NULL THEN INSERT INTO public.qr_activation_attempts(id,qr_id,user_id,outcome,failure_reason_code) VALUES('aat_'||gen_random_uuid()::text,sec.qr_id,actor,'QR_LOCKED','REPLACEMENT_ATTEMPT_LIMIT');RETURN NULL;END IF;
 RETURN jsonb_build_object('hash',sec.secret_hash,'version',sec.hash_version);END;$$;
CREATE FUNCTION public.customer_replacement_proof_failed(p_session text,p_id text) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;qr text;BEGIN actor:=public.replacement_customer_actor(p_session);SELECT new_qr_sticker_id INTO qr FROM public.replacement_requests WHERE id=p_id AND user_id=actor AND activated_at IS NULL;IF qr IS NULL THEN RAISE EXCEPTION 'NOT_FOUND';END IF;INSERT INTO public.qr_activation_attempts(id,qr_id,user_id,outcome,failure_reason_code) VALUES('aat_'||gen_random_uuid()::text,qr,actor,'INVALID_SECRET','HASH_MISMATCH');END;$$;

ALTER TABLE public.admin_export_jobs ADD COLUMN replacement_filters jsonb,ADD COLUMN replacement_ids text[];
CREATE FUNCTION public.admin_request_replacement_export(p_session uuid,p_filters jsonb,p_ids text[],p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;target uuid:=gen_random_uuid();BEGIN actor:=public.replacement_admin_actor(p_session);
 IF NOT EXISTS(SELECT 1 FROM public.admin_users WHERE id=actor AND role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST')) THEN RAISE EXCEPTION 'ADMIN_REQUIRED';END IF;
 IF cardinality(p_ids)>100 THEN RAISE EXCEPTION 'INVALID_SELECTION';END IF;
 IF (SELECT count(*) FROM public.admin_export_jobs WHERE actor_id=actor AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'RATE_LIMIT';END IF;
 INSERT INTO public.admin_export_jobs(id,actor_id,module_key,replacement_filters,replacement_ids,expires_at) VALUES(target,actor,'replacements',p_filters,p_ids,now()+interval '24 hours');
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id) VALUES(actor,'export.requested','replacements',target::text,'Requested protected replacement operations report.',p_request);RETURN target;END;$$;
CREATE FUNCTION public.admin_replacement_export_page(p_job uuid,p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE job public.admin_export_jobs;BEGIN
 SELECT j.* INTO job FROM public.admin_export_jobs j JOIN public.admin_users a ON a.id=j.actor_id WHERE j.id=p_job AND j.module_key='replacements' AND j.status='PROCESSING' AND j.expires_at>now() AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST');IF NOT FOUND THEN RAISE EXCEPTION 'EXPORT_REQUIRED';END IF;
 RETURN public.replacement_query(coalesce(job.replacement_filters,'{}'),p_cursor,500,job.replacement_ids,job.created_at);END;$$;
DO $$ DECLARE r record;BEGIN FOR r IN SELECT p.oid::regprocedure sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname LIKE 'admin_replacement_%' OR p.proname LIKE 'replacement_%' OR p.proname IN ('customer_request_replacement','customer_activate_replacement','customer_replacement_context','customer_replacement_proof_attempt','customer_replacement_proof_failed','admin_request_replacement_export')) LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',r.sig);EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',r.sig);END LOOP;END;$$;
NOTIFY pgrst,'reload schema';
COMMIT;
