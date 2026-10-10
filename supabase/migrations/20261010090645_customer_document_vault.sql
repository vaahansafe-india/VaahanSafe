BEGIN;
-- Custom HttpOnly sessions authorize the server. No browser Data API grants: this
-- prevents leaking object paths or security verifiers through direct REST calls.
CREATE TABLE public.customer_vault_policy (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), max_file_bytes bigint NOT NULL CHECK(max_file_bytes>0),
 max_bytes bigint NOT NULL CHECK(max_bytes>0), max_documents integer NOT NULL CHECK(max_documents>0)
);
INSERT INTO public.customer_vault_policy VALUES(true,20971520,524288000,200);
CREATE TABLE public.customer_vault_settings (
 owner_user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE RESTRICT,
 pin_verifier text, auto_lock_minutes integer NOT NULL DEFAULT 5 CHECK(auto_lock_minutes IN (0,5,15,30)),
 revision integer NOT NULL DEFAULT 1, attempts integer NOT NULL DEFAULT 0, attempt_window timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.customer_vault_usage (
 owner_user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE RESTRICT,
 bytes bigint NOT NULL DEFAULT 0 CHECK(bytes>=0), documents integer NOT NULL DEFAULT 0 CHECK(documents>=0)
);
CREATE TABLE public.customer_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 vehicle_id text REFERENCES public.vehicles(id) ON DELETE RESTRICT,
 category text NOT NULL CHECK(category IN ('DRIVING_LICENCE','REGISTRATION_CERTIFICATE','INSURANCE','PUC','FITNESS_CERTIFICATE','PERMIT','ROAD_TAX','PURCHASE_INVOICE','SERVICE_RECORD','WARRANTY','LOAN_HYPOTHECATION','CLAIM','ROADSIDE_ASSISTANCE','FASTAG','OTHER')),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 120), document_number_masked text,
 issued_at date, valid_from date, expires_at date, issuer_name text CHECK(length(issuer_name)<=120),
 metadata jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(metadata)='object' AND octet_length(metadata::text)<=4000),
 security_mode text NOT NULL DEFAULT 'ACCOUNT' CHECK(security_mode IN ('ACCOUNT','VAULT_PIN','DOCUMENT_PASSWORD')),
 security_revision integer NOT NULL DEFAULT 1, current_version integer NOT NULL DEFAULT 0,
 status text NOT NULL DEFAULT 'PENDING_UPLOAD' CHECK(status IN ('PENDING_UPLOAD','READY','FAILED','DELETED')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
 CHECK(expires_at IS NULL OR issued_at IS NULL OR expires_at>=issued_at),
 CHECK(expires_at IS NULL OR valid_from IS NULL OR expires_at>=valid_from)
);
-- Retain audit/version records. Only ephemeral authorization rows cascade.
CREATE TABLE public.customer_document_security (
 document_id uuid PRIMARY KEY REFERENCES public.customer_documents(id) ON DELETE RESTRICT,
 password_verifier text NOT NULL, attempts integer NOT NULL DEFAULT 0, attempt_window timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.customer_document_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES public.customer_documents(id) ON DELETE RESTRICT,
 version_number integer NOT NULL CHECK(version_number>0), original_filename text NOT NULL CHECK(length(original_filename)<=160),
 mime_type text NOT NULL CHECK(mime_type IN ('application/pdf','image/jpeg','image/png','image/webp')),
 file_size_bytes bigint NOT NULL CHECK(file_size_bytes BETWEEN 12 AND 20971520),
 storage_key text NOT NULL UNIQUE, thumbnail_key text, checksum text CHECK(checksum ~ '^[a-f0-9]{64}$'),
 upload_token_hash text UNIQUE CHECK(upload_token_hash ~ '^[a-f0-9]{64}$'), lease_id uuid,
 upload_session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'PENDING_UPLOAD' CHECK(status IN ('PENDING_UPLOAD','UPLOADING','READY','FAILED','PURGING','PURGED')),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '20 minutes',
 UNIQUE(document_id,version_number)
);
CREATE TABLE public.customer_document_shares (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES public.customer_documents(id) ON DELETE RESTRICT,
 token_hash text NOT NULL UNIQUE CHECK(token_hash ~ '^[a-f0-9]{64}$'), passcode_verifier text,
 expires_at timestamptz NOT NULL CHECK(expires_at<=created_at+interval '7 days'),
 max_views integer CHECK(max_views BETWEEN 1 AND 1000), view_count integer NOT NULL DEFAULT 0 CHECK(view_count>=0),
 allow_download boolean NOT NULL DEFAULT false, revoked_at timestamptz,
 attempts integer NOT NULL DEFAULT 0, attempt_window timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.customer_vault_unlocks (
 session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
 scope text NOT NULL, revision integer NOT NULL, expires_at timestamptz NOT NULL, PRIMARY KEY(session_id,scope)
);
CREATE TABLE public.customer_document_access (
 token_hash text PRIMARY KEY CHECK(token_hash ~ '^[a-f0-9]{64}$'), version_id uuid NOT NULL REFERENCES public.customer_document_versions(id) ON DELETE RESTRICT,
 session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
 share_id uuid REFERENCES public.customer_document_shares(id) ON DELETE RESTRICT,
 kind text NOT NULL CHECK(kind IN ('preview','download','thumbnail')), expires_at timestamptz NOT NULL,
 CHECK((session_id IS NULL)<>(share_id IS NULL))
);
CREATE TABLE public.customer_document_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES public.customer_documents(id) ON DELETE RESTRICT,
 actor_type text NOT NULL DEFAULT 'CUSTOMER' CHECK(actor_type IN ('CUSTOMER','SHARE','SYSTEM')),
 event_type text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_documents_owner_recent ON public.customer_documents(owner_user_id,created_at DESC,id DESC) WHERE deleted_at IS NULL;
CREATE INDEX customer_documents_vehicle ON public.customer_documents(vehicle_id,owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX customer_documents_expiry ON public.customer_documents(owner_user_id,expires_at,id) WHERE status='READY';
CREATE INDEX customer_documents_category ON public.customer_documents(owner_user_id,category) WHERE status='READY';
CREATE INDEX customer_document_versions_cleanup ON public.customer_document_versions(status,expires_at);
CREATE INDEX customer_document_versions_session ON public.customer_document_versions(upload_session_id);
CREATE INDEX customer_document_shares_document ON public.customer_document_shares(document_id,created_at DESC);
CREATE INDEX customer_document_events_document ON public.customer_document_events(document_id,created_at DESC);
CREATE INDEX customer_document_access_expiry ON public.customer_document_access(expires_at);
CREATE INDEX customer_document_access_version ON public.customer_document_access(version_id);
CREATE INDEX customer_document_access_session ON public.customer_document_access(session_id);
CREATE INDEX customer_document_access_share ON public.customer_document_access(share_id);

CREATE FUNCTION public.vault_session_owner(p_session uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT u.id FROM public.sessions s JOIN public.users u ON u.id=s.user_id
 WHERE s.id=p_session AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status='ACTIVE' AND u.deleted_at IS NULL
 AND EXISTS(SELECT 1 FROM public.auth_identities i WHERE i.user_id=u.id AND i.provider='PHONE' AND i.provider_user_id=u.phone AND i.verified_at IS NOT NULL)
$$;
CREATE FUNCTION public.vault_document_allowed(p_document uuid,p_session uuid,p_content boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.customer_documents d WHERE d.id=p_document AND d.owner_user_id=public.vault_session_owner(p_session)
 AND d.deleted_at IS NULL AND (d.vehicle_id IS NULL OR EXISTS(SELECT 1 FROM public.vehicles v WHERE v.id=d.vehicle_id AND v.user_id=d.owner_user_id::text AND v.status<>'DELETED' AND v.deleted_at IS NULL))
 AND (NOT p_content OR d.security_mode='ACCOUNT' OR EXISTS(SELECT 1 FROM public.customer_vault_unlocks g
 WHERE g.session_id=p_session AND g.expires_at>now() AND (
 (d.security_mode='DOCUMENT_PASSWORD' AND g.scope=d.id::text AND g.revision=d.security_revision) OR
 (d.security_mode='VAULT_PIN' AND g.scope='vault' AND g.revision=(SELECT revision FROM public.customer_vault_settings WHERE owner_user_id=d.owner_user_id))))))
$$;
CREATE FUNCTION public.vault_projection(p_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('id',d.id,'title',d.title,'category',d.category,'vehicle_id',d.vehicle_id,
 'vehicle_label',CASE WHEN v.id IS NOT NULL THEN left(v.registration_number,2)||'••••'||right(v.registration_number,4) END,
 'document_number_masked',d.document_number_masked,'issued_at',d.issued_at,'valid_from',d.valid_from,'expires_at',d.expires_at,'issuer_name',d.issuer_name,
 'metadata',d.metadata,'security_mode',d.security_mode,'created_at',d.created_at,'updated_at',d.updated_at,
 'original_filename',r.original_filename,'mime_type',r.mime_type,'file_size_bytes',r.file_size_bytes,'version_number',r.version_number)
 FROM public.customer_documents d JOIN public.customer_document_versions r ON r.document_id=d.id AND r.version_number=d.current_version AND r.status='READY'
 LEFT JOIN public.vehicles v ON v.id=d.vehicle_id WHERE d.id=p_id
$$;

CREATE FUNCTION public.vault_command(p_session uuid,p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE owner uuid; doc public.customer_documents%ROWTYPE; ver public.customer_document_versions%ROWTYPE;
 settings public.customer_vault_settings%ROWTYPE; policy public.customer_vault_policy%ROWTYPE; usage public.customer_vault_usage%ROWTYPE;
 docid uuid; unlock_scope text; verifier text; rev integer; cnt integer; result jsonb; duration integer; token text; versionid uuid;
BEGIN
 owner:=public.vault_session_owner(p_session); IF owner IS NULL THEN RETURN jsonb_build_object('error','UNAUTHORIZED'); END IF;
 INSERT INTO public.customer_vault_settings(owner_user_id) VALUES(owner) ON CONFLICT DO NOTHING;
 INSERT INTO public.customer_vault_usage(owner_user_id) VALUES(owner) ON CONFLICT DO NOTHING;
 SELECT * INTO settings FROM public.customer_vault_settings WHERE owner_user_id=owner;
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
 IF NOT public.vault_document_allowed(docid,p_session,true) THEN RETURN '{"error":"LOCKED"}'; END IF;
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

-- A transfer token carries no paths/identity. The Worker resolves it server-side
-- and checks current session/vehicle access again, including after upload.
CREATE FUNCTION public.vault_transfer(p_hash text,p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ver public.customer_document_versions%ROWTYPE; doc public.customer_documents%ROWTYPE; access public.customer_document_access%ROWTYPE; share public.customer_document_shares%ROWTYPE; lease uuid;
BEGIN
 IF p_action IN ('claim','finish','state') THEN
  SELECT * INTO ver FROM public.customer_document_versions WHERE upload_token_hash=p_hash FOR UPDATE;
  IF ver.id IS NULL THEN RETURN '{"error":"NOT_FOUND"}'; END IF;
  SELECT * INTO doc FROM public.customer_documents WHERE id=ver.document_id FOR UPDATE;
  IF ver.status='READY' THEN RETURN jsonb_build_object('ready',true,'id',doc.id); END IF;
  IF ver.expires_at<=now() OR NOT public.vault_document_allowed(doc.id,ver.upload_session_id,true) THEN RETURN '{"error":"EXPIRED"}'; END IF;
  IF p_action='state' THEN RETURN jsonb_build_object('status',ver.status); END IF;
  IF p_action='claim' THEN
   IF ver.status<>'PENDING_UPLOAD' THEN RETURN '{"error":"UPLOAD_PENDING"}'; END IF;
   lease:=gen_random_uuid();
   UPDATE public.customer_document_versions SET status='UPLOADING',lease_id=lease WHERE id=ver.id;
   RETURN jsonb_build_object('key',ver.storage_key,'size',ver.file_size_bytes,'mime',ver.mime_type,'lease',lease);
  END IF;
  IF ver.status<>'UPLOADING' OR ver.lease_id IS DISTINCT FROM (p_data->>'lease')::uuid THEN RETURN '{"error":"UPLOAD_PENDING"}'; END IF;
  IF (p_data->>'size')::bigint<>ver.file_size_bytes OR p_data->>'mime'<>ver.mime_type THEN RETURN '{"error":"INVALID_FILE"}'; END IF;
  UPDATE public.customer_document_versions SET status='READY',checksum=p_data->>'checksum',thumbnail_key=CASE WHEN (p_data->>'thumbnail')::boolean THEN storage_key||'-thumbnail' END WHERE id=ver.id;
  UPDATE public.customer_documents SET status='READY',current_version=ver.version_number,updated_at=now() WHERE id=doc.id;
  INSERT INTO public.customer_document_events(document_id,event_type) VALUES(doc.id,CASE WHEN doc.current_version=0 THEN 'Uploaded' ELSE 'Replaced' END);
  RETURN jsonb_build_object('ready',true,'id',doc.id);
 END IF;
 SELECT * INTO access FROM public.customer_document_access WHERE token_hash=p_hash AND expires_at>now();
 IF access.token_hash IS NULL THEN RETURN '{"error":"EXPIRED"}'; END IF;
 SELECT * INTO ver FROM public.customer_document_versions WHERE id=access.version_id AND status='READY';
 SELECT * INTO doc FROM public.customer_documents WHERE id=ver.document_id AND status='READY' AND deleted_at IS NULL;
 IF doc.id IS NULL THEN RETURN '{"error":"NOT_FOUND"}'; END IF;
 IF access.session_id IS NOT NULL THEN
  IF NOT public.vault_document_allowed(doc.id,access.session_id,true) THEN RETURN '{"error":"LOCKED"}'; END IF;
 ELSE
  SELECT * INTO share FROM public.customer_document_shares WHERE id=access.share_id AND revoked_at IS NULL AND expires_at>now();
  IF share.id IS NULL OR (access.kind='download' AND NOT share.allow_download) OR NOT EXISTS(SELECT 1 FROM public.users WHERE id=doc.owner_user_id AND status='ACTIVE' AND deleted_at IS NULL)
   OR (doc.vehicle_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.vehicles WHERE id=doc.vehicle_id AND user_id=doc.owner_user_id::text AND status<>'DELETED' AND deleted_at IS NULL)) THEN RETURN '{"error":"EXPIRED"}'; END IF;
 END IF;
 RETURN jsonb_build_object('key',CASE WHEN access.kind='thumbnail' THEN ver.thumbnail_key ELSE ver.storage_key END,
 'mime',CASE WHEN access.kind='thumbnail' THEN 'image/webp' ELSE ver.mime_type END,'filename',ver.original_filename,'kind',access.kind,'size',ver.file_size_bytes);
END $$;

CREATE FUNCTION public.vault_share(p_hash text,p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE share public.customer_document_shares%ROWTYPE; doc public.customer_documents%ROWTYPE; v uuid;
BEGIN
 SELECT * INTO share FROM public.customer_document_shares WHERE token_hash=p_hash FOR UPDATE;
 IF share.id IS NULL OR share.revoked_at IS NOT NULL OR share.expires_at<=now() OR (share.max_views IS NOT NULL AND share.view_count>=share.max_views) THEN RETURN '{"error":"SHARE_UNAVAILABLE"}'; END IF;
 SELECT * INTO doc FROM public.customer_documents WHERE id=share.document_id AND status='READY' AND deleted_at IS NULL;
 IF doc.id IS NULL OR NOT EXISTS(SELECT 1 FROM public.users WHERE id=doc.owner_user_id AND status='ACTIVE' AND deleted_at IS NULL)
  OR (doc.vehicle_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.vehicles WHERE id=doc.vehicle_id AND user_id=doc.owner_user_id::text AND status<>'DELETED' AND deleted_at IS NULL)) THEN RETURN '{"error":"SHARE_UNAVAILABLE"}'; END IF;
 IF p_action='info' THEN RETURN jsonb_build_object('title',doc.title,'expires',share.expires_at,'passcode',share.passcode_verifier IS NOT NULL,'download',share.allow_download); END IF;
 IF p_action='secret' THEN
  IF share.attempt_window>now()-interval '15 minutes' AND share.attempts>=5 THEN RETURN '{"error":"RATE_LIMIT"}'; END IF;
  UPDATE public.customer_document_shares SET attempts=CASE WHEN attempt_window>now()-interval '15 minutes' THEN attempts+1 ELSE 1 END,
   attempt_window=CASE WHEN attempt_window>now()-interval '15 minutes' THEN attempt_window ELSE now() END WHERE id=share.id;
  RETURN jsonb_build_object('verifier',share.passcode_verifier);
 END IF;
 IF share.passcode_verifier IS DISTINCT FROM p_data->>'verifier' THEN RETURN '{"error":"INCORRECT_PASSWORD"}'; END IF;
 SELECT id INTO v FROM public.customer_document_versions WHERE document_id=doc.id AND version_number=doc.current_version AND status='READY';
 IF v IS NULL THEN RETURN '{"error":"SHARE_UNAVAILABLE"}'; END IF;
 -- One view is consumed atomically per viewer open; thumbnail/page/range requests do not consume extra views.
 UPDATE public.customer_document_shares SET view_count=view_count+1 WHERE id=share.id;
 INSERT INTO public.customer_document_access(token_hash,version_id,share_id,kind,expires_at) VALUES(p_data->>'previewHash',v,share.id,'preview',least(share.expires_at,now()+interval '60 seconds'));
 IF share.allow_download THEN INSERT INTO public.customer_document_access(token_hash,version_id,share_id,kind,expires_at) VALUES(p_data->>'downloadHash',v,share.id,'download',least(share.expires_at,now()+interval '60 seconds')); END IF;
 INSERT INTO public.customer_document_events(document_id,actor_type,event_type) VALUES(doc.id,'SHARE','Shared document opened');
 RETURN jsonb_build_object('title',doc.title,'mime', (SELECT mime_type FROM public.customer_document_versions WHERE id=v),'download',share.allow_download);
END $$;

CREATE FUNCTION public.vault_cleanup(p_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ver public.customer_document_versions%ROWTYPE; owner uuid;
BEGIN
 DELETE FROM public.customer_document_access WHERE expires_at<now();
 DELETE FROM public.customer_vault_unlocks WHERE expires_at<now();
 IF p_id IS NULL THEN
  -- Lease longer than the bounded upload time; do not race a live upload.
  UPDATE public.customer_document_versions SET status='FAILED' WHERE status IN ('PENDING_UPLOAD','UPLOADING') AND expires_at<now()-interval '10 minutes';
  UPDATE public.customer_documents SET status='FAILED' WHERE status='PENDING_UPLOAD' AND NOT EXISTS(SELECT 1 FROM public.customer_document_versions WHERE document_id=customer_documents.id AND status IN ('PENDING_UPLOAD','UPLOADING','READY'));
  RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'key',r.storage_key,'thumbnail',r.storage_key||'-thumbnail')),'[]') FROM
   (SELECT v.* FROM public.customer_document_versions v JOIN public.customer_documents d ON d.id=v.document_id
    WHERE v.status IN ('FAILED','PURGING') OR (d.status='DELETED' AND v.status<>'PURGED' AND (v.status NOT IN ('PENDING_UPLOAD','UPLOADING') OR v.expires_at<now()-interval '10 minutes')) ORDER BY v.created_at LIMIT 20) r);
 END IF;
 SELECT * INTO ver FROM public.customer_document_versions WHERE id=p_id FOR UPDATE;
 SELECT owner_user_id INTO owner FROM public.customer_documents WHERE id=ver.document_id;
 IF ver.status='PURGED' THEN RETURN '{"ok":true}'; END IF;
 IF ver.status NOT IN ('FAILED','PURGING') AND NOT EXISTS(SELECT 1 FROM public.customer_documents WHERE id=ver.document_id AND status='DELETED') THEN RETURN '{"error":"NOT_FOUND"}'; END IF;
 UPDATE public.customer_document_versions SET status='PURGED' WHERE id=p_id;
 UPDATE public.customer_vault_usage SET bytes=greatest(0,bytes-ver.file_size_bytes-131072) WHERE owner_user_id=owner;
 IF EXISTS(SELECT 1 FROM public.customer_documents WHERE id=ver.document_id AND status='FAILED') AND NOT EXISTS(SELECT 1 FROM public.customer_document_versions WHERE document_id=ver.document_id AND status<>'PURGED') THEN
  UPDATE public.customer_documents SET status='DELETED',deleted_at=now() WHERE id=ver.document_id;
  UPDATE public.customer_vault_usage SET documents=greatest(0,documents-1) WHERE owner_user_id=owner;
 END IF;
 RETURN '{"ok":true}';
END $$;

CREATE FUNCTION public.vault_thumbnail_grants(p_session uuid,p_candidates jsonb) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 WITH inserted AS (
  INSERT INTO public.customer_document_access(token_hash,version_id,session_id,kind,expires_at)
  SELECT c.hash,r.id,p_session,'thumbnail',now()+interval '60 seconds'
  FROM jsonb_to_recordset(p_candidates) AS c(id uuid,hash text)
  JOIN public.customer_documents d ON d.id=c.id
  JOIN public.customer_document_versions r ON r.document_id=d.id AND r.version_number=d.current_version AND r.status='READY'
  WHERE r.thumbnail_key IS NOT NULL AND public.vault_document_allowed(d.id,p_session,true)
  RETURNING token_hash
 ) SELECT coalesce(jsonb_agg(token_hash),'[]') FROM inserted
$$;

DO $$ DECLARE t text; f record; BEGIN
 FOREACH t IN ARRAY ARRAY['customer_vault_policy','customer_vault_settings','customer_vault_usage','customer_documents','customer_document_security','customer_document_versions','customer_document_shares','customer_vault_unlocks','customer_document_access','customer_document_events'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
 FOR f IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('vault_session_owner','vault_document_allowed','vault_projection','vault_command','vault_transfer','vault_share','vault_cleanup','vault_thumbnail_grants') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
COMMIT;
