-- Purpose-built projections and auditable print evidence; existing identities stay authoritative.
CREATE INDEX IF NOT EXISTS qr_inventory_cursor ON public.qr_stickers(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS qr_inventory_batch_cursor ON public.qr_stickers(batch_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS qr_inventory_status_cursor ON public.qr_stickers(status,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS qr_inventory_lifecycle_cursor ON public.qr_stickers(lifecycle_state,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS qr_inventory_public_prefix ON public.qr_stickers(public_id text_pattern_ops);
CREATE INDEX IF NOT EXISTS qr_inventory_visible_prefix ON public.qr_stickers(visible_code text_pattern_ops);
CREATE INDEX IF NOT EXISTS qr_inventory_batch_reference_prefix ON public.qr_batches(reference_code text_pattern_ops);
CREATE INDEX IF NOT EXISTS qr_inventory_history ON public.qr_status_history(qr_id,created_at DESC,id DESC);

CREATE TABLE IF NOT EXISTS public.qr_print_templates (
 version text PRIMARY KEY, specification jsonb NOT NULL, active boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(specification->>'layout'='SINGLE')
);
CREATE UNIQUE INDEX IF NOT EXISTS qr_print_template_active ON public.qr_print_templates(active) WHERE active;
INSERT INTO public.qr_print_templates(version,specification,active) VALUES('VS-VEHICLE-80X60-V1',
 '{"version":"VS-VEHICLE-80X60-V1","widthMm":80,"heightMm":60,"bleedMm":2,"safeMm":4,"qr":{"x":6,"y":16,"size":36},"scratch":{"x":45,"y":36,"width":29,"height":13},"layout":"SINGLE"}',true)
ON CONFLICT (version) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.qr_print_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference_code text NOT NULL UNIQUE,
 -- RESTRICT: physical production and privileged access evidence must survive account/template changes.
 actor_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 template_version text NOT NULL REFERENCES public.qr_print_templates(version) ON DELETE RESTRICT,
 template_snapshot jsonb NOT NULL,
 mode text NOT NULL CHECK(mode IN ('PRINT','REPRINT')), quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 100),
 status text NOT NULL CHECK(status IN ('READY','GENERATING','READY_TO_PRINT','PRINTING','COMPLETED','FAILED','CANCELLED')),
 reason text NOT NULL CHECK(length(reason) BETWEEN 10 AND 500), request_id uuid NOT NULL UNIQUE,
 object_key text UNIQUE, ciphertext_sha256 text, expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes',
 created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, completed_at timestamptz, failed_at timestamptz,
 CHECK(expires_at<=created_at+interval '10 minutes')
);
CREATE INDEX IF NOT EXISTS qr_print_jobs_actor ON public.qr_print_jobs(actor_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.qr_print_items (
 -- RESTRICT: print and QR evidence are permanent, including failed/reprinted output.
 job_id uuid NOT NULL REFERENCES public.qr_print_jobs(id) ON DELETE RESTRICT,
 qr_id text NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
 sequence integer NOT NULL CHECK(sequence>0), printed_at timestamptz,
 previous_job_id uuid REFERENCES public.qr_print_jobs(id) ON DELETE RESTRICT,
 PRIMARY KEY(job_id,qr_id), UNIQUE(job_id,sequence)
);
CREATE INDEX IF NOT EXISTS qr_print_items_identity ON public.qr_print_items(qr_id,printed_at DESC);
CREATE TABLE IF NOT EXISTS public.admin_inventory_selections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 -- CASCADE: short-lived query snapshots have no lifecycle or financial truth.
 session_id uuid NOT NULL REFERENCES public.admin_sessions(id) ON DELETE CASCADE,
 filters jsonb NOT NULL, selected_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes'
);
ALTER TABLE public.qr_print_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_print_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_inventory_selections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.qr_print_templates,public.qr_print_jobs,public.qr_print_items,public.admin_inventory_selections FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.qr_print_templates,public.qr_print_jobs,public.qr_print_items,public.admin_inventory_selections TO service_role;

CREATE OR REPLACE FUNCTION public.inventory_admin_actor(p_session uuid,p_write boolean DEFAULT false,p_fresh boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor_id text;
BEGIN
 SELECT a.id INTO actor_id FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id
 WHERE s.id=p_session AND s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours'
 AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST')
 AND (NOT p_write OR a.role IN ('SUPER_ADMIN','OPS_ADMIN'))
 AND (NOT p_fresh OR s.step_up_at>now()-interval '10 minutes');
 IF actor_id IS NULL THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
 RETURN actor_id;
END; $$;

-- This helper constructs clauses, never SQL values. All filter/cursor values remain bound.
CREATE OR REPLACE FUNCTION public.inventory_filter_clause(p_filters jsonb) RETURNS text
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE clause text := 'true';
BEGIN
 IF coalesce(p_filters->>'q','')<>'' THEN
  clause:=clause||' AND s.id IN (SELECT id FROM public.qr_stickers WHERE public_id LIKE ($1->>''q'')||''%'' UNION SELECT id FROM public.qr_stickers WHERE visible_code LIKE ($1->>''q'')||''%'' UNION SELECT z.id FROM public.qr_stickers z JOIN public.qr_batches zb ON zb.id=z.batch_id WHERE zb.reference_code LIKE ($1->>''q'')||''%'')';
 END IF;
 IF jsonb_array_length(coalesce(p_filters->'statuses','[]'))>0 THEN clause:=clause||' AND s.status=ANY(ARRAY(SELECT jsonb_array_elements_text($1->''statuses'')))'; END IF;
 IF jsonb_array_length(coalesce(p_filters->'lifecycles','[]'))>0 THEN clause:=clause||' AND s.lifecycle_state=ANY(ARRAY(SELECT jsonb_array_elements_text($1->''lifecycles'')))'; END IF;
 IF coalesce(p_filters->>'batch','')<>'' THEN clause:=clause||' AND s.batch_id=$1->>''batch'''; END IF;
 IF coalesce(p_filters->>'channel','')<>'' THEN clause:=clause||' AND b.inventory_channel=$1->>''channel'''; END IF;
 IF p_filters->>'activation'='active' THEN clause:=clause||' AND s.activated_at IS NOT NULL'; END IF;
 IF p_filters->>'activation'='inactive' THEN clause:=clause||' AND s.activated_at IS NULL'; END IF;
 IF p_filters->>'custody'='retailer' THEN clause:=clause||' AND s.current_retailer_id IS NOT NULL'; END IF;
 IF p_filters->>'custody'='distributor' THEN clause:=clause||' AND s.current_distributor_id IS NOT NULL AND s.current_retailer_id IS NULL'; END IF;
 IF p_filters->>'custody'='unrecorded' THEN clause:=clause||' AND s.current_distributor_id IS NULL AND s.current_retailer_id IS NULL'; END IF;
 IF coalesce(p_filters->>'from','')<>'' THEN clause:=clause||' AND s.created_at>=($1->>''from'')::date'; END IF;
 IF coalesce(p_filters->>'to','')<>'' THEN clause:=clause||' AND s.created_at<($1->>''to'')::date+interval ''1 day'''; END IF;
 IF p_filters->>'risk'='failed' THEN clause:=clause||' AND (s.activation_attempts>0 OR EXISTS(SELECT 1 FROM public.qr_activation_secrets sec WHERE sec.qr_id=s.id AND sec.failed_attempts>0))'; END IF;
 IF p_filters->>'risk'='blocked' THEN clause:=clause||' AND s.status=''BLOCKED'''; END IF;
 IF p_filters->>'risk'='replacement' THEN clause:=clause||' AND s.replaced_by_qr_id IS NOT NULL'; END IF;
 IF p_filters->>'print'='recorded' THEN clause:=clause||' AND (b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items pi WHERE pi.qr_id=s.id AND pi.printed_at IS NOT NULL))'; END IF;
 IF p_filters->>'print'='unrecorded' THEN clause:=clause||' AND b.printed_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.qr_print_items pi WHERE pi.qr_id=s.id AND pi.printed_at IS NOT NULL)'; END IF;
 RETURN clause;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_inventory_list(p_session uuid,p_filters jsonb,p_cursor jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE clause text; direction text; op text; result jsonb;
BEGIN
 PERFORM public.inventory_admin_actor(p_session);
 clause:=public.inventory_filter_clause(p_filters);
 direction:=CASE WHEN p_filters->>'sort'='oldest' THEN 'ASC' ELSE 'DESC' END;
 op:=CASE WHEN direction='ASC' THEN '>' ELSE '<' END;
 IF p_cursor IS NOT NULL THEN clause:=clause||' AND (s.created_at,s.id)'||op||'(($2->>''createdAt'')::timestamptz,$2->>''id'')'; END IF;
 EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM (SELECT s.id,s.public_id AS "publicId",s.visible_code AS "visibleCode",s.batch_id AS "batchId",b.reference_code AS "batchReference",b.inventory_channel AS channel,s.status,s.lifecycle_state AS lifecycle,s.created_at AS "createdAt",s.activated_at AS "activatedAt",CASE WHEN b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items pi WHERE pi.qr_id=s.id AND pi.printed_at IS NOT NULL) THEN ''RECORDED'' ELSE ''UNRECORDED'' END AS "printState",b.printed_at AS "printedAt",CASE WHEN s.current_retailer_id IS NOT NULL THEN ''Retailer'' WHEN s.current_distributor_id IS NOT NULL THEN ''Distributor'' ELSE NULL END AS custodian,s.activation_attempts AS "failedAttempts",s.replaced_by_qr_id IS NOT NULL AS "replacementLinked" FROM public.qr_stickers s LEFT JOIN public.qr_batches b ON b.id=s.batch_id WHERE '||clause||' ORDER BY s.created_at '||direction||',s.id '||direction||' LIMIT 51) r'
 INTO result USING p_filters,p_cursor;
 RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_inventory_facets(p_session uuid,p_filters jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 PERFORM public.inventory_admin_actor(p_session);
 EXECUTE 'WITH matched AS MATERIALIZED (SELECT s.status,s.activated_at,s.batch_id,b.reference_code FROM public.qr_stickers s LEFT JOIN public.qr_batches b ON b.id=s.batch_id WHERE '||public.inventory_filter_clause(p_filters)||') SELECT jsonb_build_object(''total'',count(*),''available'',count(*) FILTER(WHERE status IN (''INVENTORY'',''PRINTED'',''WITH_DISTRIBUTOR'',''WITH_RETAILER'',''SOLD'') AND activated_at IS NULL),''activated'',count(*) FILTER(WHERE status=''ACTIVATED''),''blocked'',count(*) FILTER(WHERE status=''BLOCKED''),''replaced'',count(*) FILTER(WHERE status=''REPLACED''),''statuses'',(SELECT coalesce(jsonb_agg(to_jsonb(x)),''[]'') FROM(SELECT status AS value,count(*) AS count FROM matched GROUP BY status ORDER BY status)x),''batches'',(SELECT coalesce(jsonb_agg(to_jsonb(x)),''[]'') FROM(SELECT batch_id AS id,reference_code AS reference,count(*) AS count FROM matched GROUP BY batch_id,reference_code ORDER BY reference_code LIMIT 100)x)) FROM matched'
 INTO result USING p_filters;
 RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_inventory_select_all(p_session uuid,p_filters jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE selection public.admin_inventory_selections; result jsonb;
BEGIN
 PERFORM public.inventory_admin_actor(p_session,true);
 INSERT INTO public.admin_inventory_selections(session_id,filters) VALUES(p_session,p_filters) RETURNING id,session_id,filters,selected_at,expires_at INTO selection;
 EXECUTE 'SELECT jsonb_build_object(''token'',$2::text,''count'',count(*)) FROM public.qr_stickers s LEFT JOIN public.qr_batches b ON b.id=s.batch_id WHERE '||public.inventory_filter_clause(p_filters)||' AND s.created_at<=$3'
 INTO result USING p_filters,selection.id,selection.selected_at;
 RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.inventory_selected_ids(p_session uuid,p_selection jsonb,p_limit integer DEFAULT 100)
RETURNS text[] LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE snapshot public.admin_inventory_selections; ids text[];
BEGIN
 IF p_selection->>'mode'='ids' THEN
  SELECT array_agg(DISTINCT value) INTO ids FROM jsonb_array_elements_text(p_selection->'ids');
 ELSIF p_selection->>'mode'='all' THEN
  SELECT id,session_id,filters,selected_at,expires_at INTO snapshot FROM public.admin_inventory_selections WHERE id=(p_selection->>'token')::uuid AND session_id=p_session AND expires_at>now();
  IF snapshot.id IS NULL THEN RAISE EXCEPTION 'SELECTION_EXPIRED'; END IF;
  EXECUTE 'SELECT array_agg(id) FROM(SELECT s.id FROM public.qr_stickers s LEFT JOIN public.qr_batches b ON b.id=s.batch_id WHERE '||public.inventory_filter_clause(snapshot.filters)||' AND s.created_at<=$2 AND NOT (s.id=ANY(ARRAY(SELECT jsonb_array_elements_text(coalesce($3->''excluded'',''[]''))))) ORDER BY s.created_at DESC,s.id DESC LIMIT $4) selected'
  INTO ids USING snapshot.filters,snapshot.selected_at,p_selection,p_limit+1;
 ELSE RAISE EXCEPTION 'INVALID_SELECTION'; END IF;
 IF coalesce(array_length(ids,1),0)=0 OR array_length(ids,1)>p_limit THEN RAISE EXCEPTION 'SELECTION_LIMIT'; END IF;
 RETURN ids;
END; $$;

-- Application services call these with their current cookie-backed session only.
REVOKE ALL ON FUNCTION public.inventory_admin_actor(uuid,boolean,boolean),public.inventory_filter_clause(jsonb),public.admin_inventory_list(uuid,jsonb,jsonb),public.admin_inventory_facets(uuid,jsonb),public.admin_inventory_select_all(uuid,jsonb),public.inventory_selected_ids(uuid,jsonb,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_admin_actor(uuid,boolean,boolean),public.inventory_filter_clause(jsonb),public.admin_inventory_list(uuid,jsonb,jsonb),public.admin_inventory_facets(uuid,jsonb),public.admin_inventory_select_all(uuid,jsonb),public.inventory_selected_ids(uuid,jsonb,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_inventory_print_eligibility(p_session uuid,p_selection jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ids text[]; result jsonb;
BEGIN
 PERFORM public.inventory_admin_actor(p_session);
 ids:=public.inventory_selected_ids(p_session,p_selection,100);
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',s.id,'publicId',s.public_id,'visibleCode',s.visible_code,'status',s.status,
 'hasSecret',sec.qr_id IS NOT NULL,'consumed',sec.consumed_at IS NOT NULL,'hasArchive',e.id IS NOT NULL,
 'hasPrintHistory',EXISTS(SELECT 1 FROM public.qr_print_items i JOIN public.qr_print_jobs j ON j.id=i.job_id WHERE i.qr_id=s.id AND j.started_at IS NOT NULL),
 'hasOpenJob',EXISTS(SELECT 1 FROM public.qr_print_items i JOIN public.qr_print_jobs j ON j.id=i.job_id WHERE i.qr_id=s.id AND j.status IN ('READY','GENERATING','READY_TO_PRINT','PRINTING')))), '[]')
 INTO result FROM public.qr_stickers s LEFT JOIN public.qr_activation_secrets sec ON sec.qr_id=s.id LEFT JOIN public.qr_batch_activation_exports e ON e.batch_id=s.batch_id WHERE s.id=ANY(ids);
 IF jsonb_array_length(result)<>array_length(ids,1) THEN RAISE EXCEPTION 'INVENTORY_CHANGED'; END IF;
 RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_inventory_create_print_job(p_session uuid,p_selection jsonb,p_mode text,p_reason text,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_actor text; actor_role text; ids text[]; item jsonb; eligibility jsonb; template public.qr_print_templates; job record;
BEGIN
 v_actor:=public.inventory_admin_actor(p_session,true,true);
 SELECT role INTO actor_role FROM public.admin_users WHERE id=v_actor;
 IF p_mode NOT IN ('PRINT','REPRINT') OR p_mode IS NULL OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'INVALID_PRINT_REQUEST'; END IF;
 IF p_mode='REPRINT' AND actor_role<>'SUPER_ADMIN' THEN RAISE EXCEPTION 'REPRINT_FORBIDDEN'; END IF;
 SELECT j.id,j.reference_code,j.status,j.actor_id,j.quantity,j.expires_at INTO job FROM public.qr_print_jobs j WHERE request_id=p_request;
 IF job.id IS NOT NULL THEN
  IF job.actor_id IS DISTINCT FROM v_actor THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  RETURN jsonb_build_object('id',job.id,'reference',job.reference_code,'status',job.status,'quantity',job.quantity,'expiresAt',job.expires_at);
 END IF;
 ids:=public.inventory_selected_ids(p_session,p_selection,100);
 PERFORM id FROM public.qr_stickers WHERE id=ANY(ids) ORDER BY id FOR UPDATE;
 eligibility:=public.admin_inventory_print_eligibility(p_session,jsonb_build_object('mode','ids','ids',to_jsonb(ids)));
 FOR item IN SELECT value FROM jsonb_array_elements(eligibility) LOOP
  IF item->>'status' NOT IN ('INVENTORY','PRINTED') OR NOT (item->>'hasSecret')::boolean OR NOT (item->>'hasArchive')::boolean
   OR (item->>'consumed')::boolean OR (item->>'hasOpenJob')::boolean
   OR (p_mode='PRINT' AND (item->>'hasPrintHistory')::boolean)
   OR (p_mode='REPRINT' AND NOT (item->>'hasPrintHistory')::boolean) THEN RAISE EXCEPTION 'PRINT_INELIGIBLE'; END IF;
 END LOOP;
 SELECT version,specification,active,created_at INTO template FROM public.qr_print_templates WHERE active;
 IF template.version IS NULL THEN RAISE EXCEPTION 'TEMPLATE_UNAVAILABLE'; END IF;
 INSERT INTO public.qr_print_jobs(reference_code,actor_id,template_version,template_snapshot,mode,quantity,status,reason,request_id)
 VALUES('VS-PRINT-'||upper(substr(replace(pg_catalog.gen_random_uuid()::text,'-',''),1,12)),v_actor,template.version,template.specification,p_mode,array_length(ids,1),'READY',trim(p_reason),p_request)
 RETURNING id,reference_code,status,actor_id,quantity,expires_at INTO job;
 INSERT INTO public.qr_print_items(job_id,qr_id,sequence,previous_job_id)
 SELECT job.id,s.id,row_number() OVER(ORDER BY s.created_at,s.id),
 (SELECT i.job_id FROM public.qr_print_items i JOIN public.qr_print_jobs j ON j.id=i.job_id WHERE i.qr_id=s.id AND j.started_at IS NOT NULL ORDER BY j.created_at DESC LIMIT 1)
 FROM public.qr_stickers s WHERE s.id=ANY(ids);
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary)
 VALUES(v_actor,'PRINT_JOB_CREATED','print_jobs',job.id::text,trim(p_reason),p_request,jsonb_build_object('quantity',job.quantity,'mode',p_mode,'template',template.version));
 RETURN jsonb_build_object('id',job.id,'reference',job.reference_code,'status',job.status,'quantity',job.quantity,'expiresAt',job.expires_at);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_inventory_finish_print_job(p_session uuid,p_job uuid,p_action text,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text; job record;
BEGIN
 actor:=public.inventory_admin_actor(p_session,true,true);
 SELECT id,actor_id,status,reference_code,quantity,template_version,mode INTO job FROM public.qr_print_jobs WHERE id=p_job FOR UPDATE;
 IF job.id IS NULL OR job.actor_id<>actor THEN RAISE EXCEPTION 'JOB_UNAVAILABLE'; END IF;
 IF p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 10 AND 500 OR p_action NOT IN ('COMPLETE','CANCEL') THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;
 IF p_action='COMPLETE' THEN
  IF job.status<>'PRINTING' THEN RAISE EXCEPTION 'PRINT_NOT_STARTED'; END IF;
  PERFORM s.id FROM public.qr_stickers s JOIN public.qr_print_items i ON i.qr_id=s.id WHERE i.job_id=p_job ORDER BY s.id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.qr_stickers s JOIN public.qr_print_items i ON i.qr_id=s.id WHERE i.job_id=p_job AND s.status NOT IN ('INVENTORY','PRINTED')) THEN RAISE EXCEPTION 'INVENTORY_CHANGED'; END IF;
  INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,reason_code,actor_type,actor_id,metadata_json)
  SELECT 'qsh_'||pg_catalog.gen_random_uuid()::text,s.id,s.status,'PRINTED','PRODUCTION_PRINT_VERIFIED','ADMIN',actor,
   jsonb_build_object('printJob',job.id,'mode',job.mode,'template',job.template_version)::text
  FROM public.qr_stickers s JOIN public.qr_print_items i ON i.qr_id=s.id WHERE i.job_id=p_job;
  UPDATE public.qr_stickers s SET status='PRINTED',lifecycle_state='PRINTED',updated_at=now() FROM public.qr_print_items i WHERE i.qr_id=s.id AND i.job_id=p_job;
  UPDATE public.qr_print_items SET printed_at=now() WHERE job_id=p_job;
  UPDATE public.qr_print_jobs SET status='COMPLETED',completed_at=now() WHERE id=p_job;
 ELSE
  IF job.status IN ('COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'JOB_FINISHED'; END IF;
  UPDATE public.qr_print_jobs SET status='CANCELLED' WHERE id=p_job;
 END IF;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary)
 VALUES(actor,'PRINT_JOB_'||CASE WHEN p_action='COMPLETE' THEN 'COMPLETED' ELSE 'CANCELLED' END,'print_jobs',p_job::text,trim(p_reason),pg_catalog.gen_random_uuid(),jsonb_build_object('quantity',job.quantity,'mode',job.mode));
 RETURN jsonb_build_object('id',p_job,'status',CASE WHEN p_action='COMPLETE' THEN 'COMPLETED' ELSE 'CANCELLED' END);
END; $$;
REVOKE ALL ON FUNCTION public.admin_inventory_print_eligibility(uuid,jsonb),public.admin_inventory_create_print_job(uuid,jsonb,text,text,uuid),public.admin_inventory_finish_print_job(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_inventory_print_eligibility(uuid,jsonb),public.admin_inventory_create_print_job(uuid,jsonb,text,text,uuid),public.admin_inventory_finish_print_job(uuid,uuid,text,text) TO service_role;

-- Artifact issuance records access, not successful physical printing.
CREATE OR REPLACE FUNCTION public.admin_inventory_advance_print_job(p_session uuid,p_job uuid,p_action text,p_object text DEFAULT NULL,p_checksum text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text; job record;
BEGIN
 actor:=public.inventory_admin_actor(p_session,true,true);
 SELECT id,actor_id,status,expires_at,mode,reference_code,quantity INTO job FROM public.qr_print_jobs WHERE id=p_job FOR UPDATE;
 IF job.id IS NULL OR job.actor_id<>actor THEN RAISE EXCEPTION 'JOB_UNAVAILABLE'; END IF;
 IF job.mode='REPRINT' AND NOT EXISTS(SELECT 1 FROM public.admin_users WHERE id=actor AND role='SUPER_ADMIN') THEN RAISE EXCEPTION 'REPRINT_FORBIDDEN'; END IF;
 IF p_action<>'FAIL' AND job.expires_at<=now() THEN RAISE EXCEPTION 'JOB_EXPIRED'; END IF;
 IF p_action IN ('GENERATE','ISSUE') THEN
  PERFORM s.id FROM public.qr_stickers s JOIN public.qr_print_items i ON i.qr_id=s.id WHERE i.job_id=p_job ORDER BY s.id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.qr_stickers s JOIN public.qr_print_items i ON i.qr_id=s.id LEFT JOIN public.qr_activation_secrets sec ON sec.qr_id=s.id WHERE i.job_id=p_job AND (s.status NOT IN ('INVENTORY','PRINTED') OR sec.qr_id IS NULL OR sec.consumed_at IS NOT NULL)) THEN RAISE EXCEPTION 'PRINT_INELIGIBLE'; END IF;
 END IF;
 IF p_action='GENERATE' AND job.status='READY' THEN
  UPDATE public.qr_print_jobs SET status='GENERATING' WHERE id=p_job;
 ELSIF p_action='STORE' AND job.status='GENERATING' THEN
  IF p_object IS DISTINCT FROM 'print-jobs/'||p_job::text||'/sticker.pdf.enc' OR p_checksum IS NULL OR p_checksum!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'INVALID_ARTIFACT'; END IF;
  UPDATE public.qr_print_jobs SET status='READY_TO_PRINT',object_key=p_object,ciphertext_sha256=p_checksum WHERE id=p_job;
 ELSIF p_action='ISSUE' AND job.status IN ('READY_TO_PRINT','PRINTING') THEN
  UPDATE public.qr_print_jobs SET status='PRINTING',started_at=coalesce(started_at,now()) WHERE id=p_job;
 ELSIF p_action='FAIL' AND job.status='GENERATING' THEN
  UPDATE public.qr_print_jobs SET status='FAILED',failed_at=now() WHERE id=p_job;
 ELSE RAISE EXCEPTION 'JOB_CHANGED'; END IF;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary)
 VALUES(actor,'PRINT_ARTIFACT_'||p_action,'print_jobs',p_job::text,'Controlled production print operation',pg_catalog.gen_random_uuid(),jsonb_build_object('quantity',job.quantity,'mode',job.mode));
 RETURN jsonb_build_object('id',job.id,'reference',job.reference_code,'quantity',job.quantity);
END; $$;
REVOKE ALL ON FUNCTION public.admin_inventory_advance_print_job(uuid,uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_inventory_advance_print_job(uuid,uuid,text,text,text) TO service_role;
