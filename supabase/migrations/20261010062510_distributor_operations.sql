-- Extends the existing partner/custody domain; no duplicate distributors or sample business data.
BEGIN;
CREATE TABLE public.admin_geo_states (code text PRIMARY KEY,name text NOT NULL,source_version text NOT NULL);
CREATE TABLE public.admin_geo_districts (
 code text PRIMARY KEY,state_code text NOT NULL REFERENCES public.admin_geo_states(code) ON DELETE RESTRICT,
 name text NOT NULL,source_version text NOT NULL,UNIQUE(state_code,code)
); -- RESTRICT: canonical geography remains referenced by partner and territory history.
CREATE INDEX admin_geo_district_state ON public.admin_geo_districts(state_code,name);
ALTER TABLE public.admin_partners
 ADD COLUMN legal_name text NOT NULL DEFAULT '', ADD COLUMN state_code text,
 ADD COLUMN district_code text, ADD COLUMN postal_code text NOT NULL DEFAULT '',
 ADD COLUMN address_line_1 text NOT NULL DEFAULT '', ADD COLUMN address_line_2 text NOT NULL DEFAULT '',
 ADD COLUMN landmark text NOT NULL DEFAULT '', ADD COLUMN contact_name text NOT NULL DEFAULT '',
 ADD COLUMN contact_role text NOT NULL DEFAULT '', ADD COLUMN contact_phone text NOT NULL DEFAULT '',
 ADD COLUMN contact_email text NOT NULL DEFAULT '', ADD COLUMN notes text NOT NULL DEFAULT '',
 ADD COLUMN verification_status text NOT NULL DEFAULT 'PENDING' CHECK(verification_status IN ('PENDING','VERIFIED','REQUIRES_CORRECTION')),
 ADD COLUMN parent_distributor_id text REFERENCES public.admin_partners(id) ON DELETE RESTRICT,
 ADD CONSTRAINT partner_geography FOREIGN KEY(state_code,district_code) REFERENCES public.admin_geo_districts(state_code,code) ON DELETE RESTRICT,
 ADD CONSTRAINT partner_geo_pair CHECK((state_code IS NULL)=(district_code IS NULL)),
 ADD CONSTRAINT partner_parent_kind CHECK(parent_distributor_id IS NULL OR (kind='RETAILER' AND parent_distributor_id<>id)),
 ADD CONSTRAINT partner_phone CHECK(contact_phone='' OR contact_phone ~ '^\+91[6-9][0-9]{9}$'),
 ADD CONSTRAINT partner_postcode CHECK(postal_code='' OR postal_code ~ '^[1-9][0-9]{5}$');
-- RESTRICT: network/custody history survives partner deactivation; no partner deletion workflow.
CREATE TABLE public.admin_partner_territories (
 partner_id text NOT NULL REFERENCES public.admin_partners(id) ON DELETE RESTRICT,
 state_code text NOT NULL,district_code text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),created_by text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 PRIMARY KEY(partner_id,district_code),
 FOREIGN KEY(state_code,district_code) REFERENCES public.admin_geo_districts(state_code,code) ON DELETE RESTRICT
); -- Non-exclusive territory coverage; no invented exclusivity policy.
CREATE INDEX admin_territory_district ON public.admin_partner_territories(state_code,district_code);
CREATE INDEX admin_partner_cursor ON public.admin_partners(kind,created_at DESC,id DESC);
CREATE INDEX admin_partner_geography ON public.admin_partners(state_code,district_code) WHERE kind='DISTRIBUTOR';
CREATE INDEX admin_partner_retailer_parent ON public.admin_partners(parent_distributor_id) WHERE parent_distributor_id IS NOT NULL;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX admin_partner_search ON public.admin_partners USING gin(lower(name||' '||reference_code||' '||city) extensions.gin_trgm_ops) WHERE kind='DISTRIBUTOR';
CREATE INDEX qr_distributor_custody ON public.qr_stickers(current_distributor_id,status) WHERE current_retailer_id IS NULL;
CREATE INDEX qr_retailer_custody ON public.qr_stickers(current_retailer_id,status) WHERE current_retailer_id IS NOT NULL;
CREATE TABLE public.admin_stock_transfer_items (
 transfer_id text NOT NULL REFERENCES public.admin_stock_transfers(id) ON DELETE RESTRICT,
 qr_id text NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
 reserved_at timestamptz NOT NULL DEFAULT now(), released_at timestamptz,
 PRIMARY KEY(transfer_id,qr_id)
); -- RESTRICT: custody evidence must survive QR/transfer changes.
CREATE UNIQUE INDEX admin_transfer_identity_reserved ON public.admin_stock_transfer_items(qr_id) WHERE released_at IS NULL;
ALTER TABLE public.admin_stock_transfers ADD COLUMN batch_id text REFERENCES public.qr_batches(id) ON DELETE RESTRICT;
ALTER TABLE public.admin_export_jobs ADD COLUMN distributor_filters jsonb,ADD COLUMN distributor_ids text[];

CREATE VIEW public.admin_distributor_projection WITH(security_invoker=true) AS
WITH custody AS (
 SELECT current_distributor_id AS id,count(*) FILTER(WHERE status='WITH_DISTRIBUTOR')::integer AS on_hand
 FROM public.qr_stickers WHERE current_distributor_id IS NOT NULL AND current_retailer_id IS NULL GROUP BY current_distributor_id
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

CREATE FUNCTION public.distributor_filter_clause(p_filters jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE clause text:='true'; BEGIN
 IF coalesce(p_filters->>'q','')<>'' THEN clause:=clause||' AND (lower(p.name||'' ''||p.reference_code||'' ''||p.city) LIKE ''%''||($1->>''q'')||''%'' OR lower(coalesce(p.district_name,'''')||'' ''||coalesce(p.state_name,'''')) LIKE ''%''||($1->>''q'')||''%'')'; END IF;
 IF coalesce(p_filters->>'status','')<>'' THEN clause:=clause||' AND p.status=$1->>''status'''; END IF;
 IF coalesce(p_filters->>'verification','')<>'' THEN clause:=clause||' AND p.verification_status=$1->>''verification'''; END IF;
 IF coalesce(p_filters->>'state','')<>'' THEN clause:=clause||' AND p.state_code=$1->>''state'''; END IF;
 IF coalesce(p_filters->>'district','')<>'' THEN clause:=clause||' AND p.district_code=$1->>''district'''; END IF;
 IF p_filters->>'inventory'='held' THEN clause:=clause||' AND p.on_hand>0'; END IF;
 IF p_filters->>'inventory'='empty' THEN clause:=clause||' AND p.on_hand=0'; END IF;
 IF p_filters->>'inventory'='transit' THEN clause:=clause||' AND p.in_transit>0'; END IF;
 IF p_filters->>'inventory'='variance' THEN clause:=clause||' AND p.reconciliation_issues>0'; END IF;
 IF p_filters->>'network'='retailers' THEN clause:=clause||' AND p.retailer_count>0'; END IF;
 IF p_filters->>'network'='none' THEN clause:=clause||' AND p.retailer_count=0'; END IF;
 IF coalesce(p_filters->>'from','')<>'' THEN clause:=clause||' AND p.created_at>=($1->>''from'')::date'; END IF;
 IF coalesce(p_filters->>'to','')<>'' THEN clause:=clause||' AND p.created_at<($1->>''to'')::date+interval ''1 day'''; END IF;
 RETURN clause; END; $$;
CREATE FUNCTION public.admin_distributor_list(p_session uuid,p_filters jsonb,p_cursor jsonb DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE clause text;direction text;op text;result jsonb;BEGIN
 PERFORM public.inventory_admin_actor(p_session);
 clause:=public.distributor_filter_clause(p_filters);direction:=CASE WHEN p_filters->>'sort'='oldest' THEN 'ASC' ELSE 'DESC' END;op:=CASE WHEN direction='ASC' THEN '>' ELSE '<' END;
 IF p_cursor IS NOT NULL THEN clause:=clause||' AND (p.created_at,p.id)'||op||'(($2->>''created_at'')::timestamptz,$2->>''id'')'; END IF;
 EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM (SELECT p.id,p.reference_code,p.name,p.city,p.status,p.verification_status,p.state_code,p.district_code,p.state_name,p.district_name,p.on_hand,p.in_transit,p.open_transfers,p.retailer_count,p.territory_count,p.unresolved_variance,p.reconciliation_issues,p.created_at,p.updated_at,p.last_activity_at FROM public.admin_distributor_projection p WHERE '||clause||' ORDER BY p.created_at '||direction||',p.id '||direction||' LIMIT 51) r' INTO result USING p_filters,p_cursor;
 RETURN result;END;$$;
CREATE FUNCTION public.admin_distributor_summary(p_session uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session);
 SELECT jsonb_build_object('total',count(*),'active',count(*) FILTER(WHERE status='ACTIVE'),'states',count(DISTINCT state_code),
 'stock',coalesce(sum(on_hand),0),'transit',coalesce(sum(in_transit),0),'attention',count(*) FILTER(WHERE status='SUSPENDED' OR verification_status<>'VERIFIED' OR reconciliation_issues>0)) INTO result FROM public.admin_distributor_projection; RETURN result;END;$$;

CREATE FUNCTION public.admin_distributor_save(p_session uuid,p_id text,p_updated_at timestamptz,p_values jsonb,p_reason text,p_request uuid) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;old public.admin_partners;target text:=coalesce(p_id,'partner_'||gen_random_uuid()::text);area jsonb;BEGIN
 actor:=public.inventory_admin_actor(p_session,true);
 IF length(trim(p_reason)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;
 IF jsonb_typeof(p_values)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_values) k WHERE k NOT IN ('name','legal_name','state_code','district_code','city','postal_code','address_line_1','address_line_2','landmark','contact_name','contact_role','contact_phone','contact_email','notes','territories')) THEN RAISE EXCEPTION 'INVALID_DISTRIBUTOR';END IF;
 IF length(trim(coalesce(p_values->>'name',''))) NOT BETWEEN 2 AND 160 OR length(trim(coalesce(p_values->>'address_line_1',''))) NOT BETWEEN 3 AND 200
 OR length(trim(coalesce(p_values->>'contact_name',''))) NOT BETWEEN 2 AND 100 OR coalesce(p_values->>'contact_phone','')!~'^\+91[6-9][0-9]{9}$'
 OR coalesce(p_values->>'postal_code','')!~'^[1-9][0-9]{5}$' OR length(coalesce(p_values->>'city','')) NOT BETWEEN 2 AND 100
 OR length(coalesce(p_values->>'notes',''))>2000 OR EXISTS(SELECT 1 FROM jsonb_each_text(p_values) v WHERE v.key<>'territories' AND length(v.value)>2000)
 OR (coalesce(p_values->>'contact_email','')<>'' AND p_values->>'contact_email'!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
 OR NOT EXISTS(SELECT 1 FROM public.admin_geo_districts WHERE code=p_values->>'district_code' AND state_code=p_values->>'state_code')
 OR jsonb_typeof(p_values->'territories') IS DISTINCT FROM 'array' OR jsonb_array_length(p_values->'territories') NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'INVALID_DISTRIBUTOR';END IF;
 FOR area IN SELECT value FROM jsonb_array_elements(p_values->'territories') LOOP
  IF NOT EXISTS(SELECT 1 FROM public.admin_geo_districts WHERE code=area->>'district_code' AND state_code=area->>'state_code') THEN RAISE EXCEPTION 'INVALID_GEOGRAPHY';END IF;
 END LOOP;
 IF (SELECT count(*) FROM jsonb_array_elements(p_values->'territories'))<>(SELECT count(DISTINCT value->>'district_code') FROM jsonb_array_elements(p_values->'territories')) THEN RAISE EXCEPTION 'DUPLICATE_TERRITORY';END IF;
 IF p_id IS NOT NULL THEN
  SELECT id,updated_at,status,verification_status INTO old.id,old.updated_at,old.status,old.verification_status FROM public.admin_partners WHERE id=p_id AND kind='DISTRIBUTOR' FOR UPDATE;
  IF old.id IS NULL THEN RAISE EXCEPTION 'DISTRIBUTOR_NOT_FOUND';END IF;
  IF p_updated_at IS NULL OR old.updated_at<>p_updated_at THEN RAISE EXCEPTION 'DISTRIBUTOR_CHANGED';END IF;
 ELSE
  INSERT INTO public.admin_partners(id,reference_code,name,kind,city) VALUES(target,'VS-DST-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),p_values->>'name','DISTRIBUTOR',p_values->>'city');
 END IF;
 UPDATE public.admin_partners SET name=trim(p_values->>'name'),legal_name=coalesce(p_values->>'legal_name',''),state_code=p_values->>'state_code',district_code=p_values->>'district_code',city=trim(p_values->>'city'),
 postal_code=p_values->>'postal_code',address_line_1=trim(p_values->>'address_line_1'),address_line_2=coalesce(p_values->>'address_line_2',''),landmark=coalesce(p_values->>'landmark',''),
 contact_name=trim(p_values->>'contact_name'),contact_role=coalesce(p_values->>'contact_role',''),contact_phone=p_values->>'contact_phone',contact_email=coalesce(p_values->>'contact_email',''),notes=coalesce(p_values->>'notes',''),updated_at=clock_timestamp() WHERE id=target;
 DELETE FROM public.admin_partner_territories WHERE partner_id=target AND district_code NOT IN(SELECT value->>'district_code' FROM jsonb_array_elements(p_values->'territories'));
 INSERT INTO public.admin_partner_territories(partner_id,state_code,district_code,created_by) SELECT target,value->>'state_code',value->>'district_code',actor FROM jsonb_array_elements(p_values->'territories') ON CONFLICT(partner_id,district_code) DO NOTHING;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(actor,CASE WHEN p_id IS NULL THEN 'distributor.created' ELSE 'distributor.updated' END,'distributors',target,p_reason,p_request,
 jsonb_build_object('updatedAt',old.updated_at),jsonb_build_object('territories',jsonb_array_length(p_values->'territories'),'contactUpdated',true));
 RETURN target;END;$$;

CREATE FUNCTION public.admin_distributor_status(p_session uuid,p_id text,p_updated_at timestamptz,p_status text,p_verification text,p_reason text,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;old public.admin_partners;BEGIN
 actor:=public.inventory_admin_actor(p_session,true);
 IF length(trim(p_reason)) NOT BETWEEN 10 AND 500 OR (p_status IS NULL AND p_verification IS NULL) OR (p_status IS NOT NULL AND p_status NOT IN ('ACTIVE','SUSPENDED')) OR (p_verification IS NOT NULL AND p_verification NOT IN ('PENDING','VERIFIED','REQUIRES_CORRECTION')) THEN RAISE EXCEPTION 'INVALID_DISTRIBUTOR';END IF;
 SELECT id,status,verification_status,updated_at INTO old.id,old.status,old.verification_status,old.updated_at FROM public.admin_partners WHERE id=p_id AND kind='DISTRIBUTOR' FOR UPDATE;
 IF old.id IS NULL THEN RAISE EXCEPTION 'DISTRIBUTOR_NOT_FOUND';END IF;
 IF p_updated_at IS NULL OR old.updated_at<>p_updated_at THEN RAISE EXCEPTION 'DISTRIBUTOR_CHANGED';END IF;
 IF p_verification='VERIFIED' AND NOT EXISTS(SELECT 1 FROM public.admin_partners p WHERE p.id=p_id AND p.state_code IS NOT NULL AND p.contact_phone<>'' AND p.address_line_1<>'') THEN RAISE EXCEPTION 'SETUP_REQUIRED';END IF;
 UPDATE public.admin_partners SET status=coalesce(p_status,status),verification_status=coalesce(p_verification,verification_status),updated_at=clock_timestamp() WHERE id=p_id;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,CASE WHEN p_status='SUSPENDED' THEN 'distributor.suspended' WHEN p_status='ACTIVE' THEN 'distributor.reactivated' ELSE 'distributor.verification_updated' END,'distributors',p_id,p_reason,p_request,jsonb_build_object('status',old.status,'verification',old.verification_status),jsonb_build_object('status',p_status,'verification',p_verification));END;$$;

CREATE FUNCTION public.admin_distributor_detail(p_session uuid,p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;contacts boolean;BEGIN
 PERFORM public.inventory_admin_actor(p_session);
 SELECT a.role IN ('SUPER_ADMIN','OPS_ADMIN') INTO contacts FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.id=p_session;
 SELECT jsonb_build_object('distributor',to_jsonb(v)||jsonb_build_object('legal_name',p.legal_name,'postal_code',p.postal_code,'address_line_1',p.address_line_1,'address_line_2',p.address_line_2,'landmark',p.landmark,'notes',CASE WHEN contacts THEN p.notes ELSE '' END,'contact_name',CASE WHEN contacts THEN p.contact_name ELSE '' END,'contact_role',CASE WHEN contacts THEN p.contact_role ELSE '' END,'contact_phone',CASE WHEN contacts THEN p.contact_phone ELSE '' END,'contact_email',CASE WHEN contacts THEN p.contact_email ELSE '' END),
 'territories',coalesce((SELECT jsonb_agg(jsonb_build_object('state_code',t.state_code,'district_code',t.district_code,'state_name',s.name,'district_name',d.name) ORDER BY s.name,d.name) FROM public.admin_partner_territories t JOIN public.admin_geo_states s ON s.code=t.state_code JOIN public.admin_geo_districts d ON d.code=t.district_code WHERE t.partner_id=p_id),'[]'),
 'inventory',coalesce((SELECT jsonb_agg(to_jsonb(g)) FROM(SELECT status,count(*)::integer AS quantity FROM public.qr_stickers WHERE current_distributor_id=p_id AND current_retailer_id IS NULL GROUP BY status) g),'[]'),
 'transfers',public.admin_distributor_history(p_session,p_id,'transfers',NULL),'retailers',public.admin_distributor_history(p_session,p_id,'retailers',NULL),'reconciliations',public.admin_distributor_history(p_session,p_id,'reconciliations',NULL),'activity',public.admin_distributor_history(p_session,p_id,'activity',NULL))
 INTO result FROM public.admin_distributor_projection v JOIN public.admin_partners p ON p.id=v.id WHERE v.id=p_id;
 IF result IS NULL THEN RAISE EXCEPTION 'DISTRIBUTOR_NOT_FOUND';END IF;RETURN result;END;$$;

-- Preserve the existing generic mutation RPC for other modules, but prevent distributor bypass.
CREATE FUNCTION public.admin_distributor_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
 IF NEW.kind='DISTRIBUTOR' AND (NEW.state_code IS NULL OR NEW.contact_phone='' OR NEW.address_line_1='') AND TG_OP='INSERT' THEN RAISE EXCEPTION 'USE_DISTRIBUTOR_WORKFLOW';END IF;
 IF NEW.parent_distributor_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=NEW.parent_distributor_id AND kind='DISTRIBUTOR') THEN RAISE EXCEPTION 'INVALID_DISTRIBUTOR';END IF;
 RETURN NEW;END;$$;
-- Creation is finalized by the save RPC in one transaction; hierarchy/contact checks also live there.
-- Guard parent relations independently of the UI.
CREATE FUNCTION public.admin_retailer_parent_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
 IF NEW.parent_distributor_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=NEW.parent_distributor_id AND kind='DISTRIBUTOR') THEN RAISE EXCEPTION 'INVALID_DISTRIBUTOR';END IF;RETURN NEW;END;$$;
CREATE TRIGGER admin_retailer_parent_guard BEFORE INSERT OR UPDATE OF parent_distributor_id ON public.admin_partners FOR EACH ROW EXECUTE FUNCTION public.admin_retailer_parent_guard();

ALTER TABLE public.admin_geo_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_geo_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_partner_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_stock_transfer_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_geo_states,public.admin_geo_districts,public.admin_partner_territories,public.admin_stock_transfer_items,public.admin_distributor_projection FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.admin_geo_states,public.admin_geo_districts,public.admin_distributor_projection TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.admin_partner_territories TO service_role;
GRANT SELECT,INSERT,UPDATE ON public.admin_stock_transfer_items TO service_role;
REVOKE ALL ON FUNCTION public.distributor_filter_clause(jsonb),public.admin_distributor_list(uuid,jsonb,jsonb),public.admin_distributor_summary(uuid),public.admin_distributor_save(uuid,text,timestamptz,jsonb,text,uuid),public.admin_distributor_status(uuid,text,timestamptz,text,text,text,uuid),public.admin_distributor_detail(uuid,text),public.admin_distributor_guard(),public.admin_retailer_parent_guard() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.distributor_filter_clause(jsonb),public.admin_distributor_list(uuid,jsonb,jsonb),public.admin_distributor_summary(uuid),public.admin_distributor_save(uuid,text,timestamptz,jsonb,text,uuid),public.admin_distributor_status(uuid,text,timestamptz,text,text,text,uuid),public.admin_distributor_detail(uuid,text),public.admin_retailer_parent_guard() TO service_role;
CREATE FUNCTION public.admin_distributor_transfer_options(p_session uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session,true);
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM (SELECT b.id,b.reference_code,count(*)::integer AS available FROM public.qr_stickers q JOIN public.qr_batches b ON b.id=q.batch_id
 WHERE q.status='PRINTED' AND q.current_distributor_id IS NULL AND q.current_retailer_id IS NULL AND q.activated_at IS NULL AND q.user_id IS NULL AND q.vehicle_id IS NULL
 AND b.inventory_channel='OFFLINE_RETAIL' AND (b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items pi WHERE pi.qr_id=q.id AND pi.printed_at IS NOT NULL))
 AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items ti WHERE ti.qr_id=q.id AND ti.released_at IS NULL)
 GROUP BY b.id,b.reference_code ORDER BY b.reference_code LIMIT 100) r;RETURN result;END;$$;
CREATE FUNCTION public.admin_distributor_request_transfer(p_session uuid,p_id text,p_batch text,p_quantity integer,p_reason text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;target text:='transfer_'||gen_random_uuid()::text;ids text[];partner_status text;BEGIN
 actor:=public.inventory_admin_actor(p_session,true);
 IF p_quantity IS NULL OR p_quantity NOT BETWEEN 1 AND 5000 OR length(trim(p_reason)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'INVALID_TRANSFER';END IF;
 SELECT status INTO partner_status FROM public.admin_partners WHERE id=p_id AND kind='DISTRIBUTOR' FOR UPDATE;
 IF partner_status IS NULL THEN RAISE EXCEPTION 'DISTRIBUTOR_NOT_FOUND';END IF;
 IF partner_status<>'ACTIVE' THEN RAISE EXCEPTION 'SUSPENDED_PARTNER';END IF;
 SELECT array_agg(id) INTO ids FROM (SELECT q.id FROM public.qr_stickers q JOIN public.qr_batches b ON b.id=q.batch_id
 WHERE q.batch_id=p_batch AND q.status='PRINTED' AND q.current_distributor_id IS NULL AND q.current_retailer_id IS NULL AND q.activated_at IS NULL AND q.user_id IS NULL AND q.vehicle_id IS NULL
 AND b.inventory_channel='OFFLINE_RETAIL' AND (b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items pi WHERE pi.qr_id=q.id AND pi.printed_at IS NOT NULL))
 AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items ti WHERE ti.qr_id=q.id AND ti.released_at IS NULL)
 ORDER BY q.id LIMIT p_quantity FOR UPDATE OF q SKIP LOCKED) r;
 IF coalesce(cardinality(ids),0)<>p_quantity THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK';END IF;
 INSERT INTO public.admin_stock_transfers(id,reference_code,destination_partner_id,quantity,status,batch_id) VALUES(target,'VS-TRF-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),p_id,p_quantity,'REQUESTED',p_batch);
 INSERT INTO public.admin_stock_transfer_items(transfer_id,qr_id) SELECT target,unnest(ids);
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'distributor.transfer_requested','distributors',p_id,p_reason,p_request,jsonb_build_object('transfer',target,'batch',p_batch,'quantity',p_quantity));RETURN target;END;$$;
CREATE FUNCTION public.admin_distributor_transfer_transition(p_session uuid,p_id text,p_transfer text,p_from text,p_to text,p_reason text,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;t public.admin_stock_transfers;affected integer;partner_status text;BEGIN
 actor:=public.inventory_admin_actor(p_session,true);
 IF length(trim(p_reason)) NOT BETWEEN 10 AND 500 OR NOT((p_from='REQUESTED' AND p_to IN ('IN_TRANSIT','CANCELLED')) OR (p_from='IN_TRANSIT' AND p_to='RECEIVED')) THEN RAISE EXCEPTION 'INVALID_TRANSFER';END IF;
 SELECT status INTO partner_status FROM public.admin_partners WHERE id=p_id AND kind='DISTRIBUTOR' FOR UPDATE;
 IF partner_status IS NULL THEN RAISE EXCEPTION 'DISTRIBUTOR_NOT_FOUND';END IF;
 IF p_to='IN_TRANSIT' AND partner_status<>'ACTIVE' THEN RAISE EXCEPTION 'SUSPENDED_PARTNER';END IF;
 SELECT id,status,quantity,destination_partner_id,source_partner_id INTO t.id,t.status,t.quantity,t.destination_partner_id,t.source_partner_id FROM public.admin_stock_transfers WHERE id=p_transfer AND destination_partner_id=p_id FOR UPDATE;
 IF t.id IS NULL OR t.status<>p_from OR t.source_partner_id IS NOT NULL THEN RAISE EXCEPTION 'TRANSFER_CHANGED';END IF;
 PERFORM q.id FROM public.qr_stickers q JOIN public.admin_stock_transfer_items i ON i.qr_id=q.id WHERE i.transfer_id=t.id AND i.released_at IS NULL ORDER BY q.id FOR UPDATE OF q;
 IF (SELECT count(*) FROM public.admin_stock_transfer_items WHERE transfer_id=t.id AND released_at IS NULL)<>t.quantity THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
 IF p_to<>'CANCELLED' THEN
  UPDATE public.qr_stickers q SET status=CASE WHEN p_to='IN_TRANSIT' THEN 'IN_TRANSIT_DISTRIBUTOR' ELSE 'WITH_DISTRIBUTOR' END,
   lifecycle_state=CASE WHEN p_to='IN_TRANSIT' THEN 'IN_TRANSIT_DISTRIBUTOR' ELSE 'WITH_DISTRIBUTOR' END,
   current_distributor_id=CASE WHEN p_to='RECEIVED' THEN p_id ELSE NULL END,updated_at=now()
  WHERE q.id IN(SELECT qr_id FROM public.admin_stock_transfer_items WHERE transfer_id=t.id AND released_at IS NULL)
  AND q.status=CASE WHEN p_to='IN_TRANSIT' THEN 'PRINTED' ELSE 'IN_TRANSIT_DISTRIBUTOR' END
  AND q.current_distributor_id IS NULL AND q.current_retailer_id IS NULL AND q.activated_at IS NULL AND q.user_id IS NULL AND q.vehicle_id IS NULL;
  GET DIAGNOSTICS affected=ROW_COUNT;IF affected<>t.quantity THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
  INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,reason_code,actor_type,actor_id,created_at)
  SELECT gen_random_uuid()::text,qr_id,CASE WHEN p_to='IN_TRANSIT' THEN 'PRINTED' ELSE 'IN_TRANSIT_DISTRIBUTOR' END,CASE WHEN p_to='IN_TRANSIT' THEN 'IN_TRANSIT_DISTRIBUTOR' ELSE 'WITH_DISTRIBUTOR' END,'ADMIN_STOCK_TRANSFER','ADMIN',actor,now() FROM public.admin_stock_transfer_items WHERE transfer_id=t.id AND released_at IS NULL;
 END IF;
 UPDATE public.admin_stock_transfers SET status=p_to,updated_at=clock_timestamp() WHERE id=t.id;
 IF p_to IN ('RECEIVED','CANCELLED') THEN UPDATE public.admin_stock_transfer_items SET released_at=now() WHERE transfer_id=t.id AND released_at IS NULL;END IF;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,'distributor.transfer_'||lower(p_to),'distributors',p_id,p_reason,p_request,jsonb_build_object('status',p_from),jsonb_build_object('transfer',t.id,'status',p_to,'quantity',t.quantity));END;$$;
CREATE FUNCTION public.admin_distributor_reconcile(p_session uuid,p_id text,p_expected integer,p_counted integer,p_reason text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;actual integer;target text:='reconciliation_'||gen_random_uuid()::text;BEGIN
 actor:=public.inventory_admin_actor(p_session,true);
 IF p_counted IS NULL OR p_counted NOT BETWEEN 0 AND 10000000 OR length(trim(p_reason)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'INVALID_RECONCILIATION';END IF;
 PERFORM id FROM public.admin_partners WHERE id=p_id AND kind='DISTRIBUTOR' FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'DISTRIBUTOR_NOT_FOUND';END IF;
 SELECT count(*)::integer INTO actual FROM public.qr_stickers WHERE current_distributor_id=p_id AND current_retailer_id IS NULL AND status='WITH_DISTRIBUTOR';
 IF p_expected IS NULL OR actual<>p_expected THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
 INSERT INTO public.admin_stock_reconciliations(id,partner_id,expected_quantity,counted_quantity) VALUES(target,p_id,actual,p_counted);
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'distributor.reconciliation_recorded','distributors',p_id,p_reason,p_request,jsonb_build_object('reconciliation',target,'expected',actual,'counted',p_counted));RETURN target;END;$$;
CREATE FUNCTION public.admin_distributor_review_reconciliation(p_session uuid,p_id text,p_record text,p_updated_at timestamptz,p_to text,p_reason text,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;old public.admin_stock_reconciliations;BEGIN
 actor:=public.inventory_admin_actor(p_session,true);IF length(trim(p_reason)) NOT BETWEEN 10 AND 500 OR p_to NOT IN ('REVIEWED','CLOSED') THEN RAISE EXCEPTION 'INVALID_RECONCILIATION';END IF;
 SELECT id,status,updated_at INTO old.id,old.status,old.updated_at FROM public.admin_stock_reconciliations WHERE id=p_record AND partner_id=p_id FOR UPDATE;
 IF old.id IS NULL OR old.status='CLOSED' OR p_updated_at IS NULL OR old.updated_at<>p_updated_at OR (p_to='CLOSED' AND old.status<>'REVIEWED') THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
 UPDATE public.admin_stock_reconciliations SET status=p_to,updated_at=clock_timestamp() WHERE id=p_record;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,'distributor.reconciliation_'||lower(p_to),'distributors',p_id,p_reason,p_request,jsonb_build_object('status',old.status),jsonb_build_object('reconciliation',p_record,'status',p_to));END;$$;
CREATE FUNCTION public.admin_distributor_link_retailer(p_session uuid,p_id text,p_retailer text,p_reason text,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;old_parent text;BEGIN actor:=public.inventory_admin_actor(p_session,true);
 IF length(trim(p_reason)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'REASON_REQUIRED';END IF;
 PERFORM id FROM public.admin_partners WHERE id=p_id AND kind='DISTRIBUTOR' AND status='ACTIVE' FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'SUSPENDED_PARTNER';END IF;
 SELECT parent_distributor_id INTO old_parent FROM public.admin_partners WHERE id=p_retailer AND kind='RETAILER' AND status='ACTIVE' FOR UPDATE;
 IF NOT FOUND OR (old_parent IS NOT NULL AND old_parent<>p_id) THEN RAISE EXCEPTION 'INVALID_RETAILER';END IF;
 UPDATE public.admin_partners SET parent_distributor_id=p_id,updated_at=clock_timestamp() WHERE id=p_retailer;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'distributor.retailer_linked','distributors',p_id,p_reason,p_request,jsonb_build_object('retailer',p_retailer));END;$$;
REVOKE ALL ON FUNCTION public.admin_distributor_transfer_options(uuid),public.admin_distributor_request_transfer(uuid,text,text,integer,text,uuid),public.admin_distributor_transfer_transition(uuid,text,text,text,text,text,uuid),public.admin_distributor_reconcile(uuid,text,integer,integer,text,uuid),public.admin_distributor_review_reconciliation(uuid,text,text,timestamptz,text,text,uuid),public.admin_distributor_link_retailer(uuid,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_distributor_transfer_options(uuid),public.admin_distributor_request_transfer(uuid,text,text,integer,text,uuid),public.admin_distributor_transfer_transition(uuid,text,text,text,text,text,uuid),public.admin_distributor_reconcile(uuid,text,integer,integer,text,uuid),public.admin_distributor_review_reconciliation(uuid,text,text,timestamptz,text,text,uuid),public.admin_distributor_link_retailer(uuid,text,text,text,uuid) TO service_role;
CREATE FUNCTION public.admin_request_distributor_export(p_session uuid,p_filters jsonb,p_ids text[],p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;job uuid;BEGIN actor:=public.inventory_admin_actor(p_session);
 IF cardinality(p_ids)>100 OR cardinality(p_ids)=0 THEN RAISE EXCEPTION 'INVALID_SELECTION';END IF;
 IF p_ids IS NOT NULL AND (SELECT count(*) FROM public.admin_partners WHERE kind='DISTRIBUTOR' AND id=ANY(p_ids))<>cardinality(p_ids) THEN RAISE EXCEPTION 'INVALID_SELECTION';END IF;
 IF (SELECT count(*) FROM public.admin_export_jobs WHERE actor_id=actor AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'EXPORT_RATE_LIMIT';END IF;
 INSERT INTO public.admin_export_jobs(actor_id,module_key,distributor_filters,distributor_ids,selection_at) VALUES(actor,'distributors',p_filters,p_ids,now()) RETURNING id INTO job;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'EXPORT_REQUESTED','reports',job::text,'Scoped distributor network report',p_request,jsonb_build_object('module','distributors','selected',coalesce(cardinality(p_ids),0)));RETURN job;END;$$;
CREATE FUNCTION public.admin_distributor_export_page(p_job uuid,p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE job record;clause text;result jsonb;BEGIN
 SELECT j.distributor_filters,j.distributor_ids,j.selection_at INTO job FROM public.admin_export_jobs j JOIN public.admin_users a ON a.id=j.actor_id WHERE j.id=p_job AND j.module_key='distributors' AND j.status='PROCESSING' AND j.expires_at>now() AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST');
 IF NOT FOUND THEN RAISE EXCEPTION 'EXPORT_UNAVAILABLE';END IF;
 clause:=public.distributor_filter_clause(coalesce(job.distributor_filters,'{}'))||' AND p.created_at<=$2 AND ($3 IS NULL OR p.id=ANY($3))';
 IF p_cursor IS NOT NULL THEN clause:=clause||' AND (p.created_at,p.id)<(($4->>''created_at'')::timestamptz,$4->>''id'')';END IF;
 EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM (SELECT p.id,p.reference_code,p.name,p.city,p.state_name,p.district_name,p.status,p.verification_status,p.territory_count,p.on_hand,p.in_transit,p.retailer_count,p.unresolved_variance,p.created_at FROM public.admin_distributor_projection p WHERE '||clause||' ORDER BY p.created_at DESC,p.id DESC LIMIT 500) r' INTO result USING coalesce(job.distributor_filters,'{}'),coalesce(job.selection_at,now()),job.distributor_ids,p_cursor;RETURN result;END;$$;
REVOKE ALL ON FUNCTION public.admin_request_distributor_export(uuid,jsonb,text[],uuid),public.admin_distributor_export_page(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_request_distributor_export(uuid,jsonb,text[],uuid),public.admin_distributor_export_page(uuid,jsonb) TO service_role;
CREATE FUNCTION public.admin_distributor_history(p_session uuid,p_id text,p_section text,p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;contacts boolean;BEGIN
 PERFORM public.inventory_admin_actor(p_session);
 IF NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=p_id AND kind='DISTRIBUTOR') THEN RAISE EXCEPTION 'DISTRIBUTOR_NOT_FOUND';END IF;
 SELECT a.role IN ('SUPER_ADMIN','OPS_ADMIN') INTO contacts FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.id=p_session;
 CASE p_section
 WHEN 'transfers' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT t.id,t.reference_code,t.quantity,t.status,t.created_at,t.destination_partner_id,s.name AS source_name,d.name AS destination_name FROM public.admin_stock_transfers t LEFT JOIN public.admin_partners s ON s.id=t.source_partner_id JOIN public.admin_partners d ON d.id=t.destination_partner_id WHERE (t.destination_partner_id=p_id OR t.source_partner_id=p_id) AND (p_cursor IS NULL OR (t.created_at,t.id)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id')) ORDER BY t.created_at DESC,t.id DESC LIMIT 21) r;
 WHEN 'retailers' THEN
  WITH selected AS (SELECT p.id,p.reference_code,p.name,p.city,p.status,p.created_at FROM public.admin_partners p WHERE p.parent_distributor_id=p_id AND p.kind='RETAILER' AND (p_cursor IS NULL OR (p.created_at,p.id)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id')) ORDER BY p.created_at DESC,p.id DESC LIMIT 21),
  stock AS(SELECT q.current_retailer_id AS id,count(*)::integer AS quantity FROM public.qr_stickers q WHERE q.current_retailer_id IN(SELECT id FROM selected) AND q.status='WITH_RETAILER' GROUP BY q.current_retailer_id)
  SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT s.id,s.reference_code,s.name,s.city,s.status,s.created_at,coalesce(q.quantity,0) AS stock FROM selected s LEFT JOIN stock q ON q.id=s.id ORDER BY s.created_at DESC,s.id DESC) r;
 WHEN 'reconciliations' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT id,expected_quantity,counted_quantity,variance,status,created_at,updated_at FROM public.admin_stock_reconciliations WHERE partner_id=p_id AND (p_cursor IS NULL OR (created_at,id)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id')) ORDER BY created_at DESC,id DESC LIMIT 21) r;
 WHEN 'activity' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT l.id,l.action,CASE WHEN contacts THEN l.reason ELSE '' END AS reason,l.created_at,a.name AS actor_name FROM public.admin_audit_logs l JOIN public.admin_users a ON a.id=l.actor_id WHERE l.resource_type='distributors' AND l.resource_id=p_id AND (p_cursor IS NULL OR (l.created_at,l.id)<((p_cursor->>'created_at')::timestamptz,(p_cursor->>'id')::uuid)) ORDER BY l.created_at DESC,l.id DESC LIMIT 21) r;
 ELSE RAISE EXCEPTION 'INVALID_SECTION';END CASE;RETURN result;END;$$;
REVOKE ALL ON FUNCTION public.admin_distributor_history(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_distributor_history(uuid,text,text,jsonb) TO service_role;
-- GEOGRAPHY_REFERENCE_DATA: generated from the complete official IGOD snapshot by tooling.
-- Source: https://igod.gov.in/sg/district/states; snapshot 2026-10-10; identifiers are IGOD, not LGD codes.
INSERT INTO public.admin_geo_states(code,name,source_version) VALUES
('AN','Andaman and Nicobar Islands','2026-10-10'),
('AP','Andhra Pradesh','2026-10-10'),
('AR','Arunachal Pradesh','2026-10-10'),
('AS','Assam','2026-10-10'),
('BR','Bihar','2026-10-10'),
('CH','Chandigarh','2026-10-10'),
('CG','Chhattisgarh','2026-10-10'),
('ND','Dadra and Nagar Haveli and Daman and Diu','2026-10-10'),
('DL','Delhi','2026-10-10'),
('GA','Goa','2026-10-10'),
('GJ','Gujarat','2026-10-10'),
('HR','Haryana','2026-10-10'),
('HP','Himachal Pradesh','2026-10-10'),
('JK','Jammu and Kashmir','2026-10-10'),
('JH','Jharkhand','2026-10-10'),
('KA','Karnataka','2026-10-10'),
('KL','Kerala','2026-10-10'),
('LA','Ladakh','2026-10-10'),
('LD','Lakshadweep','2026-10-10'),
('MP','Madhya Pradesh','2026-10-10'),
('MH','Maharashtra','2026-10-10'),
('MN','Manipur','2026-10-10'),
('ML','Meghalaya','2026-10-10'),
('MZ','Mizoram','2026-10-10'),
('NL','Nagaland','2026-10-10'),
('OD','Odisha','2026-10-10'),
('PY','Puducherry','2026-10-10'),
('PB','Punjab','2026-10-10'),
('RJ','Rajasthan','2026-10-10'),
('SK','Sikkim','2026-10-10'),
('TN','Tamil Nadu','2026-10-10'),
('TS','Telangana','2026-10-10'),
('TR','Tripura','2026-10-10'),
('UP','Uttar Pradesh','2026-10-10'),
('UK','Uttarakhand','2026-10-10'),
('WB','West Bengal','2026-10-10');
INSERT INTO public.admin_geo_districts(code,state_code,name,source_version) VALUES
('czg3tXQBW7DqAzx4Vrus','AN','Nicobars','2026-10-10'),
('xzg3tXQBW7DqAzx4Vrut','AN','North And Middle Andaman','2026-10-10'),
('djg3tXQBW7DqAzx4Vrus','AN','South Andamans','2026-10-10'),
('kPtyHYABE0OKm-I4FaeT','AP','Alluri Sitharama Raju','2026-10-10'),
('lPt0HYABE0OKm-I4dae0','AP','Anakapalli','2026-10-10'),
('4Dg3tXQBW7DqAzx4Vryt','AP','Ananthapuramu','2026-10-10'),
('kvtzHYABE0OKm-I4s6cP','AP','Annamayya','2026-10-10'),
('oQV1HYABkVu6g5kHHJks','AP','Bapatla','2026-10-10'),
('4zg3tXQBW7DqAzx4Vryt','AP','Chittoor','2026-10-10'),
('pQV3HYABkVu6g5kH8plR','AP','Dr. B.R. Ambedkar Konaseema','2026-10-10'),
('Hjg3tXQBW7DqAzx4Vr2t','AP','East Godavari','2026-10-10'),
('ogV2HYABkVu6g5kHZpkt','AP','Eluru','2026-10-10'),
('5Tg3tXQBW7DqAzx4Vryt','AP','Guntur','2026-10-10'),
('lvt3HYABE0OKm-I4CKex','AP','Kakinada','2026-10-10'),
('Ozg3tXQBW7DqAzx4Vryt','AP','Krishna','2026-10-10'),
('xzg3tXQBW7DqAzx4Vryt','AP','Kurnool','2026-10-10'),
('ZzAF2ZsB15Llg5ed7TZt','AP','Markapuram Sub Districts','2026-10-10'),
('pwV5HYABkVu6g5kHRpnL','AP','Nandyal','2026-10-10'),
('qQV6HYABkVu6g5kHD5mx','AP','Ntr','2026-10-10'),
('qgV6HYABkVu6g5kH_Zkj','AP','Palnadu','2026-10-10'),
('rAV8HYABkVu6g5kHzZns','AP','Parvathipuram Manyam','2026-10-10'),
('aDAF2ZsB15Llg5ed7Ta-','AP','Polavaram Sub Districts','2026-10-10'),
('Jzg3tXQBW7DqAzx4Vryt','AP','Prakasam','2026-10-10'),
('5jg3tXQBW7DqAzx4Vryt','AP','Sri Potti Sriramulu Nellore','2026-10-10'),
('rQV-HYABkVu6g5kHepnx','AP','Sri Sathya Sai','2026-10-10'),
('dDg3tXQBW7DqAzx4Vrus','AP','Srikakulam','2026-10-10'),
('mvt_HYABE0OKm-I48aeR','AP','Tirupati','2026-10-10'),
('cTg3tXQBW7DqAzx4Vrus','AP','Visakhapatnam','2026-10-10'),
('xTg3tXQBW7DqAzx4Vrqs','AP','Vizianagaram','2026-10-10'),
('aTg3tXQBW7DqAzx4Vryt','AP','West Godavari','2026-10-10'),
('aDg3tXQBW7DqAzx4Vryt','AP','Y.S.R. Kadapa','2026-10-10'),
('kzg3tXQBW7DqAzx4Vrus','AR','Anjaw','2026-10-10'),
('mav7UpQB15Llg5edjlym','AR','Bichom Sub Districts','2026-10-10'),
('wDg3tXQBW7DqAzx4Vrut','AR','Changlang','2026-10-10'),
('Hzg3tXQBW7DqAzx4Vr2t','AR','Dibang Valley','2026-10-10'),
('qTg3tXQBW7DqAzx4Vryt','AR','East Kameng','2026-10-10'),
('qjg3tXQBW7DqAzx4Vryt','AR','East Siang','2026-10-10'),
('czg3tXQBW7DqAzx4Vr2t','AR','Kamle Sub Districts','2026-10-10'),
('mqv7UpQB15Llg5edj1we','AR','Keyi Panyor Sub Districts','2026-10-10'),
('Jzg3tXQBW7DqAzx4Vr2t','AR','Kra Daadi','2026-10-10'),
('IDg3tXQBW7DqAzx4Vr2t','AR','Kurung Kumey','2026-10-10'),
('cTg3tXQBW7DqAzx4Vr2t','AR','Leparada Sub Districts','2026-10-10'),
('2Tg3tXQBW7DqAzx4Vrqs','AR','Lohit','2026-10-10'),
('_jg3tXQBW7DqAzx4Vryt','AR','Longding','2026-10-10'),
('qzg3tXQBW7DqAzx4Vryt','AR','Lower Dibang Valley','2026-10-10'),
('djg3tXQBW7DqAzx4Vr2t','AR','Lower Siang Sub Districts','2026-10-10'),
('rDg3tXQBW7DqAzx4Vryt','AR','Lower Subansiri','2026-10-10'),
('_zg3tXQBW7DqAzx4Vryt','AR','Namsai','2026-10-10'),
('cDg3tXQBW7DqAzx4Vr2t','AR','Pakke Kessang Sub Districts','2026-10-10'),
('ITg3tXQBW7DqAzx4Vr2t','AR','Papum Pare','2026-10-10'),
('cjg3tXQBW7DqAzx4Vr2t','AR','Shi Yomi','2026-10-10'),
('ZTg3tXQBW7DqAzx4Vr2t','AR','Siang','2026-10-10'),
('Izg3tXQBW7DqAzx4Vr2t','AR','Tawang','2026-10-10'),
('XTg3tXQBW7DqAzx4Vrus','AR','Tirap','2026-10-10'),
('fjg3tXQBW7DqAzx4Vryt','AR','Upper Siang','2026-10-10'),
('njg3tXQBW7DqAzx4Vrus','AR','Upper Subansiri','2026-10-10'),
('JDg3tXQBW7DqAzx4Vr2t','AR','West Kameng','2026-10-10'),
('Ijg3tXQBW7DqAzx4Vr2t','AR','West Siang','2026-10-10'),
('NgXPjIoBF92NGf8XbNt8','AS','Bajali','2026-10-10'),
('LTg3tXQBW7DqAzx4Vryt','AS','Baksa','2026-10-10'),
('g76-uIsBC8DLsKxJhFEY','AS','Barpeta','2026-10-10'),
('YKNEInUBxrox_Nfi_3yz','AS','Biswanath','2026-10-10'),
('zjg3tXQBW7DqAzx4Vryt','AS','Bongaigaon','2026-10-10'),
('kjg3tXQBW7DqAzx4Vrus','AS','Cachar','2026-10-10'),
('6jg3tXQBW7DqAzx4Vryt','AS','Charaideo','2026-10-10'),
('Nzg3tXQBW7DqAzx4Vryt','AS','Chirang','2026-10-10'),
('hDg3tXQBW7DqAzx4Vryt','AS','Darrang','2026-10-10'),
('hTg3tXQBW7DqAzx4Vryt','AS','Dhemaji','2026-10-10'),
('hjg3tXQBW7DqAzx4Vryt','AS','Dhubri','2026-10-10'),
('hzg3tXQBW7DqAzx4Vryt','AS','Dibrugarh','2026-10-10'),
('jzg3tXQBW7DqAzx4Vryt','AS','Dima Hasao','2026-10-10'),
('iDg3tXQBW7DqAzx4Vryt','AS','Goalpara','2026-10-10'),
('Ljg3tXQBW7DqAzx4Vryt','AS','Golaghat','2026-10-10'),
('Rzg3tXQBW7DqAzx4Vryt','AS','Hailakandi','2026-10-10'),
('1b6-uIsBC8DLsKxJv1G1','AS','Hojai','2026-10-10'),
('gTg3tXQBW7DqAzx4Vryt','AS','Jorhat','2026-10-10'),
('iTg3tXQBW7DqAzx4Vryt','AS','Kamrup','2026-10-10'),
('vnuZcYgB2SjI4rfpoZGf','AS','Kamrup Metro','2026-10-10'),
('6r6-uIsBC8DLsKxJ1lG7','AS','Karbi Anglong','2026-10-10'),
('uTg3tXQBW7DqAzx4Vrqs','AS','Kokrajhar','2026-10-10'),
('izg3tXQBW7DqAzx4Vryt','AS','Lakhimpur','2026-10-10'),
('qDg3tXQBW7DqAzx4Vrut','AS','Majuli','2026-10-10'),
('kzg3tXQBW7DqAzx4Vryt','AS','Marigaon','2026-10-10'),
('jDg3tXQBW7DqAzx4Vryt','AS','Nagaon','2026-10-10'),
('3zg3tXQBW7DqAzx4Vrut','AS','Nalbari','2026-10-10'),
('Qzg3tXQBW7DqAzx4Vryt','AS','Sivasagar','2026-10-10'),
('jTg3tXQBW7DqAzx4Vryt','AS','Sonitpur','2026-10-10'),
('dTg3tXQBW7DqAzx4Vr2t','AS','South Salmara Mancachar','2026-10-10'),
('gjg3tXQBW7DqAzx4Vryt','AS','Sribhumi','2026-10-10'),
('u8eEPYwBC8DLsKxJZ2wi','AS','Tamulpur Sub Districts','2026-10-10'),
('jjg3tXQBW7DqAzx4Vryt','AS','Tinsukia','2026-10-10'),
('wTg3tXQBW7DqAzx4Vrut','AS','Udalguri','2026-10-10'),
('dDg3tXQBW7DqAzx4Vr2t','AS','West Karbi Anglong','2026-10-10'),
('qjg3tXQBW7DqAzx4Vrut','BR','Araria','2026-10-10'),
('xDg3tXQBW7DqAzx4Vrqs','BR','Arwal','2026-10-10'),
('dL6-uIsBC8DLsKxJelF0','BR','Aurangabad','2026-10-10'),
('uzg3tXQBW7DqAzx4Vrut','BR','Banka','2026-10-10'),
('tjg3tXQBW7DqAzx4Vrqs','BR','Begusarai','2026-10-10'),
('JTg3tXQBW7DqAzx4Vr2t','BR','Bhagalpur','2026-10-10'),
('Jjg3tXQBW7DqAzx4Vr2t','BR','Bhojpur','2026-10-10'),
('tjg3tXQBW7DqAzx4Vrut','BR','Buxar','2026-10-10'),
('1Tg3tXQBW7DqAzx4Vrqs','BR','Darbhanga','2026-10-10'),
('ujg3tXQBW7DqAzx4Vrqs','BR','Gaya','2026-10-10'),
('uzg3tXQBW7DqAzx4Vrqs','BR','Gopalganj','2026-10-10'),
('zTg3tXQBW7DqAzx4Vrqs','BR','Jamui','2026-10-10'),
('Bjg3tXQBW7DqAzx4Vr2t','BR','Jehanabad','2026-10-10'),
('rzg3tXQBW7DqAzx4Vrut','BR','Kaimur (Bhabua)','2026-10-10'),
('DDg3tXQBW7DqAzx4Vr2t','BR','Katihar','2026-10-10'),
('vDg3tXQBW7DqAzx4Vrqs','BR','Khagaria','2026-10-10'),
('zjg3tXQBW7DqAzx4Vrqs','BR','Kishanganj','2026-10-10'),
('zzg3tXQBW7DqAzx4Vrqs','BR','Lakhisarai','2026-10-10'),
('DTg3tXQBW7DqAzx4Vr2t','BR','Madhepura','2026-10-10'),
('1Dg3tXQBW7DqAzx4Vrqs','BR','Madhubani','2026-10-10'),
('Xjg3tXQBW7DqAzx4Vrus','BR','Munger','2026-10-10'),
('yDg3tXQBW7DqAzx4Vryt','BR','Muzaffarpur','2026-10-10'),
('0Dg3tXQBW7DqAzx4Vrqs','BR','Nalanda','2026-10-10'),
('sjg3tXQBW7DqAzx4Vrut','BR','Nawada','2026-10-10'),
('vTg3tXQBW7DqAzx4Vrqs','BR','Pashchim Champaran','2026-10-10'),
('tDg3tXQBW7DqAzx4Vrut','BR','Patna','2026-10-10'),
('1jg3tXQBW7DqAzx4Vrqs','BR','Purbi Champaran','2026-10-10'),
('bDg3tXQBW7DqAzx4Vrus','BR','Purnia','2026-10-10'),
('yTg3tXQBW7DqAzx4Vryt','BR','Rohtas','2026-10-10'),
('tzg3tXQBW7DqAzx4Vrut','BR','Saharsa','2026-10-10'),
('0Tg3tXQBW7DqAzx4Vrqs','BR','Samastipur','2026-10-10'),
('_Dg3tXQBW7DqAzx4Vryt','BR','Saran','2026-10-10'),
('0jg3tXQBW7DqAzx4Vrqs','BR','Sheikhpura','2026-10-10'),
('KDg3tXQBW7DqAzx4Vr2t','BR','Sheohar','2026-10-10'),
('-zg3tXQBW7DqAzx4Vrut','BR','Sitamarhi','2026-10-10'),
('pjg3tXQBW7DqAzx4Vrut','BR','Siwan','2026-10-10'),
('sjg3tXQBW7DqAzx4Vrqs','BR','Supaul','2026-10-10'),
('0zg3tXQBW7DqAzx4Vrqs','BR','Vaishali','2026-10-10'),
('Azg3tXQBW7DqAzx4Vryt','CG','Balod','2026-10-10'),
('_jg3tXQBW7DqAzx4Vrut','CG','Balodabazar-Bhatapara','2026-10-10'),
('Kzg3tXQBW7DqAzx4Vr2t','CG','Balrampur-Ramanujganj','2026-10-10'),
('LDg3tXQBW7DqAzx4Vryt','CG','Bastar','2026-10-10'),
('LDg3tXQBW7DqAzx4Vr2t','CG','Bemetara','2026-10-10'),
('szg3tXQBW7DqAzx4Vrut','CG','Bijapur','2026-10-10'),
('LTg3tXQBW7DqAzx4Vr2t','CG','Bilaspur','2026-10-10'),
('oDg3tXQBW7DqAzx4Vrus','CG','Dakshin Bastar Dantewada','2026-10-10'),
('Szg3tXQBW7DqAzx4Vryt','CG','Dhamtari','2026-10-10'),
('sDg3tXQBW7DqAzx4Vrut','CG','Durg','2026-10-10'),
('_Tg3tXQBW7DqAzx4Vrut','CG','Gariyaband','2026-10-10'),
('r3uOcYgB2SjI4rfpAJGX','CG','Gaurela-Pendra-Marwahi','2026-10-10'),
('TDg3tXQBW7DqAzx4Vryt','CG','Janjgir-Champa','2026-10-10'),
('Sjg3tXQBW7DqAzx4Vryt','CG','Jashpur','2026-10-10'),
('Ljg3tXQBW7DqAzx4Vr2t','CG','Kabeerdham','2026-10-10'),
('sXuOcYgB2SjI4rfp6JHE','CG','Khairagarh-Chhuikhadan-Gandai Sub Districts','2026-10-10'),
('Ajg3tXQBW7DqAzx4Vryt','CG','Kondagaon','2026-10-10'),
('976-uIsBC8DLsKxJ41HJ','CG','Korba','2026-10-10'),
('Tjg3tXQBW7DqAzx4Vryt','CG','Korea','2026-10-10'),
('Tzg3tXQBW7DqAzx4Vryt','CG','Mahasamund','2026-10-10'),
('s3uPcYgB2SjI4rfplJHq','CG','Manendragarh-Chirmiri-Bharatpur(M C B) Sub Districts','2026-10-10'),
('hwWUcYgBF92NGf8XIsYx','CG','Mohla-Manpur-Ambagarh Chouki','2026-10-10'),
('MDg3tXQBW7DqAzx4Vr2t','CG','Mungeli','2026-10-10'),
('0jg3tXQBW7DqAzx4Vryt','CG','Narayanpur','2026-10-10'),
('UDg3tXQBW7DqAzx4Vryt','CG','Raigarh','2026-10-10'),
('UTg3tXQBW7DqAzx4Vryt','CG','Raipur','2026-10-10'),
('Ujg3tXQBW7DqAzx4Vryt','CG','Rajnandgaon','2026-10-10'),
('hQWTcYgBF92NGf8Xe8YX','CG','Sakti Sub Districts','2026-10-10'),
('tHuQcYgB2SjI4rfpOpGh','CG','Sarangarh-Bilaigarh Sub Districts','2026-10-10'),
('_Dg3tXQBW7DqAzx4Vrut','CG','Sukma','2026-10-10'),
('Xzg3tXQBW7DqAzx4Vryt','CG','Surajpur','2026-10-10'),
('Uzg3tXQBW7DqAzx4Vryt','CG','Surguja','2026-10-10'),
('TTg3tXQBW7DqAzx4Vryt','CG','Uttar Bastar Kanker','2026-10-10'),
('Zjg3tXQBW7DqAzx4Vr2t','CH','Chandigarh','2026-10-10'),
('tzg3tXQBW7DqAzx4Vrqs','DL','Central','2026-10-10'),
('gGGq2J0Bzqy4jgdFIcgu','DL','Central North Sub Districts','2026-10-10'),
('4zg3tXQBW7DqAzx4Vrut','DL','East','2026-10-10'),
('2zg3tXQBW7DqAzx4Vrut','DL','New Delhi','2026-10-10'),
('3Tg3tXQBW7DqAzx4Vrut','DL','North','2026-10-10'),
('3jg3tXQBW7DqAzx4Vrut','DL','North East','2026-10-10'),
('4Dg3tXQBW7DqAzx4Vrut','DL','North West','2026-10-10'),
('gWGq2J0Bzqy4jgdFIchv','DL','Old Delhi Sub Districts','2026-10-10'),
('hGGq2J0Bzqy4jgdFIcig','DL','Outer North Sub Districts','2026-10-10'),
('1jg3tXQBW7DqAzx4Vrut','DL','South','2026-10-10'),
('4jg3tXQBW7DqAzx4Vrut','DL','South East','2026-10-10'),
('1zg3tXQBW7DqAzx4Vrut','DL','South West','2026-10-10'),
('lL6_uIsBC8DLsKxJVlJ9','DL','West','2026-10-10'),
('3ch56JsBzqy4jgdFAyLz','GA','Kushavati Sub Districts','2026-10-10'),
('iDg3tXQBW7DqAzx4Vrus','GA','North Goa','2026-10-10'),
('izg3tXQBW7DqAzx4Vrus','GA','South Goa','2026-10-10'),
('azg3tXQBW7DqAzx4Vrus','GJ','Ahmedabad','2026-10-10'),
('bTg3tXQBW7DqAzx4Vrus','GJ','Amreli','2026-10-10'),
('cjg3tXQBW7DqAzx4Vrus','GJ','Anand','2026-10-10'),
('7zg3tXQBW7DqAzx4Vryt','GJ','Arvalli','2026-10-10'),
('6Tg3tXQBW7DqAzx4Vrut','GJ','Banas Kantha','2026-10-10'),
('xTg3tXQBW7DqAzx4Vrut','GJ','Bharuch','2026-10-10'),
('6Dg3tXQBW7DqAzx4Vrut','GJ','Bhavnagar','2026-10-10'),
('Cjg3tXQBW7DqAzx4Vryt','GJ','Botad','2026-10-10'),
('DDg3tXQBW7DqAzx4Vryt','GJ','Chhotaudepur','2026-10-10'),
('6jg3tXQBW7DqAzx4Vrut','GJ','Dahod','2026-10-10'),
('hDg3tXQBW7DqAzx4Vrus','GJ','Dangs','2026-10-10'),
('Czg3tXQBW7DqAzx4Vryt','GJ','Devbhumi Dwarka','2026-10-10'),
('6zg3tXQBW7DqAzx4Vrut','GJ','Gandhinagar','2026-10-10'),
('DTg3tXQBW7DqAzx4Vryt','GJ','Gir Somnath','2026-10-10'),
('tTg3tXQBW7DqAzx4Vrqs','GJ','Jamnagar','2026-10-10'),
('Lzg3tXQBW7DqAzx4Vryt','GJ','Junagadh','2026-10-10'),
('qTg3tXQBW7DqAzx4Vrqs','GJ','Kachchh','2026-10-10'),
('7Dg3tXQBW7DqAzx4Vrut','GJ','Kheda','2026-10-10'),
('7Tg3tXQBW7DqAzx4Vrut','GJ','Mahesana','2026-10-10'),
('Djg3tXQBW7DqAzx4Vryt','GJ','Mahisagar','2026-10-10'),
('EDg3tXQBW7DqAzx4Vryt','GJ','Morbi','2026-10-10'),
('hTg3tXQBW7DqAzx4Vrus','GJ','Narmada','2026-10-10'),
('2jg3tXQBW7DqAzx4Vrut','GJ','Navsari','2026-10-10'),
('Mjg3tXQBW7DqAzx4Vryt','GJ','Panch Mahals','2026-10-10'),
('MTg3tXQBW7DqAzx4Vr2t','GJ','Patan','2026-10-10'),
('7jg3tXQBW7DqAzx4Vrut','GJ','Porbandar','2026-10-10'),
('7zg3tXQBW7DqAzx4Vrut','GJ','Rajkot','2026-10-10'),
('8Dg3tXQBW7DqAzx4Vrut','GJ','Sabar Kantha','2026-10-10'),
('8Tg3tXQBW7DqAzx4Vrut','GJ','Surat','2026-10-10'),
('8jg3tXQBW7DqAzx4Vrut','GJ','Surendranagar','2026-10-10'),
('Dzg3tXQBW7DqAzx4Vryt','GJ','Tapi','2026-10-10'),
('9Dg3tXQBW7DqAzx4Vrut','GJ','Vadodara','2026-10-10'),
('8zg3tXQBW7DqAzx4Vrut','GJ','Valsad','2026-10-10'),
('vLg7zZoB15Llg5edQ9ua','GJ','Vav-Tharad Sub Districts','2026-10-10'),
('MTg3tXQBW7DqAzx4Vrus','HP','Bilaspur','2026-10-10'),
('NTg3tXQBW7DqAzx4Vr2t','HP','Chamba','2026-10-10'),
('0L6-uIsBC8DLsKxJu1Eo','HP','Hamirpur','2026-10-10'),
('Njg3tXQBW7DqAzx4Vr2t','HP','Kangra','2026-10-10'),
('Vzg3tXQBW7DqAzx4Vrus','HP','Kinnaur','2026-10-10'),
('ZDg3tXQBW7DqAzx4Vrus','HP','Kullu','2026-10-10'),
('4Tg3tXQBW7DqAzx4Vrut','HP','Lahaul And Spiti','2026-10-10'),
('ZTg3tXQBW7DqAzx4Vrus','HP','Mandi','2026-10-10'),
('UDg3tXQBW7DqAzx4Vrus','HP','Shimla','2026-10-10'),
('Mjg3tXQBW7DqAzx4Vrus','HP','Sirmaur','2026-10-10'),
('Zjg3tXQBW7DqAzx4Vrus','HP','Solan','2026-10-10'),
('Nzg3tXQBW7DqAzx4Vr2t','HP','Una','2026-10-10'),
('Mjg3tXQBW7DqAzx4Vr2t','HR','Ambala','2026-10-10'),
('dzg3tXQBW7DqAzx4Vrus','HR','Bhiwani','2026-10-10'),
('Kjg3tXQBW7DqAzx4Vr2t','HR','Charkhi Dadri','2026-10-10'),
('cDg3tXQBW7DqAzx4Vryt','HR','Faridabad','2026-10-10'),
('eDg3tXQBW7DqAzx4Vrus','HR','Fatehabad','2026-10-10'),
('-jg3tXQBW7DqAzx4Vryt','HR','Gurugram','2026-10-10'),
('eTIs3psB15Llg5edStgf','HR','Hansi Sub Districts','2026-10-10'),
('eTg3tXQBW7DqAzx4Vrus','HR','Hisar','2026-10-10'),
('lDg3tXQBW7DqAzx4Vryt','HR','Jhajjar','2026-10-10'),
('ejg3tXQBW7DqAzx4Vrus','HR','Jind','2026-10-10'),
('ezg3tXQBW7DqAzx4Vrus','HR','Kaithal','2026-10-10'),
('fDg3tXQBW7DqAzx4Vrus','HR','Karnal','2026-10-10'),
('fTg3tXQBW7DqAzx4Vrus','HR','Kurukshetra','2026-10-10'),
('3Dg3tXQBW7DqAzx4Vrqs','HR','Mahendragarh','2026-10-10'),
('Bzg3tXQBW7DqAzx4Vr2t','HR','Nuh','2026-10-10'),
('Mzg3tXQBW7DqAzx4Vr2t','HR','Palwal','2026-10-10'),
('lTg3tXQBW7DqAzx4Vryt','HR','Panchkula','2026-10-10'),
('ljg3tXQBW7DqAzx4Vryt','HR','Panipat','2026-10-10'),
('fjg3tXQBW7DqAzx4Vrus','HR','Rewari','2026-10-10'),
('lzg3tXQBW7DqAzx4Vryt','HR','Rohtak','2026-10-10'),
('fzg3tXQBW7DqAzx4Vrus','HR','Sirsa','2026-10-10'),
('NDg3tXQBW7DqAzx4Vr2t','HR','Sonipat','2026-10-10'),
('1zg3tXQBW7DqAzx4Vrqs','HR','Yamunanagar','2026-10-10'),
('wTg3tXQBW7DqAzx4Vrqs','JH','Bokaro','2026-10-10'),
('ujg3tXQBW7DqAzx4Vrut','JH','Chatra','2026-10-10'),
('OTg3tXQBW7DqAzx4Vr2t','JH','Deoghar','2026-10-10'),
('rTg3tXQBW7DqAzx4Vryt','JH','Dhanbad','2026-10-10'),
('5Tg3tXQBW7DqAzx4Vrut','JH','Dumka','2026-10-10'),
('Ojg3tXQBW7DqAzx4Vr2t','JH','East Singhbum','2026-10-10'),
('KTg3tXQBW7DqAzx4Vr2t','JH','Garhwa','2026-10-10'),
('Yjg3tXQBW7DqAzx4Vryt','JH','Giridih','2026-10-10'),
('Xzg3tXQBW7DqAzx4Vrus','JH','Godda','2026-10-10'),
('rjg3tXQBW7DqAzx4Vryt','JH','Gumla','2026-10-10'),
('bjg3tXQBW7DqAzx4Vrus','JH','Hazaribagh','2026-10-10'),
('yjg3tXQBW7DqAzx4Vryt','JH','Jamtara','2026-10-10'),
('zzg3tXQBW7DqAzx4Vryt','JH','Khunti','2026-10-10'),
('Ozg3tXQBW7DqAzx4Vr2t','JH','Koderma','2026-10-10'),
('bzg3tXQBW7DqAzx4Vrus','JH','Latehar','2026-10-10'),
('cTg3tXQBW7DqAzx4Vryt','JH','Lohardaga','2026-10-10'),
('Pb6_uIsBC8DLsKxJDVIy','JH','Pakur','2026-10-10'),
('PDg3tXQBW7DqAzx4Vr2t','JH','Palamu','2026-10-10'),
('3Tg3tXQBW7DqAzx4Vrqs','JH','Ramgarh','2026-10-10'),
('BTg3tXQBW7DqAzx4Vr2t','JH','Ranchi','2026-10-10'),
('QDg3tXQBW7DqAzx4Vryt','JH','Sahebganj','2026-10-10'),
('Mzg3tXQBW7DqAzx4Vrus','JH','Saraikela Kharsawan','2026-10-10'),
('PTg3tXQBW7DqAzx4Vr2t','JH','Simdega','2026-10-10'),
('mDg3tXQBW7DqAzx4Vryt','JH','West Singhbhum','2026-10-10'),
('TTg3tXQBW7DqAzx4Vrus','JK','Anantnag','2026-10-10'),
('wjg3tXQBW7DqAzx4Vrqs','JK','Bandipora','2026-10-10'),
('Mzg3tXQBW7DqAzx4Vryt','JK','Baramulla','2026-10-10'),
('NDg3tXQBW7DqAzx4Vryt','JK','Budgam','2026-10-10'),
('9Dg3tXQBW7DqAzx4Vryt','JK','Doda','2026-10-10'),
('uDg3tXQBW7DqAzx4Vrqs','JK','Ganderbal','2026-10-10'),
('zDg3tXQBW7DqAzx4Vrqs','JK','Jammu','2026-10-10'),
('9jg3tXQBW7DqAzx4Vryt','JK','Kathua','2026-10-10'),
('0Dg3tXQBW7DqAzx4Vryt','JK','Kishtwar','2026-10-10'),
('3jg3tXQBW7DqAzx4Vrqs','JK','Kulgam','2026-10-10'),
('Tjg3tXQBW7DqAzx4Vrus','JK','Kupwara','2026-10-10'),
('gzg3tXQBW7DqAzx4Vryt','JK','Poonch','2026-10-10'),
('ODg3tXQBW7DqAzx4Vr2t','JK','Pulwama','2026-10-10'),
('jzg3tXQBW7DqAzx4Vrus','JK','Rajouri','2026-10-10'),
('0zg3tXQBW7DqAzx4Vryt','JK','Ramban','2026-10-10'),
('-Dg3tXQBW7DqAzx4Vryt','JK','Reasi','2026-10-10'),
('kDg3tXQBW7DqAzx4Vrus','JK','Samba','2026-10-10'),
('cDg3tXQBW7DqAzx4Vrus','JK','Shopian','2026-10-10'),
('Njg3tXQBW7DqAzx4Vryt','JK','Srinagar','2026-10-10'),
('wzg3tXQBW7DqAzx4Vrqs','JK','Udhampur','2026-10-10'),
('WTg3tXQBW7DqAzx4Vrus','KA','Bagalkote','2026-10-10'),
('wTg3tXQBW7DqAzx4Vryt','KA','Ballari','2026-10-10'),
('uDg3tXQBW7DqAzx4Vrut','KA','Belagavi','2026-10-10'),
('pzg3tXQBW7DqAzx4Vrut','KA','Bengaluru Rural','2026-10-10'),
('ATg3tXQBW7DqAzx4Vryt','KA','Bengaluru South','2026-10-10'),
('Zzg3tXQBW7DqAzx4Vr2t','KA','Bengaluru Urban','2026-10-10'),
('Wjg3tXQBW7DqAzx4Vrus','KA','Bidar','2026-10-10'),
('BTg3tXQBW7DqAzx4Vryt','KA','Chamarajanagar','2026-10-10'),
('ozg3tXQBW7DqAzx4Vrus','KA','Chikkaballapura','2026-10-10'),
('dzg3tXQBW7DqAzx4Vryt','KA','Chikkamagaluru','2026-10-10'),
('vzg3tXQBW7DqAzx4Vrut','KA','Chitradurga','2026-10-10'),
('aDg3tXQBW7DqAzx4Vr2t','KA','Dakshina Kannada','2026-10-10'),
('Zjg3tXQBW7DqAzx4Vryt','KA','Davanagere','2026-10-10'),
('BDg3tXQBW7DqAzx4Vryt','KA','Dharwad','2026-10-10'),
('oTg3tXQBW7DqAzx4Vrus','KA','Gadag','2026-10-10'),
('Pjg3tXQBW7DqAzx4Vr2t','KA','Hassan','2026-10-10'),
('9Tg3tXQBW7DqAzx4Vrut','KA','Haveri','2026-10-10'),
('sTg3tXQBW7DqAzx4Vrut','KA','Kalaburagi','2026-10-10'),
('rzg3tXQBW7DqAzx4Vryt','KA','Kodagu','2026-10-10'),
('2Tg3tXQBW7DqAzx4Vrut','KA','Kolar','2026-10-10'),
('qDg3tXQBW7DqAzx4Vryt','KA','Koppal','2026-10-10'),
('MDg3tXQBW7DqAzx4Vryt','KA','Mandya','2026-10-10'),
('eTg3tXQBW7DqAzx4Vryt','KA','Mysuru','2026-10-10'),
('xDg3tXQBW7DqAzx4Vryt','KA','Raichur','2026-10-10'),
('kTg3tXQBW7DqAzx4Vryt','KA','Shivamogga','2026-10-10'),
('ODg3tXQBW7DqAzx4Vryt','KA','Tumakuru','2026-10-10'),
('2Dg3tXQBW7DqAzx4Vrut','KA','Udupi','2026-10-10'),
('xDg3tXQBW7DqAzx4Vrut','KA','Uttara Kannada','2026-10-10'),
('v3ubcYgB2SjI4rfp_5GV','KA','Vijayanagara','2026-10-10'),
('kb6_uIsBC8DLsKxJU1IT','KA','Vijayapura','2026-10-10'),
('Pzg3tXQBW7DqAzx4Vr2t','KA','Yadgir','2026-10-10'),
('QDg3tXQBW7DqAzx4Vr2t','KL','Alappuzha','2026-10-10'),
('mTg3tXQBW7DqAzx4Vrus','KL','Ernakulam','2026-10-10'),
('9zg3tXQBW7DqAzx4Vrut','KL','Idukki','2026-10-10'),
('QTg3tXQBW7DqAzx4Vr2t','KL','Kannur','2026-10-10'),
('NDg3tXQBW7DqAzx4Vrus','KL','Kasaragod','2026-10-10'),
('Qjg3tXQBW7DqAzx4Vr2t','KL','Kollam','2026-10-10'),
('UTg3tXQBW7DqAzx4Vrus','KL','Kottayam','2026-10-10'),
('Ujg3tXQBW7DqAzx4Vrus','KL','Kozhikode','2026-10-10'),
('Azg3tXQBW7DqAzx4Vrus','KL','Malappuram','2026-10-10'),
('9jg3tXQBW7DqAzx4Vrut','KL','Palakkad','2026-10-10'),
('Uzg3tXQBW7DqAzx4Vrus','KL','Pathanamthitta','2026-10-10'),
('VDg3tXQBW7DqAzx4Vrus','KL','Thiruvananthapuram','2026-10-10'),
('VTg3tXQBW7DqAzx4Vrus','KL','Thrissur','2026-10-10'),
('NTg3tXQBW7DqAzx4Vrus','KL','Wayanad','2026-10-10'),
('njg3tXQBW7DqAzx4Vryt','LA','Kargil','2026-10-10'),
('ijg3tXQBW7DqAzx4Vrus','LA','Leh Ladakh','2026-10-10'),
('pTg3tXQBW7DqAzx4Vrus','LD','Lakshadweep District','2026-10-10'),
('xzg3tXQBW7DqAzx4Vrqs','MH','Ahilyanagar','2026-10-10'),
('jDg3tXQBW7DqAzx4Vrus','MH','Akola','2026-10-10'),
('jTg3tXQBW7DqAzx4Vrus','MH','Amravati','2026-10-10'),
('_Tg3tXQBW7DqAzx4Vryt','MH','Beed','2026-10-10'),
('Qzg3tXQBW7DqAzx4Vr2t','MH','Bhandara','2026-10-10'),
('gDg3tXQBW7DqAzx4Vrus','MH','Buldhana','2026-10-10'),
('mTg3tXQBW7DqAzx4Vryt','MH','Chandrapur','2026-10-10'),
('lDg3tXQBW7DqAzx4Vrus','MH','Chhatrapati Sambhajinagar','2026-10-10'),
('rDg3tXQBW7DqAzx4Vrqs','MH','Dharashiv','2026-10-10'),
('cjg3tXQBW7DqAzx4Vryt','MH','Dhule','2026-10-10'),
('qjg3tXQBW7DqAzx4Vrqs','MH','Gadchiroli','2026-10-10'),
('RDg3tXQBW7DqAzx4Vr2t','MH','Gondia','2026-10-10'),
('sDg3tXQBW7DqAzx4Vryt','MH','Hingoli','2026-10-10'),
('qzg3tXQBW7DqAzx4Vrqs','MH','Jalgaon','2026-10-10'),
('yDg3tXQBW7DqAzx4Vrqs','MH','Jalna','2026-10-10'),
('RTg3tXQBW7DqAzx4Vr2t','MH','Kolhapur','2026-10-10'),
('lTg3tXQBW7DqAzx4Vrus','MH','Latur','2026-10-10'),
('YDg3tXQBW7DqAzx4Vrus','MH','Mumbai','2026-10-10'),
('yTg3tXQBW7DqAzx4Vrqs','MH','Mumbai Suburban','2026-10-10'),
('Rjg3tXQBW7DqAzx4Vr2t','MH','Nagpur','2026-10-10'),
('ljg3tXQBW7DqAzx4Vrus','MH','Nanded','2026-10-10'),
('sTg3tXQBW7DqAzx4Vryt','MH','Nandurbar','2026-10-10'),
('Bjg3tXQBW7DqAzx4Vryt','MH','Nashik','2026-10-10'),
('Kjg3tXQBW7DqAzx4Vryt','MH','Palghar','2026-10-10'),
('rzg3tXQBW7DqAzx4Vrqs','MH','Parbhani','2026-10-10'),
('mjg3tXQBW7DqAzx4Vryt','MH','Pune','2026-10-10'),
('rTg3tXQBW7DqAzx4Vrqs','MH','Raigad','2026-10-10'),
('Rzg3tXQBW7DqAzx4Vr2t','MH','Ratnagiri','2026-10-10'),
('sDg3tXQBW7DqAzx4Vrqs','MH','Sangli','2026-10-10'),
('Bzg3tXQBW7DqAzx4Vryt','MH','Satara','2026-10-10'),
('-Dg3tXQBW7DqAzx4Vrut','MH','Sindhudurg','2026-10-10'),
('sTg3tXQBW7DqAzx4Vrqs','MH','Solapur','2026-10-10'),
('SDg3tXQBW7DqAzx4Vr2t','MH','Thane','2026-10-10'),
('CDg3tXQBW7DqAzx4Vryt','MH','Wardha','2026-10-10'),
('CTg3tXQBW7DqAzx4Vryt','MH','Washim','2026-10-10'),
('QTg3tXQBW7DqAzx4Vryt','MH','Yavatmal','2026-10-10'),
('hjg3tXQBW7DqAzx4Vrus','ML','East Garo Hills','2026-10-10'),
('8Dg3tXQBW7DqAzx4Vryt','ML','East Jaintia Hills','2026-10-10'),
('MDg3tXQBW7DqAzx4Vrus','ML','East Khasi Hills','2026-10-10'),
('Q6NEInUBxrox_Nfi_3ix','ML','Eastern West Khasi Hills Sub Districts','2026-10-10'),
('PTg3tXQBW7DqAzx4Vryt','ML','North Garo Hills','2026-10-10'),
('2zg3tXQBW7DqAzx4Vrqs','ML','Ri Bhoi','2026-10-10'),
('Pjg3tXQBW7DqAzx4Vrus','ML','South Garo Hills','2026-10-10'),
('nTg3tXQBW7DqAzx4Vrus','ML','South West Garo Hills','2026-10-10'),
('PDg3tXQBW7DqAzx4Vryt','ML','South West Khasi Hills','2026-10-10'),
('3zg3tXQBW7DqAzx4Vrqs','ML','West Garo Hills','2026-10-10'),
('qDg3tXQBW7DqAzx4Vrqs','ML','West Jaintia Hills','2026-10-10'),
('Lzg3tXQBW7DqAzx4Vrus','ML','West Khasi Hills','2026-10-10'),
('1Dg3tXQBW7DqAzx4Vrut','MN','Bishnupur','2026-10-10'),
('rjg3tXQBW7DqAzx4Vrut','MN','Chandel','2026-10-10'),
('aTg3tXQBW7DqAzx4Vr2t','MN','Churachandpur','2026-10-10'),
('yTg3tXQBW7DqAzx4Vrut','MN','Imphal East','2026-10-10'),
('STg3tXQBW7DqAzx4Vr2t','MN','Imphal West','2026-10-10'),
('dzg3tXQBW7DqAzx4Vr2t','MN','Jiribam Sub Districts','2026-10-10'),
('Jjg3tXQBW7DqAzx4Vryt','MN','Kakching','2026-10-10'),
('eDg3tXQBW7DqAzx4Vr2t','MN','Kamjong','2026-10-10'),
('-Tg3tXQBW7DqAzx4Vryt','MN','Kangpokpi','2026-10-10'),
('eTg3tXQBW7DqAzx4Vr2t','MN','Noney Sub Districts','2026-10-10'),
('ejg3tXQBW7DqAzx4Vr2t','MN','Pherzawl','2026-10-10'),
('Sjg3tXQBW7DqAzx4Vr2t','MN','Senapati','2026-10-10'),
('mzg3tXQBW7DqAzx4Vryt','MN','Tamenglong','2026-10-10'),
('ezg3tXQBW7DqAzx4Vr2t','MN','Tengnoupal','2026-10-10'),
('nDg3tXQBW7DqAzx4Vryt','MN','Thoubal','2026-10-10'),
('fzg3tXQBW7DqAzx4Vryt','MN','Ukhrul','2026-10-10'),
('7Tg3tXQBW7DqAzx4Vryt','MP','Agar-Malwa','2026-10-10'),
('rjg3tXQBW7DqAzx4Vrqs','MP','Alirajpur','2026-10-10'),
('WDg3tXQBW7DqAzx4Vrus','MP','Anuppur','2026-10-10'),
('ATg3tXQBW7DqAzx4Vr2t','MP','Ashoknagar','2026-10-10'),
('2Tg3tXQBW7DqAzx4Vryt','MP','Balaghat','2026-10-10'),
('Ozg3tXQBW7DqAzx4Vrus','MP','Barwani','2026-10-10'),
('Ejg3tXQBW7DqAzx4Vrus','MP','Betul','2026-10-10'),
('2zg3tXQBW7DqAzx4Vryt','MP','Bhind','2026-10-10'),
('PDg3tXQBW7DqAzx4Vrus','MP','Bhopal','2026-10-10'),
('Ajg3tXQBW7DqAzx4Vr2t','MP','Burhanpur','2026-10-10'),
('5Dg3tXQBW7DqAzx4Vrqs','MP','Chhatarpur','2026-10-10'),
('5Tg3tXQBW7DqAzx4Vrqs','MP','Chhindwara','2026-10-10'),
('KDg3tXQBW7DqAzx4Vryt','MP','Damoh','2026-10-10'),
('6Dg3tXQBW7DqAzx4Vrqs','MP','Datia','2026-10-10'),
('6jg3tXQBW7DqAzx4Vrqs','MP','Dewas','2026-10-10'),
('3Tg3tXQBW7DqAzx4Vryt','MP','Dhar','2026-10-10'),
('Sjg3tXQBW7DqAzx4Vrus','MP','Dindori','2026-10-10'),
('7Tg3tXQBW7DqAzx4Vrqs','MP','Guna','2026-10-10'),
('5jg3tXQBW7DqAzx4Vrqs','MP','Gwalior','2026-10-10'),
('3zg3tXQBW7DqAzx4Vryt','MP','Harda','2026-10-10'),
('RDg3tXQBW7DqAzx4Vrus','MP','Indore','2026-10-10'),
('4jg3tXQBW7DqAzx4Vryt','MP','Jabalpur','2026-10-10'),
('Ljg3tXQBW7DqAzx4Vrus','MP','Jhabua','2026-10-10'),
('5Dg3tXQBW7DqAzx4Vryt','MP','Katni','2026-10-10'),
('RTg3tXQBW7DqAzx4Vrus','MP','Khandwa (East Nimar)','2026-10-10'),
('6Dg3tXQBW7DqAzx4Vryt','MP','Khargone (West Nimar)','2026-10-10'),
('Db6-uIsBC8DLsKxJ8lLy','MP','Maihar Sub Districts','2026-10-10'),
('7zg3tXQBW7DqAzx4Vrqs','MP','Mandla','2026-10-10'),
('6Tg3tXQBW7DqAzx4Vryt','MP','Mandsaur','2026-10-10'),
('NQXNjIoBF92NGf8XtttX','MP','MAUGANJ','2026-10-10'),
('8Dg3tXQBW7DqAzx4Vrqs','MP','Morena','2026-10-10'),
('7jg3tXQBW7DqAzx4Vrqs','MP','Narmadapuram','2026-10-10'),
('Azg3tXQBW7DqAzx4Vr2t','MP','Narsimhapur','2026-10-10'),
('Rjg3tXQBW7DqAzx4Vrus','MP','Neemuch','2026-10-10'),
('6zg3tXQBW7DqAzx4Vryt','MP','Niwari','2026-10-10'),
('QL6_uIsBC8DLsKxJEFIQ','MP','Pandhurna Sub Districts','2026-10-10'),
('8Tg3tXQBW7DqAzx4Vrqs','MP','Panna','2026-10-10'),
('Rzg3tXQBW7DqAzx4Vrus','MP','Raisen','2026-10-10'),
('BDg3tXQBW7DqAzx4Vr2t','MP','Rajgarh','2026-10-10'),
('8jg3tXQBW7DqAzx4Vrqs','MP','Ratlam','2026-10-10'),
('-zg3tXQBW7DqAzx4Vrqs','MP','Rewa','2026-10-10'),
('5zg3tXQBW7DqAzx4Vrqs','MP','Sagar','2026-10-10'),
('8zg3tXQBW7DqAzx4Vrqs','MP','Satna','2026-10-10'),
('Szg3tXQBW7DqAzx4Vrus','MP','Sehore','2026-10-10'),
('Ojg3tXQBW7DqAzx4Vryt','MP','Seoni','2026-10-10'),
('9Dg3tXQBW7DqAzx4Vrqs','MP','Shahdol','2026-10-10'),
('9Tg3tXQBW7DqAzx4Vrqs','MP','Shajapur','2026-10-10'),
('SDg3tXQBW7DqAzx4Vrus','MP','Sheopur','2026-10-10'),
('KTg3tXQBW7DqAzx4Vryt','MP','Shivpuri','2026-10-10'),
('TDg3tXQBW7DqAzx4Vrus','MP','Sidhi','2026-10-10'),
('yDg3tXQBW7DqAzx4Vrut','MP','Singrauli','2026-10-10'),
('9jg3tXQBW7DqAzx4Vrqs','MP','Tikamgarh','2026-10-10'),
('9zg3tXQBW7DqAzx4Vrqs','MP','Ujjain','2026-10-10'),
('Fjg3tXQBW7DqAzx4Vrus','MP','Umaria','2026-10-10'),
('-Dg3tXQBW7DqAzx4Vrqs','MP','Vidisha','2026-10-10'),
('mjg3tXQBW7DqAzx4Vrus','MZ','Aizawl','2026-10-10'),
('mDg3tXQBW7DqAzx4Vrus','MZ','Champhai','2026-10-10'),
('kaNEInUBxrox_Nfi_32z','MZ','Hnahthial Sub Districts','2026-10-10'),
('eKNEInUBxrox_Nfi_3yz','MZ','Khawzawl Sub Districts','2026-10-10'),
('ZDg3tXQBW7DqAzx4Vryt','MZ','Kolasib','2026-10-10'),
('vTg3tXQBW7DqAzx4Vrut','MZ','Lawngtlai','2026-10-10'),
('dDg3tXQBW7DqAzx4Vryt','MZ','Lunglei','2026-10-10'),
('ZTg3tXQBW7DqAzx4Vryt','MZ','Mamit','2026-10-10'),
('JaNEInUBxrox_Nfi_3uy','MZ','Saitual Sub Districts','2026-10-10'),
('RTg3tXQBW7DqAzx4Vryt','MZ','Serchhip','2026-10-10'),
('mzg3tXQBW7DqAzx4Vrus','MZ','Siaha','2026-10-10'),
('p76-uIsBC8DLsKxJnFFU','ND','Dadra And Nagar Haveli','2026-10-10'),
('5jg3tXQBW7DqAzx4Vrut','ND','Daman','2026-10-10'),
('5zg3tXQBW7DqAzx4Vrut','ND','Diu','2026-10-10'),
('t3uWcYgB2SjI4rfpAZHy','NL','Chumoukedima','2026-10-10'),
('pzg3tXQBW7DqAzx4Vryt','NL','Dimapur','2026-10-10'),
('Szg3tXQBW7DqAzx4Vr2t','NL','Kiphire','2026-10-10'),
('Yzg3tXQBW7DqAzx4Vryt','NL','Kohima','2026-10-10'),
('ejg3tXQBW7DqAzx4Vryt','NL','Longleng','2026-10-10'),
('veeQapYB15Llg5ed5nOV','NL','Meluri Sub Districts','2026-10-10'),
('xjg3tXQBW7DqAzx4Vrqs','NL','Mokokchung','2026-10-10'),
('sjg3tXQBW7DqAzx4Vryt','NL','Mon','2026-10-10'),
('tnuVcYgB2SjI4rfpRpEh','NL','Niuland Sub Districts','2026-10-10'),
('BvMK33sBnAUp6yMBF92e','NL','Noklak','2026-10-10'),
('Zzg3tXQBW7DqAzx4Vryt','NL','Peren','2026-10-10'),
('pjg3tXQBW7DqAzx4Vryt','NL','Phek','2026-10-10'),
('uXuWcYgB2SjI4rfpz5Hl','NL','Shamator','2026-10-10'),
('unuXcYgB2SjI4rfpq5Fc','NL','Tseminyu','2026-10-10'),
('szg3tXQBW7DqAzx4Vryt','NL','Tuensang','2026-10-10'),
('pTg3tXQBW7DqAzx4Vryt','NL','Wokha','2026-10-10'),
('YTg3tXQBW7DqAzx4Vryt','NL','Zunheboto','2026-10-10'),
('TDg3tXQBW7DqAzx4Vr2t','OD','Anugola','2026-10-10'),
('XDg3tXQBW7DqAzx4Vryt','OD','Balangir','2026-10-10'),
('XTg3tXQBW7DqAzx4Vryt','OD','Baleshwar','2026-10-10'),
('Xjg3tXQBW7DqAzx4Vryt','OD','Baragada','2026-10-10'),
('tDg3tXQBW7DqAzx4Vryt','OD','Bhadrak','2026-10-10'),
('TTg3tXQBW7DqAzx4Vr2t','OD','Boudh','2026-10-10'),
('Tjg3tXQBW7DqAzx4Vr2t','OD','Debagada','2026-10-10'),
('Tzg3tXQBW7DqAzx4Vr2t','OD','Dhenkanal','2026-10-10'),
('tTg3tXQBW7DqAzx4Vryt','OD','Gajapati','2026-10-10'),
('1Dg3tXQBW7DqAzx4Vryt','OD','Ganjam','2026-10-10'),
('czg3tXQBW7DqAzx4Vryt','OD','Jagatsinghapur','2026-10-10'),
('gTg3tXQBW7DqAzx4Vrus','OD','Jajpur','2026-10-10'),
('UDg3tXQBW7DqAzx4Vr2t','OD','Jharsuguda','2026-10-10'),
('tjg3tXQBW7DqAzx4Vryt','OD','Kalahandi','2026-10-10'),
('tzg3tXQBW7DqAzx4Vryt','OD','Kandhamala','2026-10-10'),
('nTg3tXQBW7DqAzx4Vryt','OD','Kataka','2026-10-10'),
('UTg3tXQBW7DqAzx4Vr2t','OD','Kendrapada','2026-10-10'),
('Ujg3tXQBW7DqAzx4Vr2t','OD','Kendujhar','2026-10-10'),
('uDg3tXQBW7DqAzx4Vryt','OD','Khordha','2026-10-10'),
('Uzg3tXQBW7DqAzx4Vr2t','OD','Koraput','2026-10-10'),
('1Tg3tXQBW7DqAzx4Vryt','OD','Malkangiri','2026-10-10'),
('uTg3tXQBW7DqAzx4Vryt','OD','Mayurbhanj','2026-10-10'),
('1Tg3tXQBW7DqAzx4Vrut','OD','Nabarangpur','2026-10-10'),
('gjg3tXQBW7DqAzx4Vrus','OD','Nayagada','2026-10-10'),
('1jg3tXQBW7DqAzx4Vryt','OD','Nuapada','2026-10-10'),
('rTg3tXQBW7DqAzx4Vrut','OD','Puri','2026-10-10'),
('ujg3tXQBW7DqAzx4Vryt','OD','Rayagada','2026-10-10'),
('qzg3tXQBW7DqAzx4Vrut','OD','Sambalpur','2026-10-10'),
('VDg3tXQBW7DqAzx4Vr2t','OD','Subarnapur','2026-10-10'),
('1zg3tXQBW7DqAzx4Vryt','OD','Sundaragada','2026-10-10'),
('2Dg3tXQBW7DqAzx4Vryt','PB','Amritsar','2026-10-10'),
('VTg3tXQBW7DqAzx4Vr2t','PB','Barnala','2026-10-10'),
('Vjg3tXQBW7DqAzx4Vr2t','PB','Bathinda','2026-10-10'),
('2jg3tXQBW7DqAzx4Vryt','PB','Faridkot','2026-10-10'),
('3Dg3tXQBW7DqAzx4Vryt','PB','Fatehgarh Sahib','2026-10-10'),
('8jg3tXQBW7DqAzx4Vryt','PB','Fazilka','2026-10-10'),
('Vzg3tXQBW7DqAzx4Vr2t','PB','Ferozepur','2026-10-10'),
('nDg3tXQBW7DqAzx4Vrus','PB','Gurdaspur','2026-10-10'),
('rDg3tXQBW7DqAzx4Vrut','PB','Hoshiarpur','2026-10-10'),
('4Dg3tXQBW7DqAzx4Vrqs','PB','Jalandhar','2026-10-10'),
('WDg3tXQBW7DqAzx4Vr2t','PB','Kapurthala','2026-10-10'),
('WTg3tXQBW7DqAzx4Vr2t','PB','Ludhiana','2026-10-10'),
('4Tg3tXQBW7DqAzx4Vryt','PB','Malerkotla','2026-10-10'),
('3jg3tXQBW7DqAzx4Vryt','PB','Mansa','2026-10-10'),
('-jg3tXQBW7DqAzx4Vrut','PB','Moga','2026-10-10'),
('_zg3tXQBW7DqAzx4Vrut','PB','Pathankot','2026-10-10'),
('szg3tXQBW7DqAzx4Vrqs','PB','Patiala','2026-10-10'),
('Wjg3tXQBW7DqAzx4Vr2t','PB','Rupnagar','2026-10-10'),
('iTg3tXQBW7DqAzx4Vrus','PB','S.A.S Nagar','2026-10-10'),
('pDg3tXQBW7DqAzx4Vrus','PB','Sangrur','2026-10-10'),
('wXudcYgB2SjI4rfpXJFk','PB','Shahid Bhagat Singh Nagar','2026-10-10'),
('Kzg3tXQBW7DqAzx4Vryt','PB','Sri Muktsar Sahib','2026-10-10'),
('ojg3tXQBW7DqAzx4Vrus','PB','Tarn Taran','2026-10-10'),
('CDg3tXQBW7DqAzx4Vr2t','PY','Karaikal','2026-10-10'),
('Cjg3tXQBW7DqAzx4Vr2t','PY','Puducherry','2026-10-10'),
('uzg3tXQBW7DqAzx4Vryt','RJ','Ajmer','2026-10-10'),
('yzg3tXQBW7DqAzx4Vrut','RJ','Alwar','2026-10-10'),
('e76-uIsBC8DLsKxJf1ED','RJ','Balotra','2026-10-10'),
('zTg3tXQBW7DqAzx4Vryt','RJ','Banswara','2026-10-10'),
('gL6-uIsBC8DLsKxJglGp','RJ','Baran','2026-10-10'),
('pjg3tXQBW7DqAzx4Vrqs','RJ','Barmer','2026-10-10'),
('hb6-uIsBC8DLsKxJhVGs','RJ','Beawar','2026-10-10'),
('djg3tXQBW7DqAzx4Vryt','RJ','Bharatpur','2026-10-10'),
('zDg3tXQBW7DqAzx4Vrut','RJ','Bhilwara','2026-10-10'),
('lzg3tXQBW7DqAzx4Vrus','RJ','Bikaner','2026-10-10'),
('vDg3tXQBW7DqAzx4Vryt','RJ','Bundi','2026-10-10'),
('zjg3tXQBW7DqAzx4Vrut','RJ','Chittorgarh','2026-10-10'),
('ezg3tXQBW7DqAzx4Vryt','RJ','Churu','2026-10-10'),
('wzg3tXQBW7DqAzx4Vrut','RJ','Dausa','2026-10-10'),
('rb6-uIsBC8DLsKxJoFE8','RJ','Deeg','2026-10-10'),
('vTg3tXQBW7DqAzx4Vryt','RJ','Dholpur','2026-10-10'),
('t76-uIsBC8DLsKxJplF3','RJ','Didwana-Kuchaman Sub Districts','2026-10-10'),
('oDg3tXQBW7DqAzx4Vryt','RJ','Dungarpur','2026-10-10'),
('wDg3tXQBW7DqAzx4Vryt','RJ','Ganganagar','2026-10-10'),
('vjg3tXQBW7DqAzx4Vryt','RJ','Hanumangarh','2026-10-10'),
('oTg3tXQBW7DqAzx4Vryt','RJ','Jaipur','2026-10-10'),
('xTg3tXQBW7DqAzx4Vryt','RJ','Jaisalmer','2026-10-10'),
('xjg3tXQBW7DqAzx4Vryt','RJ','Jalore','2026-10-10'),
('zzg3tXQBW7DqAzx4Vrut','RJ','Jhalawar','2026-10-10'),
('yjg3tXQBW7DqAzx4Vrqs','RJ','Jhunjhunu','2026-10-10'),
('0zg3tXQBW7DqAzx4Vrut','RJ','Jodhpur','2026-10-10'),
('Tzg3tXQBW7DqAzx4Vrus','RJ','Karauli','2026-10-10'),
('8L6-uIsBC8DLsKxJ21HX','RJ','Khairthal-Tijara','2026-10-10'),
('qTg3tXQBW7DqAzx4Vrut','RJ','Kota','2026-10-10'),
('-L6-uIsBC8DLsKxJ5FGr','RJ','Kotputli-Behror','2026-10-10'),
('ojg3tXQBW7DqAzx4Vryt','RJ','Nagaur','2026-10-10'),
('ozg3tXQBW7DqAzx4Vryt','RJ','Pali','2026-10-10'),
('SL6_uIsBC8DLsKxJFVJu','RJ','Phalodi','2026-10-10'),
('dTg3tXQBW7DqAzx4Vryt','RJ','Pratapgarh','2026-10-10'),
('vzg3tXQBW7DqAzx4Vryt','RJ','Rajsamand','2026-10-10'),
('Y76_uIsBC8DLsKxJJ1Lx','RJ','Salumbar','2026-10-10'),
('0Dg3tXQBW7DqAzx4Vrut','RJ','Sawai Madhopur','2026-10-10'),
('0Tg3tXQBW7DqAzx4Vrut','RJ','Sikar','2026-10-10'),
('0jg3tXQBW7DqAzx4Vrut','RJ','Sirohi','2026-10-10'),
('kDg3tXQBW7DqAzx4Vryt','RJ','Tonk','2026-10-10'),
('pDg3tXQBW7DqAzx4Vryt','RJ','Udaipur','2026-10-10'),
('7jg3tXQBW7DqAzx4Vryt','SK','Gangtok Sub Districts','2026-10-10'),
('wjg3tXQBW7DqAzx4Vrut','SK','Gyalshing Sub Districts','2026-10-10'),
('F76-uIsBC8DLsKxJ91IV','SK','Mangan','2026-10-10'),
('wDg3tXQBW7DqAzx4Vrqs','SK','Namchi Sub Districts','2026-10-10'),
('XqNEInUBxrox_Nfi_3Sw','SK','Pakyong Sub Districts','2026-10-10'),
('DAWa_YIBF92NGf8XiZkK','SK','Soreng','2026-10-10'),
('Pjg3tXQBW7DqAzx4Vryt','TN','Ariyalur','2026-10-10'),
('bzg3tXQBW7DqAzx4Vr2t','TN','Chengalpattu','2026-10-10'),
('Pzg3tXQBW7DqAzx4Vryt','TN','Chennai','2026-10-10'),
('Gzg3tXQBW7DqAzx4Vr2t','TN','Coimbatore','2026-10-10'),
('YDg3tXQBW7DqAzx4Vryt','TN','Cuddalore','2026-10-10'),
('ETg3tXQBW7DqAzx4Vr2t','TN','Dharmapuri','2026-10-10'),
('Djg3tXQBW7DqAzx4Vr2t','TN','Dindigul','2026-10-10'),
('QTg3tXQBW7DqAzx4Vrus','TN','Erode','2026-10-10'),
('bTg3tXQBW7DqAzx4Vr2t','TN','Kallakurichi','2026-10-10'),
('XDg3tXQBW7DqAzx4Vrus','TN','Kancheepuram','2026-10-10'),
('azg3tXQBW7DqAzx4Vryt','TN','Kanniyakumari','2026-10-10'),
('Wzg3tXQBW7DqAzx4Vrus','TN','Karur','2026-10-10'),
('bDg3tXQBW7DqAzx4Vryt','TN','Krishnagiri','2026-10-10'),
('bzg3tXQBW7DqAzx4Vryt','TN','Madurai','2026-10-10'),
('PmUH33sBNf80hyXhYgAC','TN','Mayiladuthurai','2026-10-10'),
('bTg3tXQBW7DqAzx4Vryt','TN','Nagapattinam','2026-10-10'),
('Gjg3tXQBW7DqAzx4Vr2t','TN','Namakkal','2026-10-10'),
('FDg3tXQBW7DqAzx4Vr2t','TN','Perambalur','2026-10-10'),
('QDg3tXQBW7DqAzx4Vrus','TN','Pudukkottai','2026-10-10'),
('Fzg3tXQBW7DqAzx4Vr2t','TN','Ramanathapuram','2026-10-10'),
('azg3tXQBW7DqAzx4Vr2t','TN','Ranipet Sub Districts','2026-10-10'),
('EDg3tXQBW7DqAzx4Vr2t','TN','Salem','2026-10-10'),
('Pzg3tXQBW7DqAzx4Vrus','TN','Sivaganga','2026-10-10'),
('bjg3tXQBW7DqAzx4Vr2t','TN','Tenkasi','2026-10-10'),
('GTg3tXQBW7DqAzx4Vr2t','TN','Thanjavur','2026-10-10'),
('NTg3tXQBW7DqAzx4Vryt','TN','The Nilgiris','2026-10-10'),
('Ejg3tXQBW7DqAzx4Vr2t','TN','Theni','2026-10-10'),
('STg3tXQBW7DqAzx4Vryt','TN','Thiruvallur','2026-10-10'),
('FTg3tXQBW7DqAzx4Vr2t','TN','Thiruvarur','2026-10-10'),
('Rjg3tXQBW7DqAzx4Vryt','TN','Thoothukkudi','2026-10-10'),
('Fjg3tXQBW7DqAzx4Vr2t','TN','Tiruchirappalli','2026-10-10'),
('GDg3tXQBW7DqAzx4Vr2t','TN','Tirunelveli','2026-10-10'),
('bDg3tXQBW7DqAzx4Vr2t','TN','Tirupathur','2026-10-10'),
('ajg3tXQBW7DqAzx4Vryt','TN','Tiruppur','2026-10-10'),
('HDg3tXQBW7DqAzx4Vr2t','TN','Tiruvannamalai','2026-10-10'),
('bjg3tXQBW7DqAzx4Vryt','TN','Vellore','2026-10-10'),
('Ezg3tXQBW7DqAzx4Vr2t','TN','Viluppuram','2026-10-10'),
('HTg3tXQBW7DqAzx4Vr2t','TN','Virudhunagar','2026-10-10'),
('4Tg3tXQBW7DqAzx4Vrqs','TR','Dhalai','2026-10-10'),
('Qjg3tXQBW7DqAzx4Vryt','TR','Gomati','2026-10-10'),
('YDg3tXQBW7DqAzx4Vr2t','TR','Khowai','2026-10-10'),
('6zg3tXQBW7DqAzx4Vrqs','TR','North Tripura','2026-10-10'),
('Xjg3tXQBW7DqAzx4Vr2t','TR','Sepahijala','2026-10-10'),
('Qjg3tXQBW7DqAzx4Vrus','TR','South Tripura','2026-10-10'),
('-Tg3tXQBW7DqAzx4Vrut','TR','Unakoti','2026-10-10'),
('Xzg3tXQBW7DqAzx4Vr2t','TR','West Tripura','2026-10-10'),
('dTg3tXQBW7DqAzx4Vrus','TS','Adilabad','2026-10-10'),
('ETg3tXQBW7DqAzx4Vryt','TS','Bhadradri Kothagudem','2026-10-10'),
('kAWecYgBF92NGf8XrMaa','TS','Hanumakonda','2026-10-10'),
('0Tg3tXQBW7DqAzx4Vryt','TS','Hyderabad','2026-10-10'),
('Fjg3tXQBW7DqAzx4Vryt','TS','Jagitial','2026-10-10'),
('Ejg3tXQBW7DqAzx4Vryt','TS','Jangoan','2026-10-10'),
('Ezg3tXQBW7DqAzx4Vryt','TS','Jayashankar Bhupalapally','2026-10-10'),
('Fzg3tXQBW7DqAzx4Vryt','TS','Jogulamba Gadwal','2026-10-10'),
('FDg3tXQBW7DqAzx4Vryt','TS','Kamareddy','2026-10-10'),
('zDg3tXQBW7DqAzx4Vryt','TS','Karimnagar','2026-10-10'),
('yzg3tXQBW7DqAzx4Vryt','TS','Khammam','2026-10-10'),
('FTg3tXQBW7DqAzx4Vryt','TS','Kumuram Bheem Asifabad','2026-10-10'),
('GDg3tXQBW7DqAzx4Vryt','TS','Mahabubabad','2026-10-10'),
('Wzg3tXQBW7DqAzx4Vr2t','TS','Mahabubnagar','2026-10-10'),
('GTg3tXQBW7DqAzx4Vryt','TS','Mancherial','2026-10-10'),
('RDg3tXQBW7DqAzx4Vryt','TS','Medak','2026-10-10'),
('Gzg3tXQBW7DqAzx4Vryt','TS','Medchal Malkajgiri','2026-10-10'),
('JjoHcXcBn1ysIAOzI5PX','TS','Mulugu','2026-10-10'),
('HDg3tXQBW7DqAzx4Vryt','TS','Nagarkurnool','2026-10-10'),
('ADg3tXQBW7DqAzx4Vr2t','TS','Nalgonda','2026-10-10'),
('FToGcXcBn1ysIAOzR5Mf','TS','Narayanpet','2026-10-10'),
('Hjg3tXQBW7DqAzx4Vryt','TS','Nirmal','2026-10-10'),
('XDg3tXQBW7DqAzx4Vr2t','TS','Nizamabad','2026-10-10'),
('JDg3tXQBW7DqAzx4Vryt','TS','Peddapalli','2026-10-10'),
('Gjg3tXQBW7DqAzx4Vryt','TS','Rajanna Sircilla','2026-10-10'),
('uTg3tXQBW7DqAzx4Vrut','TS','Ranga Reddy','2026-10-10'),
('XTg3tXQBW7DqAzx4Vr2t','TS','Sangareddy','2026-10-10'),
('HTg3tXQBW7DqAzx4Vryt','TS','Siddipet','2026-10-10'),
('Hzg3tXQBW7DqAzx4Vryt','TS','Suryapet','2026-10-10'),
('IDg3tXQBW7DqAzx4Vryt','TS','Vikarabad','2026-10-10'),
('JTg3tXQBW7DqAzx4Vryt','TS','Wanaparthy','2026-10-10'),
('NzoIcXcBn1ysIAOzaJOs','TS','Warangal','2026-10-10'),
('Ijg3tXQBW7DqAzx4Vryt','TS','Yadadri Bhuvanagiri','2026-10-10'),
('jjg3tXQBW7DqAzx4Vrus','UK','Almora','2026-10-10'),
('VDg3tXQBW7DqAzx4Vryt','UK','Bageshwar','2026-10-10'),
('Yzg3tXQBW7DqAzx4Vr2t','UK','Chamoli','2026-10-10'),
('ZDg3tXQBW7DqAzx4Vr2t','UK','Champawat','2026-10-10'),
('gzg3tXQBW7DqAzx4Vrus','UK','Dehradun','2026-10-10'),
('VTg3tXQBW7DqAzx4Vryt','UK','Haridwar','2026-10-10'),
('Vjg3tXQBW7DqAzx4Vryt','UK','Nainital','2026-10-10'),
('Vzg3tXQBW7DqAzx4Vryt','UK','Pauri Garhwal','2026-10-10'),
('WDg3tXQBW7DqAzx4Vryt','UK','Pithoragarh','2026-10-10'),
('WTg3tXQBW7DqAzx4Vryt','UK','Rudraprayag','2026-10-10'),
('Wjg3tXQBW7DqAzx4Vryt','UK','Tehri Garhwal','2026-10-10'),
('Wzg3tXQBW7DqAzx4Vryt','UK','Udham Singh Nagar','2026-10-10'),
('kTg3tXQBW7DqAzx4Vrus','UK','Uttarkashi','2026-10-10'),
('-Tg3tXQBW7DqAzx4Vrqs','UP','Agra','2026-10-10'),
('-jg3tXQBW7DqAzx4Vrqs','UP','Aligarh','2026-10-10'),
('YTg3tXQBW7DqAzx4Vrus','UP','Ambedkar Nagar','2026-10-10'),
('tDg3tXQBW7DqAzx4Vrqs','UP','Amethi','2026-10-10'),
('ajg3tXQBW7DqAzx4Vr2t','UP','Amroha','2026-10-10'),
('BTg3tXQBW7DqAzx4Vrus','UP','Auraiya','2026-10-10'),
('dr6-uIsBC8DLsKxJelG2','UP','Ayodhya','2026-10-10'),
('_Dg3tXQBW7DqAzx4Vrqs','UP','Azamgarh','2026-10-10'),
('Bjg3tXQBW7DqAzx4Vrus','UP','Baghpat','2026-10-10'),
('GTg3tXQBW7DqAzx4Vrus','UP','Bahraich','2026-10-10'),
('YTg3tXQBW7DqAzx4Vr2t','UP','Ballia','2026-10-10'),
('Zzg3tXQBW7DqAzx4Vrus','UP','Balrampur','2026-10-10'),
('_jg3tXQBW7DqAzx4Vrqs','UP','Banda','2026-10-10'),
('Bzg3tXQBW7DqAzx4Vrus','UP','Bara Banki','2026-10-10'),
('CDg3tXQBW7DqAzx4Vrus','UP','Bareilly','2026-10-10'),
('_zg3tXQBW7DqAzx4Vrqs','UP','Basti','2026-10-10'),
('aDg3tXQBW7DqAzx4Vrus','UP','Bhadohi','2026-10-10'),
('CTg3tXQBW7DqAzx4Vrus','UP','Bijnor','2026-10-10'),
('_Tg3tXQBW7DqAzx4Vrqs','UP','Budaun','2026-10-10'),
('Cjg3tXQBW7DqAzx4Vrus','UP','Bulandshahr','2026-10-10'),
('Czg3tXQBW7DqAzx4Vrus','UP','Chandauli','2026-10-10'),
('Qzg3tXQBW7DqAzx4Vrus','UP','Chitrakoot','2026-10-10'),
('DDg3tXQBW7DqAzx4Vrus','UP','Deoria','2026-10-10'),
('pTg3tXQBW7DqAzx4Vrqs','UP','Etah','2026-10-10'),
('ADg3tXQBW7DqAzx4Vrus','UP','Etawah','2026-10-10'),
('DTg3tXQBW7DqAzx4Vrus','UP','Farrukhabad','2026-10-10'),
('Djg3tXQBW7DqAzx4Vrus','UP','Fatehpur','2026-10-10'),
('Dzg3tXQBW7DqAzx4Vrus','UP','Firozabad','2026-10-10'),
('EDg3tXQBW7DqAzx4Vrus','UP','Gautam Buddha Nagar','2026-10-10'),
('Kjg3tXQBW7DqAzx4Vrus','UP','Ghaziabad','2026-10-10'),
('Kzg3tXQBW7DqAzx4Vrus','UP','Ghazipur','2026-10-10'),
('ATg3tXQBW7DqAzx4Vrus','UP','Gonda','2026-10-10'),
('ETg3tXQBW7DqAzx4Vrus','UP','Gorakhpur','2026-10-10'),
('Ajg3tXQBW7DqAzx4Vrus','UP','Hamirpur','2026-10-10'),
('pzg3tXQBW7DqAzx4Vrqs','UP','Hapur','2026-10-10'),
('Nzg3tXQBW7DqAzx4Vrus','UP','Hardoi','2026-10-10'),
('2Dg3tXQBW7DqAzx4Vrqs','UP','Hathras','2026-10-10'),
('LDg3tXQBW7DqAzx4Vrus','UP','Jalaun','2026-10-10'),
('2jg3tXQBW7DqAzx4Vrqs','UP','Jaunpur','2026-10-10'),
('4jg3tXQBW7DqAzx4Vrqs','UP','Jhansi','2026-10-10'),
('ODg3tXQBW7DqAzx4Vrus','UP','Kannauj','2026-10-10'),
('6Tg3tXQBW7DqAzx4Vrqs','UP','Kanpur Dehat','2026-10-10'),
('yzg3tXQBW7DqAzx4Vrqs','UP','Kanpur Nagar','2026-10-10'),
('Vjg3tXQBW7DqAzx4Vrus','UP','Kasganj','2026-10-10'),
('Gjg3tXQBW7DqAzx4Vrus','UP','Kaushambi','2026-10-10'),
('Gzg3tXQBW7DqAzx4Vrus','UP','Kheri','2026-10-10'),
('7Dg3tXQBW7DqAzx4Vrqs','UP','Kushinagar','2026-10-10'),
('HDg3tXQBW7DqAzx4Vrus','UP','Lalitpur','2026-10-10'),
('HTg3tXQBW7DqAzx4Vrus','UP','Lucknow','2026-10-10'),
('Ezg3tXQBW7DqAzx4Vrus','UP','Mahoba','2026-10-10'),
('Hjg3tXQBW7DqAzx4Vrus','UP','Mahrajganj','2026-10-10'),
('Hzg3tXQBW7DqAzx4Vrus','UP','Mainpuri','2026-10-10'),
('Gr6-uIsBC8DLsKxJ91Ll','UP','Mathura','2026-10-10'),
('FTg3tXQBW7DqAzx4Vrus','UP','Mau','2026-10-10'),
('IDg3tXQBW7DqAzx4Vrus','UP','Meerut','2026-10-10'),
('ITg3tXQBW7DqAzx4Vrus','UP','Mirzapur','2026-10-10'),
('LTg3tXQBW7DqAzx4Vrus','UP','Moradabad','2026-10-10'),
('Ijg3tXQBW7DqAzx4Vrus','UP','Muzaffarnagar','2026-10-10'),
('Izg3tXQBW7DqAzx4Vrus','UP','Pilibhit','2026-10-10'),
('JDg3tXQBW7DqAzx4Vrus','UP','Pratapgarh','2026-10-10'),
('BDg3tXQBW7DqAzx4Vrus','UP','Prayagraj','2026-10-10'),
('4zg3tXQBW7DqAzx4Vrqs','UP','Rae Bareli','2026-10-10'),
('JTg3tXQBW7DqAzx4Vrus','UP','Rampur','2026-10-10'),
('Yjg3tXQBW7DqAzx4Vr2t','UP','Saharanpur','2026-10-10'),
('5Dg3tXQBW7DqAzx4Vrut','UP','Sambhal','2026-10-10'),
('Jjg3tXQBW7DqAzx4Vrus','UP','Sant Kabir Nagar','2026-10-10'),
('OTg3tXQBW7DqAzx4Vrus','UP','Shahjahanpur','2026-10-10'),
('vDg3tXQBW7DqAzx4Vrut','UP','Shamli','2026-10-10'),
('aTg3tXQBW7DqAzx4Vrus','UP','Shrawasti','2026-10-10'),
('Jzg3tXQBW7DqAzx4Vrus','UP','Siddharthnagar','2026-10-10'),
('Fzg3tXQBW7DqAzx4Vrus','UP','Sitapur','2026-10-10'),
('PTg3tXQBW7DqAzx4Vrus','UP','Sonbhadra','2026-10-10'),
('GDg3tXQBW7DqAzx4Vrus','UP','Sultanpur','2026-10-10'),
('KDg3tXQBW7DqAzx4Vrus','UP','Unnao','2026-10-10'),
('jr6_uIsBC8DLsKxJUVLd','UP','Varanasi','2026-10-10'),
('-zg3tXQBW7DqAzx4Vryt','WB','Alipurduar','2026-10-10'),
('Yjg3tXQBW7DqAzx4Vrus','WB','Bankura','2026-10-10'),
('vjg3tXQBW7DqAzx4Vrqs','WB','Birbhum','2026-10-10'),
('Ojg3tXQBW7DqAzx4Vrus','WB','Cooch Behar','2026-10-10'),
('ADg3tXQBW7DqAzx4Vryt','WB','Dakshin Dinajpur','2026-10-10'),
('gDg3tXQBW7DqAzx4Vryt','WB','Darjeeling','2026-10-10'),
('eDg3tXQBW7DqAzx4Vryt','WB','Hooghly','2026-10-10'),
('wzg3tXQBW7DqAzx4Vryt','WB','Howrah','2026-10-10'),
('fTg3tXQBW7DqAzx4Vryt','WB','Jalpaiguri','2026-10-10'),
('vzg3tXQBW7DqAzx4Vrqs','WB','Jhargram','2026-10-10'),
('8zg3tXQBW7DqAzx4Vryt','WB','Kalimpong','2026-10-10'),
('fDg3tXQBW7DqAzx4Vr2t','WB','Kolkata Sub Districts','2026-10-10'),
('nzg3tXQBW7DqAzx4Vryt','WB','Malda','2026-10-10'),
('vjg3tXQBW7DqAzx4Vrut','WB','Murshidabad','2026-10-10'),
('I76-uIsBC8DLsKxJ_1Kp','WB','Nadia','2026-10-10'),
('3Dg3tXQBW7DqAzx4Vrut','WB','North 24 Parganas','2026-10-10'),
('9Tg3tXQBW7DqAzx4Vryt','WB','Paschim Bardhaman','2026-10-10'),
('wjg3tXQBW7DqAzx4Vryt','WB','Paschim Medinipur','2026-10-10'),
('Dzg3tXQBW7DqAzx4Vr2t','WB','Purba Bardhaman','2026-10-10'),
('xjg3tXQBW7DqAzx4Vrut','WB','Purba Medinipur','2026-10-10'),
('yjg3tXQBW7DqAzx4Vrut','WB','Purulia','2026-10-10'),
('fL6_uIsBC8DLsKxJO1JB','WB','South 24 Parganas','2026-10-10'),
('STg3tXQBW7DqAzx4Vrus','WB','Uttar Dinajpur','2026-10-10');
COMMIT;
