-- Batches Manufacturing & Operations Schema Upgrade
-- Indexes, aggregated summaries, atomic creation, generation, and lifecycle transitions.

ALTER TABLE public.qr_batches ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS qr_batches_created_cursor ON public.qr_batches (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS qr_batches_status_cursor ON public.qr_batches (status, created_at DESC);
CREATE INDEX IF NOT EXISTS qr_batches_channel_cursor ON public.qr_batches (inventory_channel, created_at DESC);

-- 1. Fast, bounded summary aggregation strip
CREATE OR REPLACE FUNCTION public.admin_get_batches_summary()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'totalBatches', count(*)::int,
    'totalIdentities', coalesce(sum(quantity), 0)::bigint,
    'draft', count(*) FILTER (WHERE status = 'DRAFT')::int,
    'generating', count(*) FILTER (WHERE status = 'GENERATING')::int,
    'printReady', count(*) FILTER (WHERE status = 'PRINT_READY')::int,
    'printed', count(*) FILTER (WHERE status = 'PRINTED')::int,
    'attention', count(*) FILTER (WHERE status IN ('FAILED', 'QUARANTINED', 'VOIDED'))::int
  )
  FROM public.qr_batches;
$$;

-- 2. Atomic Batch Creation
CREATE OR REPLACE FUNCTION public.admin_create_batch(
  p_session uuid,
  p_reference text,
  p_channel text,
  p_quantity integer,
  p_manufacturer text,
  p_notes text,
  p_request uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  actor public.admin_users;
  ses public.admin_sessions;
  new_id text;
  clean_ref text;
BEGIN
  SELECT * INTO ses FROM public.admin_sessions
  WHERE id = p_session AND revoked_at IS NULL
    AND expires_at > now() AND email_verified_at IS NOT NULL;
  SELECT * INTO actor FROM public.admin_users
  WHERE id = ses.admin_id AND status = 'ACTIVE'
    AND role IN ('SUPER_ADMIN', 'OPS_ADMIN');
  IF actor.id IS NULL THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;

  clean_ref := upper(trim(p_reference));
  IF clean_ref IS NULL OR clean_ref !~ '^[A-Z0-9_-]{3,64}$' THEN
    RAISE EXCEPTION 'INVALID_REFERENCE';
  END IF;

  IF p_channel NOT IN ('ONLINE_SYSTEM', 'OFFLINE_RETAIL') THEN
    RAISE EXCEPTION 'INVALID_CHANNEL';
  END IF;

  IF p_quantity < 1 OR p_quantity > 200000 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;

  IF EXISTS (SELECT 1 FROM public.qr_batches WHERE reference_code = clean_ref) THEN
    RAISE EXCEPTION 'DUPLICATE_REFERENCE';
  END IF;

  new_id := 'batch_' || pg_catalog.gen_random_uuid()::text;

  INSERT INTO public.qr_batches (
    id, reference_code, quantity, status, inventory_channel,
    manufacturer_name, notes, created_by, created_at, updated_at
  ) VALUES (
    new_id, clean_ref, p_quantity, 'DRAFT', p_channel,
    nullif(trim(p_manufacturer), ''), nullif(trim(p_notes), ''),
    actor.id, now(), now()
  );

  INSERT INTO public.admin_audit_logs (
    actor_id, action, resource_type, resource_id, reason, request_id, after_summary
  ) VALUES (
    actor.id, 'CREATE_BATCH', 'batches', new_id,
    'Create controlled manufacturing batch lot.', p_request,
    jsonb_build_object(
      'reference', clean_ref,
      'quantity', p_quantity,
      'channel', p_channel,
      'manufacturer', p_manufacturer
    )
  );

  RETURN jsonb_build_object(
    'id', new_id,
    'reference', clean_ref,
    'quantity', p_quantity,
    'channel', p_channel,
    'status', 'DRAFT'
  );
END;
$$;

-- 3. Transition Batch Status with State Machine Safeguards
CREATE OR REPLACE FUNCTION public.admin_transition_batch_status(
  p_session uuid,
  p_batch text,
  p_to_status text,
  p_reason text,
  p_request uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  actor public.admin_users;
  ses public.admin_sessions;
  batch public.qr_batches;
  from_st text;
BEGIN
  SELECT * INTO ses FROM public.admin_sessions
  WHERE id = p_session AND revoked_at IS NULL
    AND expires_at > now() AND email_verified_at IS NOT NULL;
  SELECT * INTO actor FROM public.admin_users
  WHERE id = ses.admin_id AND status = 'ACTIVE'
    AND role IN ('SUPER_ADMIN', 'OPS_ADMIN');
  IF actor.id IS NULL THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;

  SELECT * INTO batch FROM public.qr_batches WHERE id = p_batch FOR UPDATE;
  IF batch.id IS NULL THEN RAISE EXCEPTION 'BATCH_NOT_FOUND'; END IF;

  from_st := batch.status;

  -- Disallow transitioning closed or voided batches
  IF from_st IN ('CLOSED', 'VOIDED') THEN
    RAISE EXCEPTION 'BATCH_TERMINAL_STATE';
  END IF;

  -- Validate allowed transitions
  IF p_to_status = 'VALIDATED' AND from_st NOT IN ('DRAFT', 'GENERATED') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  ELSIF p_to_status = 'PRINT_READY' AND from_st NOT IN ('GENERATED', 'VALIDATED') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  ELSIF p_to_status = 'PRINTED' AND from_st NOT IN ('PRINT_READY', 'VALIDATED') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  ELSIF p_to_status = 'RECEIVED' AND from_st <> 'PRINTED' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  ELSIF p_to_status = 'CLOSED' AND from_st NOT IN ('PRINTED', 'RECEIVED') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  ELSIF p_to_status IN ('QUARANTINED', 'VOIDED') THEN
    -- Quarantining or voiding is allowed from any non-terminal state
    NULL;
  ELSIF p_to_status NOT IN ('VALIDATED', 'PRINT_READY', 'PRINTED', 'RECEIVED', 'CLOSED', 'QUARANTINED', 'VOIDED') THEN
    RAISE EXCEPTION 'UNKNOWN_STATUS';
  END IF;

  UPDATE public.qr_batches
  SET
    status = p_to_status,
    printed_at = CASE WHEN p_to_status = 'PRINTED' AND printed_at IS NULL THEN now() ELSE printed_at END,
    updated_at = now()
  WHERE id = p_batch;

  -- Also update sticker statuses if transitioning to PRINTED
  IF p_to_status = 'PRINTED' THEN
    UPDATE public.qr_stickers
    SET status = 'PRINTED', updated_at = now()
    WHERE batch_id = p_batch AND status = 'INVENTORY';
  END IF;

  INSERT INTO public.admin_audit_logs (
    actor_id, action, resource_type, resource_id, reason, request_id, after_summary
  ) VALUES (
    actor.id, 'TRANSITION_BATCH_STATUS', 'batches', p_batch,
    coalesce(nullif(trim(p_reason), ''), 'Manufacturing lifecycle state transition'),
    p_request,
    jsonb_build_object(
      'from', from_st,
      'to', p_to_status,
      'batchId', p_batch,
      'reference', batch.reference_code
    )
  );

  RETURN jsonb_build_object(
    'id', p_batch,
    'status', p_to_status,
    'previousStatus', from_st,
    'reference', batch.reference_code
  );
END;
$$;
