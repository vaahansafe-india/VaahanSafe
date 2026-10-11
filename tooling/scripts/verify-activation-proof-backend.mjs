import fs from "node:fs/promises";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig("apps/activate", true);
const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function sql(p_sql) {
  const response = await fetch(`${base}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_sql }),
    signal: AbortSignal.timeout(60000),
  });
  const data = await response.json();
  if (!response.ok)
    throw Error(
      `Activation backend verification failed: ${data.code}: ${data.message}`,
    );
  return data;
}
const baseline = `SELECT (SELECT count(*) FROM public.qr_stickers) identities,(SELECT count(*) FROM public.qr_activation_attempts) attempts,(SELECT count(*) FROM public.qr_activation_challenges) challenges,(SELECT count(*) FROM public.qr_assignments) assignments,(SELECT count(*) FROM public.service_entitlements) entitlements,(SELECT coalesce(sum(failed_attempts),0) FROM public.qr_activation_secrets) failed_attempts,EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='qr_activation_attempts' AND column_name='failure_reason_code') installed`;
const before = await sql(baseline);
const migration = (
  await fs.readFile(
    "supabase/migrations/20261011202225_activation_proof_lookup_and_audit.sql",
    "utf8",
  )
)
  .replace(/^BEGIN;$/m, "")
  .replace(/^COMMIT;$/m, "");
// Checks run in an exception subtransaction; no fixtures, proof verification or
// ownership changes are committed, and no real secret is read or submitted.
await sql(`DO $preview$ BEGIN BEGIN ${before[0].installed ? "" : migration}
 DO $checks$ DECLARE q text:='qr_'||gen_random_uuid()::text; fixture_public_id text:='Case'||replace(gen_random_uuid()::text,'-',''); code text; challenge text:='qac_'||gen_random_uuid()::text; token text:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''); BEGIN
 code:='VS-'||upper(fixture_public_id);
 IF has_table_privilege('anon','public.qr_activation_attempts','SELECT') OR has_table_privilege('authenticated','public.qr_activation_attempts','INSERT') OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.qr_activation_attempts'::regclass) THEN RAISE EXCEPTION 'PUBLIC_ACTIVATION_AUDIT'; END IF;
 INSERT INTO public.qr_stickers(id,public_id,visible_code,status,lifecycle_state) VALUES(q,fixture_public_id,code,'SOLD','SOLD');
 IF NOT EXISTS(SELECT 1 FROM public.qr_stickers WHERE (public_id=fixture_public_id OR visible_code=code) AND id=q) THEN RAISE EXCEPTION 'CANONICAL_LOOKUP_FAILED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.qr_stickers WHERE (public_id=lower(fixture_public_id) OR visible_code=code) AND id=q) THEN RAISE EXCEPTION 'VISIBLE_LOOKUP_FAILED'; END IF;
 INSERT INTO public.qr_activation_attempts(id,qr_id,user_id,outcome,failure_reason_code,request_fingerprint_hash,ip_hash,created_at) VALUES('att_'||gen_random_uuid()::text,q,NULL,'INVALID_SECRET','HASH_MISMATCH',NULL,replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''),now());
 IF (SELECT count(*) FROM public.qr_activation_attempts WHERE qr_id=q AND created_at>=CURRENT_TIMESTAMP-(900 * INTERVAL '1 second'))<>1 THEN RAISE EXCEPTION 'ATTEMPT_WINDOW_FAILED'; END IF;
 INSERT INTO public.qr_activation_challenges(id,challenge_token_hash,qr_id,public_id,user_id,proof_verified_at,expires_at,created_at) VALUES(challenge,token,q,fixture_public_id,NULL,now(),now()+interval '15 minutes',now());
 IF NOT EXISTS(SELECT 1 FROM public.qr_activation_challenges WHERE challenge_token_hash=token AND consumed_at IS NULL AND expires_at>CURRENT_TIMESTAMP AND public_id=fixture_public_id) THEN RAISE EXCEPTION 'CHALLENGE_LOOKUP_FAILED'; END IF;
 UPDATE public.qr_activation_challenges SET expires_at=now()-interval '1 second' WHERE id=challenge;
 IF EXISTS(SELECT 1 FROM public.qr_activation_challenges WHERE challenge_token_hash=token AND consumed_at IS NULL AND expires_at>CURRENT_TIMESTAMP) THEN RAISE EXCEPTION 'EXPIRED_CHALLENGE_ACCEPTED'; END IF;
 IF (SELECT status FROM public.qr_stickers WHERE id=q)<>'SOLD' THEN RAISE EXCEPTION 'PROOF_ACTIVATED_STICKER'; END IF;
 END; $checks$;
 RAISE EXCEPTION 'ACTIVATION_BACKEND_PREVIEW_PASSED'; EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'ACTIVATION_BACKEND_PREVIEW_PASSED' THEN RAISE; END IF; END; END; $preview$;`);
if (JSON.stringify(await sql(baseline)) !== JSON.stringify(before))
  throw Error("Activation verification rollback changed existing records");
console.log(
  "Canonical lookup, private audit writes, PostgreSQL challenge expiry and attempt window checks passed; all fixtures rolled back.",
);
