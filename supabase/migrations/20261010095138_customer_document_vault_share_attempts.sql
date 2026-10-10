BEGIN;
-- Successful opens are governed by expiry and atomic max-view limits.
-- Failed passcode guesses remain limited independently to five per 15 minutes.
CREATE OR REPLACE FUNCTION public.vault_share(p_hash text,p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE share public.customer_document_shares%ROWTYPE; doc public.customer_documents%ROWTYPE; v uuid;
BEGIN
 SELECT * INTO share FROM public.customer_document_shares WHERE token_hash=p_hash FOR UPDATE;
 IF share.id IS NULL OR share.revoked_at IS NOT NULL OR share.expires_at<=now() OR (share.max_views IS NOT NULL AND share.view_count>=share.max_views) THEN RETURN '{"error":"SHARE_UNAVAILABLE"}'; END IF;
 SELECT * INTO doc FROM public.customer_documents WHERE id=share.document_id AND status='READY' AND deleted_at IS NULL;
 IF doc.id IS NULL OR NOT EXISTS(SELECT 1 FROM public.users WHERE id=doc.owner_user_id AND status='ACTIVE' AND deleted_at IS NULL)
  OR (doc.vehicle_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.vehicles WHERE id=doc.vehicle_id AND user_id=doc.owner_user_id::text AND status<>'DELETED' AND deleted_at IS NULL)) THEN RETURN '{"error":"SHARE_UNAVAILABLE"}'; END IF;
 IF p_action='info' THEN RETURN jsonb_build_object('title',doc.title,'expires',share.expires_at,'passcode',share.passcode_verifier IS NOT NULL,'download',share.allow_download); END IF;
 IF p_action='secret' THEN
  IF share.passcode_verifier IS NOT NULL THEN
   IF share.attempt_window>now()-interval '15 minutes' AND share.attempts>=5 THEN RETURN '{"error":"RATE_LIMIT"}'; END IF;
   UPDATE public.customer_document_shares SET attempts=CASE WHEN attempt_window>now()-interval '15 minutes' THEN attempts+1 ELSE 1 END,
    attempt_window=CASE WHEN attempt_window>now()-interval '15 minutes' THEN attempt_window ELSE now() END WHERE id=share.id;
  END IF;
  RETURN jsonb_build_object('verifier',share.passcode_verifier);
 END IF;
 IF p_action<>'open' THEN RETURN '{"error":"SHARE_UNAVAILABLE"}'; END IF;
 IF share.passcode_verifier IS DISTINCT FROM p_data->>'verifier' THEN RETURN '{"error":"INCORRECT_PASSWORD"}'; END IF;
 SELECT id INTO v FROM public.customer_document_versions WHERE document_id=doc.id AND version_number=doc.current_version AND status='READY';
 IF v IS NULL THEN RETURN '{"error":"SHARE_UNAVAILABLE"}'; END IF;
 UPDATE public.customer_document_shares SET view_count=view_count+1,attempts=0 WHERE id=share.id;
 INSERT INTO public.customer_document_access(token_hash,version_id,share_id,kind,expires_at) VALUES(p_data->>'previewHash',v,share.id,'preview',least(share.expires_at,now()+interval '60 seconds'));
 IF share.allow_download THEN INSERT INTO public.customer_document_access(token_hash,version_id,share_id,kind,expires_at) VALUES(p_data->>'downloadHash',v,share.id,'download',least(share.expires_at,now()+interval '60 seconds')); END IF;
 INSERT INTO public.customer_document_events(document_id,actor_type,event_type) VALUES(doc.id,'SHARE','Shared document opened');
 RETURN jsonb_build_object('title',doc.title,'mime',(SELECT mime_type FROM public.customer_document_versions WHERE id=v),'download',share.allow_download);
END $$;
REVOKE ALL ON FUNCTION public.vault_share(text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vault_share(text,text,jsonb) TO service_role;
COMMIT;
