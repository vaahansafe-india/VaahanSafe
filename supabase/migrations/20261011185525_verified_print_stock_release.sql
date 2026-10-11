-- Release only verified units from a completed print job, never an entire draft batch.
BEGIN;
CREATE TABLE public.admin_print_stock_releases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 -- RESTRICT preserves physical production, administrator and custody evidence.
 print_job_id uuid NOT NULL UNIQUE REFERENCES public.qr_print_jobs(id) ON DELETE RESTRICT,
 actor_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 100),
 reason text NOT NULL CHECK(length(reason) BETWEEN 10 AND 500),
 request_id uuid NOT NULL UNIQUE, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.admin_print_stock_release_items (
 -- RESTRICT retains the exact manifest; a sticker is released only once.
 release_id uuid NOT NULL REFERENCES public.admin_print_stock_releases(id) ON DELETE RESTRICT,
 qr_id text NOT NULL UNIQUE REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
 verified_print_at timestamptz NOT NULL, PRIMARY KEY(release_id,qr_id)
);
CREATE INDEX admin_print_stock_release_actor ON public.admin_print_stock_releases(actor_id);
ALTER TABLE public.admin_print_stock_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_print_stock_release_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_print_stock_releases,public.admin_print_stock_release_items FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.admin_print_stock_releases,public.admin_print_stock_release_items TO service_role;
CREATE TRIGGER print_stock_release_immutable BEFORE UPDATE OR DELETE ON public.admin_print_stock_releases FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable();
CREATE TRIGGER print_stock_release_item_immutable BEFORE UPDATE OR DELETE ON public.admin_print_stock_release_items FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable();

CREATE FUNCTION public.retail_stock_ready(p_qr text) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.qr_stickers q JOIN public.qr_batches b ON b.id=q.batch_id
 WHERE q.id=p_qr AND b.inventory_channel='OFFLINE_RETAIL' AND (
  (b.status IN ('PRINTED','RECEIVED','CLOSED') AND (b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items x WHERE x.qr_id=q.id AND x.printed_at IS NOT NULL)))
  OR (b.status IN ('DRAFT','GENERATED','EXPORTED')
   AND EXISTS(SELECT 1 FROM public.admin_print_stock_release_items i JOIN public.admin_print_stock_releases r ON r.id=i.release_id
    JOIN public.qr_print_jobs j ON j.id=r.print_job_id JOIN public.qr_print_items x ON x.job_id=j.id AND x.qr_id=i.qr_id
    WHERE i.qr_id=q.id AND j.mode='PRINT' AND j.status='COMPLETED' AND x.printed_at IS NOT NULL)
   AND EXISTS(SELECT 1 FROM public.qr_activation_secrets s WHERE s.qr_id=q.id AND s.consumed_at IS NULL AND s.secret_hash<>'' AND (s.locked_until IS NULL OR s.locked_until<=now()))
  )
 ));
$$;
CREATE FUNCTION public.verified_print_release_candidates(p_job uuid)
RETURNS TABLE(id text,visible_code text,printed_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT q.id,q.visible_code,x.printed_at FROM public.qr_print_jobs j JOIN public.qr_print_items x ON x.job_id=j.id
 JOIN public.qr_stickers q ON q.id=x.qr_id JOIN public.qr_batches b ON b.id=q.batch_id
 WHERE j.id=p_job AND j.mode='PRINT' AND j.status='COMPLETED' AND x.printed_at IS NOT NULL
 AND b.inventory_channel='OFFLINE_RETAIL' AND b.status IN ('DRAFT','GENERATED','EXPORTED','PRINTED','RECEIVED','CLOSED')
 AND q.status='PRINTED' AND q.lifecycle_state='PRINTED' AND q.current_distributor_id IS NULL AND q.current_retailer_id IS NULL
 AND q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL
 AND EXISTS(SELECT 1 FROM public.qr_activation_secrets s WHERE s.qr_id=q.id AND s.consumed_at IS NULL AND s.secret_hash<>'' AND (s.locked_until IS NULL OR s.locked_until<=now()))
 AND NOT EXISTS(SELECT 1 FROM public.qr_assignments a WHERE a.qr_id=q.id AND a.ended_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items i WHERE i.qr_id=q.id AND i.released_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.admin_print_stock_release_items i WHERE i.qr_id=q.id);
$$;
CREATE FUNCTION public.admin_print_stock_release_status(p_session uuid,p_job uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text; j public.qr_print_jobs; r public.admin_print_stock_releases; eligible integer; role text;
BEGIN
 actor:=public.inventory_admin_actor(p_session);
 SELECT a.role INTO role FROM public.admin_users a WHERE a.id=actor;
 SELECT * INTO j FROM public.qr_print_jobs WHERE id=p_job;
 IF NOT FOUND THEN RAISE EXCEPTION 'JOB_UNAVAILABLE'; END IF;
 SELECT * INTO r FROM public.admin_print_stock_releases WHERE print_job_id=p_job;
 SELECT count(*) INTO eligible FROM public.verified_print_release_candidates(p_job);
 RETURN jsonb_build_object('quantity',j.quantity,'eligible',eligible,'canRelease',role IN ('SUPER_ADMIN','OPS_ADMIN') AND r.id IS NULL AND eligible=j.quantity,
 'release',CASE WHEN r.id IS NULL THEN NULL ELSE jsonb_build_object('id',r.id,'quantity',r.quantity,'createdAt',r.created_at) END);
END; $$;
CREATE FUNCTION public.admin_release_verified_print_stock(p_session uuid,p_job uuid,p_reason text,p_request uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text; j public.qr_print_jobs; old public.admin_print_stock_releases; payload jsonb; target uuid:=gen_random_uuid(); ids text[];
BEGIN
 actor:=public.inventory_admin_actor(p_session,true,true);
 IF p_request IS NULL OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'INVALID_STOCK_RELEASE'; END IF;
 payload:=jsonb_build_object('job',p_job,'reason',trim(p_reason));
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 SELECT * INTO old FROM public.admin_print_stock_releases WHERE request_id=p_request;
 IF FOUND THEN IF old.actor_id<>actor OR old.payload<>payload THEN RAISE EXCEPTION 'REQUEST_CONFLICT'; END IF; RETURN old.id; END IF;
 SELECT * INTO j FROM public.qr_print_jobs WHERE id=p_job FOR UPDATE;
 IF j.id IS NULL OR j.mode<>'PRINT' OR j.status<>'COMPLETED' THEN RAISE EXCEPTION 'RELEASE_PRINT_INCOMPLETE'; END IF;
 IF EXISTS(SELECT 1 FROM public.admin_print_stock_releases WHERE print_job_id=p_job) THEN RAISE EXCEPTION 'STOCK_ALREADY_RELEASED'; END IF;
 -- Match custody commands' batch -> identity lock order; protect private proof under those locks.
 PERFORM b.id FROM public.qr_batches b WHERE b.id IN(SELECT q.batch_id FROM public.qr_stickers q JOIN public.qr_print_items x ON x.qr_id=q.id WHERE x.job_id=p_job) ORDER BY b.id FOR UPDATE;
 PERFORM q.id FROM public.qr_stickers q JOIN public.qr_print_items x ON x.qr_id=q.id WHERE x.job_id=p_job ORDER BY q.id FOR UPDATE OF q;
 PERFORM s.id FROM public.qr_activation_secrets s JOIN public.qr_print_items x ON x.qr_id=s.qr_id WHERE x.job_id=p_job ORDER BY s.id FOR SHARE OF s;
 SELECT array_agg(id ORDER BY id) INTO ids FROM public.verified_print_release_candidates(p_job);
 IF coalesce(cardinality(ids),0)<>j.quantity OR (SELECT count(*) FROM public.qr_print_items WHERE job_id=p_job)<>j.quantity THEN RAISE EXCEPTION 'RELEASE_STOCK_CHANGED'; END IF;
 INSERT INTO public.admin_print_stock_releases(id,print_job_id,actor_id,quantity,reason,request_id,payload) VALUES(target,p_job,actor,j.quantity,trim(p_reason),p_request,payload);
 INSERT INTO public.admin_print_stock_release_items(release_id,qr_id,verified_print_at) SELECT target,q.id,x.printed_at FROM public.qr_stickers q JOIN public.qr_print_items x ON x.qr_id=q.id WHERE x.job_id=p_job AND q.id=ANY(ids);
 INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,reason_code,actor_type,actor_id,metadata_json,created_at)
 SELECT gen_random_uuid()::text,id,'PRINTED','PRINTED','VERIFIED_PRINT_STOCK_RELEASE','ADMIN',actor,jsonb_build_object('release',target,'printJob',p_job)::text,now() FROM unnest(ids) id;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary)
 VALUES(actor,'inventory.stock_released','print_jobs',p_job::text,trim(p_reason),p_request,jsonb_build_object('release',target,'quantity',j.quantity));
 -- Printing, payment, ownership, private proof consumption and service entitlement remain separate.
 RETURN target;
END; $$;

CREATE OR REPLACE FUNCTION public.transfer_eligible(p_source text,p_batch text) RETURNS SETOF public.qr_stickers LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT q.* FROM public.qr_stickers q WHERE (p_batch IS NULL OR q.batch_id=p_batch) AND public.retail_stock_ready(q.id)
 AND q.current_distributor_id IS NOT DISTINCT FROM p_source AND q.current_retailer_id IS NULL
 AND q.status=CASE WHEN p_source IS NULL THEN 'PRINTED' ELSE 'WITH_DISTRIBUTOR' END AND q.lifecycle_state=q.status
 AND q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL
 AND NOT EXISTS(SELECT 1 FROM public.qr_assignments a WHERE a.qr_id=q.id AND a.ended_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items i WHERE i.qr_id=q.id AND i.released_at IS NULL);
$$;
CREATE OR REPLACE FUNCTION public.retail_sale_eligible(p_retailer text)
RETURNS TABLE(id text,visible_code text,batch_reference text,created_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT q.id,q.visible_code,b.reference_code,q.created_at FROM public.qr_stickers q JOIN public.qr_batches b ON b.id=q.batch_id
 JOIN public.admin_partners r ON r.id=q.current_retailer_id AND r.kind='RETAILER' JOIN public.admin_partners d ON d.id=r.parent_distributor_id AND d.kind='DISTRIBUTOR'
 WHERE r.id=p_retailer AND r.status='ACTIVE' AND r.verification_status='VERIFIED' AND d.status='ACTIVE'
 AND q.current_distributor_id=d.id AND q.status='WITH_RETAILER' AND q.lifecycle_state='WITH_RETAILER'
 AND q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL AND q.visible_code IS NOT NULL AND public.retail_stock_ready(q.id)
 AND EXISTS(SELECT 1 FROM public.qr_activation_secrets s WHERE s.qr_id=q.id AND s.consumed_at IS NULL AND s.secret_hash<>'' AND (s.locked_until IS NULL OR s.locked_until<=now()))
 AND NOT EXISTS(SELECT 1 FROM public.qr_assignments a WHERE a.qr_id=q.id AND a.ended_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items i WHERE i.qr_id=q.id AND i.released_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.admin_retail_sale_items i WHERE i.qr_id=q.id);
$$;
-- Guard the known deployed command body rather than replacing unrelated custody behavior.
DO $patch$ DECLARE definition text; original text:=$old$IF EXISTS(SELECT 1 FROM public.admin_transfer_allocations a JOIN public.qr_batches b ON b.id=a.batch_id WHERE a.transfer_id=target AND b.status NOT IN ('PRINTED','RECEIVED','CLOSED')) THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;$old$;
 replacement text:=$new$IF EXISTS(SELECT 1 FROM public.admin_stock_transfer_items i WHERE i.transfer_id=target AND i.released_at IS NULL AND NOT public.retail_stock_ready(i.qr_id)) THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;$new$;
BEGIN
 SELECT pg_get_functiondef('public.admin_transfer_command(uuid,text,integer,text,jsonb,text,uuid)'::regprocedure) INTO definition;
 IF strpos(definition,original)=0 THEN RAISE EXCEPTION 'TRANSFER_READINESS_PATCH_MISMATCH'; END IF;
 EXECUTE replace(definition,original,replacement);
END; $patch$;
-- All stock selectors now use the same authoritative gate.
CREATE OR REPLACE FUNCTION public.admin_distributor_transfer_options(p_session uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN PERFORM public.inventory_admin_actor(p_session,true); RETURN public.admin_transfer_options(p_session,NULL,'inventory'); END; $$;
CREATE OR REPLACE FUNCTION public.admin_retailer_transfer_options(p_session uuid,p_id text,p_q text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE parent text; BEGIN PERFORM public.inventory_admin_actor(p_session,true);
 SELECT parent_distributor_id INTO parent FROM public.admin_partners WHERE id=p_id AND kind='RETAILER'; IF NOT FOUND THEN RAISE EXCEPTION 'RETAILER_NOT_FOUND'; END IF;
 IF parent IS NULL THEN RETURN '[]'; END IF;
 RETURN public.admin_transfer_options(p_session,parent,'inventory',p_q);
END; $$;
REVOKE ALL ON FUNCTION public.retail_stock_ready(text),public.verified_print_release_candidates(uuid),public.admin_print_stock_release_status(uuid,uuid),public.admin_release_verified_print_stock(uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.retail_stock_ready(text),public.verified_print_release_candidates(uuid),public.admin_print_stock_release_status(uuid,uuid),public.admin_release_verified_print_stock(uuid,uuid,text,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
