-- Only hashes live in relational records. R2 stores the encrypted packaging archive.
CREATE TABLE IF NOT EXISTS public.qr_batch_activation_exports (
  id uuid PRIMARY KEY,
  -- RESTRICT: manufacturing evidence and code recovery must survive batch/actor changes.
  batch_id text NOT NULL UNIQUE REFERENCES public.qr_batches(id) ON DELETE RESTRICT,
  actor_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
  bucket_name text NOT NULL, object_key text NOT NULL UNIQUE,
  ciphertext_sha256 text NOT NULL CHECK(ciphertext_sha256 ~ '^[a-f0-9]{64}$'),
  key_version text NOT NULL CHECK(key_version='v1'),
  code_count integer NOT NULL CHECK(code_count>0), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS qr_batch_activation_exports_actor ON public.qr_batch_activation_exports(actor_id);
ALTER TABLE public.qr_batch_activation_exports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.qr_batch_activation_exports FROM anon,authenticated;
GRANT SELECT,INSERT ON public.qr_batch_activation_exports TO service_role;

CREATE OR REPLACE FUNCTION public.admin_provision_offline_activation_codes(
  p_session uuid, p_batch text, p_hashes jsonb, p_export uuid, p_bucket text,
  p_object text, p_checksum text, p_request uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ses public.admin_sessions; actor public.admin_users; batch public.qr_batches;
  existing public.qr_batch_activation_exports; item jsonb; qty integer;
BEGIN
  SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL
    AND expires_at>now() AND created_at>now()-interval '4 hours' AND email_verified_at IS NOT NULL;
  SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE'
    AND role IN ('SUPER_ADMIN','OPS_ADMIN');
  IF actor.id IS NULL THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  SELECT * INTO batch FROM public.qr_batches WHERE id=p_batch FOR UPDATE;
  IF batch.id IS NULL OR batch.inventory_channel<>'OFFLINE_RETAIL' THEN RAISE EXCEPTION 'INVALID_BATCH'; END IF;
  SELECT * INTO existing FROM public.qr_batch_activation_exports WHERE batch_id=p_batch;
  IF existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('exportId',existing.id,'count',existing.code_count,'alreadyProvisioned',true);
  END IF;
  IF p_hashes IS NULL OR jsonb_typeof(p_hashes)<>'array' OR p_export IS NULL
    OR p_checksum IS NULL OR p_checksum !~ '^[a-f0-9]{64}$'
    OR p_bucket IS NULL OR p_bucket !~ '^[a-z0-9-]{3,63}$'
    OR p_object IS DISTINCT FROM ('activation-codes/'||p_batch||'/'||p_export::text||'.json.enc')
    THEN RAISE EXCEPTION 'INVALID_PROVISIONING'; END IF;
  qty := jsonb_array_length(p_hashes);
  IF qty<>batch.quantity OR qty NOT BETWEEN 1 AND 5000 OR
    (SELECT count(*) FROM public.qr_stickers WHERE batch_id=p_batch)<>qty OR
    (SELECT count(DISTINCT value->>'qrId') FROM jsonb_array_elements(p_hashes))<>qty
    THEN RAISE EXCEPTION 'BATCH_CHANGED'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_hashes) LOOP
    IF item->>'hash' IS NULL OR item->>'hash' !~ '^[a-f0-9]{32}:[a-f0-9]{64}$'
      OR item->>'version' IS DISTINCT FROM 'v1' OR item->>'qrId' IS NULL OR
      NOT EXISTS (SELECT 1 FROM public.qr_stickers WHERE id=item->>'qrId' AND batch_id=p_batch)
      THEN RAISE EXCEPTION 'INVALID_PROVISIONING'; END IF;
  END LOOP;
  PERFORM id FROM public.qr_stickers WHERE batch_id=p_batch ORDER BY id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.qr_stickers s WHERE s.batch_id=p_batch AND
    (s.status<>'INVENTORY' OR s.lifecycle_state<>'INVENTORY' OR s.user_id IS NOT NULL OR
      s.vehicle_id IS NOT NULL OR s.activated_at IS NOT NULL OR s.activation_secret_hash IS NOT NULL))
    OR EXISTS (SELECT 1 FROM public.qr_activation_secrets sec JOIN public.qr_stickers s ON s.id=sec.qr_id WHERE s.batch_id=p_batch)
    OR EXISTS (SELECT 1 FROM public.qr_assignments a JOIN public.qr_stickers s ON s.id=a.qr_id WHERE s.batch_id=p_batch)
    OR EXISTS (SELECT 1 FROM public.service_entitlements e JOIN public.qr_stickers s ON s.id=e.qr_sticker_id WHERE s.batch_id=p_batch)
    THEN RAISE EXCEPTION 'BATCH_CHANGED'; END IF;
  INSERT INTO public.qr_activation_secrets(id,qr_id,secret_hash,hash_version)
    SELECT 'sec_'||pg_catalog.gen_random_uuid()::text,value->>'qrId',value->>'hash','v1'
    FROM jsonb_array_elements(p_hashes);
  UPDATE public.qr_stickers s SET activation_secret_hash=r->>'hash',updated_at=now()
    FROM jsonb_array_elements(p_hashes) r WHERE s.id=r->>'qrId' AND s.batch_id=p_batch;
  INSERT INTO public.qr_batch_activation_exports(id,batch_id,actor_id,bucket_name,object_key,ciphertext_sha256,key_version,code_count)
    VALUES(p_export,p_batch,actor.id,p_bucket,p_object,p_checksum,'v1',qty);
  INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary)
    VALUES(actor.id,'PROVISION_OFFLINE_ACTIVATION_CODES','batches',p_batch,
      'Generate private activation proofs and preserve encrypted packaging archive; no service activation.',p_request,
      jsonb_build_object('count',qty,'exportId',p_export,'hashVersion','v1','status','INVENTORY'));
  RETURN jsonb_build_object('exportId',p_export,'count',qty,'alreadyProvisioned',false);
END; $$;
REVOKE ALL ON FUNCTION public.admin_provision_offline_activation_codes(uuid,text,jsonb,uuid,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_provision_offline_activation_codes(uuid,text,jsonb,uuid,text,text,text,uuid) TO service_role;
