-- Extends existing partners, reservations, reconciliation and private exports.
BEGIN;
ALTER TABLE public.admin_partners ADD COLUMN stock_threshold integer NOT NULL DEFAULT 0 CHECK(stock_threshold BETWEEN 0 AND 100000);
ALTER TABLE public.admin_export_jobs ADD COLUMN retailer_filters jsonb,ADD COLUMN retailer_ids text[];
-- Existing custody, parent, transfer and cursor indexes are reused.
CREATE INDEX admin_retailer_search ON public.admin_partners USING gin(lower(name||' '||reference_code||' '||city) extensions.gin_trgm_ops) WHERE kind='RETAILER';
CREATE INDEX admin_retailer_geography ON public.admin_partners(state_code,district_code,created_at DESC,id DESC) WHERE kind='RETAILER';
CREATE INDEX qr_retailer_activation ON public.qr_stickers(current_retailer_id,activated_at DESC,id DESC) WHERE current_retailer_id IS NOT NULL AND activated_at IS NOT NULL;

CREATE VIEW public.admin_retailer_projection WITH(security_invoker=true) AS
WITH stock AS(
 SELECT q.current_retailer_id AS id,
 count(*) FILTER(WHERE q.status='WITH_RETAILER' AND q.activated_at IS NULL AND q.user_id IS NULL AND q.vehicle_id IS NULL)::integer AS on_hand,
 count(*) FILTER(WHERE q.status='WITH_RETAILER' AND q.activated_at IS NULL AND q.user_id IS NULL AND q.vehicle_id IS NULL AND i.qr_id IS NOT NULL)::integer AS reserved,
 count(*) FILTER(WHERE b.inventory_channel='OFFLINE_RETAIL' AND q.activated_at>=date_trunc('day',now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')::integer AS activations_today,
 count(*) FILTER(WHERE b.inventory_channel='OFFLINE_RETAIL' AND q.activated_at>=now()-interval '7 days')::integer AS activations_7d,
 count(*) FILTER(WHERE b.inventory_channel='OFFLINE_RETAIL' AND q.activated_at>=now()-interval '30 days')::integer AS activations_30d,
 max(q.activated_at) FILTER(WHERE b.inventory_channel='OFFLINE_RETAIL') AS last_activation_at
 FROM public.qr_stickers q LEFT JOIN public.qr_batches b ON b.id=q.batch_id
 LEFT JOIN public.admin_stock_transfer_items i ON i.qr_id=q.id AND i.released_at IS NULL
 WHERE q.current_retailer_id IS NOT NULL GROUP BY q.current_retailer_id
), movement AS(
 SELECT destination_partner_id AS id,coalesce(sum(quantity) FILTER(WHERE status='IN_TRANSIT'),0)::integer AS in_transit,
 max(updated_at) FILTER(WHERE status='RECEIVED') AS last_receipt_at,max(updated_at) AS moved_at
 FROM public.admin_stock_transfers GROUP BY destination_partner_id
), reconciliation AS(
 SELECT partner_id AS id,coalesce(sum(abs(variance)) FILTER(WHERE status<>'CLOSED'),0)::integer AS unresolved_variance,
 count(*) FILTER(WHERE status<>'CLOSED' AND variance<>0)::integer AS reconciliation_issues FROM public.admin_stock_reconciliations GROUP BY partner_id
)
SELECT p.id,p.reference_code,p.name,p.city,p.status,p.verification_status,p.state_code,p.district_code,s.name AS state_name,d.name AS district_name,
 p.parent_distributor_id,dp.name AS distributor_name,dp.reference_code AS distributor_reference,dp.status AS distributor_status,p.stock_threshold,
 coalesce(c.on_hand,0) AS on_hand,coalesce(c.reserved,0) AS reserved,coalesce(c.on_hand,0)-coalesce(c.reserved,0) AS available,
 coalesce(m.in_transit,0) AS in_transit,coalesce(c.activations_today,0) AS activations_today,coalesce(c.activations_7d,0) AS activations_7d,
 coalesce(c.activations_30d,0) AS activations_30d,c.last_activation_at,m.last_receipt_at,coalesce(v.unresolved_variance,0) AS unresolved_variance,
 coalesce(v.reconciliation_issues,0) AS reconciliation_issues,p.created_at,p.updated_at,greatest(p.updated_at,m.moved_at,c.last_activation_at) AS last_activity_at
FROM public.admin_partners p LEFT JOIN public.admin_partners dp ON dp.id=p.parent_distributor_id LEFT JOIN public.admin_geo_states s ON s.code=p.state_code
LEFT JOIN public.admin_geo_districts d ON d.code=p.district_code LEFT JOIN stock c ON c.id=p.id LEFT JOIN movement m ON m.id=p.id
LEFT JOIN reconciliation v ON v.id=p.id WHERE p.kind='RETAILER';
REVOKE ALL ON public.admin_retailer_projection FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.admin_retailer_projection TO service_role;

CREATE FUNCTION public.retailer_filter_clause(p_filters jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE clause text:='true';BEGIN
 IF coalesce(p_filters->>'q','')<>'' THEN clause:=clause||' AND (lower(p.name||'' ''||p.reference_code||'' ''||p.city) LIKE ''%''||($1->>''q'')||''%'' OR lower(coalesce(p.district_name,'''')||'' ''||coalesce(p.distributor_name,'''')||'' ''||coalesce(p.distributor_reference,'''')) LIKE ''%''||($1->>''q'')||''%'')';END IF;
 IF coalesce(p_filters->>'status','')<>'' THEN clause:=clause||' AND p.status=$1->>''status''';END IF;
 IF coalesce(p_filters->>'verification','')<>'' THEN clause:=clause||' AND p.verification_status=$1->>''verification''';END IF;
 IF coalesce(p_filters->>'state','')<>'' THEN clause:=clause||' AND p.state_code=$1->>''state''';END IF;
 IF coalesce(p_filters->>'district','')<>'' THEN clause:=clause||' AND p.district_code=$1->>''district''';END IF;
 IF coalesce(p_filters->>'distributor','')<>'' THEN clause:=clause||' AND p.parent_distributor_id=$1->>''distributor''';END IF;
 IF coalesce(p_filters->>'locality','')<>'' THEN clause:=clause||' AND lower(p.city) LIKE ''%''||($1->>''locality'')||''%''';END IF;
 IF p_filters->>'inventory'='held' THEN clause:=clause||' AND p.available>0';END IF;
 IF p_filters->>'inventory'='low' THEN clause:=clause||' AND p.stock_threshold>0 AND p.available>0 AND p.available<=p.stock_threshold';END IF;
 IF p_filters->>'inventory'='empty' THEN clause:=clause||' AND p.available=0';END IF;
 IF p_filters->>'inventory'='transit' THEN clause:=clause||' AND p.in_transit>0';END IF;
 IF p_filters->>'inventory'='variance' THEN clause:=clause||' AND p.reconciliation_issues>0';END IF;
 IF p_filters->>'activity'='today' THEN clause:=clause||' AND p.activations_today>0';END IF;
 IF p_filters->>'activity'='week' THEN clause:=clause||' AND p.activations_7d>0';END IF;
 IF p_filters->>'activity'='quiet' THEN clause:=clause||' AND p.activations_30d=0';END IF;
 IF coalesce(p_filters->>'from','')<>'' THEN clause:=clause||' AND p.created_at>=($1->>''from'')::date';END IF;
 IF coalesce(p_filters->>'to','')<>'' THEN clause:=clause||' AND p.created_at<($1->>''to'')::date+interval ''1 day''';END IF;
 RETURN clause;END;$$;
CREATE FUNCTION public.admin_retailer_list(p_session uuid,p_filters jsonb,p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE clause text;direction text;op text;result jsonb;BEGIN
 PERFORM public.inventory_admin_actor(p_session);clause:=public.retailer_filter_clause(p_filters);direction:=CASE WHEN p_filters->>'sort'='oldest' THEN 'ASC' ELSE 'DESC' END;op:=CASE WHEN direction='ASC' THEN '>' ELSE '<' END;
 IF p_cursor IS NOT NULL THEN clause:=clause||' AND (p.created_at,p.id)'||op||'(($2->>''created_at'')::timestamptz,$2->>''id'')';END IF;
 EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM (SELECT p.id,p.reference_code,p.name,p.city,p.status,p.verification_status,p.state_code,p.district_code,p.state_name,p.district_name,p.parent_distributor_id,p.distributor_name,p.distributor_reference,p.distributor_status,p.stock_threshold,p.on_hand,p.reserved,p.available,p.in_transit,p.activations_today,p.activations_7d,p.activations_30d,p.last_activation_at,p.last_receipt_at,p.unresolved_variance,p.reconciliation_issues,p.created_at,p.updated_at,p.last_activity_at FROM public.admin_retailer_projection p WHERE '||clause||' ORDER BY p.created_at '||direction||',p.id '||direction||' LIMIT 51) r' INTO result USING p_filters,p_cursor;RETURN result;END;$$;
CREATE FUNCTION public.admin_retailer_summary(p_session uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session);
 SELECT jsonb_build_object('total',count(*),'active',count(*) FILTER(WHERE status='ACTIVE'),'districts',count(DISTINCT district_code),'stock',coalesce(sum(available),0),'transit',coalesce(sum(in_transit),0),'activations',coalesce(sum(activations_30d),0),'low_stock',count(*) FILTER(WHERE stock_threshold>0 AND available>0 AND available<=stock_threshold),'attention',count(*) FILTER(WHERE status='SUSPENDED' OR verification_status<>'VERIFIED' OR parent_distributor_id IS NULL OR distributor_status IS DISTINCT FROM 'ACTIVE' OR available=0 OR (stock_threshold>0 AND available<=stock_threshold) OR reconciliation_issues>0)) INTO result FROM public.admin_retailer_projection;RETURN result;END;$$;
CREATE FUNCTION public.admin_retailer_distributors(p_session uuid,p_q text DEFAULT '',p_id text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session);
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT p.id,p.reference_code,p.name,p.city,p.status,s.name AS state_name,d.name AS district_name,
 coalesce((SELECT jsonb_agg(jsonb_build_object('state_code',t.state_code,'district_code',t.district_code,'district_name',gd.name) ORDER BY gd.name) FROM public.admin_partner_territories t JOIN public.admin_geo_districts gd ON gd.code=t.district_code WHERE t.partner_id=p.id),'[]') AS territories
 FROM public.admin_partners p LEFT JOIN public.admin_geo_states s ON s.code=p.state_code LEFT JOIN public.admin_geo_districts d ON d.code=p.district_code
 WHERE p.kind='DISTRIBUTOR' AND ((p_id IS NOT NULL AND p.id=p_id) OR (p_id IS NULL AND p.status='ACTIVE' AND (length(trim(p_q))=0 OR length(trim(p_q))>=2 AND lower(p.name||' '||p.reference_code||' '||p.city) LIKE '%'||lower(left(p_q,100))||'%')))
 ORDER BY p.name,p.id LIMIT 20) r;RETURN result;END;$$;
CREATE FUNCTION public.admin_retailer_save(p_session uuid,p_id text,p_updated_at timestamptz,p_values jsonb,p_reason text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;old public.admin_partners;target text:=coalesce(p_id,'partner_'||gen_random_uuid()::text);parent text;outside boolean;BEGIN
 actor:=public.inventory_admin_actor(p_session,true);
 IF length(trim(p_reason)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'REASON_REQUIRED';END IF;
 IF jsonb_typeof(p_values)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_values) k WHERE k NOT IN ('name','legal_name','parent_distributor_id','state_code','district_code','city','postal_code','address_line_1','address_line_2','landmark','contact_name','contact_phone','contact_email','notes','stock_threshold','territory_override')) THEN RAISE EXCEPTION 'INVALID_RETAILER';END IF;
 IF length(trim(coalesce(p_values->>'name',''))) NOT BETWEEN 2 AND 160 OR length(trim(coalesce(p_values->>'city',''))) NOT BETWEEN 2 AND 100 OR length(trim(coalesce(p_values->>'address_line_1',''))) NOT BETWEEN 3 AND 200 OR length(trim(coalesce(p_values->>'contact_name',''))) NOT BETWEEN 2 AND 100 OR coalesce(p_values->>'contact_phone','')!~'^\+91[6-9][0-9]{9}$' OR (coalesce(p_values->>'postal_code','')<>'' AND p_values->>'postal_code'!~'^[1-9][0-9]{5}$') OR (coalesce(p_values->>'contact_email','')<>'' AND p_values->>'contact_email'!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') OR length(coalesce(p_values->>'notes',''))>2000 OR EXISTS(SELECT 1 FROM jsonb_each_text(p_values) v WHERE length(v.value)>2000) OR coalesce((p_values->>'stock_threshold')::integer,-1) NOT BETWEEN 0 AND 100000 OR NOT EXISTS(SELECT 1 FROM public.admin_geo_districts WHERE code=p_values->>'district_code' AND state_code=p_values->>'state_code') THEN RAISE EXCEPTION 'INVALID_RETAILER';END IF;
 SELECT id INTO parent FROM public.admin_partners WHERE id=p_values->>'parent_distributor_id' AND kind='DISTRIBUTOR' AND status='ACTIVE' FOR UPDATE;
 IF parent IS NULL THEN RAISE EXCEPTION 'DISTRIBUTOR_UNAVAILABLE';END IF;
 outside:=NOT EXISTS(SELECT 1 FROM public.admin_partner_territories WHERE partner_id=parent AND district_code=p_values->>'district_code' AND state_code=p_values->>'state_code');
 IF outside AND coalesce((p_values->>'territory_override')::boolean,false)=false THEN RAISE EXCEPTION 'TERRITORY_REVIEW_REQUIRED';END IF;
 IF p_id IS NOT NULL THEN
  SELECT id,updated_at,parent_distributor_id,state_code,district_code,city,address_line_1,address_line_2,landmark,contact_name,contact_phone,contact_email INTO old.id,old.updated_at,old.parent_distributor_id,old.state_code,old.district_code,old.city,old.address_line_1,old.address_line_2,old.landmark,old.contact_name,old.contact_phone,old.contact_email FROM public.admin_partners WHERE id=p_id AND kind='RETAILER' FOR UPDATE;
  IF old.id IS NULL THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND';END IF;
  IF p_updated_at IS NULL OR old.updated_at<>p_updated_at THEN RAISE EXCEPTION 'RETAILER_CHANGED';END IF;
  IF old.parent_distributor_id IS DISTINCT FROM parent AND (EXISTS(SELECT 1 FROM public.admin_stock_transfers WHERE destination_partner_id=p_id AND status IN ('REQUESTED','IN_TRANSIT')) OR EXISTS(SELECT 1 FROM public.qr_stickers WHERE current_retailer_id=p_id AND status='WITH_RETAILER' AND activated_at IS NULL)) THEN RAISE EXCEPTION 'NETWORK_STOCK_REVIEW_REQUIRED';END IF;
 ELSE
  INSERT INTO public.admin_partners(id,reference_code,name,kind,city) VALUES(target,'VS-RTL-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),p_values->>'name','RETAILER',p_values->>'city');
 END IF;
 UPDATE public.admin_partners SET name=trim(p_values->>'name'),legal_name=coalesce(p_values->>'legal_name',''),parent_distributor_id=parent,state_code=p_values->>'state_code',district_code=p_values->>'district_code',city=trim(p_values->>'city'),postal_code=coalesce(p_values->>'postal_code',''),address_line_1=trim(p_values->>'address_line_1'),address_line_2=coalesce(p_values->>'address_line_2',''),landmark=coalesce(p_values->>'landmark',''),contact_name=trim(p_values->>'contact_name'),contact_phone=p_values->>'contact_phone',contact_email=coalesce(p_values->>'contact_email',''),notes=coalesce(p_values->>'notes',''),stock_threshold=(p_values->>'stock_threshold')::integer,updated_at=clock_timestamp() WHERE id=target;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,CASE WHEN p_id IS NULL THEN 'retailer.created' ELSE 'retailer.updated' END,'retailers',target,p_reason,p_request,jsonb_build_object('updatedAt',old.updated_at),jsonb_build_object('parent',parent,'territoryOverride',outside,'threshold',p_values->'stock_threshold'));
 IF p_id IS NOT NULL AND old.parent_distributor_id IS DISTINCT FROM parent THEN INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,'retailer.distributor_changed','retailers',target,p_reason,p_request,jsonb_build_object('parent',old.parent_distributor_id),jsonb_build_object('parent',parent));END IF;
 IF p_id IS NOT NULL AND (old.state_code IS DISTINCT FROM p_values->>'state_code' OR old.district_code IS DISTINCT FROM p_values->>'district_code' OR old.city IS DISTINCT FROM p_values->>'city' OR old.address_line_1 IS DISTINCT FROM p_values->>'address_line_1' OR old.address_line_2 IS DISTINCT FROM coalesce(p_values->>'address_line_2','') OR old.landmark IS DISTINCT FROM coalesce(p_values->>'landmark','')) THEN INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'retailer.location_updated','retailers',target,p_reason,p_request,jsonb_build_object('state',p_values->>'state_code','district',p_values->>'district_code'));END IF;
 IF p_id IS NOT NULL AND (old.contact_name IS DISTINCT FROM p_values->>'contact_name' OR old.contact_phone IS DISTINCT FROM p_values->>'contact_phone' OR old.contact_email IS DISTINCT FROM coalesce(p_values->>'contact_email','')) THEN INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'retailer.contact_updated','retailers',target,p_reason,p_request,jsonb_build_object('contactUpdated',true));END IF;
 RETURN target;END;$$;
CREATE FUNCTION public.admin_retailer_status(p_session uuid,p_id text,p_updated_at timestamptz,p_status text,p_verification text,p_reason text,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;old public.admin_partners;BEGIN actor:=public.inventory_admin_actor(p_session,true);
 IF length(trim(p_reason)) NOT BETWEEN 10 AND 500 OR (p_status IS NULL AND p_verification IS NULL) OR (p_status IS NOT NULL AND p_status NOT IN ('ACTIVE','SUSPENDED')) OR (p_verification IS NOT NULL AND p_verification NOT IN ('PENDING','VERIFIED','REQUIRES_CORRECTION')) THEN RAISE EXCEPTION 'INVALID_RETAILER';END IF;
 SELECT id,status,verification_status,updated_at INTO old.id,old.status,old.verification_status,old.updated_at FROM public.admin_partners WHERE id=p_id AND kind='RETAILER' FOR UPDATE;
 IF old.id IS NULL THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND';END IF;
 IF p_updated_at IS NULL OR old.updated_at<>p_updated_at THEN RAISE EXCEPTION 'RETAILER_CHANGED';END IF;
 IF p_verification='VERIFIED' AND NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=p_id AND state_code IS NOT NULL AND parent_distributor_id IS NOT NULL AND contact_phone<>'' AND address_line_1<>'') THEN RAISE EXCEPTION 'SETUP_REQUIRED';END IF;
 UPDATE public.admin_partners SET status=coalesce(p_status,status),verification_status=coalesce(p_verification,verification_status),updated_at=clock_timestamp() WHERE id=p_id;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,CASE WHEN p_status='SUSPENDED' THEN 'retailer.suspended' WHEN p_status='ACTIVE' THEN 'retailer.reactivated' WHEN p_verification='VERIFIED' THEN 'retailer.verified' ELSE 'retailer.verification_updated' END,'retailers',p_id,p_reason,p_request,jsonb_build_object('status',old.status,'verification',old.verification_status),jsonb_build_object('status',p_status,'verification',p_verification));END;$$;
CREATE FUNCTION public.admin_retailer_detail(p_session uuid,p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;contacts boolean;BEGIN PERFORM public.inventory_admin_actor(p_session);
 SELECT a.role IN ('SUPER_ADMIN','OPS_ADMIN') INTO contacts FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.id=p_session;
 SELECT jsonb_build_object('retailer',to_jsonb(v)||jsonb_build_object('legal_name',p.legal_name,'postal_code',p.postal_code,'address_line_1',p.address_line_1,'address_line_2',p.address_line_2,'landmark',p.landmark,'notes',CASE WHEN contacts THEN p.notes ELSE '' END,'contact_name',CASE WHEN contacts THEN p.contact_name ELSE '' END,'contact_phone',CASE WHEN contacts THEN p.contact_phone ELSE '' END,'contact_email',CASE WHEN contacts THEN p.contact_email ELSE '' END),
 'parent',CASE WHEN p.parent_distributor_id IS NOT NULL THEN public.admin_retailer_distributors(p_session,'',p.parent_distributor_id)->0 ELSE NULL END,
 'territory_match',EXISTS(SELECT 1 FROM public.admin_partner_territories WHERE partner_id=p.parent_distributor_id AND district_code=p.district_code AND state_code=p.state_code),
 'contacts_allowed',contacts,'inventory',coalesce((SELECT jsonb_agg(to_jsonb(g)) FROM(SELECT status,count(*)::integer AS quantity FROM public.qr_stickers WHERE current_retailer_id=p_id GROUP BY status)g),'[]')) INTO result FROM public.admin_retailer_projection v JOIN public.admin_partners p ON p.id=v.id WHERE v.id=p_id;
 IF result IS NULL THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND';END IF;RETURN result;END;$$;
CREATE FUNCTION public.admin_retailer_history(p_session uuid,p_id text,p_section text,p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;contacts boolean;BEGIN PERFORM public.inventory_admin_actor(p_session);
 IF NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=p_id AND kind='RETAILER') THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND';END IF;
 SELECT a.role IN ('SUPER_ADMIN','OPS_ADMIN') INTO contacts FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.id=p_session;
 CASE p_section
 WHEN 'inventory' THEN SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT q.id,q.visible_code,q.status,q.created_at,b.reference_code AS batch_reference FROM public.qr_stickers q LEFT JOIN public.qr_batches b ON b.id=q.batch_id WHERE q.current_retailer_id=p_id AND (p_cursor IS NULL OR (q.created_at,q.id)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id')) ORDER BY q.created_at DESC,q.id DESC LIMIT 21)r;
 WHEN 'activations' THEN SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT q.id,'••••'||right(q.visible_code,4) AS visible_code,q.activated_at AS created_at FROM public.qr_stickers q JOIN public.qr_batches b ON b.id=q.batch_id WHERE q.current_retailer_id=p_id AND q.activated_at IS NOT NULL AND b.inventory_channel='OFFLINE_RETAIL' AND (p_cursor IS NULL OR (q.activated_at,q.id)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id')) ORDER BY q.activated_at DESC,q.id DESC LIMIT 21)r;
 WHEN 'transfers' THEN SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT t.id,t.reference_code,t.quantity,t.status,t.created_at,t.updated_at,t.source_partner_id,t.destination_partner_id,s.name AS source_name,b.reference_code AS batch_reference FROM public.admin_stock_transfers t LEFT JOIN public.admin_partners s ON s.id=t.source_partner_id LEFT JOIN public.qr_batches b ON b.id=t.batch_id WHERE t.destination_partner_id=p_id AND (p_cursor IS NULL OR (t.created_at,t.id)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id')) ORDER BY t.created_at DESC,t.id DESC LIMIT 21)r;
 WHEN 'reconciliations' THEN SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT id,expected_quantity,counted_quantity,variance,status,created_at,updated_at FROM public.admin_stock_reconciliations WHERE partner_id=p_id AND (p_cursor IS NULL OR (created_at,id)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id')) ORDER BY created_at DESC,id DESC LIMIT 21)r;
 WHEN 'activity' THEN SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT l.id,l.action,CASE WHEN contacts THEN l.reason ELSE '' END AS reason,l.created_at,a.name AS actor_name FROM public.admin_audit_logs l JOIN public.admin_users a ON a.id=l.actor_id WHERE l.resource_type='retailers' AND l.resource_id=p_id AND (p_cursor IS NULL OR (l.created_at,l.id)<((p_cursor->>'created_at')::timestamptz,(p_cursor->>'id')::uuid)) ORDER BY l.created_at DESC,l.id DESC LIMIT 21)r;
 ELSE RAISE EXCEPTION 'INVALID_SECTION';END CASE;RETURN result;END;$$;

CREATE FUNCTION public.admin_retailer_transfer_options(p_session uuid,p_id text,p_q text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE parent text;result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session,true);
 SELECT parent_distributor_id INTO parent FROM public.admin_partners WHERE id=p_id AND kind='RETAILER';IF NOT FOUND THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND';END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT b.id,b.reference_code,count(*)::integer AS available FROM public.qr_stickers q JOIN public.qr_batches b ON b.id=q.batch_id
 WHERE q.current_distributor_id=parent AND q.current_retailer_id IS NULL AND q.status='WITH_DISTRIBUTOR' AND q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL AND b.inventory_channel='OFFLINE_RETAIL'
 AND (b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items WHERE qr_id=q.id AND printed_at IS NOT NULL)) AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items WHERE qr_id=q.id AND released_at IS NULL)
 AND (p_q='' OR lower(b.reference_code) LIKE '%'||lower(left(p_q,100))||'%') GROUP BY b.id,b.reference_code ORDER BY b.reference_code LIMIT 20)r;RETURN result;END;$$;
CREATE FUNCTION public.admin_retailer_request_transfer(p_session uuid,p_id text,p_source text,p_batch text,p_quantity integer,p_reason text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;target text:='transfer_'||gen_random_uuid()::text;ids text[];r public.admin_partners;BEGIN actor:=public.inventory_admin_actor(p_session,true);
 IF p_quantity IS NULL OR p_quantity NOT BETWEEN 1 AND 5000 OR length(trim(p_reason)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'INVALID_TRANSFER';END IF;
 PERFORM id FROM public.admin_partners WHERE id=p_source AND kind='DISTRIBUTOR' AND status='ACTIVE' FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'DISTRIBUTOR_UNAVAILABLE';END IF;
 SELECT id,status,verification_status,parent_distributor_id INTO r.id,r.status,r.verification_status,r.parent_distributor_id FROM public.admin_partners WHERE id=p_id AND kind='RETAILER' FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND';END IF;
 IF r.status<>'ACTIVE' THEN RAISE EXCEPTION 'SUSPENDED_PARTNER';END IF;
 IF r.verification_status<>'VERIFIED' THEN RAISE EXCEPTION 'VERIFICATION_REQUIRED';END IF;
 IF r.parent_distributor_id IS DISTINCT FROM p_source THEN RAISE EXCEPTION 'RETAILER_CHANGED';END IF;
 SELECT array_agg(id) INTO ids FROM(SELECT q.id FROM public.qr_stickers q JOIN public.qr_batches b ON b.id=q.batch_id WHERE q.batch_id=p_batch AND q.current_distributor_id=p_source AND q.current_retailer_id IS NULL AND q.status='WITH_DISTRIBUTOR' AND q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL AND b.inventory_channel='OFFLINE_RETAIL' AND (b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items WHERE qr_id=q.id AND printed_at IS NOT NULL)) AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items WHERE qr_id=q.id AND released_at IS NULL) ORDER BY q.id LIMIT p_quantity FOR UPDATE OF q SKIP LOCKED)x;
 IF coalesce(cardinality(ids),0)<>p_quantity THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK';END IF;
 INSERT INTO public.admin_stock_transfers(id,reference_code,source_partner_id,destination_partner_id,batch_id,quantity) VALUES(target,'VS-TRF-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),p_source,p_id,p_batch,p_quantity);
 INSERT INTO public.admin_stock_transfer_items(transfer_id,qr_id) SELECT target,unnest(ids);
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'retailer.stock_requested','retailers',p_id,p_reason,p_request,jsonb_build_object('transfer',target,'source',p_source,'batch',p_batch,'quantity',p_quantity));RETURN target;END;$$;
CREATE FUNCTION public.admin_retailer_transfer_transition(p_session uuid,p_id text,p_transfer text,p_from text,p_to text,p_reason text,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;t public.admin_stock_transfers;source text;r public.admin_partners;affected integer;BEGIN actor:=public.inventory_admin_actor(p_session,true);
 IF length(trim(p_reason)) NOT BETWEEN 10 AND 500 OR NOT((p_from='REQUESTED' AND p_to IN ('IN_TRANSIT','CANCELLED')) OR (p_from='IN_TRANSIT' AND p_to='RECEIVED')) THEN RAISE EXCEPTION 'INVALID_TRANSFER';END IF;
 SELECT source_partner_id INTO source FROM public.admin_stock_transfers WHERE id=p_transfer AND destination_partner_id=p_id;
 IF source IS NULL THEN RAISE EXCEPTION 'TRANSFER_CHANGED';END IF;
 PERFORM id FROM public.admin_partners WHERE id=source AND kind='DISTRIBUTOR' FOR UPDATE;
 SELECT id,status,verification_status,parent_distributor_id INTO r.id,r.status,r.verification_status,r.parent_distributor_id FROM public.admin_partners WHERE id=p_id AND kind='RETAILER' FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND';END IF;
 IF p_to='IN_TRANSIT' AND (r.status<>'ACTIVE' OR r.verification_status<>'VERIFIED' OR NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=source AND status='ACTIVE')) THEN RAISE EXCEPTION 'SUSPENDED_PARTNER';END IF;
 SELECT id,status,quantity,source_partner_id INTO t.id,t.status,t.quantity,t.source_partner_id FROM public.admin_stock_transfers WHERE id=p_transfer AND destination_partner_id=p_id FOR UPDATE;
 IF t.id IS NULL OR t.status<>p_from OR t.source_partner_id IS DISTINCT FROM source OR r.parent_distributor_id IS DISTINCT FROM source THEN RAISE EXCEPTION 'TRANSFER_CHANGED';END IF;
 PERFORM q.id FROM public.qr_stickers q JOIN public.admin_stock_transfer_items i ON i.qr_id=q.id WHERE i.transfer_id=t.id AND i.released_at IS NULL ORDER BY q.id FOR UPDATE OF q;
 IF (SELECT count(*) FROM public.admin_stock_transfer_items WHERE transfer_id=t.id AND released_at IS NULL)<>t.quantity THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
 IF p_to='IN_TRANSIT' AND (SELECT count(*) FROM public.qr_stickers q JOIN public.admin_stock_transfer_items i ON i.qr_id=q.id WHERE i.transfer_id=t.id AND i.released_at IS NULL AND q.status='WITH_DISTRIBUTOR' AND q.current_distributor_id=source AND q.current_retailer_id IS NULL AND q.activated_at IS NULL AND q.user_id IS NULL AND q.vehicle_id IS NULL)<>t.quantity THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
 -- Transit belongs to the transfer state. QR retains last acknowledged custody
 -- until receipt; no new canonical QR lifecycle value is introduced.
 IF p_to='RECEIVED' THEN
 UPDATE public.qr_stickers q SET status='WITH_RETAILER',lifecycle_state='WITH_RETAILER',current_retailer_id=p_id,updated_at=now()
 WHERE q.id IN(SELECT qr_id FROM public.admin_stock_transfer_items WHERE transfer_id=t.id AND released_at IS NULL) AND q.current_distributor_id=source AND q.current_retailer_id IS NULL AND q.status='WITH_DISTRIBUTOR' AND q.activated_at IS NULL AND q.user_id IS NULL AND q.vehicle_id IS NULL;
 GET DIAGNOSTICS affected=ROW_COUNT;IF affected<>t.quantity THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
 INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,reason_code,actor_type,actor_id,created_at) SELECT gen_random_uuid()::text,qr_id,'WITH_DISTRIBUTOR','WITH_RETAILER','ADMIN_STOCK_TRANSFER','ADMIN',actor,now() FROM public.admin_stock_transfer_items WHERE transfer_id=t.id AND released_at IS NULL;
 END IF;
 UPDATE public.admin_stock_transfers SET status=p_to,updated_at=clock_timestamp() WHERE id=t.id;
 IF p_to IN ('RECEIVED','CANCELLED') THEN UPDATE public.admin_stock_transfer_items SET released_at=now() WHERE transfer_id=t.id AND released_at IS NULL;END IF;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,'retailer.transfer_'||lower(p_to),'retailers',p_id,p_reason,p_request,jsonb_build_object('status',p_from),jsonb_build_object('transfer',t.id,'status',p_to,'quantity',t.quantity));END;$$;
CREATE FUNCTION public.admin_retailer_reconcile(p_session uuid,p_id text,p_expected integer,p_counted integer,p_reason text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;actual integer;target text:='reconciliation_'||gen_random_uuid()::text;BEGIN actor:=public.inventory_admin_actor(p_session,true);
 IF p_counted IS NULL OR p_counted NOT BETWEEN 0 AND 10000000 OR length(trim(p_reason)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'INVALID_RECONCILIATION';END IF;
 PERFORM id FROM public.admin_partners WHERE id=p_id AND kind='RETAILER' FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND';END IF;
 SELECT count(*)::integer INTO actual FROM public.qr_stickers WHERE current_retailer_id=p_id AND status='WITH_RETAILER' AND activated_at IS NULL AND user_id IS NULL AND vehicle_id IS NULL;
 IF p_expected IS NULL OR actual<>p_expected THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
 INSERT INTO public.admin_stock_reconciliations(id,partner_id,expected_quantity,counted_quantity) VALUES(target,p_id,actual,p_counted);
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'retailer.reconciliation_recorded','retailers',p_id,p_reason,p_request,jsonb_build_object('reconciliation',target,'expected',actual,'counted',p_counted));RETURN target;END;$$;
CREATE FUNCTION public.admin_retailer_review_reconciliation(p_session uuid,p_id text,p_record text,p_updated_at timestamptz,p_to text,p_reason text,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;old public.admin_stock_reconciliations;BEGIN actor:=public.inventory_admin_actor(p_session,true);
 IF length(trim(p_reason)) NOT BETWEEN 10 AND 500 OR p_to NOT IN ('REVIEWED','CLOSED') OR NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=p_id AND kind='RETAILER') THEN RAISE EXCEPTION 'INVALID_RECONCILIATION';END IF;
 SELECT id,status,updated_at INTO old.id,old.status,old.updated_at FROM public.admin_stock_reconciliations WHERE id=p_record AND partner_id=p_id FOR UPDATE;
 IF old.id IS NULL OR old.status='CLOSED' OR p_updated_at IS NULL OR old.updated_at<>p_updated_at OR (p_to='CLOSED' AND old.status<>'REVIEWED') THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
 UPDATE public.admin_stock_reconciliations SET status=p_to,updated_at=clock_timestamp() WHERE id=p_record;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,'retailer.reconciliation_'||lower(p_to),'retailers',p_id,p_reason,p_request,jsonb_build_object('status',old.status),jsonb_build_object('reconciliation',p_record,'status',p_to));END;$$;
CREATE FUNCTION public.admin_request_retailer_export(p_session uuid,p_filters jsonb,p_ids text[],p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;job uuid;BEGIN actor:=public.inventory_admin_actor(p_session);
 IF cardinality(p_ids)>100 OR cardinality(p_ids)=0 OR (p_ids IS NOT NULL AND (SELECT count(*) FROM public.admin_partners WHERE kind='RETAILER' AND id=ANY(p_ids))<>cardinality(p_ids)) THEN RAISE EXCEPTION 'INVALID_SELECTION';END IF;
 IF (SELECT count(*) FROM public.admin_export_jobs WHERE actor_id=actor AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'EXPORT_RATE_LIMIT';END IF;
 INSERT INTO public.admin_export_jobs(actor_id,module_key,retailer_filters,retailer_ids,selection_at) VALUES(actor,'retailers',p_filters,p_ids,now()) RETURNING id INTO job;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'EXPORT_REQUESTED','reports',job::text,'Scoped retail network report',p_request,jsonb_build_object('module','retailers','selected',coalesce(cardinality(p_ids),0)));RETURN job;END;$$;
CREATE FUNCTION public.admin_retailer_export_page(p_job uuid,p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE job record;clause text;result jsonb;BEGIN
 SELECT j.retailer_filters,j.retailer_ids,j.selection_at INTO job FROM public.admin_export_jobs j JOIN public.admin_users a ON a.id=j.actor_id WHERE j.id=p_job AND j.module_key='retailers' AND j.status='PROCESSING' AND j.expires_at>now() AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST');IF NOT FOUND THEN RAISE EXCEPTION 'EXPORT_UNAVAILABLE';END IF;
 clause:=public.retailer_filter_clause(coalesce(job.retailer_filters,'{}'))||' AND p.created_at<=$2 AND ($3 IS NULL OR p.id=ANY($3))';IF p_cursor IS NOT NULL THEN clause:=clause||' AND (p.created_at,p.id)<(($4->>''created_at'')::timestamptz,$4->>''id'')';END IF;
 EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM(SELECT p.id,p.reference_code,p.name,p.city,p.state_name,p.district_name,p.distributor_reference,p.distributor_name,p.status,p.verification_status,p.available,p.reserved,p.in_transit,p.stock_threshold,p.activations_30d,p.last_activation_at,p.unresolved_variance,p.created_at FROM public.admin_retailer_projection p WHERE '||clause||' ORDER BY p.created_at DESC,p.id DESC LIMIT 500)r' INTO result USING coalesce(job.retailer_filters,'{}'),coalesce(job.selection_at,now()),job.retailer_ids,p_cursor;RETURN result;END;$$;
-- The existing distributor-side link action must respect retailer territory review.
CREATE OR REPLACE FUNCTION public.admin_distributor_link_retailer(p_session uuid,p_id text,p_retailer text,p_reason text,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;r public.admin_partners;BEGIN actor:=public.inventory_admin_actor(p_session,true);
 IF length(trim(p_reason)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'REASON_REQUIRED';END IF;
 PERFORM id FROM public.admin_partners WHERE id=p_id AND kind='DISTRIBUTOR' AND status='ACTIVE' FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'SUSPENDED_PARTNER';END IF;
 SELECT id,parent_distributor_id,state_code,district_code INTO r.id,r.parent_distributor_id,r.state_code,r.district_code FROM public.admin_partners WHERE id=p_retailer AND kind='RETAILER' AND status='ACTIVE' FOR UPDATE;
 IF r.id IS NULL OR r.parent_distributor_id IS NOT NULL AND r.parent_distributor_id<>p_id THEN RAISE EXCEPTION 'INVALID_RETAILER';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.admin_partner_territories WHERE partner_id=p_id AND state_code=r.state_code AND district_code=r.district_code) THEN RAISE EXCEPTION 'TERRITORY_REVIEW_REQUIRED';END IF;
 UPDATE public.admin_partners SET parent_distributor_id=p_id,updated_at=clock_timestamp() WHERE id=p_retailer;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'distributor.retailer_linked','distributors',p_id,p_reason,p_request,jsonb_build_object('retailer',p_retailer));
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,'retailer.distributor_changed','retailers',p_retailer,p_reason,p_request,jsonb_build_object('parent',r.parent_distributor_id),jsonb_build_object('parent',p_id));END;$$;
-- All new functions remain private invoker RPCs. No table/public grant is widened.
DO $$DECLARE f record;BEGIN FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname LIKE 'admin_retailer_%' OR p.proname IN ('retailer_filter_clause','admin_request_retailer_export')) LOOP EXECUTE 'REVOKE ALL ON FUNCTION '||f.signature||' FROM PUBLIC,anon,authenticated';EXECUTE 'GRANT EXECUTE ON FUNCTION '||f.signature||' TO service_role';END LOOP;END;$$;
-- Exclude dispatched retailer reservations from physical distributor stock.
CREATE OR REPLACE VIEW public.admin_distributor_projection WITH(security_invoker=true) AS
WITH custody AS (
 SELECT current_distributor_id AS id,count(*) FILTER(WHERE status='WITH_DISTRIBUTOR')::integer AS on_hand
 FROM public.qr_stickers WHERE current_distributor_id IS NOT NULL AND current_retailer_id IS NULL AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items ti JOIN public.admin_stock_transfers tr ON tr.id=ti.transfer_id WHERE ti.qr_id=qr_stickers.id AND ti.released_at IS NULL AND tr.status='IN_TRANSIT') GROUP BY current_distributor_id
), transfers AS (
 SELECT destination_partner_id AS id,coalesce(sum(quantity) FILTER(WHERE status='IN_TRANSIT'),0)::integer AS in_transit,
 count(*) FILTER(WHERE status IN ('REQUESTED','IN_TRANSIT'))::integer AS open_transfers,max(updated_at) AS moved_at
 FROM public.admin_stock_transfers GROUP BY destination_partner_id
), retailers AS (SELECT parent_distributor_id AS id,count(*)::integer AS retailer_count FROM public.admin_partners WHERE kind='RETAILER' AND parent_distributor_id IS NOT NULL GROUP BY parent_distributor_id),
 territories AS (SELECT partner_id AS id,count(*)::integer AS territory_count FROM public.admin_partner_territories GROUP BY partner_id),
 reconciliation AS (SELECT partner_id AS id,coalesce(sum(abs(variance)) FILTER(WHERE status<>'CLOSED'),0)::integer AS unresolved_variance,count(*) FILTER(WHERE status<>'CLOSED' AND variance<>0)::integer AS reconciliation_issues FROM public.admin_stock_reconciliations GROUP BY partner_id)
SELECT p.id,p.reference_code,p.name,p.city,p.status,p.verification_status,p.state_code,p.district_code,
 s.name AS state_name,d.name AS district_name,coalesce(c.on_hand,0) AS on_hand,coalesce(t.in_transit,0) AS in_transit,
 coalesce(t.open_transfers,0) AS open_transfers,coalesce(r.retailer_count,0) AS retailer_count,coalesce(a.territory_count,0) AS territory_count,
 coalesce(v.unresolved_variance,0) AS unresolved_variance,coalesce(v.reconciliation_issues,0) AS reconciliation_issues,
 p.created_at,p.updated_at,greatest(p.updated_at,t.moved_at) AS last_activity_at
FROM public.admin_partners p LEFT JOIN public.admin_geo_states s ON s.code=p.state_code
LEFT JOIN public.admin_geo_districts d ON d.code=p.district_code LEFT JOIN custody c ON c.id=p.id
LEFT JOIN transfers t ON t.id=p.id LEFT JOIN retailers r ON r.id=p.id LEFT JOIN territories a ON a.id=p.id
LEFT JOIN reconciliation v ON v.id=p.id WHERE p.kind='DISTRIBUTOR';


COMMIT;
