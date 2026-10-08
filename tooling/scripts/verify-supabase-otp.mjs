// Real Supabase security/state-machine verification. Every fixture rolls back.
import { executeAdminSql } from './admin-service.mjs';
await executeAdminSql(`DO $otp_check$
DECLARE request_id text := 'otp_' || gen_random_uuid()::text; matched integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261008205438')
    OR EXISTS (SELECT 1 FROM pg_class WHERE oid='public.auth_otp_requests'::regclass AND NOT relrowsecurity)
    OR has_table_privilege('anon','public.auth_otp_requests','SELECT')
    OR has_table_privilege('authenticated','public.auth_otp_requests','UPDATE')
    OR EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'auth_otp_%' AND (p.prosecdef OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE')))
  THEN RAISE EXCEPTION 'OTP security checks failed'; END IF;
  BEGIN
    IF NOT public.auth_otp_reserve(request_id,repeat('a',64),repeat('b',64),repeat('c',64),'CUSTOMER','WHATSAPP') THEN RAISE EXCEPTION 'Reservation failed'; END IF;
    IF public.auth_otp_reserve('otp_' || gen_random_uuid()::text,repeat('d',64),repeat('b',64),repeat('e',64),'ACTIVATE','WHATSAPP') THEN RAISE EXCEPTION 'Cross-surface cooldown bypass'; END IF;
    IF NOT public.auth_otp_finish_dispatch(request_id,true,'verification-reference') THEN RAISE EXCEPTION 'Dispatch failed'; END IF;
    SELECT count(*) INTO matched FROM public.auth_otp_claim_verification(repeat('a',64),repeat('f',64),'CUSTOMER');
    IF matched <> 0 THEN RAISE EXCEPTION 'Phone mismatch bypass'; END IF;
    SELECT count(*) INTO matched FROM public.auth_otp_claim_verification(repeat('a',64),repeat('b',64),'ACTIVATE');
    IF matched <> 0 THEN RAISE EXCEPTION 'Surface mismatch bypass'; END IF;
    SELECT count(*) INTO matched FROM public.auth_otp_claim_verification(repeat('a',64),repeat('b',64),'CUSTOMER');
    IF matched <> 1 THEN RAISE EXCEPTION 'Claim failed'; END IF;
    SELECT count(*) INTO matched FROM public.auth_otp_claim_verification(repeat('a',64),repeat('b',64),'CUSTOMER');
    IF matched <> 0 THEN RAISE EXCEPTION 'Concurrent claim bypass'; END IF;
    IF NOT public.auth_otp_finish_verification(request_id,false) THEN RAISE EXCEPTION 'Retry recovery failed'; END IF;
    UPDATE public.auth_otp_requests SET attempt_count=5 WHERE id=request_id;
    SELECT count(*) INTO matched FROM public.auth_otp_claim_verification(repeat('a',64),repeat('b',64),'CUSTOMER');
    IF matched <> 0 THEN RAISE EXCEPTION 'Attempt limit bypass'; END IF;
    UPDATE public.auth_otp_requests SET attempt_count=0,created_at=created_at-600000,expires_at=expires_at-600000 WHERE id=request_id;
    SELECT count(*) INTO matched FROM public.auth_otp_claim_verification(repeat('a',64),repeat('b',64),'CUSTOMER');
    IF matched <> 0 THEN RAISE EXCEPTION 'Expiry bypass'; END IF;
    UPDATE public.auth_otp_requests SET status='VERIFYING' WHERE id=request_id;
    IF NOT public.auth_otp_finish_verification(request_id,true) THEN RAISE EXCEPTION 'Consumption failed'; END IF;
    IF public.auth_otp_finish_verification(request_id,true) THEN RAISE EXCEPTION 'Double consumption bypass'; END IF;
    RAISE EXCEPTION USING ERRCODE='ZX001',MESSAGE='Verification complete';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL; END;
END $otp_check$;`);
console.log('Supabase OTP migration, RLS, RPC privileges, shared cooldown, expiry, attempts and single consumption verified; all fixtures rolled back.');
