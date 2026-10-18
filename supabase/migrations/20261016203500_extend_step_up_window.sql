-- Extend step-up security fresh window to 60 minutes for uninterrupted operations
BEGIN;

CREATE OR REPLACE FUNCTION public.inventory_admin_actor(p_session uuid,p_write boolean DEFAULT false,p_fresh boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor_id text;
BEGIN
 SELECT a.id INTO actor_id FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id
 WHERE s.id=p_session AND s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '8 hours'
 AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST')
 AND (NOT p_write OR a.role IN ('SUPER_ADMIN','OPS_ADMIN'))
 AND (NOT p_fresh OR s.step_up_at>now()-interval '60 minutes');
 IF actor_id IS NULL THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
 RETURN actor_id;
END; $$;

COMMIT;
