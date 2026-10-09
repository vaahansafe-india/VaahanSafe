import { readFile } from "node:fs/promises";
import { executeAdminSql } from "./admin-service.mjs";
const source = await readFile(
  "supabase/migrations/20261009092457_admin_email_otp_sign_in.sql",
  "utf8",
);
const ddl = source.replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, "");
await executeAdminSql(`DO $verify_email$
DECLARE definition text; signature text; actor_id text; test_session uuid; n integer;
BEGIN
 BEGIN
  EXECUTE $email_ddl$${ddl}$email_ddl$;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.admin_sessions'::regclass)
   OR has_table_privilege('anon','public.admin_sessions','SELECT')
   OR has_table_privilege('authenticated','public.admin_sessions','SELECT')
   OR has_function_privilege('anon','public.admin_verify_email_otp(uuid,text,text,uuid)','EXECUTE')
   OR has_function_privilege('authenticated','public.admin_reserve_email_otp(uuid,text,text)','EXECUTE')
  THEN RAISE EXCEPTION 'Admin email isolation failed'; END IF;
  FOREACH signature IN ARRAY ARRAY['public.admin_console_mutate(uuid,text,text,jsonb,text,uuid)',
   'public.admin_block_inventory(uuid,uuid,text,uuid)','public.admin_article_mutate(uuid,text,text,jsonb,text,uuid)',
   'public.admin_request_export(uuid,text,uuid)','public.admin_inventory_preview(uuid,text[],uuid)'] LOOP
   definition:=pg_get_functiondef(signature::regprocedure);
   IF position('AND email_verified_at IS NOT NULL' IN definition)=0 OR position('AND phone_verified_at IS NOT NULL' IN definition)>0
   THEN RAISE EXCEPTION 'Admin admission check failed'; END IF;
  END LOOP;
  IF public.admin_verify_email_otp(gen_random_uuid(),repeat('a',64),repeat('b',64),gen_random_uuid())
    OR public.admin_reserve_email_otp(gen_random_uuid(),repeat('a',64),repeat('b',64))
  THEN RAISE EXCEPTION 'Unknown session accepted'; END IF;
  -- Isolated session for an existing active Admin; no raw cookie is generated
  -- or disclosed. This entire subtransaction, including audits, rolls back.
  SELECT id INTO actor_id FROM public.admin_users WHERE status='ACTIVE' AND role='SUPER_ADMIN' ORDER BY id LIMIT 1;
  IF actor_id IS NULL THEN RAISE EXCEPTION 'An existing active Admin is required for validation'; END IF;
  INSERT INTO public.admin_sessions(admin_id,token_hash,expires_at)
   VALUES(actor_id,encode(sha256(gen_random_uuid()::text::bytea),'hex'),now()+interval '1 hour') RETURNING id INTO test_session;
  DELETE FROM public.admin_auth_limits WHERE bucket='email_otp:'||actor_id;
  IF NOT public.admin_reserve_email_otp(test_session,repeat('a',64),repeat('b',64))
   OR public.admin_reserve_email_otp(test_session,repeat('c',64),repeat('d',64))
   OR public.admin_verify_email_otp(test_session,repeat('a',64),repeat('b',64),gen_random_uuid())
  THEN RAISE EXCEPTION 'Reservation, cooldown or undelivered challenge check failed'; END IF;
  PERFORM public.admin_email_otp_dispatch(test_session,repeat('a',64),true);
  FOR n IN 1..5 LOOP
   IF public.admin_verify_email_otp(test_session,repeat('a',64),repeat('c',64),gen_random_uuid())
   THEN RAISE EXCEPTION 'Wrong code accepted'; END IF;
  END LOOP;
  IF public.admin_verify_email_otp(test_session,repeat('a',64),repeat('b',64),gen_random_uuid())
  THEN RAISE EXCEPTION 'Attempt limit bypassed'; END IF;
  UPDATE public.admin_sessions SET email_otp_sent_at=now()-interval '61 seconds' WHERE id=test_session;
  IF NOT public.admin_reserve_email_otp(test_session,repeat('c',64),repeat('d',64)) THEN RAISE EXCEPTION 'Resend failed'; END IF;
  PERFORM public.admin_email_otp_dispatch(test_session,repeat('c',64),true);
  IF public.admin_verify_email_otp(test_session,repeat('a',64),repeat('b',64),gen_random_uuid())
   OR NOT public.admin_verify_email_otp(test_session,repeat('c',64),repeat('d',64),gen_random_uuid())
   OR public.admin_verify_email_otp(test_session,repeat('c',64),repeat('d',64),gen_random_uuid())
  THEN RAISE EXCEPTION 'Replacement, verification or replay check failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.admin_sessions WHERE id=test_session AND email_verified_at IS NOT NULL AND step_up_at IS NOT NULL AND phone_verified_at IS NULL)
  THEN RAISE EXCEPTION 'Email truth was not isolated from phone truth'; END IF;
  UPDATE public.admin_sessions SET email_otp_sent_at=now()-interval '61 seconds' WHERE id=test_session;
  PERFORM public.admin_reserve_email_otp(test_session,repeat('e',64),repeat('f',64));
  PERFORM public.admin_email_otp_dispatch(test_session,repeat('e',64),true);
  UPDATE public.admin_sessions SET email_otp_sent_at=now()-interval '6 minutes' WHERE id=test_session;
  IF public.admin_verify_email_otp(test_session,repeat('e',64),repeat('f',64),gen_random_uuid()) THEN RAISE EXCEPTION 'Expired challenge accepted'; END IF;
  UPDATE public.admin_sessions SET revoked_at=now() WHERE id=test_session;
  IF public.admin_reserve_email_otp(test_session,repeat('e',64),repeat('f',64)) THEN RAISE EXCEPTION 'Revoked session accepted'; END IF;
  RAISE EXCEPTION USING ERRCODE='ZX003',MESSAGE='Email migration validation completed';
 EXCEPTION WHEN SQLSTATE 'ZX003' THEN NULL;
 END;
END $verify_email$;`);
console.log(
  "Admin email migration validated against the real schema; all validation changes rolled back.",
);
