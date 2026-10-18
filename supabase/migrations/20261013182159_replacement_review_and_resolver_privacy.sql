-- Keep ineligible reviews actionable without relaxing approval or paid allocation.
BEGIN;
CREATE OR REPLACE FUNCTION public.admin_replacement_command(p_session uuid,p_id text,p_action text,p_revision integer,p_values jsonb,p_reason text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;old public.replacement_requests;prior public.admin_replacement_commands;payload jsonb;new_qr text;new_fulfilment text;chosen_order public.orders;next_status text;old_qr_status text;BEGIN
 actor:=public.replacement_admin_actor(p_session,true,true);
 IF p_request IS NULL OR p_values IS NULL OR length(trim(coalesce(p_reason,''))) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'INVALID_COMMAND';END IF;
 payload:=jsonb_build_object('id',p_id,'action',p_action,'revision',p_revision,'values',p_values,'reason',trim(p_reason));
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));SELECT * INTO prior FROM public.admin_replacement_commands WHERE request_id=p_request;
 IF FOUND THEN IF prior.actor_id<>actor OR prior.payload<>payload THEN RAISE EXCEPTION 'REQUEST_CONFLICT';END IF;RETURN prior.replacement_id;END IF;
 SELECT * INTO old FROM public.replacement_requests WHERE id=p_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
 IF p_revision IS DISTINCT FROM old.revision THEN RAISE EXCEPTION 'STATE_CHANGED';END IF;next_status:=old.status;
 PERFORM id FROM public.vehicles WHERE id=old.vehicle_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_OWNER';END IF; IF p_action NOT IN ('review','reject','cancel') AND NOT EXISTS(SELECT 1 FROM public.vehicles WHERE id=old.vehicle_id AND user_id=old.user_id AND status='ACTIVE') THEN RAISE EXCEPTION 'INVALID_OWNER';END IF;
 PERFORM id FROM public.qr_stickers WHERE id IN (old.old_qr_sticker_id,old.new_qr_sticker_id) ORDER BY id FOR UPDATE;
 IF p_action IN ('approve','allocate','retire') AND NOT public.replacement_owner_eligible(p_id) THEN RAISE EXCEPTION 'INVALID_ELIGIBILITY';END IF;
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
 UPDATE public.qr_stickers SET status='REPLACED',lifecycle_state='REPLACED',replaced_by_qr_id=NULL,updated_at=now() WHERE id=old.old_qr_sticker_id;
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
CREATE OR REPLACE FUNCTION public.customer_replacement_context(p_session text,p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;result jsonb;BEGIN actor:=public.replacement_customer_actor(p_session);
 SELECT jsonb_build_object('id',r.id,'reference',r.reference_code,'vehicleId',r.vehicle_id,'vehicle',v.make||' '||v.model,'status',r.status,'oldCode',q.visible_code,'newCode',CASE WHEN r.retired_at IS NOT NULL THEN nq.visible_code ELSE NULL END,'payment',o.payment_state,'orderNumber',o.order_number,'shipment',s.status,'activatedAt',r.activated_at,'canActivate',v.user_id=r.user_id AND v.status='ACTIVE' AND r.status IN ('MIGRATED','SHIPPED') AND r.activated_at IS NULL AND s.status='DELIVERED' AND s.delivered_at IS NOT NULL AND public.replacement_order_eligible(r.id,r.order_id)) INTO result FROM public.replacement_requests r JOIN public.vehicles v ON v.id=r.vehicle_id JOIN public.qr_stickers q ON q.id=r.old_qr_sticker_id LEFT JOIN public.qr_stickers nq ON nq.id=r.new_qr_sticker_id LEFT JOIN public.orders o ON o.id=r.order_id LEFT JOIN LATERAL(SELECT sh.status,sh.delivered_at FROM public.shipments sh WHERE sh.fulfilment_id=r.fulfilment_id ORDER BY sh.created_at DESC LIMIT 1)s ON true WHERE r.id=p_id AND r.user_id=actor;
 IF result IS NULL THEN RAISE EXCEPTION 'NOT_FOUND';END IF;RETURN result;END;$$;
CREATE FUNCTION public.replacement_retirement_privacy() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN IF NEW.status='REPLACED' THEN NEW.replaced_by_qr_id:=NULL;END IF;RETURN NEW;END;$$;
-- Immutable sticker_replacements retains the private old/new linkage. Public
-- resolver queries must not discover the new identity from a lost old sticker.
CREATE TRIGGER replacement_retirement_privacy BEFORE UPDATE ON public.qr_stickers FOR EACH ROW EXECUTE FUNCTION public.replacement_retirement_privacy();
REVOKE ALL ON FUNCTION public.replacement_retirement_privacy() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.replacement_retirement_privacy() TO service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
