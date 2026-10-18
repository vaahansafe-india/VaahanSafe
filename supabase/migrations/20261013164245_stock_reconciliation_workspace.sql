-- Additive operations workspace. Existing transfer receipt commands retain authority.
BEGIN;
ALTER TABLE public.admin_export_jobs ADD COLUMN reconciliation_filters jsonb,ADD COLUMN reconciliation_ids text[];
ALTER TABLE public.admin_stock_reconciliations
 ALTER COLUMN partner_id DROP NOT NULL,
 ADD COLUMN reference_code text NOT NULL DEFAULT ('VS-REC-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 ADD COLUMN phase text CHECK(phase IN ('COUNTING','COUNTED','INVESTIGATING','RESOLVED','APPROVED','CANCELLED')),
 ADD COLUMN revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
 ADD COLUMN snapshot_at timestamptz,
 ADD COLUMN snapshot_batches text[] NOT NULL DEFAULT '{}',
 ADD COLUMN snapshot_reserved integer NOT NULL DEFAULT 0 CHECK(snapshot_reserved>=0),
 ADD COLUMN count_completed_at timestamptz,
 ADD COLUMN closed_at timestamptz,
 ADD COLUMN missing_quantity integer CHECK(missing_quantity>=0),
 ADD COLUMN extra_quantity integer CHECK(extra_quantity>=0),
 ADD COLUMN damaged_quantity integer CHECK(damaged_quantity>=0),
 ADD COLUMN resolution text,
 ADD COLUMN adjustment_applied_at timestamptz,
 ADD COLUMN counted_by text REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 ADD COLUMN approved_by text REFERENCES public.admin_users(id) ON DELETE RESTRICT;
-- RESTRICT preserves snapshot, operational and actor evidence after account changes.
CREATE UNIQUE INDEX reconciliation_reference ON public.admin_stock_reconciliations(reference_code text_pattern_ops);
CREATE INDEX reconciliation_cursor ON public.admin_stock_reconciliations(created_at DESC,id DESC);
CREATE INDEX reconciliation_count_cursor ON public.admin_stock_reconciliations((coalesce(count_completed_at,created_at)) DESC,id DESC);
CREATE INDEX reconciliation_status_cursor ON public.admin_stock_reconciliations(status,created_at DESC,id DESC);
CREATE TABLE public.admin_reconciliation_snapshot_items (
 reconciliation_id text NOT NULL REFERENCES public.admin_stock_reconciliations(id) ON DELETE RESTRICT,
 qr_id text NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
 batch_id text REFERENCES public.qr_batches(id) ON DELETE RESTRICT,
 visible_code text NOT NULL, snapshot_status text NOT NULL, snapshot_updated_at timestamptz NOT NULL,
 reserved boolean NOT NULL, PRIMARY KEY(reconciliation_id,qr_id)
);
CREATE INDEX reconciliation_snapshot_codes ON public.admin_reconciliation_snapshot_items(reconciliation_id,visible_code);
CREATE TABLE public.admin_reconciliation_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reconciliation_id text NOT NULL REFERENCES public.admin_stock_reconciliations(id) ON DELETE RESTRICT,
 actor_id text REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 action text NOT NULL, from_phase text, to_phase text, reason text NOT NULL,
 quantities jsonb NOT NULL DEFAULT '{}', occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX reconciliation_event_cursor ON public.admin_reconciliation_events(reconciliation_id,occurred_at DESC,id DESC);
CREATE TABLE public.admin_reconciliation_commands (
 request_id uuid PRIMARY KEY, actor_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 reconciliation_id text NOT NULL REFERENCES public.admin_stock_reconciliations(id) ON DELETE RESTRICT,
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['admin_reconciliation_snapshot_items','admin_reconciliation_events','admin_reconciliation_commands'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT SELECT,INSERT ON public.%I TO service_role',t);
  EXECUTE format('CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable()',t);
 END LOOP;
END;$$;
CREATE FUNCTION public.reconciliation_revision() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN NEW.revision:=OLD.revision+1;NEW.updated_at:=clock_timestamp();IF NEW.status='CLOSED' AND OLD.status<>'CLOSED' THEN NEW.closed_at:=clock_timestamp();END IF;RETURN NEW;END;$$;
CREATE TRIGGER reconciliation_revision BEFORE UPDATE ON public.admin_stock_reconciliations FOR EACH ROW EXECUTE FUNCTION public.reconciliation_revision();

CREATE VIEW public.admin_reconciliation_projection WITH(security_invoker=true) AS
SELECT r.id,r.reference_code,r.partner_id,coalesce(p.name,CASE WHEN r.partner_id IS NULL THEN 'VaahanSafe central inventory' ELSE 'Unknown partner' END) AS custodian_name,
 coalesce(p.kind,CASE WHEN r.partner_id IS NULL THEN 'WAREHOUSE' ELSE 'HISTORICAL' END) AS custodian_kind,p.reference_code AS custodian_reference,
 p.city,s.name AS state_name,d.name AS district_name,p.state_code,p.district_code,
 r.expected_quantity,r.counted_quantity,r.variance,r.status,
 CASE WHEN r.status='CLOSED' THEN 'CLOSED' WHEN r.transfer_id IS NOT NULL THEN 'TRANSFER_CONTROL' ELSE coalesce(r.phase,CASE WHEN r.status='REVIEWED' THEN 'REVIEWING' ELSE 'COUNTED' END) END AS phase,
 CASE WHEN r.phase='COUNTING' THEN 'COUNT_PENDING' WHEN r.phase='CANCELLED' THEN 'CANCELLED'
 WHEN r.variance=0 AND coalesce(r.damaged_quantity,t.damaged_quantity,0)=0 THEN 'MATCHED'
 WHEN r.adjustment_applied_at IS NOT NULL THEN 'RESOLVED_VARIANCE'
 WHEN r.status='CLOSED' AND r.resolution IS NOT NULL THEN 'DOCUMENTED_VARIANCE'
 WHEN r.status='CLOSED' THEN 'CLOSED_VARIANCE' ELSE 'VARIANCE' END AS outcome,
 r.missing_quantity,r.damaged_quantity,r.extra_quantity,
 r.transfer_id,t.reference_code AS transfer_reference,t.status AS transfer_status,
 r.snapshot_at,r.snapshot_reserved,r.count_completed_at,r.created_at,r.updated_at,r.closed_at,r.revision,
 CASE WHEN r.status='CLOSED' OR r.phase='CANCELLED' THEN NULL WHEN r.phase='COUNTING' THEN 'COUNT_REQUIRED'
 WHEN r.phase='RESOLVED' THEN 'APPROVAL_REQUIRED' WHEN r.phase='APPROVED' THEN 'CLOSURE_REQUIRED'
 WHEN r.transfer_id IS NOT NULL AND t.status='DISCREPANCY' THEN 'TRANSFER_REVIEW_REQUIRED'
 WHEN r.variance<>0 OR coalesce(r.damaged_quantity,t.damaged_quantity,0)>0 THEN 'VARIANCE_UNRESOLVED' ELSE 'REVIEW_REQUIRED' END AS attention
FROM public.admin_stock_reconciliations r LEFT JOIN public.admin_partners p ON p.id=r.partner_id
LEFT JOIN public.admin_geo_states s ON s.code=p.state_code LEFT JOIN public.admin_geo_districts d ON d.code=p.district_code
LEFT JOIN public.admin_stock_transfers t ON t.id=r.transfer_id;
REVOKE ALL ON public.admin_reconciliation_projection FROM PUBLIC,anon,authenticated;GRANT SELECT ON public.admin_reconciliation_projection TO service_role;

CREATE FUNCTION public.reconciliation_filter_clause(f jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE c text:='true';BEGIN
 IF coalesce(f->>'q','')<>'' THEN c:=c||' AND (p.reference_code LIKE upper($1->>''q'')||''%'' OR p.id=$1->>''q'' OR p.custodian_name ILIKE ($1->>''q'')||''%'' OR p.transfer_reference LIKE upper($1->>''q'')||''%'' OR EXISTS(SELECT 1 FROM public.admin_reconciliation_snapshot_items si JOIN public.qr_batches b ON b.id=si.batch_id WHERE si.reconciliation_id=p.id AND b.reference_code ILIKE ($1->>''q'')||''%'') OR EXISTS(SELECT 1 FROM public.admin_transfer_allocations ta JOIN public.qr_batches b ON b.id=ta.batch_id WHERE ta.transfer_id=p.transfer_id AND b.reference_code ILIKE ($1->>''q'')||''%''))';END IF;
 IF coalesce(f->>'status','')<>'' THEN c:=c||' AND p.status=$1->>''status''';END IF;
 IF coalesce(f->>'partner','')<>'' THEN c:=c||' AND coalesce(p.partner_id,''central'')=$1->>''partner''';END IF;
 IF coalesce(f->>'kind','')<>'' THEN c:=c||' AND p.custodian_kind=$1->>''kind''';END IF;
 IF coalesce(f->>'state','')<>'' THEN c:=c||' AND p.state_code=$1->>''state''';END IF;
 IF coalesce(f->>'district','')<>'' THEN c:=c||' AND p.district_code=$1->>''district''';END IF;
 IF f->>'variance'='matched' THEN c:=c||' AND p.outcome=''MATCHED''';
 ELSIF f->>'variance'='any' THEN c:=c||' AND p.phase<>''COUNTING'' AND (p.variance<>0 OR coalesce(p.damaged_quantity,0)>0)';
 ELSIF f->>'variance'='shortage' THEN c:=c||' AND p.phase<>''COUNTING'' AND p.variance<0';
 ELSIF f->>'variance'='surplus' THEN c:=c||' AND p.phase<>''COUNTING'' AND p.variance>0';
 ELSIF f->>'variance'='damaged' THEN c:=c||' AND p.damaged_quantity>0';END IF;
 IF f->>'scope'='open' THEN c:=c||' AND p.status<>''CLOSED'' AND p.phase<>''CANCELLED''';
 ELSIF f->>'scope'='attention' THEN c:=c||' AND p.attention IS NOT NULL';
 ELSIF f->>'scope'='approval' THEN c:=c||' AND p.phase=''RESOLVED''';
 ELSIF f->>'scope'='closed' THEN c:=c||' AND p.status=''CLOSED''';END IF;
 IF coalesce(f->>'from','')<>'' THEN c:=c||' AND '||CASE f->>'dateMode' WHEN 'closed' THEN 'p.closed_at' WHEN 'created' THEN 'p.created_at' ELSE 'coalesce(p.count_completed_at,p.created_at)' END||'>=(($1->>''from'')::date::timestamp AT TIME ZONE ''Asia/Kolkata'')';END IF;
 IF coalesce(f->>'to','')<>'' THEN c:=c||' AND '||CASE f->>'dateMode' WHEN 'closed' THEN 'p.closed_at' WHEN 'created' THEN 'p.created_at' ELSE 'coalesce(p.count_completed_at,p.created_at)' END||'<((($1->>''to'')::date+1)::timestamp AT TIME ZONE ''Asia/Kolkata'')';END IF;
 RETURN c;END;$$;
CREATE FUNCTION public.reconciliation_query(f jsonb,cursor_value jsonb DEFAULT NULL,lim integer DEFAULT 51,ids text[] DEFAULT NULL,before_at timestamptz DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE clause text:=public.reconciliation_filter_clause(f);sort_col text;direction text:='DESC';result jsonb;BEGIN
 sort_col:=CASE f->>'sort' WHEN 'updated' THEN 'p.updated_at' WHEN 'shortage' THEN 'p.variance' WHEN 'surplus' THEN 'p.variance' ELSE 'coalesce(p.count_completed_at,p.created_at)' END;
 IF f->>'sort' IN ('oldest','shortage','unresolved') THEN direction:='ASC';END IF;
 IF cursor_value IS NOT NULL THEN clause:=clause||' AND ('||sort_col||',p.id)'||CASE WHEN direction='ASC' THEN '>' ELSE '<' END||'(($2->>''value'')::'||CASE WHEN f->>'sort' IN ('shortage','surplus') THEN 'integer' ELSE 'timestamptz' END||',$2->>''id'')';END IF;
 IF ids IS NOT NULL THEN clause:=clause||' AND p.id=ANY($3)';END IF;
 IF before_at IS NOT NULL THEN clause:=clause||' AND p.created_at<=$4';END IF;
 IF f->>'sort'='unresolved' THEN clause:=clause||' AND p.attention IS NOT NULL';END IF;
 EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM (SELECT p.id,p.reference_code,p.partner_id,p.custodian_name,p.custodian_kind,p.custodian_reference,p.city,p.state_name,p.district_name,p.state_code,p.district_code,p.expected_quantity,p.counted_quantity,p.variance,p.status,p.phase,p.outcome,p.missing_quantity,p.damaged_quantity,p.extra_quantity,p.attention,p.transfer_id,p.transfer_reference,p.transfer_status,p.snapshot_at,p.snapshot_reserved,p.count_completed_at,p.created_at,p.updated_at,p.closed_at,p.revision,'||sort_col||'::text AS sort_value FROM public.admin_reconciliation_projection p WHERE '||clause||' ORDER BY '||sort_col||' '||direction||',p.id '||direction||' LIMIT '||least(greatest(lim,1),501)::text||') r' INTO result USING f,cursor_value,ids,before_at;
 RETURN result;END;$$;
CREATE FUNCTION public.admin_reconciliation_list(p_session uuid,p_filters jsonb DEFAULT '{}',p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN PERFORM public.inventory_admin_actor(p_session);RETURN public.reconciliation_query(p_filters,p_cursor);END;$$;
CREATE FUNCTION public.admin_reconciliation_summary(p_session uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session);
 SELECT jsonb_build_object('total',count(*),'open',count(*) FILTER(WHERE status<>'CLOSED' AND phase<>'CANCELLED'),'variances',count(*) FILTER(WHERE status<>'CLOSED' AND phase NOT IN ('CANCELLED','COUNTING') AND (variance<>0 OR damaged_quantity>0)), 'review',count(*) FILTER(WHERE attention IS NOT NULL),'matchedToday',count(*) FILTER(WHERE outcome='MATCHED' AND count_completed_at>=(now() AT TIME ZONE 'Asia/Kolkata')::date::timestamp AT TIME ZONE 'Asia/Kolkata')) INTO result FROM public.admin_reconciliation_projection;RETURN result;END;$$;

CREATE FUNCTION public.admin_reconciliation_partners(p_session uuid,p_q text DEFAULT '',p_kind text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session);
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO result FROM (SELECT p.id,p.name,p.kind,p.city,p.reference_code,p.status,s.name AS state_name,d.name AS district_name FROM public.admin_partners p LEFT JOIN public.admin_geo_states s ON s.code=p.state_code LEFT JOIN public.admin_geo_districts d ON d.code=p.district_code WHERE (p_kind='' OR p.kind=p_kind) AND (p_q='' OR p.name ILIKE p_q||'%' OR p.reference_code ILIKE p_q||'%') ORDER BY p.name,p.id LIMIT 30) x;RETURN result;END;$$;
-- The eligible scope mirrors existing partner physical-stock counts. Sold/assigned units are excluded.
CREATE FUNCTION public.reconciliation_stock(p_partner text,p_batches text[] DEFAULT '{}') RETURNS SETOF public.qr_stickers LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT q.* FROM public.qr_stickers q WHERE q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL
 AND (cardinality(p_batches)=0 OR q.batch_id=ANY(p_batches))
 AND ((p_partner IS NULL AND q.current_distributor_id IS NULL AND q.current_retailer_id IS NULL AND q.status='PRINTED' AND public.retail_stock_ready(q.id))
 OR (q.current_retailer_id=p_partner AND q.status='WITH_RETAILER')
 OR (q.current_distributor_id=p_partner AND q.current_retailer_id IS NULL AND q.status='WITH_DISTRIBUTOR'));
$$;
CREATE FUNCTION public.admin_reconciliation_snapshot(p_session uuid,p_partner text DEFAULT NULL,p_batches text[] DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session,true);
 IF cardinality(p_batches)>20 OR (p_partner IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=p_partner AND status='ACTIVE')) THEN RAISE EXCEPTION 'INVALID_SCOPE';END IF;
 SELECT jsonb_build_object('partner',p_partner,'snapshotAt',clock_timestamp(),'expected',count(*),'reserved',count(*) FILTER(WHERE EXISTS(SELECT 1 FROM public.admin_stock_transfer_items i WHERE i.qr_id=q.id AND i.released_at IS NULL)), 'batches',coalesce((SELECT jsonb_agg(to_jsonb(b)) FROM (SELECT qb.id,qb.reference_code,count(*) AS expected FROM public.reconciliation_stock(p_partner,p_batches) z JOIN public.qr_batches qb ON qb.id=z.batch_id GROUP BY qb.id,qb.reference_code ORDER BY qb.reference_code LIMIT 100) b),'[]')) INTO result FROM public.reconciliation_stock(p_partner,p_batches) q;RETURN result;END;$$;
CREATE FUNCTION public.admin_reconciliation_detail(p_session uuid,p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session);
 SELECT jsonb_build_object('record',to_jsonb(p),'resolution',r.resolution,'adjustmentAppliedAt',r.adjustment_applied_at,'countedBy',ca.name,'approvedBy',aa.name,
 'snapshotBatches',r.snapshot_batches,'hasSnapshot',r.snapshot_at IS NOT NULL) INTO result FROM public.admin_reconciliation_projection p JOIN public.admin_stock_reconciliations r ON r.id=p.id LEFT JOIN public.admin_users ca ON ca.id=r.counted_by LEFT JOIN public.admin_users aa ON aa.id=r.approved_by WHERE p.id=p_id;
 IF result IS NULL THEN RAISE EXCEPTION 'RECONCILIATION_NOT_FOUND';END IF;RETURN result;END;$$;

CREATE FUNCTION public.admin_reconciliation_history(p_session uuid,p_id text,p_section text,p_cursor jsonb DEFAULT NULL,p_q text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;rec public.admin_stock_reconciliations;BEGIN PERFORM public.inventory_admin_actor(p_session);
 SELECT * INTO rec FROM public.admin_stock_reconciliations WHERE id=p_id;IF NOT FOUND THEN RAISE EXCEPTION 'RECONCILIATION_NOT_FOUND';END IF;
 IF p_section='timeline' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO result FROM (
 SELECT e.id::text,e.action,e.reason,e.occurred_at AS created_at,a.name AS actor_name,e.quantities FROM public.admin_reconciliation_events e LEFT JOIN public.admin_users a ON a.id=e.actor_id WHERE e.reconciliation_id=p_id AND (p_cursor IS NULL OR (e.occurred_at,e.id::text)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id'))
 UNION ALL SELECT e.id::text,'TRANSFER_'||upper(e.action),e.reason,e.occurred_at,a.name,e.quantities FROM public.admin_transfer_events e LEFT JOIN public.admin_users a ON a.id=e.actor_id WHERE e.transfer_id=rec.transfer_id AND (p_cursor IS NULL OR (e.occurred_at,e.id::text)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id')) ORDER BY created_at DESC,id DESC LIMIT 21) x;
 ELSIF p_section='audit' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO result FROM (SELECT l.id::text,l.action,l.reason,l.created_at,a.name AS actor_name,l.after_summary AS quantities FROM public.admin_audit_logs l LEFT JOIN public.admin_users a ON a.id=l.actor_id WHERE ((l.resource_type='reconciliation' AND l.resource_id=p_id) OR (l.resource_type='transfers' AND l.resource_id=rec.transfer_id) OR l.after_summary->>'reconciliation'=p_id) AND (p_cursor IS NULL OR (l.created_at,l.id::text)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id')) ORDER BY l.created_at DESC,l.id DESC LIMIT 21) x;
 ELSIF p_section='batches' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO result FROM (SELECT b.id,b.reference_code,count(*) AS expected FROM public.admin_reconciliation_snapshot_items i JOIN public.qr_batches b ON b.id=i.batch_id WHERE i.reconciliation_id=p_id GROUP BY b.id,b.reference_code UNION ALL SELECT b.id,b.reference_code,a.quantity FROM public.admin_transfer_allocations a JOIN public.qr_batches b ON b.id=a.batch_id WHERE a.transfer_id=rec.transfer_id ORDER BY reference_code LIMIT 100) x;
 ELSIF p_section='identities' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO result FROM (
 SELECT q.id,q.visible_code,q.status,q.created_at,b.reference_code AS batch_reference,'SNAPSHOT'::text AS receipt_state FROM public.admin_reconciliation_snapshot_items i JOIN public.qr_stickers q ON q.id=i.qr_id LEFT JOIN public.qr_batches b ON b.id=i.batch_id WHERE i.reconciliation_id=p_id AND (p_q='' OR q.visible_code LIKE upper(p_q)||'%') AND (p_cursor IS NULL OR (q.created_at,q.id)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id'))
 UNION ALL SELECT q.id,q.visible_code,q.status,q.created_at,b.reference_code,i.receipt_state FROM public.admin_stock_transfer_items i JOIN public.qr_stickers q ON q.id=i.qr_id LEFT JOIN public.qr_batches b ON b.id=q.batch_id WHERE i.transfer_id=rec.transfer_id AND (p_q='' OR q.visible_code LIKE upper(p_q)||'%') AND (p_cursor IS NULL OR (q.created_at,q.id)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id')) ORDER BY created_at DESC,id DESC LIMIT 51) x;
 ELSE RAISE EXCEPTION 'INVALID_SECTION';END IF;RETURN result;END;$$;

CREATE FUNCTION public.admin_reconciliation_command(p_session uuid,p_id text,p_action text,p_revision integer,p_values jsonb,p_reason text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;target text:=p_id;old public.admin_stock_reconciliations;prior public.admin_reconciliation_commands;payload jsonb;actual integer;codes text[];bad_codes text[];partner text;batch_ids text[];new_phase text;BEGIN
 actor:=public.inventory_admin_actor(p_session,true,true);
 IF p_request IS NULL OR p_values IS NULL OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'INVALID_COMMAND';END IF;
 payload:=jsonb_build_object('id',p_id,'action',p_action,'revision',p_revision,'values',p_values,'reason',trim(p_reason));
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));SELECT * INTO prior FROM public.admin_reconciliation_commands WHERE request_id=p_request;
 IF FOUND THEN IF prior.actor_id<>actor OR prior.payload<>payload THEN RAISE EXCEPTION 'REQUEST_CONFLICT';END IF;RETURN prior.reconciliation_id;END IF;
 IF p_action='create' THEN
  IF p_id IS NOT NULL THEN RAISE EXCEPTION 'INVALID_COMMAND';END IF;
  partner:=nullif(p_values->>'partner','central');SELECT coalesce(array_agg(v),'{}') INTO batch_ids FROM jsonb_array_elements_text(coalesce(p_values->'batches','[]')) v;
  IF cardinality(batch_ids)>20 OR (partner IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=partner AND status='ACTIVE')) THEN RAISE EXCEPTION 'INVALID_SCOPE';END IF;
  -- Lock the exact existing stock, then preserve a per-identity snapshot in the same transaction.
  PERFORM q.id FROM public.qr_stickers q JOIN public.reconciliation_stock(partner,batch_ids) s ON s.id=q.id ORDER BY q.id FOR UPDATE OF q;
  SELECT count(*) INTO actual FROM public.reconciliation_stock(partner,batch_ids);
  IF actual>100000 OR actual<>coalesce((p_values->>'expected')::integer,-1) THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
  target:='reconciliation_'||gen_random_uuid()::text;
  INSERT INTO public.admin_stock_reconciliations(id,partner_id,expected_quantity,counted_quantity,phase,snapshot_at,snapshot_batches)
  VALUES(target,partner,actual,0,'COUNTING',clock_timestamp(),batch_ids);
  INSERT INTO public.admin_reconciliation_snapshot_items(reconciliation_id,qr_id,batch_id,visible_code,snapshot_status,snapshot_updated_at,reserved)
  SELECT target,q.id,q.batch_id,q.visible_code,q.status,q.updated_at,EXISTS(SELECT 1 FROM public.admin_stock_transfer_items i WHERE i.qr_id=q.id AND i.released_at IS NULL) FROM public.reconciliation_stock(partner,batch_ids) q;
  UPDATE public.admin_stock_reconciliations SET snapshot_reserved=(SELECT count(*) FROM public.admin_reconciliation_snapshot_items WHERE reconciliation_id=target AND reserved) WHERE id=target;
  new_phase:='COUNTING';
 ELSE
  SELECT * INTO old FROM public.admin_stock_reconciliations WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'RECONCILIATION_NOT_FOUND';END IF;
  IF old.transfer_id IS NOT NULL THEN RAISE EXCEPTION 'TRANSFER_CONTROL_REQUIRED';END IF;
  IF old.status='CLOSED' OR old.phase='CANCELLED' OR old.revision IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'RECONCILIATION_STATE_CHANGED';END IF;
  IF p_action IN ('save','complete') AND old.phase='COUNTING' THEN
   actual:=(p_values->>'counted')::integer;IF actual IS NULL OR actual NOT BETWEEN 0 AND 100000 THEN RAISE EXCEPTION 'INVALID_COUNT';END IF;
   new_phase:=CASE WHEN p_action='save' THEN 'COUNTING' WHEN actual=old.expected_quantity THEN 'RESOLVED' ELSE 'COUNTED' END;
   UPDATE public.admin_stock_reconciliations SET counted_quantity=actual,phase=new_phase,counted_by=actor,count_completed_at=CASE WHEN p_action='complete' THEN clock_timestamp() ELSE count_completed_at END,missing_quantity=NULL,extra_quantity=NULL,damaged_quantity=NULL,resolution=CASE WHEN p_action='complete' AND actual=expected_quantity THEN 'Physical count matches the snapshot.' ELSE NULL END WHERE id=target;
  ELSIF p_action='investigate' AND (old.phase IS NULL OR old.phase='COUNTED') THEN new_phase:='INVESTIGATING';UPDATE public.admin_stock_reconciliations SET phase=new_phase WHERE id=target;
  ELSIF p_action='recount' AND coalesce(old.phase,'COUNTED') IN ('COUNTED','INVESTIGATING','RESOLVED') THEN new_phase:='COUNTING';UPDATE public.admin_stock_reconciliations SET phase=new_phase,approved_by=NULL WHERE id=target;
  ELSIF p_action='resolve' AND coalesce(old.phase,'COUNTED') IN ('COUNTED','INVESTIGATING') THEN
   IF coalesce((p_values->>'missing')::integer,-1)<>greatest(-old.variance,0) OR coalesce((p_values->>'extra')::integer,-1)<>greatest(old.variance,0) OR coalesce((p_values->>'damaged')::integer,-1) NOT BETWEEN 0 AND old.counted_quantity THEN RAISE EXCEPTION 'INVALID_RESOLUTION';END IF;
   new_phase:='RESOLVED';UPDATE public.admin_stock_reconciliations SET phase=new_phase,missing_quantity=(p_values->>'missing')::integer,extra_quantity=(p_values->>'extra')::integer,damaged_quantity=(p_values->>'damaged')::integer,resolution=trim(p_reason) WHERE id=target;
  ELSIF p_action='approve' AND old.phase='RESOLVED' THEN new_phase:='APPROVED';UPDATE public.admin_stock_reconciliations SET phase=new_phase,status='REVIEWED',approved_by=actor WHERE id=target;
  ELSIF p_action='adjust' AND old.phase='APPROVED' AND old.snapshot_at IS NOT NULL AND old.adjustment_applied_at IS NULL AND coalesce(old.extra_quantity,0)=0 THEN
   SELECT coalesce(array_agg(v),'{}') INTO codes FROM jsonb_array_elements_text(coalesce(p_values->'missingCodes','[]')) v;
   SELECT coalesce(array_agg(v),'{}') INTO bad_codes FROM jsonb_array_elements_text(coalesce(p_values->'damagedCodes','[]')) v;
   IF cardinality(codes)<>coalesce(old.missing_quantity,0) OR cardinality(bad_codes)<>coalesce(old.damaged_quantity,0) OR cardinality(codes)+cardinality(bad_codes)=0 OR cardinality(codes)+cardinality(bad_codes)>5000 OR (SELECT count(DISTINCT v) FROM unnest(codes||bad_codes) v)<>cardinality(codes)+cardinality(bad_codes) THEN RAISE EXCEPTION 'INVALID_IDENTITIES';END IF;
   PERFORM q.id FROM public.qr_stickers q JOIN public.admin_reconciliation_snapshot_items si ON si.qr_id=q.id WHERE si.reconciliation_id=target AND si.visible_code=ANY(codes||bad_codes) ORDER BY q.id FOR UPDATE OF q;
   IF (SELECT count(*) FROM public.admin_reconciliation_snapshot_items si JOIN public.qr_stickers q ON q.id=si.qr_id WHERE si.reconciliation_id=target AND si.visible_code=ANY(codes||bad_codes) AND q.updated_at=si.snapshot_updated_at AND q.status=si.snapshot_status AND q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL AND q.current_retailer_id IS NOT DISTINCT FROM CASE WHEN EXISTS(SELECT 1 FROM public.admin_partners WHERE id=old.partner_id AND kind='RETAILER') THEN old.partner_id ELSE NULL END AND (old.partner_id IS NULL OR q.current_distributor_id=old.partner_id OR q.current_retailer_id=old.partner_id) AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items i WHERE i.qr_id=q.id AND i.released_at IS NULL))<>cardinality(codes)+cardinality(bad_codes) THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
   INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,reason_code,actor_type,actor_id,created_at) SELECT gen_random_uuid()::text,q.id,q.status,CASE WHEN q.visible_code=ANY(codes) THEN 'LOST' ELSE 'DAMAGED' END,'STOCK_RECONCILIATION','ADMIN',actor,now() FROM public.qr_stickers q JOIN public.admin_reconciliation_snapshot_items si ON si.qr_id=q.id WHERE si.reconciliation_id=target AND q.visible_code=ANY(codes||bad_codes);
   UPDATE public.qr_stickers SET status=CASE WHEN visible_code=ANY(codes) THEN 'LOST' ELSE 'DAMAGED' END,lifecycle_state=CASE WHEN visible_code=ANY(codes) THEN 'LOST' ELSE 'DAMAGED' END,updated_at=clock_timestamp() WHERE id IN(SELECT qr_id FROM public.admin_reconciliation_snapshot_items WHERE reconciliation_id=target AND visible_code=ANY(codes||bad_codes));
   UPDATE public.admin_stock_reconciliations SET adjustment_applied_at=clock_timestamp() WHERE id=target;new_phase:=old.phase;
  ELSIF p_action='close' AND (old.phase='APPROVED' OR (old.phase IS NULL AND old.status='REVIEWED')) THEN
   new_phase:=coalesce(old.phase,'APPROVED');UPDATE public.admin_stock_reconciliations SET status='CLOSED',resolution=coalesce(resolution,trim(p_reason)) WHERE id=target;
  ELSIF p_action='cancel' AND old.phase='COUNTING' THEN new_phase:='CANCELLED';UPDATE public.admin_stock_reconciliations SET phase=new_phase,status='CLOSED',resolution=trim(p_reason) WHERE id=target;
  ELSE RAISE EXCEPTION 'INVALID_TRANSITION';END IF;
 END IF;
 INSERT INTO public.admin_reconciliation_commands(request_id,actor_id,reconciliation_id,payload) VALUES(p_request,actor,target,payload);
 INSERT INTO public.admin_reconciliation_events(reconciliation_id,actor_id,action,from_phase,to_phase,reason,quantities) SELECT target,actor,upper(p_action),old.phase,new_phase,trim(p_reason),jsonb_build_object('expected',expected_quantity,'counted',counted_quantity,'variance',variance,'missing',missing_quantity,'damaged',damaged_quantity,'extra',extra_quantity) FROM public.admin_stock_reconciliations WHERE id=target;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) SELECT actor,'reconciliation.'||p_action,'reconciliation',target,trim(p_reason),p_request,jsonb_build_object('phase',old.phase,'revision',old.revision),jsonb_build_object('phase',phase,'status',status,'revision',revision,'inventoryChanged',p_action='adjust') FROM public.admin_stock_reconciliations WHERE id=target;
 RETURN target;END;$$;

CREATE FUNCTION public.admin_request_reconciliation_export(p_session uuid,p_filters jsonb,p_ids text[],p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;target uuid:=gen_random_uuid();BEGIN actor:=public.inventory_admin_actor(p_session);
 IF cardinality(p_ids)>100 THEN RAISE EXCEPTION 'INVALID_SELECTION';END IF;
 IF (SELECT count(*) FROM public.admin_export_jobs WHERE actor_id=actor AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'RATE_LIMIT';END IF;
 INSERT INTO public.admin_export_jobs(id,actor_id,module_key,reconciliation_filters,reconciliation_ids,expires_at) VALUES(target,actor,'reconciliation',p_filters,p_ids,now()+interval '24 hours');
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id) VALUES(actor,'export.requested','reconciliation',target::text,'Requested protected reconciliation report.',p_request);RETURN target;END;$$;
CREATE FUNCTION public.admin_reconciliation_export_page(p_job uuid,p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE job public.admin_export_jobs;result jsonb;BEGIN
 SELECT j.* INTO job FROM public.admin_export_jobs j JOIN public.admin_users a ON a.id=j.actor_id WHERE j.id=p_job AND j.module_key='reconciliation' AND j.status='PROCESSING' AND j.expires_at>now() AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST');IF NOT FOUND THEN RAISE EXCEPTION 'EXPORT_REQUIRED';END IF;
 RETURN public.reconciliation_query(coalesce(job.reconciliation_filters,'{}'),p_cursor,500,job.reconciliation_ids,job.created_at);END;$$;
DO $$ DECLARE r record;BEGIN FOR r IN SELECT p.oid::regprocedure sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname LIKE 'admin_reconciliation_%' OR p.proname LIKE 'reconciliation_%' OR p.proname='admin_request_reconciliation_export') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',r.sig);EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',r.sig);END LOOP;END;$$;
NOTIFY pgrst,'reload schema';
COMMIT;
