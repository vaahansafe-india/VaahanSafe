-- Scope inventory reports within the existing export/audit/storage workflow.
ALTER TABLE public.admin_export_jobs ADD COLUMN IF NOT EXISTS inventory_filters jsonb;
ALTER TABLE public.admin_export_jobs ADD COLUMN IF NOT EXISTS inventory_ids text[];
ALTER TABLE public.admin_export_jobs ADD COLUMN IF NOT EXISTS inventory_excluded text[];
ALTER TABLE public.admin_export_jobs ADD COLUMN IF NOT EXISTS selection_at timestamptz;

CREATE OR REPLACE FUNCTION public.admin_inventory_select_all(p_session uuid,p_filters jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE selection public.admin_inventory_selections; result jsonb;
BEGIN
 PERFORM public.inventory_admin_actor(p_session);
 INSERT INTO public.admin_inventory_selections(session_id,filters) VALUES(p_session,p_filters) RETURNING id,session_id,filters,selected_at,expires_at INTO selection;
 EXECUTE 'SELECT jsonb_build_object(''token'',$2::text,''count'',count(*)) FROM public.qr_stickers s LEFT JOIN public.qr_batches b ON b.id=s.batch_id WHERE '||public.inventory_filter_clause(p_filters)||' AND s.created_at<=$3'
 INTO result USING p_filters,selection.id,selection.selected_at;
 RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_request_inventory_export(p_session uuid,p_filters jsonb,p_selection jsonb,p_request uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text; snapshot record; ids text[]; excluded text[]; job uuid; filters jsonb:=p_filters; cutoff timestamptz:=now();
BEGIN
 actor:=public.inventory_admin_actor(p_session);
 IF (SELECT count(*) FROM public.admin_export_jobs WHERE actor_id=actor AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'EXPORT_RATE_LIMIT'; END IF;
 IF p_selection->>'mode'='all' THEN
  SELECT s.filters,s.selected_at INTO snapshot FROM public.admin_inventory_selections s WHERE s.id=(p_selection->>'token')::uuid AND session_id=p_session AND expires_at>now();
  IF NOT FOUND THEN RAISE EXCEPTION 'SELECTION_EXPIRED'; END IF;
  filters:=snapshot.filters;cutoff:=snapshot.selected_at;
  SELECT array_agg(value) INTO excluded FROM jsonb_array_elements_text(coalesce(p_selection->'excluded','[]'));
 ELSIF p_selection IS NOT NULL THEN ids:=public.inventory_selected_ids(p_session,p_selection,100); END IF;
 INSERT INTO public.admin_export_jobs(actor_id,module_key,inventory_filters,inventory_ids,inventory_excluded,selection_at)
 VALUES(actor,'inventory',coalesce(filters,'{}'),ids,excluded,cutoff) RETURNING id INTO job;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary)
 VALUES(actor,'EXPORT_REQUESTED','reports',job::text,'Scoped QR inventory report',p_request,jsonb_build_object('module','inventory','selection',CASE WHEN p_selection IS NULL THEN 'filtered' ELSE p_selection->>'mode' END));
 RETURN job;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_inventory_export_page(p_job uuid,p_cursor jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE job record; result jsonb; clause text;
BEGIN
 SELECT j.inventory_filters,j.inventory_ids,j.inventory_excluded,j.selection_at INTO job FROM public.admin_export_jobs j JOIN public.admin_users a ON a.id=j.actor_id
 WHERE j.id=p_job AND j.module_key='inventory' AND j.status='PROCESSING' AND j.expires_at>now() AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST');
 IF NOT FOUND THEN RAISE EXCEPTION 'EXPORT_UNAVAILABLE'; END IF;
 clause:=public.inventory_filter_clause(coalesce(job.inventory_filters,'{}'))||' AND s.created_at<=$2 AND ($3 IS NULL OR s.id=ANY($3)) AND NOT(s.id=ANY(coalesce($4,ARRAY[]::text[])))';
 IF p_cursor IS NOT NULL THEN clause:=clause||' AND (s.created_at,s.id)<(($5->>''created_at'')::timestamptz,$5->>''id'')'; END IF;
 EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM(SELECT s.id,s.public_id,s.visible_code,b.reference_code AS batch_reference,s.batch_id,b.inventory_channel,s.status,s.lifecycle_state,s.activated_at,s.created_at,CASE WHEN b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items pi WHERE pi.qr_id=s.id AND pi.printed_at IS NOT NULL) THEN ''RECORDED'' ELSE ''UNRECORDED'' END AS print_evidence FROM public.qr_stickers s LEFT JOIN public.qr_batches b ON b.id=s.batch_id WHERE '||clause||' ORDER BY s.created_at DESC,s.id DESC LIMIT 500) r'
 INTO result USING coalesce(job.inventory_filters,'{}'),coalesce(job.selection_at,now()),job.inventory_ids,job.inventory_excluded,p_cursor;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.admin_request_inventory_export(uuid,jsonb,jsonb,uuid),public.admin_inventory_export_page(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_request_inventory_export(uuid,jsonb,jsonb,uuid),public.admin_inventory_export_page(uuid,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_inventory_list(p_session uuid,p_filters jsonb,p_cursor jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE clause text; direction text; op text; result jsonb;
BEGIN
 PERFORM public.inventory_admin_actor(p_session);
 clause:=public.inventory_filter_clause(p_filters);
 direction:=CASE WHEN p_filters->>'sort'='oldest' THEN 'ASC' ELSE 'DESC' END;
 op:=CASE WHEN direction='ASC' THEN '>' ELSE '<' END;
 IF p_cursor IS NOT NULL THEN clause:=clause||' AND (s.created_at,s.id)'||op||'(($2->>''createdAt'')::timestamptz,$2->>''id'')'; END IF;
 EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM (SELECT s.id,s.public_id AS "publicId",s.visible_code AS "visibleCode",s.batch_id AS "batchId",b.reference_code AS "batchReference",b.inventory_channel AS channel,s.status,s.lifecycle_state AS lifecycle,s.created_at AS "createdAt",s.activated_at AS "activatedAt",CASE WHEN b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items pi WHERE pi.qr_id=s.id AND pi.printed_at IS NOT NULL) THEN ''RECORDED'' ELSE ''UNRECORDED'' END AS "printState",coalesce((SELECT max(printed_at) FROM public.qr_print_items WHERE qr_id=s.id),b.printed_at) AS "printedAt",CASE WHEN s.current_retailer_id IS NOT NULL THEN ''Retailer'' WHEN s.current_distributor_id IS NOT NULL THEN ''Distributor'' ELSE NULL END AS custodian,greatest(s.activation_attempts,coalesce((SELECT sec.failed_attempts FROM public.qr_activation_secrets sec WHERE sec.qr_id=s.id),0)) AS "failedAttempts",s.replaced_by_qr_id IS NOT NULL AS "replacementLinked" FROM public.qr_stickers s LEFT JOIN public.qr_batches b ON b.id=s.batch_id WHERE '||clause||' ORDER BY s.created_at '||direction||',s.id '||direction||' LIMIT 51) r'
 INTO result USING p_filters,p_cursor;
 RETURN result;
END; $$;
