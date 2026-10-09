-- Manufacturing is never allowed to override ownership or a closed batch.
CREATE OR REPLACE FUNCTION public.inventory_printable_qr(p_qr text) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.qr_stickers s
 JOIN public.qr_batches b ON b.id=s.batch_id
 JOIN public.qr_activation_secrets sec ON sec.qr_id=s.id
 JOIN public.qr_batch_activation_exports e ON e.batch_id=b.id
 WHERE s.id=p_qr AND b.status IN ('DRAFT','GENERATED','EXPORTED','PRINTED')
 AND s.status IN ('INVENTORY','PRINTED') AND s.lifecycle_state=s.status
 AND s.activated_at IS NULL AND s.user_id IS NULL AND s.vehicle_id IS NULL
 AND sec.consumed_at IS NULL AND sec.secret_hash IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM public.qr_assignments a WHERE a.qr_id=s.id AND a.ended_at IS NULL))
$$;
REVOKE ALL ON FUNCTION public.inventory_printable_qr(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_printable_qr(text) TO service_role;
CREATE OR REPLACE FUNCTION public.admin_inventory_print_eligibility(p_session uuid,p_selection jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ids text[]; result jsonb;
BEGIN
 PERFORM public.inventory_admin_actor(p_session);
 ids:=public.inventory_selected_ids(p_session,p_selection,100);
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',s.id,'publicId',s.public_id,'visibleCode',s.visible_code,'status',s.status,
 'contextEligible',public.inventory_printable_qr(s.id),'hasSecret',sec.qr_id IS NOT NULL,'consumed',sec.consumed_at IS NOT NULL,'hasArchive',e.id IS NOT NULL,
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
  IF NOT (item->>'contextEligible')::boolean OR item->>'status' NOT IN ('INVENTORY','PRINTED') OR NOT (item->>'hasSecret')::boolean OR NOT (item->>'hasArchive')::boolean
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
  IF EXISTS(SELECT 1 FROM public.qr_stickers s JOIN public.qr_print_items i ON i.qr_id=s.id LEFT JOIN public.qr_activation_secrets sec ON sec.qr_id=s.id WHERE i.job_id=p_job AND (NOT public.inventory_printable_qr(s.id))) THEN RAISE EXCEPTION 'PRINT_INELIGIBLE'; END IF;
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
  IF EXISTS(SELECT 1 FROM public.qr_stickers s JOIN public.qr_print_items i ON i.qr_id=s.id WHERE i.job_id=p_job AND NOT public.inventory_printable_qr(s.id)) THEN RAISE EXCEPTION 'INVENTORY_CHANGED'; END IF;
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

