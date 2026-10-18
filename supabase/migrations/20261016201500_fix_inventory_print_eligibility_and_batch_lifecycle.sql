-- Fix print manufacturing eligibility across all valid offline retail batch statuses and sync sticker lifecycle states
BEGIN;

CREATE OR REPLACE FUNCTION public.inventory_printable_qr(p_qr text) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.qr_stickers s
 JOIN public.qr_batches b ON b.id=s.batch_id
 JOIN public.qr_activation_secrets sec ON sec.qr_id=s.id
 JOIN public.qr_batch_activation_exports e ON e.batch_id=b.id
 WHERE s.id=p_qr AND b.status IN ('DRAFT','GENERATED','VALIDATED','PRINT_READY','EXPORTED','PRINTED','RECEIVED')
 AND s.status IN ('INVENTORY','PRINTED')
 AND (s.lifecycle_state = s.status OR s.lifecycle_state = 'INVENTORY')
 AND s.activated_at IS NULL AND s.user_id IS NULL AND s.vehicle_id IS NULL
 AND sec.consumed_at IS NULL AND sec.secret_hash IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM public.qr_assignments a WHERE a.qr_id=s.id AND a.ended_at IS NULL))
$$;

-- Keep sticker lifecycle_state in sync with status when transitioning batches to PRINTED
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

  IF from_st IN ('CLOSED', 'VOIDED') THEN
    RAISE EXCEPTION 'BATCH_TERMINAL_STATE';
  END IF;

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

  IF p_to_status = 'PRINTED' THEN
    UPDATE public.qr_stickers
    SET status = 'PRINTED', lifecycle_state = 'PRINTED', updated_at = now()
    WHERE batch_id = p_batch AND status IN ('INVENTORY', 'PRINTED');
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

-- Align any existing stickers
UPDATE public.qr_stickers
SET lifecycle_state = status, updated_at = now()
WHERE status = 'PRINTED' AND lifecycle_state = 'INVENTORY';

COMMIT;
