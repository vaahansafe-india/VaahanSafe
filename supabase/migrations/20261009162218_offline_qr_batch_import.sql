-- Stage imported offline identities without activating services or assigning owners.
ALTER TABLE public.qr_batches ADD COLUMN IF NOT EXISTS inventory_channel text NOT NULL
  DEFAULT 'ONLINE_SYSTEM' CHECK (inventory_channel IN ('ONLINE_SYSTEM','OFFLINE_RETAIL'));

CREATE OR REPLACE FUNCTION public.admin_import_offline_qr_batch(
  p_session uuid, p_reference text, p_rows jsonb, p_checksum text,
  p_request uuid, p_preview boolean DEFAULT true
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  actor public.admin_users; ses public.admin_sessions; existing public.qr_batches;
  new_batch_id text; qty integer; item jsonb;
BEGIN
  SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL
    AND expires_at>now() AND created_at>now()-interval '4 hours' AND email_verified_at IS NOT NULL;
  SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE'
    AND role IN ('SUPER_ADMIN','OPS_ADMIN');
  IF actor.id IS NULL THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  IF p_reference IS NULL OR p_reference !~ '^B[0-9]{3}$'
    OR p_checksum IS NULL OR p_checksum !~ '^[a-f0-9]{64}$'
    OR p_rows IS NULL OR jsonb_typeof(p_rows)<>'array' THEN RAISE EXCEPTION 'INVALID_BATCH'; END IF;
  qty := jsonb_array_length(p_rows);
  IF qty NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'INVALID_BATCH'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    IF jsonb_typeof(item)<>'object' OR item->>'serial' IS NULL OR item->>'publicId' IS NULL
      OR item->>'serial' !~ ('^'||p_reference||'-[0-9]{4}$')
      OR item->>'publicId' !~ '^[A-Z0-9]{8}$' THEN RAISE EXCEPTION 'INVALID_BATCH'; END IF;
  END LOOP;
  IF (SELECT count(DISTINCT value->>'serial') FROM jsonb_array_elements(p_rows))<>qty
    OR (SELECT count(DISTINCT value->>'publicId') FROM jsonb_array_elements(p_rows))<>qty
    THEN RAISE EXCEPTION 'DUPLICATE_IDS'; END IF;
  -- Serialize same-batch imports. Unique public IDs reject cross-batch collisions atomically.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_reference,0));
  SELECT * INTO existing FROM public.qr_batches WHERE reference_code=p_reference;
  IF existing.id IS NOT NULL THEN
    IF existing.inventory_channel<>'OFFLINE_RETAIL' OR existing.manufacturer_reference IS DISTINCT FROM p_checksum
      OR existing.quantity<>qty OR
      (SELECT count(*) FROM public.qr_stickers s JOIN jsonb_array_elements(p_rows) r
       ON s.public_id=r->>'publicId' AND s.visible_code='VS-'||(r->>'publicId')
       WHERE s.batch_id=existing.id)<>qty THEN RAISE EXCEPTION 'BATCH_CONFLICT'; END IF;
    RETURN jsonb_build_object('batchId',existing.id,'reference',p_reference,'count',qty,'alreadyImported',true);
  END IF;
  IF EXISTS (SELECT 1 FROM public.qr_stickers s JOIN jsonb_array_elements(p_rows) r
    ON s.public_id IN (r->>'publicId','VS-'||(r->>'publicId')) OR s.visible_code='VS-'||(r->>'publicId'))
    THEN RAISE EXCEPTION 'BATCH_CONFLICT'; END IF;
  IF p_preview THEN
    RETURN jsonb_build_object('reference',p_reference,'count',qty,'alreadyImported',false,
      'channel','OFFLINE_RETAIL','status','INVENTORY','activationReady',false);
  END IF;
  new_batch_id := 'batch_'||pg_catalog.gen_random_uuid()::text;
  INSERT INTO public.qr_batches(id,reference_code,quantity,status,inventory_channel,manufacturer_reference,created_by)
    VALUES(new_batch_id,p_reference,qty,'DRAFT','OFFLINE_RETAIL',p_checksum,actor.id);
  INSERT INTO public.qr_stickers(id,public_id,public_code,visible_code,batch_id,status,lifecycle_state,qr_type)
    SELECT 'qr_'||pg_catalog.gen_random_uuid()::text,value->>'publicId','VS-'||(value->>'publicId'),
      'VS-'||(value->>'publicId'),new_batch_id,'INVENTORY','INVENTORY','PHYSICAL_STICKER'
    FROM jsonb_array_elements(p_rows);
  INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,reason_code,actor_type,actor_id,metadata_json)
    SELECT 'qsh_'||pg_catalog.gen_random_uuid()::text,s.id,NULL,'INVENTORY','OFFLINE_BATCH_IMPORT','ADMIN',actor.id,
      jsonb_build_object('channel','OFFLINE_RETAIL','serial',r->>'serial',
        'originalUrl','https://www.vaahansafe.com/v/VS-'||(r->>'publicId'),
        'activationProofConfigured',false)::text
    FROM public.qr_stickers s JOIN jsonb_array_elements(p_rows) r ON s.public_id=r->>'publicId'
    WHERE s.batch_id=new_batch_id;
  INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary)
    VALUES(actor.id,'IMPORT_OFFLINE_QR_BATCH','batches',new_batch_id,
      'Import unactivated offline inventory; activation proofs require separate provisioning.',p_request,
      jsonb_build_object('reference',p_reference,'count',qty,'channel','OFFLINE_RETAIL','checksum',p_checksum));
  RETURN jsonb_build_object('batchId',new_batch_id,'reference',p_reference,'count',qty,'alreadyImported',false);
END; $$;
REVOKE ALL ON FUNCTION public.admin_import_offline_qr_batch(uuid,text,jsonb,text,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_import_offline_qr_batch(uuid,text,jsonb,text,uuid,boolean) TO service_role;
