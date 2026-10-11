-- A retail sale records physical acquisition, never customer activation or payment truth.
BEGIN;
CREATE TABLE public.admin_retail_sales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference_code text NOT NULL UNIQUE,
 -- RESTRICT: custody and acquisition evidence must survive partner/admin changes.
 retailer_id text NOT NULL REFERENCES public.admin_partners(id) ON DELETE RESTRICT,
 distributor_id text NOT NULL REFERENCES public.admin_partners(id) ON DELETE RESTRICT,
 actor_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 receipt_reference text NOT NULL CHECK(length(receipt_reference) BETWEEN 3 AND 80),
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 100),
 reason text NOT NULL CHECK(length(reason) BETWEEN 10 AND 500),
 request_id uuid NOT NULL UNIQUE, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(retailer_id,receipt_reference)
);
CREATE TABLE public.admin_retail_sale_items (
 -- RESTRICT: preserve sale evidence; a sticker can be sold only once in this flow.
 sale_id uuid NOT NULL REFERENCES public.admin_retail_sales(id) ON DELETE RESTRICT,
 qr_id text NOT NULL UNIQUE REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
 PRIMARY KEY(sale_id,qr_id)
);
CREATE INDEX admin_retail_sale_cursor ON public.admin_retail_sales(retailer_id,created_at DESC,id DESC);
CREATE INDEX admin_retail_sale_distributor ON public.admin_retail_sales(distributor_id);
CREATE INDEX admin_retail_sale_actor ON public.admin_retail_sales(actor_id);
CREATE INDEX qr_retail_sale_cursor ON public.qr_stickers(current_retailer_id,visible_code) WHERE status='WITH_RETAILER';
ALTER TABLE public.admin_retail_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_retail_sale_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_retail_sales,public.admin_retail_sale_items FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.admin_retail_sales,public.admin_retail_sale_items TO service_role;
CREATE TRIGGER admin_retail_sale_immutable BEFORE UPDATE OR DELETE ON public.admin_retail_sales FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable();
CREATE TRIGGER admin_retail_sale_item_immutable BEFORE UPDATE OR DELETE ON public.admin_retail_sale_items FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable();

-- Minimum operational projection only: private proof material never leaves the database.
CREATE FUNCTION public.retail_sale_eligible(p_retailer text)
RETURNS TABLE(id text,visible_code text,batch_reference text,created_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT q.id,q.visible_code,b.reference_code,q.created_at
 FROM public.qr_stickers q JOIN public.qr_batches b ON b.id=q.batch_id
 JOIN public.admin_partners r ON r.id=q.current_retailer_id AND r.kind='RETAILER'
 JOIN public.admin_partners d ON d.id=r.parent_distributor_id AND d.kind='DISTRIBUTOR'
 WHERE r.id=p_retailer AND r.status='ACTIVE' AND r.verification_status='VERIFIED' AND d.status='ACTIVE'
 AND q.current_distributor_id=d.id AND q.status='WITH_RETAILER' AND q.lifecycle_state='WITH_RETAILER'
 AND q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL AND q.visible_code IS NOT NULL
 AND b.inventory_channel='OFFLINE_RETAIL' AND b.status IN ('PRINTED','RECEIVED','CLOSED')
 AND (b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items x WHERE x.qr_id=q.id AND x.printed_at IS NOT NULL))
 AND EXISTS(SELECT 1 FROM public.qr_activation_secrets s WHERE s.qr_id=q.id AND s.consumed_at IS NULL AND s.secret_hash<>'' AND (s.locked_until IS NULL OR s.locked_until<=now()))
 AND NOT EXISTS(SELECT 1 FROM public.qr_assignments a WHERE a.qr_id=q.id AND a.ended_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items i WHERE i.qr_id=q.id AND i.released_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.admin_retail_sale_items i WHERE i.qr_id=q.id);
$$;
CREATE FUNCTION public.admin_retail_sale_options(p_session uuid,p_id text,p_q text DEFAULT '',p_after text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb; BEGIN
 PERFORM public.inventory_admin_actor(p_session,true);
 IF NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=p_id AND kind='RETAILER') THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO result FROM (
 SELECT e.* FROM public.retail_sale_eligible(p_id) e
 WHERE (p_q='' OR starts_with(e.visible_code,upper(left(p_q,100)))) AND (p_after IS NULL OR e.visible_code>p_after)
 ORDER BY e.visible_code LIMIT 51) x;
 RETURN result;
END; $$;
CREATE FUNCTION public.admin_retail_sale_history(p_session uuid,p_id text,p_cursor jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb; privileged boolean; actor text; BEGIN
 actor:=public.inventory_admin_actor(p_session);
 SELECT role IN ('SUPER_ADMIN','OPS_ADMIN') INTO privileged FROM public.admin_users WHERE id=actor;
 IF NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=p_id AND kind='RETAILER') THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO result FROM (
 SELECT s.id,s.reference_code,s.receipt_reference,s.quantity,CASE WHEN privileged THEN s.reason ELSE '' END AS reason,s.created_at,a.name AS actor_name,
 (SELECT jsonb_agg(q.visible_code ORDER BY q.visible_code) FROM public.admin_retail_sale_items i JOIN public.qr_stickers q ON q.id=i.qr_id WHERE i.sale_id=s.id) AS visible_codes
 FROM public.admin_retail_sales s JOIN public.admin_users a ON a.id=s.actor_id
 WHERE s.retailer_id=p_id AND (p_cursor IS NULL OR (s.created_at,s.id)<((p_cursor->>'created_at')::timestamptz,(p_cursor->>'id')::uuid))
 ORDER BY s.created_at DESC,s.id DESC LIMIT 21) x;
 RETURN result;
END; $$;

CREATE FUNCTION public.admin_record_retail_sale(p_session uuid,p_id text,p_codes text[],p_receipt text,p_reason text,p_request uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text; codes text[]; payload jsonb; old public.admin_retail_sales; r public.admin_partners;
 target uuid:=gen_random_uuid(); ids text[]; affected integer; parent text; receipt text:=upper(trim(p_receipt)); reason text:=trim(p_reason);
BEGIN
 actor:=public.inventory_admin_actor(p_session,true,true);
 IF p_request IS NULL OR cardinality(p_codes) IS NULL OR cardinality(p_codes) NOT BETWEEN 1 AND 100
 OR receipt IS NULL OR length(receipt) NOT BETWEEN 3 AND 80 OR reason IS NULL OR length(reason) NOT BETWEEN 10 AND 500
 OR EXISTS(SELECT 1 FROM unnest(p_codes) c WHERE c IS NULL OR c !~ '^VS-[A-Z0-9-]{4,90}$') THEN RAISE EXCEPTION 'INVALID_SALE'; END IF;
 SELECT array_agg(c ORDER BY c) INTO codes FROM unnest(p_codes) c;
 IF (SELECT count(DISTINCT c) FROM unnest(codes) c)<>cardinality(codes) THEN RAISE EXCEPTION 'INVALID_SALE'; END IF;
 payload:=jsonb_build_object('retailer',p_id,'codes',codes,'receipt',receipt,'reason',reason);
 -- Serialize retry IDs before checking the immutable, actor-bound receipt.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 SELECT * INTO old FROM public.admin_retail_sales WHERE request_id=p_request;
 IF FOUND THEN
  IF old.actor_id<>actor OR old.payload<>payload THEN RAISE EXCEPTION 'REQUEST_CONFLICT'; END IF;
  RETURN old.id;
 END IF;
 SELECT * INTO r FROM public.admin_partners WHERE id=p_id AND kind='RETAILER';
 IF NOT FOUND THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND'; END IF;
 parent:=r.parent_distributor_id;
 PERFORM id FROM public.admin_partners WHERE id IN (p_id,r.parent_distributor_id) ORDER BY id FOR UPDATE;
 SELECT * INTO r FROM public.admin_partners WHERE id=p_id;
 IF r.parent_distributor_id IS DISTINCT FROM parent THEN RAISE EXCEPTION 'SALE_STOCK_CHANGED'; END IF;
 IF r.status<>'ACTIVE' OR r.verification_status<>'VERIFIED' OR NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=r.parent_distributor_id AND kind='DISTRIBUTOR' AND status='ACTIVE') THEN RAISE EXCEPTION 'SALE_PARTNER_UNAVAILABLE'; END IF;
 -- QR row locks make overlapping sale attempts mutually exclusive; recheck every gate after locking.
 PERFORM b.id FROM public.qr_batches b WHERE b.id IN(SELECT q.batch_id FROM public.qr_stickers q WHERE q.visible_code=ANY(codes)) ORDER BY b.id FOR SHARE;
 PERFORM q.id FROM public.qr_stickers q WHERE q.visible_code=ANY(codes) ORDER BY q.id FOR UPDATE;
 PERFORM s.id FROM public.qr_activation_secrets s WHERE s.qr_id IN(SELECT q.id FROM public.qr_stickers q WHERE q.visible_code=ANY(codes)) ORDER BY s.id FOR SHARE;
 SELECT array_agg(e.id ORDER BY e.id) INTO ids FROM public.retail_sale_eligible(p_id) e WHERE e.visible_code=ANY(codes);
 IF coalesce(cardinality(ids),0)<>cardinality(codes) THEN RAISE EXCEPTION 'SALE_STOCK_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM public.admin_retail_sales WHERE retailer_id=p_id AND receipt_reference=receipt) THEN RAISE EXCEPTION 'RECEIPT_ALREADY_RECORDED'; END IF;
 INSERT INTO public.admin_retail_sales(id,reference_code,retailer_id,distributor_id,actor_id,receipt_reference,quantity,reason,request_id,payload)
 VALUES(target,'VS-SALE-'||upper(replace(target::text,'-','')),p_id,r.parent_distributor_id,actor,receipt,cardinality(ids),reason,p_request,payload);
 INSERT INTO public.admin_retail_sale_items(sale_id,qr_id) SELECT target,unnest(ids);
 UPDATE public.qr_stickers SET status='SOLD',lifecycle_state='SOLD',updated_at=now()
 WHERE id=ANY(ids) AND status='WITH_RETAILER' AND current_retailer_id=p_id AND user_id IS NULL AND vehicle_id IS NULL AND activated_at IS NULL;
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>cardinality(ids) THEN RAISE EXCEPTION 'SALE_STOCK_CHANGED'; END IF;
 INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,reason_code,actor_type,actor_id,created_at)
 SELECT gen_random_uuid()::text,unnest(ids),'WITH_RETAILER','SOLD','RETAIL_SALE_RECORDED','ADMIN',actor,now();
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(actor,'retailer.sale_recorded','retailers',p_id,reason,p_request,jsonb_build_object('status','WITH_RETAILER','quantity',cardinality(ids)),jsonb_build_object('status','SOLD','quantity',cardinality(ids),'sale_id',target,'receipt_reference',receipt));
 RETURN target;
END; $$;
REVOKE ALL ON FUNCTION public.retail_sale_eligible(text),public.admin_retail_sale_options(uuid,text,text,text),public.admin_retail_sale_history(uuid,text,jsonb),public.admin_record_retail_sale(uuid,text,text[],text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.retail_sale_eligible(text),public.admin_retail_sale_options(uuid,text,text,text),public.admin_retail_sale_history(uuid,text,jsonb),public.admin_record_retail_sale(uuid,text,text[],text,text,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
