-- Admin console follows the explicitly selected Supabase + Cloudflare R2 architecture.
-- All admin-only records have RLS, no client grants, and service-role access only.
-- No data, identities, payments, entitlements, or example accounts are seeded.
BEGIN;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS google_subject text UNIQUE;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS verified_mobile text UNIQUE;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS mobile_verified_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_normalized ON public.admin_users(lower(email));
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_users FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.admin_users TO service_role;

CREATE TABLE public.admin_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 -- RESTRICT: suspension/revocation, not deletion, preserves privileged identity history.
 admin_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 token_hash text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 revoked_at timestamptz, phone_verified_at timestamptz, step_up_at timestamptz,
 pending_phone text, otp_sent_at timestamptz, otp_attempts integer NOT NULL DEFAULT 0 CHECK(otp_attempts >= 0),
 CHECK(expires_at <= created_at + interval '4 hours')
);
CREATE INDEX admin_sessions_actor ON public.admin_sessions(admin_id,expires_at) WHERE revoked_at IS NULL;

CREATE TABLE public.admin_audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 -- RESTRICT: the actor and evidence must survive operational account changes.
 actor_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 action text NOT NULL, resource_type text NOT NULL, resource_id text NOT NULL,
 reason text NOT NULL, request_id uuid NOT NULL,
 before_summary jsonb NOT NULL DEFAULT '{}', after_summary jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_resource ON public.admin_audit_logs(resource_type,resource_id,created_at DESC);
CREATE INDEX admin_audit_actor ON public.admin_audit_logs(actor_id,created_at DESC);
CREATE INDEX admin_audit_request ON public.admin_audit_logs(request_id);
CREATE FUNCTION public.admin_audit_immutable() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'Audit records are immutable'; END; $$;
CREATE TRIGGER admin_audit_immutable BEFORE UPDATE OR DELETE ON public.admin_audit_logs FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable();

CREATE TABLE public.admin_partners (
 id text PRIMARY KEY, reference_code text NOT NULL UNIQUE, name text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('DISTRIBUTOR','RETAILER')), city text NOT NULL,
 status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','SUSPENDED')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_partners_kind ON public.admin_partners(kind,status);
CREATE TABLE public.admin_stock_transfers (
 id text PRIMARY KEY, reference_code text NOT NULL UNIQUE,
 -- RESTRICT: physical custody and stock history must remain traceable.
 source_partner_id text REFERENCES public.admin_partners(id) ON DELETE RESTRICT,
 destination_partner_id text NOT NULL REFERENCES public.admin_partners(id) ON DELETE RESTRICT,
 quantity integer NOT NULL CHECK(quantity > 0),
 status text NOT NULL DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED','IN_TRANSIT','RECEIVED','CANCELLED')),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(source_partner_id IS DISTINCT FROM destination_partner_id)
);
CREATE INDEX admin_transfers_source ON public.admin_stock_transfers(source_partner_id,created_at DESC);
CREATE INDEX admin_transfers_destination ON public.admin_stock_transfers(destination_partner_id,created_at DESC);
CREATE TABLE public.admin_stock_reconciliations (
 id text PRIMARY KEY,
 -- RESTRICT: counted stock evidence must not vanish with a partner.
 partner_id text NOT NULL REFERENCES public.admin_partners(id) ON DELETE RESTRICT,
 expected_quantity integer NOT NULL CHECK(expected_quantity >= 0), counted_quantity integer NOT NULL CHECK(counted_quantity >= 0),
 variance integer GENERATED ALWAYS AS(counted_quantity-expected_quantity) STORED,
 status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','REVIEWED','CLOSED')),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_reconciliation_partner ON public.admin_stock_reconciliations(partner_id,created_at DESC);
CREATE TABLE public.admin_support_tickets (
 id text PRIMARY KEY,reference_code text NOT NULL UNIQUE,subject text NOT NULL,
 priority text NOT NULL CHECK(priority IN ('LOW','NORMAL','HIGH','URGENT')),
 status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','IN_PROGRESS','WAITING_CUSTOMER','RESOLVED','CLOSED')),
 -- RESTRICT: case ownership and evidence are retained when staff leave.
 assigned_to text REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_support_status ON public.admin_support_tickets(status,created_at DESC);
CREATE INDEX admin_support_assignee ON public.admin_support_tickets(assigned_to);
CREATE TABLE public.admin_documents (
 id text PRIMARY KEY,title text NOT NULL,asset_key text NOT NULL,
 status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED','ARCHIVED')),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.admin_incidents (
 id text PRIMARY KEY,title text NOT NULL,summary text NOT NULL,
 impact text NOT NULL CHECK(impact IN ('NONE','MINOR','MAJOR','CRITICAL')),
 status text NOT NULL DEFAULT 'INVESTIGATING' CHECK(status IN ('INVESTIGATING','IDENTIFIED','MONITORING','RESOLVED')),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.admin_feature_flags (
 id text PRIMARY KEY,name text NOT NULL UNIQUE,description text NOT NULL,enabled boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.admin_action_previews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 -- CASCADE: preview is ephemeral and has no audit or financial truth.
 session_id uuid NOT NULL REFERENCES public.admin_sessions(id) ON DELETE CASCADE,
 action text NOT NULL CHECK(action='BLOCK_QR'), snapshot jsonb NOT NULL,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '5 minutes',consumed_at timestamptz
);
CREATE INDEX admin_previews_session ON public.admin_action_previews(session_id,expires_at);
CREATE TABLE public.admin_export_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 -- RESTRICT: access ownership and export evidence are preserved.
 actor_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 module_key text NOT NULL,status text NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','PROCESSING','READY','FAILED','EXPIRED')),
 object_key text UNIQUE, row_count integer, expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours',
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_exports_pending ON public.admin_export_jobs(status,created_at);
CREATE INDEX admin_exports_actor ON public.admin_export_jobs(actor_id,created_at DESC);

-- Controlled management operation and audit run in a single Postgres transaction.
-- SECURITY INVOKER: only the server service role may execute. No elevated public RPC.
CREATE FUNCTION public.admin_console_mutate(p_session uuid,p_module text,p_id text,p_values jsonb,p_reason text,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor public.admin_users; ses public.admin_sessions; target text; allowed text[]; column_list text; set_list text; before_row jsonb; after_row jsonb;
BEGIN
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL AND expires_at>now() AND phone_verified_at IS NOT NULL FOR UPDATE;
 SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE';
 IF actor.id IS NULL OR actor.role='READ_ONLY_ANALYST' THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF length(trim(p_reason))<10 OR length(p_reason)>500 THEN RAISE EXCEPTION 'Reason required'; END IF;
 CASE p_module
 WHEN 'distributors','retailers' THEN
  IF actor.role NOT IN ('SUPER_ADMIN','OPS_ADMIN') THEN RAISE EXCEPTION 'Access denied'; END IF;
  target:='admin_partners'; allowed:=ARRAY['reference_code','name','kind','city','status'];
 WHEN 'support' THEN
  IF actor.role NOT IN ('SUPER_ADMIN','SUPPORT_AGENT','OPS_ADMIN') THEN RAISE EXCEPTION 'Access denied'; END IF;
  target:='admin_support_tickets'; allowed:=ARRAY['reference_code','subject','priority','status','assigned_to'];
 WHEN 'incidents' THEN
  IF actor.role NOT IN ('SUPER_ADMIN','STATUS_MANAGER') THEN RAISE EXCEPTION 'Access denied'; END IF;
  target:='admin_incidents';allowed:=ARRAY['title','summary','impact','status'];
 WHEN 'documents' THEN
  IF actor.role NOT IN ('SUPER_ADMIN','CONTENT_EDITOR') THEN RAISE EXCEPTION 'Access denied'; END IF;
  target:='admin_documents';allowed:=ARRAY['title','asset_key','status'];
 WHEN 'flags' THEN
  IF actor.role<>'SUPER_ADMIN' OR ses.step_up_at IS NULL OR ses.step_up_at<now()-interval '10 minutes' THEN RAISE EXCEPTION 'Step-up required'; END IF;
  target:='admin_feature_flags';allowed:=ARRAY['name','description','enabled'];
 ELSE RAISE EXCEPTION 'Unsupported operation'; END CASE;
 IF jsonb_typeof(p_values)<>'object' OR p_values='{}'::jsonb OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_values) k WHERE NOT(k=ANY(allowed))) THEN RAISE EXCEPTION 'Invalid fields'; END IF;
 EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE',target) INTO before_row USING p_id;
 IF before_row IS NULL THEN
  SELECT string_agg(format('%I',k),',' ORDER BY k) INTO column_list FROM jsonb_object_keys(p_values) k;
  EXECUTE format('INSERT INTO public.%I (id,%s) SELECT $1,%s FROM jsonb_populate_record(NULL::public.%I,$2) RETURNING to_jsonb(%I)',target,column_list,column_list,target,target) INTO after_row USING p_id,p_values;
 ELSE
  SELECT string_agg(format('%I=r.%I',k,k),',') INTO set_list FROM jsonb_object_keys(p_values) k;
  EXECUTE format('UPDATE public.%I t SET %s,updated_at=now() FROM jsonb_populate_record(NULL::public.%I,$2) r WHERE t.id=$1 RETURNING to_jsonb(t)',target,set_list,target) INTO after_row USING p_id,p_values;
 END IF;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(actor.id,CASE WHEN before_row IS NULL THEN 'CREATE' ELSE 'UPDATE' END,p_module,p_id,p_reason,p_request,COALESCE(before_row,'{}'),after_row);
 RETURN after_row;
END; $$;

CREATE FUNCTION public.admin_block_inventory(p_session uuid,p_preview uuid,p_reason text,p_request uuid)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ses public.admin_sessions; actor public.admin_users; preview public.admin_action_previews; affected integer; item jsonb; sticker public.qr_stickers;
BEGIN
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL AND expires_at>now() AND phone_verified_at IS NOT NULL FOR UPDATE;
 SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE';
 IF actor.id IS NULL OR actor.role NOT IN ('SUPER_ADMIN','OPS_ADMIN') THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF ses.step_up_at IS NULL OR ses.step_up_at<now()-interval '10 minutes' THEN RAISE EXCEPTION 'Step-up required'; END IF;
 IF length(trim(p_reason))<10 OR length(p_reason)>500 THEN RAISE EXCEPTION 'Reason required'; END IF;
 SELECT * INTO preview FROM public.admin_action_previews WHERE id=p_preview AND session_id=p_session AND consumed_at IS NULL AND expires_at>now() FOR UPDATE;
 IF preview.id IS NULL THEN RAISE EXCEPTION 'Preview expired'; END IF;
 affected:=0;
 FOR item IN SELECT value FROM jsonb_array_elements(preview.snapshot) ORDER BY value->>'id' LOOP
  SELECT * INTO sticker FROM public.qr_stickers WHERE id=item->>'id' FOR UPDATE;
  IF sticker.id IS NULL OR sticker.status IS DISTINCT FROM item->>'status' OR sticker.lifecycle_state IS DISTINCT FROM item->>'lifecycle_state' THEN RAISE EXCEPTION 'Inventory changed; preview again'; END IF;
  IF sticker.status IN ('BLOCKED','REPLACED') THEN RAISE EXCEPTION 'Invalid transition'; END IF;
  UPDATE public.qr_stickers SET status='BLOCKED',lifecycle_state='BLOCKED',updated_at=now() WHERE id=sticker.id;
  -- A block never creates or upgrades any acquisition or subscription entitlement.
  INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,reason_code,actor_type,actor_id,changed_by,change_reason,created_at)
  VALUES(gen_random_uuid()::text,sticker.id,sticker.status,'BLOCKED','ADMIN_BLOCK','ADMIN',actor.id,actor.id,p_reason,now());
  INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
  VALUES(actor.id,'BLOCK_QR','inventory',sticker.id,p_reason,p_request,item,jsonb_build_object('status','BLOCKED','lifecycle_state','BLOCKED'));
  affected:=affected+1;
 END LOOP;
 UPDATE public.admin_action_previews SET consumed_at=now() WHERE id=p_preview;
 RETURN affected;
END; $$;

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['admin_sessions','admin_audit_logs','admin_partners','admin_stock_transfers','admin_stock_reconciliations','admin_support_tickets','admin_documents','admin_incidents','admin_feature_flags','admin_action_previews','admin_export_jobs'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO service_role',t);
 END LOOP;
END $$;
REVOKE UPDATE,DELETE ON public.admin_audit_logs FROM service_role;
REVOKE ALL ON FUNCTION public.admin_audit_immutable() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.admin_console_mutate(uuid,text,text,jsonb,text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.admin_block_inventory(uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_console_mutate(uuid,text,text,jsonb,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_block_inventory(uuid,uuid,text,uuid) TO service_role;
CREATE FUNCTION public.admin_complete_phone(p_session uuid,p_sent_at timestamptz,p_phone text,p_request uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ses public.admin_sessions; actor public.admin_users;
BEGIN
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL AND expires_at>now() AND otp_sent_at=p_sent_at AND pending_phone=p_phone AND otp_sent_at>now()-interval '5 minutes' FOR UPDATE;
 SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE' FOR UPDATE;
 IF actor.id IS NULL OR (actor.verified_mobile IS NOT NULL AND actor.verified_mobile<>p_phone) THEN RAISE EXCEPTION 'Verification rejected'; END IF;
 UPDATE public.admin_users SET verified_mobile=p_phone,mobile_verified_at=COALESCE(mobile_verified_at,now()) WHERE id=actor.id;
 UPDATE public.admin_sessions SET phone_verified_at=now(),step_up_at=now(),pending_phone=NULL,otp_sent_at=NULL WHERE id=p_session;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(actor.id,'MOBILE_VERIFIED','admin_session',p_session::text,'Provider-verified mobile authentication',p_request,'{}',jsonb_build_object('verified',true));
END; $$;
REVOKE ALL ON FUNCTION public.admin_complete_phone(uuid,timestamptz,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_complete_phone(uuid,timestamptz,text,uuid) TO service_role;
CREATE FUNCTION public.admin_article_mutate(p_session uuid,p_id text,p_mode text,p_values jsonb,p_reason text,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ses public.admin_sessions;actor public.admin_users;before_row jsonb;after_row jsonb;column_list text;set_list text;
allowed text[]:=ARRAY['title','slug','excerpt','deck','intro','category','category_slug','status','reading_time','reading_time_minutes','word_count','is_featured','is_guide','featured_image_url','tags','key_takeaways','body','faq','references_data','related_slugs','content_markdown','seo_title','seo_description','author_name','author_role'];
BEGIN
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL AND expires_at>now() AND phone_verified_at IS NOT NULL FOR UPDATE;
 SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE';
 IF actor.id IS NULL OR actor.role NOT IN ('SUPER_ADMIN','CONTENT_EDITOR') THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF length(trim(p_reason))<10 OR length(p_reason)>500 THEN RAISE EXCEPTION 'Reason required'; END IF;
 IF jsonb_typeof(p_values)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_values) k WHERE NOT(k=ANY(allowed))) THEN RAISE EXCEPTION 'Invalid fields'; END IF;
 SELECT to_jsonb(t) INTO before_row FROM public.journal_articles t WHERE id=p_id FOR UPDATE;
 IF p_values->>'status'='PUBLISHED' OR p_mode='ARCHIVE' OR (before_row->>'status'='PUBLISHED' AND p_values->>'status' IS NOT NULL) THEN
  IF ses.step_up_at IS NULL OR ses.step_up_at<now()-interval '10 minutes' THEN RAISE EXCEPTION 'Step-up required'; END IF;
 END IF;
 IF p_mode='CREATE' AND before_row IS NULL THEN
  SELECT string_agg(format('%I',k),',' ORDER BY k) INTO column_list FROM jsonb_object_keys(p_values) k;
  EXECUTE format('INSERT INTO public.journal_articles (id,%s) SELECT $1,%s FROM jsonb_populate_record(NULL::public.journal_articles,$2) RETURNING to_jsonb(journal_articles)',column_list,column_list) INTO after_row USING p_id,p_values;
 ELSIF p_mode='UPDATE' AND before_row IS NOT NULL THEN
  SELECT string_agg(format('%I=r.%I',k,k),',') INTO set_list FROM jsonb_object_keys(p_values) k;
  EXECUTE format('UPDATE public.journal_articles t SET %s,updated_at=now() FROM jsonb_populate_record(NULL::public.journal_articles,$2) r WHERE t.id=$1 RETURNING to_jsonb(t)',set_list) INTO after_row USING p_id,p_values;
 ELSIF p_mode='ARCHIVE' AND before_row IS NOT NULL THEN
  UPDATE public.journal_articles t SET status='ARCHIVED',updated_at=now() WHERE id=p_id RETURNING to_jsonb(t) INTO after_row;
 ELSE RAISE EXCEPTION 'Invalid article operation'; END IF;
 IF after_row->>'status'='PUBLISHED' THEN UPDATE public.journal_articles SET published_at=COALESCE(published_at,now()) WHERE id=p_id; END IF;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(actor.id,p_mode,'articles',p_id,p_reason,p_request,jsonb_build_object('title',before_row->>'title','status',before_row->>'status'),jsonb_build_object('title',after_row->>'title','status',after_row->>'status'));
 RETURN after_row;
END; $$;
REVOKE ALL ON FUNCTION public.admin_article_mutate(uuid,text,text,jsonb,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_article_mutate(uuid,text,text,jsonb,text,uuid) TO service_role;
CREATE FUNCTION public.admin_request_export(p_session uuid,p_module text,p_request uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ses public.admin_sessions;actor public.admin_users;job uuid;
BEGIN
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL AND expires_at>now() AND phone_verified_at IS NOT NULL FOR UPDATE;
 SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE';
 IF actor.id IS NULL OR actor.role NOT IN ('SUPER_ADMIN','OPS_ADMIN','FINANCE_ADMIN','READ_ONLY_ANALYST') THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF (SELECT count(*) FROM public.admin_export_jobs WHERE actor_id=actor.id AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'Export rate limit'; END IF;
 INSERT INTO public.admin_export_jobs(actor_id,module_key) VALUES(actor.id,p_module) RETURNING id INTO job;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(actor.id,'EXPORT_REQUEST','reports',job::text,'Authorized asynchronous export request',p_request,'{}',jsonb_build_object('module',p_module,'status','QUEUED'));
 RETURN job;
END; $$;
REVOKE ALL ON FUNCTION public.admin_request_export(uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_request_export(uuid,text,uuid) TO service_role;
CREATE FUNCTION public.admin_reserve_otp(p_session uuid,p_phone text,p_request uuid)
RETURNS timestamptz LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ses public.admin_sessions;actor public.admin_users;sent timestamptz:=now();
BEGIN
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL AND expires_at>now() FOR UPDATE;
 SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE' FOR UPDATE;
 IF actor.id IS NULL OR p_phone !~ '^\+91[6-9][0-9]{9}$' OR (actor.verified_mobile IS NOT NULL AND actor.verified_mobile<>p_phone) THEN RAISE EXCEPTION 'Mobile request rejected'; END IF;
 IF ses.otp_sent_at>now()-interval '1 minute' OR (SELECT count(*) FROM public.admin_audit_logs WHERE actor_id=actor.id AND action='OTP_REQUEST' AND created_at>now()-interval '1 hour')>=5 THEN RAISE EXCEPTION 'OTP rate limit'; END IF;
 UPDATE public.admin_sessions SET pending_phone=p_phone,otp_sent_at=sent,otp_attempts=0 WHERE id=p_session;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(actor.id,'OTP_REQUEST','admin_session',p_session::text,'Mobile authentication request',p_request,'{}','{}');
 RETURN sent;
END; $$;
REVOKE ALL ON FUNCTION public.admin_reserve_otp(uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reserve_otp(uuid,text,uuid) TO service_role;

CREATE FUNCTION public.admin_google_session(p_email text,p_subject text,p_hash text,p_request uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor public.admin_users;ses uuid;
BEGIN
 SELECT * INTO actor FROM public.admin_users WHERE lower(email)=lower(p_email) AND status='ACTIVE' FOR UPDATE;
 IF actor.id IS NULL OR (actor.google_subject IS NOT NULL AND actor.google_subject<>p_subject) THEN RAISE EXCEPTION 'Admin sign-in rejected'; END IF;
 UPDATE public.admin_users SET google_subject=p_subject WHERE id=actor.id;
 INSERT INTO public.admin_sessions(admin_id,token_hash,expires_at) VALUES(actor.id,p_hash,now()+interval '4 hours') RETURNING id INTO ses;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(actor.id,'GOOGLE_SIGN_IN','admin_session',ses::text,'Verified Google OpenID identity sign-in',p_request,'{}',jsonb_build_object('mobileRequired',true));
 RETURN ses;
END; $$;
REVOKE ALL ON FUNCTION public.admin_google_session(text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_google_session(text,text,text,uuid) TO service_role;
CREATE FUNCTION public.admin_logout(p_session uuid,p_request uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ses public.admin_sessions;
BEGIN
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL FOR UPDATE;
 IF ses.id IS NULL THEN RETURN; END IF;
 UPDATE public.admin_sessions SET revoked_at=now() WHERE id=p_session;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(ses.admin_id,'SIGN_OUT','admin_session',p_session::text,'Administrator requested sign-out',p_request,'{}',jsonb_build_object('revoked',true));
END; $$;
REVOKE ALL ON FUNCTION public.admin_logout(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_logout(uuid,uuid) TO service_role;

CREATE FUNCTION public.admin_otp_attempt(p_session uuid,p_sent_at timestamptz,p_request uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ses public.admin_sessions;
BEGIN
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL AND expires_at>now() AND otp_sent_at=p_sent_at AND otp_sent_at>now()-interval '5 minutes' FOR UPDATE;
 IF ses.id IS NULL OR ses.otp_attempts>=5 THEN RAISE EXCEPTION 'Verification limit reached'; END IF;
 UPDATE public.admin_sessions SET otp_attempts=otp_attempts+1 WHERE id=p_session;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(ses.admin_id,'OTP_VERIFY_ATTEMPT','admin_session',p_session::text,'Mobile authentication verification attempt',p_request,'{}',jsonb_build_object('attempt',ses.otp_attempts+1));
END; $$;
REVOKE ALL ON FUNCTION public.admin_otp_attempt(uuid,timestamptz,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_otp_attempt(uuid,timestamptz,uuid) TO service_role;

CREATE FUNCTION public.admin_inventory_preview(p_session uuid,p_ids text[],p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ses public.admin_sessions;actor public.admin_users;snapshot jsonb;preview public.admin_action_previews;
BEGIN
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL AND expires_at>now() AND phone_verified_at IS NOT NULL FOR UPDATE;
 SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE';
 IF actor.id IS NULL OR actor.role NOT IN ('SUPER_ADMIN','OPS_ADMIN') THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF cardinality(p_ids)<1 OR cardinality(p_ids)>100 THEN RAISE EXCEPTION 'Invalid selection'; END IF;
 SELECT jsonb_agg(jsonb_build_object('id',id,'visible_code',visible_code,'status',status,'lifecycle_state',lifecycle_state) ORDER BY id)
 INTO snapshot FROM public.qr_stickers WHERE id=ANY(p_ids) AND status NOT IN ('BLOCKED','REPLACED');
 IF snapshot IS NULL OR jsonb_array_length(snapshot)<>cardinality(p_ids) THEN RAISE EXCEPTION 'Invalid selection'; END IF;
 INSERT INTO public.admin_action_previews(session_id,action,snapshot) VALUES(p_session,'BLOCK_QR',snapshot) RETURNING * INTO preview;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(actor.id,'BLOCK_PREVIEW','inventory',preview.id::text,'Preview of proposed inventory block',p_request,'{}',jsonb_build_object('affected',cardinality(p_ids)));
 RETURN jsonb_build_object('previewId',preview.id,'expiresAt',preview.expires_at,'count',cardinality(p_ids),'rows',snapshot);
END; $$;
REVOKE ALL ON FUNCTION public.admin_inventory_preview(uuid,text[],uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_inventory_preview(uuid,text[],uuid) TO service_role;
-- Scheduled workers use the same transaction boundary for lifecycle changes and audit.
CREATE FUNCTION public.admin_export_transition(p_id uuid,p_from text,p_to text,p_key text,p_count integer,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE job public.admin_export_jobs;
BEGIN
 SELECT * INTO job FROM public.admin_export_jobs WHERE id=p_id AND status=p_from FOR UPDATE;
 IF job.id IS NULL THEN RETURN NULL; END IF;
 IF NOT((p_from='QUEUED' AND p_to='PROCESSING') OR (p_from='PROCESSING' AND p_to IN ('READY','FAILED'))
  OR (p_from='PROCESSING' AND p_to='QUEUED' AND job.updated_at<now()-interval '15 minutes')
  OR (p_from='READY' AND p_to='EXPIRED' AND job.expires_at<now())) THEN RAISE EXCEPTION 'Invalid export transition'; END IF;
 IF p_to='READY' AND (p_key IS NULL OR p_key<>('admin-exports/'||job.actor_id||'/'||job.id::text||'.csv') OR p_count IS NULL OR p_count<0 OR p_count>10000) THEN RAISE EXCEPTION 'Invalid export output'; END IF;
 UPDATE public.admin_export_jobs SET status=p_to,object_key=CASE WHEN p_to='READY' THEN p_key ELSE object_key END,
  row_count=CASE WHEN p_to='READY' THEN p_count ELSE row_count END,updated_at=now() WHERE id=p_id RETURNING * INTO job;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(job.actor_id,'EXPORT_'||p_to,'reports',job.id::text,'Scheduled private export lifecycle operation',p_request,jsonb_build_object('status',p_from),jsonb_build_object('status',p_to,'rowCount',job.row_count));
 RETURN to_jsonb(job);
END; $$;
REVOKE ALL ON FUNCTION public.admin_export_transition(uuid,text,text,text,integer,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_export_transition(uuid,text,text,text,integer,uuid) TO service_role;
COMMIT;
