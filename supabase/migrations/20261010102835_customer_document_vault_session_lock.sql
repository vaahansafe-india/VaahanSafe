BEGIN;
-- A configured PIN protects every owner file, including ACCOUNT files. Per-file
-- passwords remain an additional gate. Public shares retain their explicit grant.
CREATE FUNCTION public.vault_session_unlocked(p_session uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT public.vault_session_owner(p_session) IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.customer_vault_settings s WHERE s.owner_user_id=public.vault_session_owner(p_session)
  AND s.pin_verifier IS NOT NULL AND NOT EXISTS (
   SELECT 1 FROM public.customer_vault_unlocks g WHERE g.session_id=p_session AND g.scope='vault'
   AND g.revision=s.revision AND g.expires_at>now()))
$$;
CREATE FUNCTION public.vault_session_state(p_session uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE owner uuid; settings public.customer_vault_settings%ROWTYPE; expiry timestamptz;
BEGIN
 owner:=public.vault_session_owner(p_session);
 IF owner IS NULL THEN RETURN '{"error":"UNAUTHORIZED"}'; END IF;
 SELECT * INTO settings FROM public.customer_vault_settings WHERE owner_user_id=owner;
 SELECT min(g.expires_at) INTO expiry FROM public.customer_vault_unlocks g WHERE g.session_id=p_session AND g.expires_at>now()
 AND ((g.scope='vault' AND g.revision=settings.revision) OR EXISTS (
  SELECT 1 FROM public.customer_documents d WHERE d.id::text=g.scope AND d.owner_user_id=owner
  AND d.security_mode='DOCUMENT_PASSWORD' AND d.security_revision=g.revision AND d.deleted_at IS NULL));
 RETURN jsonb_build_object('enabled',settings.pin_verifier IS NOT NULL,'locked',NOT public.vault_session_unlocked(p_session),
  'autoLockMinutes',coalesce(settings.auto_lock_minutes,5),'unlockExpiresAt',expiry);
END $$;
CREATE OR REPLACE FUNCTION public.vault_document_allowed(p_document uuid,p_session uuid,p_content boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.customer_documents d WHERE d.id=p_document AND d.owner_user_id=public.vault_session_owner(p_session)
 AND d.deleted_at IS NULL AND (d.vehicle_id IS NULL OR EXISTS(SELECT 1 FROM public.vehicles v WHERE v.id=d.vehicle_id AND v.user_id=d.owner_user_id::text AND v.status<>'DELETED' AND v.deleted_at IS NULL))
 AND (NOT p_content OR (public.vault_session_unlocked(p_session) AND (
  d.security_mode='ACCOUNT' OR (d.security_mode='VAULT_PIN' AND EXISTS(SELECT 1 FROM public.customer_vault_settings WHERE owner_user_id=d.owner_user_id AND pin_verifier IS NOT NULL))
  OR (d.security_mode='DOCUMENT_PASSWORD' AND EXISTS(SELECT 1 FROM public.customer_vault_unlocks g
   WHERE g.session_id=p_session AND g.scope=d.id::text AND g.revision=d.security_revision AND g.expires_at>now()))))))
$$;
CREATE OR REPLACE FUNCTION public.vault_command(p_session uuid,p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE owner uuid; doc public.customer_documents%ROWTYPE; ver public.customer_document_versions%ROWTYPE;
 settings public.customer_vault_settings%ROWTYPE; policy public.customer_vault_policy%ROWTYPE; usage public.customer_vault_usage%ROWTYPE;
 docid uuid; unlock_scope text; verifier text; rev integer; cnt integer; result jsonb; duration integer; token text; versionid uuid;
BEGIN
 owner:=public.vault_session_owner(p_session); IF owner IS NULL THEN RETURN jsonb_build_object('error','UNAUTHORIZED'); END IF;
 INSERT INTO public.customer_vault_settings(owner_user_id) VALUES(owner) ON CONFLICT DO NOTHING;
 INSERT INTO public.customer_vault_usage(owner_user_id) VALUES(owner) ON CONFLICT DO NOTHING;
 SELECT * INTO settings FROM public.customer_vault_settings WHERE owner_user_id=owner FOR UPDATE;
 IF p_action='lock' THEN
  DELETE FROM public.customer_vault_unlocks WHERE session_id=p_session;
  DELETE FROM public.customer_document_access WHERE session_id=p_session;
  RETURN '{"ok":true}';
 END IF;
 IF p_action='configure_pin' THEN
  -- A reset requires fresh account sign-in through the existing verified provider.
  IF settings.pin_verifier IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.sessions WHERE id=p_session AND created_at>now()-interval '5 minutes')
   AND NOT EXISTS(SELECT 1 FROM public.customer_vault_unlocks WHERE session_id=p_session AND scope='vault' AND revision=settings.revision AND expires_at>now())
  THEN RETURN '{"error":"REVERIFY"}'; END IF;
  UPDATE public.customer_vault_settings SET pin_verifier=p_data->>'verifier',auto_lock_minutes=(p_data->>'minutes')::integer,revision=revision+1,attempts=0 WHERE owner_user_id=owner;
  DELETE FROM public.customer_vault_unlocks WHERE session_id IN(SELECT id FROM public.sessions WHERE user_id=owner);
  DELETE FROM public.customer_document_access WHERE session_id IN(SELECT id FROM public.sessions WHERE user_id=owner);
  RETURN '{"ok":true}';
 END IF;
 IF p_action IN ('secret','unlock') THEN
  unlock_scope:=coalesce(p_data->>'scope','vault');
  IF unlock_scope='vault' THEN
   SELECT * INTO settings FROM public.customer_vault_settings WHERE owner_user_id=owner FOR UPDATE;
   verifier:=settings.pin_verifier; rev:=settings.revision;
   IF verifier IS NULL THEN RETURN '{"error":"PIN_REQUIRED"}'; END IF;
   IF p_action='secret' THEN
    IF settings.attempt_window>now()-interval '15 minutes' AND settings.attempts>=5 THEN RETURN '{"error":"RATE_LIMIT"}'; END IF;
    UPDATE public.customer_vault_settings SET attempts=CASE WHEN attempt_window>now()-interval '15 minutes' THEN attempts+1 ELSE 1 END,
     attempt_window=CASE WHEN attempt_window>now()-interval '15 minutes' THEN attempt_window ELSE now() END WHERE owner_user_id=owner;
   END IF;
  ELSE
   docid:=unlock_scope::uuid; IF NOT public.vault_document_allowed(docid,p_session) THEN RETURN '{"error":"NOT_FOUND"}'; END IF;
   SELECT * INTO doc FROM public.customer_documents WHERE id=docid FOR UPDATE;
   rev:=doc.security_revision;
   SELECT password_verifier INTO verifier FROM public.customer_document_security WHERE document_id=docid FOR UPDATE;
   IF verifier IS NULL THEN RETURN '{"error":"NOT_FOUND"}'; END IF;
   IF p_action='secret' THEN
    IF EXISTS(SELECT 1 FROM public.customer_document_security WHERE document_id=docid AND attempt_window>now()-interval '15 minutes' AND attempts>=5) THEN RETURN '{"error":"RATE_LIMIT"}'; END IF;
    UPDATE public.customer_document_security SET attempts=CASE WHEN attempt_window>now()-interval '15 minutes' THEN attempts+1 ELSE 1 END,
     attempt_window=CASE WHEN attempt_window>now()-interval '15 minutes' THEN attempt_window ELSE now() END WHERE document_id=docid;
   END IF;
  END IF;
  IF p_action='secret' THEN RETURN jsonb_build_object('verifier',verifier); END IF;
  IF verifier IS DISTINCT FROM p_data->>'verifier' THEN RETURN '{"error":"INCORRECT_PASSWORD"}'; END IF;
  IF unlock_scope='vault' THEN UPDATE public.customer_vault_settings SET attempts=0 WHERE owner_user_id=owner;
  ELSE UPDATE public.customer_document_security SET attempts=0 WHERE document_id=docid; END IF;
  INSERT INTO public.customer_vault_unlocks(session_id,scope,revision,expires_at) VALUES(p_session,unlock_scope,rev,
   now()+make_interval(secs=>CASE WHEN settings.auto_lock_minutes=0 THEN 60 ELSE settings.auto_lock_minutes*60 END))
   ON CONFLICT(session_id,scope) DO UPDATE SET revision=excluded.revision,expires_at=excluded.expires_at;
  RETURN '{"ok":true}';
 END IF;
 IF p_action='upload' THEN
  IF NOT public.vault_session_unlocked(p_session) THEN RETURN '{"error":"LOCKED","scope":"vault"}'; END IF;
  SELECT * INTO policy FROM public.customer_vault_policy WHERE id;
  SELECT * INTO usage FROM public.customer_vault_usage WHERE owner_user_id=owner FOR UPDATE;
  IF (p_data->>'size')::bigint>policy.max_file_bytes OR usage.bytes+(p_data->>'size')::bigint+131072>policy.max_bytes THEN RETURN '{"error":"QUOTA"}'; END IF;
  IF p_data->>'documentId' IS NOT NULL THEN
   docid:=(p_data->>'documentId')::uuid;
   IF NOT public.vault_document_allowed(docid,p_session,true) THEN RETURN '{"error":"LOCKED"}'; END IF;
   SELECT * INTO doc FROM public.customer_documents WHERE id=docid FOR UPDATE;
   IF EXISTS(SELECT 1 FROM public.customer_document_versions WHERE document_id=docid AND status IN ('PENDING_UPLOAD','UPLOADING') AND expires_at>now()) THEN RETURN '{"error":"UPLOAD_PENDING"}'; END IF;
  ELSE
   IF usage.documents>=policy.max_documents THEN RETURN '{"error":"QUOTA"}'; END IF;
   IF p_data->>'vehicleId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.vehicles WHERE id=p_data->>'vehicleId' AND user_id=owner::text AND status<>'DELETED' AND deleted_at IS NULL) THEN RETURN '{"error":"NOT_FOUND"}'; END IF;
   IF p_data->>'mode'='VAULT_PIN' AND settings.pin_verifier IS NULL THEN RETURN '{"error":"PIN_REQUIRED"}'; END IF;
   IF p_data->>'mode'='VAULT_PIN' AND NOT EXISTS(SELECT 1 FROM public.customer_vault_unlocks WHERE session_id=p_session AND scope='vault' AND revision=settings.revision AND expires_at>now()) THEN RETURN '{"error":"LOCKED"}'; END IF;
   INSERT INTO public.customer_documents(owner_user_id,vehicle_id,category,title,document_number_masked,issued_at,valid_from,expires_at,issuer_name,metadata,security_mode)
    VALUES(owner,p_data->>'vehicleId',p_data->>'category',p_data->>'title',p_data->>'numberMasked',nullif(p_data->>'issued','')::date,nullif(p_data->>'validFrom','')::date,nullif(p_data->>'expires','')::date,p_data->>'issuer',coalesce(p_data->'metadata','{}'),p_data->>'mode') RETURNING * INTO doc;
   docid:=doc.id;
   IF doc.security_mode='DOCUMENT_PASSWORD' THEN
    IF p_data->>'verifier' IS NULL THEN RAISE EXCEPTION 'Missing verifier'; END IF;
    INSERT INTO public.customer_document_security(document_id,password_verifier) VALUES(docid,p_data->>'verifier');
    INSERT INTO public.customer_vault_unlocks(session_id,scope,revision,expires_at) VALUES(p_session,docid::text,doc.security_revision,now()+interval '5 minutes');
   END IF;
   UPDATE public.customer_vault_usage SET documents=documents+1 WHERE owner_user_id=owner;
  END IF;
  SELECT coalesce(max(version_number),0)+1 INTO cnt FROM public.customer_document_versions WHERE document_id=docid;
  versionid:=gen_random_uuid();
  INSERT INTO public.customer_document_versions(id,document_id,version_number,original_filename,mime_type,file_size_bytes,storage_key,upload_token_hash,upload_session_id)
   VALUES(versionid,docid,cnt,p_data->>'filename',p_data->>'mime',(p_data->>'size')::bigint,
    'customer-documents/'||owner||'/'||docid||'/'||versionid||'/original',p_data->>'tokenHash',p_session);
  UPDATE public.customer_vault_usage SET bytes=bytes+(p_data->>'size')::bigint+131072 WHERE owner_user_id=owner;
  RETURN jsonb_build_object('id',docid,'versionId',versionid);
 END IF;
 docid:=(p_data->>'id')::uuid;
 IF NOT public.vault_document_allowed(docid,p_session) THEN RETURN '{"error":"NOT_FOUND"}'; END IF;
 SELECT * INTO doc FROM public.customer_documents WHERE id=docid FOR UPDATE;
 IF p_action='detail' THEN
  RETURN jsonb_build_object('document',public.vault_projection(docid),
   'versions',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'version_number',version_number,'original_filename',original_filename,'file_size_bytes',file_size_bytes,'created_at',created_at) ORDER BY version_number DESC),'[]') FROM public.customer_document_versions WHERE document_id=docid AND status='READY'),
   'shares',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'expires_at',expires_at,'allow_download',allow_download,'max_views',max_views,'view_count',view_count,'revoked_at',revoked_at) ORDER BY created_at DESC),'[]') FROM (SELECT * FROM public.customer_document_shares WHERE document_id=docid ORDER BY created_at DESC LIMIT 30) x),
   'events',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'event_type',event_type,'created_at',created_at) ORDER BY created_at DESC),'[]') FROM (SELECT * FROM public.customer_document_events WHERE document_id=docid ORDER BY created_at DESC LIMIT 30) x));
 END IF;
 IF NOT public.vault_session_unlocked(p_session) THEN RETURN '{"error":"LOCKED","scope":"vault"}'; END IF;
 IF NOT public.vault_document_allowed(docid,p_session,true) THEN RETURN jsonb_build_object('error','LOCKED','scope',CASE WHEN doc.security_mode='DOCUMENT_PASSWORD' THEN doc.id::text ELSE 'vault' END); END IF;
 IF p_action='access' THEN
  SELECT * INTO ver FROM public.customer_document_versions WHERE document_id=docid AND status='READY' AND (CASE WHEN p_data->>'versionId' IS NOT NULL THEN id=(p_data->>'versionId')::uuid ELSE version_number=doc.current_version END);
  IF ver.id IS NULL THEN RETURN '{"error":"NOT_FOUND"}'; END IF;
  INSERT INTO public.customer_document_access(token_hash,version_id,session_id,kind,expires_at) VALUES(p_data->>'tokenHash',ver.id,p_session,p_data->>'kind',now()+interval '60 seconds');
  IF p_data->>'kind'<>'thumbnail' THEN INSERT INTO public.customer_document_events(document_id,event_type) VALUES(docid,CASE WHEN p_data->>'kind'='download' THEN 'Downloaded' ELSE 'Previewed' END); END IF;
  RETURN jsonb_build_object('mime',ver.mime_type);
 ELSIF p_action='edit' THEN
  UPDATE public.customer_documents SET title=p_data->>'title',expires_at=nullif(p_data->>'expires','')::date,issuer_name=p_data->>'issuer',metadata=coalesce(p_data->'metadata',metadata),updated_at=now() WHERE id=docid;
  INSERT INTO public.customer_document_events(document_id,event_type) VALUES(docid,'Details updated');
 ELSIF p_action='security' THEN
  IF p_data->>'mode'='VAULT_PIN' AND settings.pin_verifier IS NULL THEN RETURN '{"error":"PIN_REQUIRED"}'; END IF;
  IF p_data->>'mode'='DOCUMENT_PASSWORD' THEN
   INSERT INTO public.customer_document_security(document_id,password_verifier) VALUES(docid,p_data->>'verifier') ON CONFLICT(document_id) DO UPDATE SET password_verifier=excluded.password_verifier,attempts=0;
  ELSE DELETE FROM public.customer_document_security WHERE document_id=docid; END IF;
  UPDATE public.customer_documents SET security_mode=p_data->>'mode',security_revision=security_revision+1,updated_at=now() WHERE id=docid;
  UPDATE public.customer_document_shares SET revoked_at=coalesce(revoked_at,now()) WHERE document_id=docid;
  DELETE FROM public.customer_document_access WHERE version_id IN(SELECT id FROM public.customer_document_versions WHERE document_id=docid);
  INSERT INTO public.customer_document_events(document_id,event_type) VALUES(docid,'Security changed; shares revoked');
 ELSIF p_action='delete' THEN
  UPDATE public.customer_documents SET status='DELETED',deleted_at=now(),updated_at=now() WHERE id=docid;
  UPDATE public.customer_document_shares SET revoked_at=coalesce(revoked_at,now()) WHERE document_id=docid;
  UPDATE public.customer_vault_usage SET documents=documents-1 WHERE owner_user_id=owner;
  INSERT INTO public.customer_document_events(document_id,event_type) VALUES(docid,'Deleted');
 ELSIF p_action='share' THEN
  SELECT count(*) INTO cnt FROM public.customer_document_shares WHERE document_id=docid AND revoked_at IS NULL AND expires_at>now();
  IF cnt>=20 THEN RETURN '{"error":"SHARE_LIMIT"}'; END IF;
  INSERT INTO public.customer_document_shares(document_id,token_hash,passcode_verifier,expires_at,max_views,allow_download)
   VALUES(docid,p_data->>'tokenHash',p_data->>'verifier',now()+make_interval(secs=>(p_data->>'seconds')::int),nullif(p_data->>'maxViews','')::int,(p_data->>'download')::boolean);
  INSERT INTO public.customer_document_events(document_id,event_type) VALUES(docid,'Secure link created');
 ELSIF p_action='revoke' THEN
  UPDATE public.customer_document_shares SET revoked_at=now() WHERE id=(p_data->>'shareId')::uuid AND document_id=docid;
  INSERT INTO public.customer_document_events(document_id,event_type) VALUES(docid,'Share revoked');
 ELSE RETURN '{"error":"INVALID_ACTION"}'; END IF;
 RETURN '{"ok":true}';
END $$;
CREATE OR REPLACE FUNCTION public.vault_thumbnail_grants(p_session uuid,p_candidates jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE owner uuid; result jsonb;
BEGIN
 owner:=public.vault_session_owner(p_session);
 IF owner IS NULL THEN RETURN '[]'; END IF;
 INSERT INTO public.customer_vault_settings(owner_user_id) VALUES(owner) ON CONFLICT DO NOTHING;
 -- Serialize new thumbnail grants with lock/PIN changes, before touching access rows.
 PERFORM 1 FROM public.customer_vault_settings WHERE owner_user_id=owner FOR UPDATE;
 WITH inserted AS (
  INSERT INTO public.customer_document_access(token_hash,version_id,session_id,kind,expires_at)
  SELECT c.hash,r.id,p_session,'thumbnail',now()+interval '60 seconds'
  FROM jsonb_to_recordset(p_candidates) AS c(id uuid,hash text)
  JOIN public.customer_documents d ON d.id=c.id
  JOIN public.customer_document_versions r ON r.document_id=d.id AND r.version_number=d.current_version AND r.status='READY'
  WHERE r.thumbnail_key IS NOT NULL AND public.vault_document_allowed(d.id,p_session,true)
  RETURNING token_hash
 ) SELECT coalesce(jsonb_agg(token_hash),'[]') INTO result FROM inserted;
 RETURN result;
END
$$;
REVOKE ALL ON FUNCTION public.vault_session_unlocked(uuid),public.vault_session_state(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vault_session_unlocked(uuid),public.vault_session_state(uuid) TO service_role;
COMMIT;
