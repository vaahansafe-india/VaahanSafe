import { readFileSync, readdirSync } from "node:fs";
import { executeAdminSql } from "./admin-service.mjs";
const file = readdirSync("supabase/migrations").find((f) =>
  /^\d{14}_customer_document_vault\.sql$/.test(f),
);
const source = readFileSync("supabase/migrations/" + file, "utf8");
const body = source.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, "");
const assertions = String.raw`
 DECLARE sid uuid; other_sid uuid; owner uuid; vehicle text; d uuid; account_doc uuid; v uuid; recovery_v uuid; r jsonb; lease uuid; h text; secret text; count_now integer; original_created timestamptz; action_name text;
 BEGIN
 SELECT s.id,s.user_id INTO sid,owner FROM public.sessions s WHERE public.vault_session_owner(s.id) IS NOT NULL LIMIT 1;
 IF sid IS NULL THEN RAISE EXCEPTION 'A real verified customer session is needed for verification'; END IF;
 -- Isolate PIN settings inside this rolled-back transaction, including accounts
 -- that have already configured a PIN in the actual customer application.
 UPDATE public.customer_vault_settings SET pin_verifier=NULL WHERE owner_user_id=owner;
 DELETE FROM public.customer_vault_unlocks WHERE session_id=sid;
 IF (public.vault_session_state(sid)->>'locked')::boolean THEN RAISE EXCEPTION 'Unconfigured vault incorrectly locked'; END IF;
 SELECT id INTO vehicle FROM public.vehicles WHERE user_id=owner::text AND deleted_at IS NULL AND status<>'DELETED' LIMIT 1;
 r:=public.vault_command(gen_random_uuid(),'lock'); IF r->>'error'<>'UNAUTHORIZED' THEN RAISE EXCEPTION 'Invalid session bypass'; END IF;
 r:=public.vault_command(sid,'detail',jsonb_build_object('id',gen_random_uuid())); IF r->>'error'<>'NOT_FOUND' THEN RAISE EXCEPTION 'Unknown document bypass'; END IF;
 h:=encode(sha256(gen_random_uuid()::text::bytea),'hex');
 r:=public.vault_command(sid,'upload',jsonb_build_object('category','OTHER','title','Rollback-only vault verification','vehicleId',vehicle,'mode','ACCOUNT','size',20,'mime','image/png','filename','verification.png','tokenHash',h));
 IF r->>'error' IS NOT NULL THEN RAISE EXCEPTION 'Upload reserve: %',r->>'error'; END IF; d:=(r->>'id')::uuid;v:=(r->>'versionId')::uuid;
 IF public.vault_projection(d) IS NOT NULL THEN RAISE EXCEPTION 'Premature ready projection'; END IF;
 r:=public.vault_transfer(h,'claim');lease:=(r->>'lease')::uuid;IF lease IS NULL THEN RAISE EXCEPTION 'Upload claim failed'; END IF;
 r:=public.vault_transfer(h,'claim');IF r->>'error'<>'UPLOAD_PENDING' THEN RAISE EXCEPTION 'Concurrent claim accepted'; END IF;
 r:=public.vault_transfer(h,'finish',jsonb_build_object('lease',lease,'size',21,'mime','image/png'));IF r->>'error'<>'INVALID_FILE' THEN RAISE EXCEPTION 'Size mismatch accepted'; END IF;
 r:=public.vault_transfer(h,'finish',jsonb_build_object('lease',lease,'size',20,'mime','image/png','checksum',repeat('a',64),'thumbnail',true));IF (r->>'ready')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'Finalize failed: %',r; END IF;
 r:=public.vault_transfer(h,'finish',jsonb_build_object('lease',lease,'size',20,'mime','image/png','checksum',repeat('a',64),'thumbnail',true));IF (r->>'ready')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'Finalize replay failed'; END IF;
 IF (SELECT count(*) FROM public.customer_document_events WHERE document_id=d AND event_type='Uploaded')<>1 THEN RAISE EXCEPTION 'Duplicate upload event'; END IF;
 r:=public.vault_command(sid,'detail',jsonb_build_object('id',d));IF r->'document' ? 'storage_key' OR r->'document' ? 'password_verifier' THEN RAISE EXCEPTION 'Unsafe detail'; END IF;
 h:=repeat('b',64);r:=public.vault_command(sid,'access',jsonb_build_object('id',d,'kind','preview','tokenHash',h));r:=public.vault_transfer(h,'read');IF r->>'key' IS NULL THEN RAISE EXCEPTION 'Authorized access failed'; END IF;
 PERFORM public.vault_command(sid,'lock');r:=public.vault_transfer(h,'read');IF r->>'error'<>'EXPIRED' THEN RAISE EXCEPTION 'Lock failed to revoke access'; END IF;
 h:=repeat('c',64);PERFORM public.vault_command(sid,'share',jsonb_build_object('id',d,'seconds',3600,'maxViews',1,'download',false,'tokenHash',h));
 r:=public.vault_share(h,'open',jsonb_build_object('previewHash',repeat('d',64),'downloadHash',repeat('e',64)));IF r->>'mime'<>'image/png' THEN RAISE EXCEPTION 'Share open failed: %',r; END IF;
 r:=public.vault_share(h,'open',jsonb_build_object('previewHash',repeat('f',64),'downloadHash',repeat('1',64)));IF r->>'error'<>'SHARE_UNAVAILABLE' THEN RAISE EXCEPTION 'Share view limit bypass'; END IF;
 IF EXISTS(SELECT 1 FROM public.customer_document_access WHERE token_hash=repeat('e',64)) THEN RAISE EXCEPTION 'Download restriction bypass'; END IF;
 r:=public.vault_transfer(repeat('d',64),'read');IF r->>'key' IS NULL THEN RAISE EXCEPTION 'Last permitted view denied'; END IF;
 UPDATE public.customer_document_shares SET revoked_at=now() WHERE document_id=d;
 r:=public.vault_transfer(repeat('d',64),'read');IF r->>'error'<>'EXPIRED' THEN RAISE EXCEPTION 'Revoked share access'; END IF;
 UPDATE public.customer_document_shares SET revoked_at=NULL,expires_at=now()-interval '1 second' WHERE document_id=d;
 r:=public.vault_share(repeat('c',64),'open',jsonb_build_object('previewHash',repeat('2',64),'downloadHash',repeat('3',64)));IF r->>'error'<>'SHARE_UNAVAILABLE' THEN RAISE EXCEPTION 'Expired share access'; END IF;
 -- Credentials below are verifier placeholders in rollback-only SQL, never application passwords.
 PERFORM public.vault_command(sid,'security',jsonb_build_object('id',d,'mode','DOCUMENT_PASSWORD','verifier','rollback-verifier'));
 IF public.vault_document_allowed(d,sid,true) THEN RAISE EXCEPTION 'Password protection bypass'; END IF;
 FOR count_now IN 1..5 LOOP r:=public.vault_command(sid,'secret',jsonb_build_object('scope',d::text)); END LOOP;
 r:=public.vault_command(sid,'secret',jsonb_build_object('scope',d::text));IF r->>'error'<>'RATE_LIMIT' THEN RAISE EXCEPTION 'Password rate limit bypass'; END IF;
 r:=public.vault_command(sid,'unlock',jsonb_build_object('scope',d::text,'verifier','rollback-verifier'));
 IF NOT public.vault_document_allowed(d,sid,true) THEN RAISE EXCEPTION 'Password unlock failed: %',r; END IF;
 -- Successful share opens must not accumulate failed-password attempts.
 secret:=repeat('7',64);PERFORM public.vault_command(sid,'share',jsonb_build_object('id',d,'seconds',3600,'maxViews',20,'download',false,'tokenHash',secret));
 FOR count_now IN 1..7 LOOP
  r:=public.vault_share(secret,'secret');IF r->>'error' IS NOT NULL THEN RAISE EXCEPTION 'Plain share throttled'; END IF;
  r:=public.vault_share(secret,'open',jsonb_build_object('previewHash',encode(sha256(gen_random_uuid()::text::bytea),'hex')));IF r->>'mime'<>'image/png' THEN RAISE EXCEPTION 'Plain share open failed'; END IF;
 END LOOP;
 secret:=repeat('8',64);PERFORM public.vault_command(sid,'share',jsonb_build_object('id',d,'seconds',3600,'maxViews',20,'download',false,'tokenHash',secret,'verifier','rollback-share-verifier'));
 FOR count_now IN 1..7 LOOP
  r:=public.vault_share(secret,'secret');IF r->>'error' IS NOT NULL THEN RAISE EXCEPTION 'Successful passcode attempts throttled'; END IF;
  r:=public.vault_share(secret,'open',jsonb_build_object('previewHash',encode(sha256(gen_random_uuid()::text::bytea),'hex'),'verifier','rollback-share-verifier'));IF r->>'mime'<>'image/png' THEN RAISE EXCEPTION 'Passcode share open failed'; END IF;
 END LOOP;
 FOR count_now IN 1..5 LOOP r:=public.vault_share(secret,'secret'); END LOOP;
 r:=public.vault_share(secret,'secret');IF r->>'error'<>'RATE_LIMIT' THEN RAISE EXCEPTION 'Share guessing limit bypass'; END IF;
 -- Real customer settings/session changes here are confined to this rollback transaction.
 h:=encode(sha256(gen_random_uuid()::text::bytea),'hex');
 r:=public.vault_command(sid,'upload',jsonb_build_object('category','OTHER','title','Rollback account protection verification','mode','ACCOUNT','size',20,'mime','image/png','filename','verification.png','tokenHash',h));
 account_doc:=(r->>'id')::uuid;
 IF account_doc IS NULL THEN RAISE EXCEPTION 'Account file reserve failed'; END IF;
 r:=public.vault_transfer(h,'claim');lease:=(r->>'lease')::uuid;
 r:=public.vault_transfer(h,'finish',jsonb_build_object('lease',lease,'size',20,'mime','image/png','checksum',repeat('a',64),'thumbnail',true));
 IF (r->>'ready')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'Account file finalization failed'; END IF;
 UPDATE public.customer_vault_settings SET pin_verifier=NULL WHERE owner_user_id=owner;
 PERFORM public.vault_command(sid,'configure_pin',jsonb_build_object('verifier','rollback-pin-verifier','minutes',5));
 IF (public.vault_session_state(sid)->>'locked')::boolean IS NOT TRUE OR public.vault_document_allowed(account_doc,sid,true) THEN RAISE EXCEPTION 'Configured PIN failed to protect ACCOUNT file'; END IF;
 IF NOT public.vault_document_allowed(account_doc,sid,false) THEN RAISE EXCEPTION 'Locked metadata unavailable'; END IF;
 FOREACH action_name IN ARRAY ARRAY['access','share','edit','security','delete','revoke'] LOOP
  r:=public.vault_command(sid,action_name,jsonb_build_object('id',account_doc,'kind','preview','tokenHash',repeat('9',64)));
  IF r->>'error'<>'LOCKED' OR r->>'scope'<>'vault' THEN RAISE EXCEPTION 'Global lock bypass: %',action_name; END IF;
 END LOOP;
 r:=public.vault_command(sid,'upload',jsonb_build_object('mode','ACCOUNT'));
 IF r->>'error'<>'LOCKED' OR r->>'scope'<>'vault' THEN RAISE EXCEPTION 'Locked upload accepted'; END IF;
 r:=public.vault_thumbnail_grants(sid,jsonb_build_array(jsonb_build_object('id',account_doc,'hash',repeat('9',64))));
 IF jsonb_array_length(r)<>0 THEN RAISE EXCEPTION 'Locked thumbnail accepted'; END IF;
 SELECT created_at INTO original_created FROM public.sessions WHERE id=sid;
 UPDATE public.sessions SET created_at=now()-interval '1 day' WHERE id=sid;
 r:=public.vault_command(sid,'configure_pin',jsonb_build_object('verifier','reset-verifier','minutes',5));IF r->>'error'<>'REVERIFY' THEN RAISE EXCEPTION 'PIN reset bypass'; END IF;
 UPDATE public.sessions SET created_at=original_created WHERE id=sid;
 PERFORM public.vault_command(sid,'unlock',jsonb_build_object('scope','vault','verifier','rollback-pin-verifier'));
 IF (public.vault_session_state(sid)->>'locked')::boolean OR public.vault_session_state(sid)->>'unlockExpiresAt' IS NULL THEN RAISE EXCEPTION 'Authoritative unlock state missing'; END IF;
 IF NOT public.vault_document_allowed(account_doc,sid,true) OR public.vault_document_allowed(d,sid,true) THEN RAISE EXCEPTION 'Vault PIN bypassed document password'; END IF;
 r:=public.vault_command(sid,'access',jsonb_build_object('id',d,'kind','preview','tokenHash',repeat('9',64)));
 IF r->>'error'<>'LOCKED' OR r->>'scope'<>d::text THEN RAISE EXCEPTION 'Additional document password scope missing'; END IF;
 PERFORM public.vault_command(sid,'unlock',jsonb_build_object('scope',d::text,'verifier','rollback-verifier'));
 r:=public.vault_command(sid,'security',jsonb_build_object('id',d,'mode','VAULT_PIN'));IF r->>'error' IS NOT NULL THEN RAISE EXCEPTION 'Security update failed: %',r->>'error'; END IF;
 h:=repeat('9',64);PERFORM public.vault_command(sid,'access',jsonb_build_object('id',account_doc,'kind','preview','tokenHash',h));
 PERFORM public.vault_command(sid,'lock');
 r:=public.vault_transfer(h,'read');IF r->>'error'<>'EXPIRED' THEN RAISE EXCEPTION 'Lock retained pre-existing file grant'; END IF;
 r:=public.vault_command(sid,'access',jsonb_build_object('id',account_doc,'kind','download','tokenHash',h));
 IF r->>'error'<>'LOCKED' OR public.vault_document_allowed(account_doc,sid,true) THEN RAISE EXCEPTION 'ACCOUNT file reopened after lock'; END IF;
 IF public.vault_document_allowed(d,sid,true) THEN RAISE EXCEPTION 'Vault PIN bypass'; END IF;
 r:=public.vault_command(sid,'unlock',jsonb_build_object('scope','vault','verifier','wrong-verifier'));IF r->>'error'<>'INCORRECT_PASSWORD' THEN RAISE EXCEPTION 'PIN mismatch accepted'; END IF;
 PERFORM public.vault_command(sid,'unlock',jsonb_build_object('scope','vault','verifier','rollback-pin-verifier'));
 IF NOT public.vault_document_allowed(d,sid,true) THEN RAISE EXCEPTION 'Vault PIN unlock failed'; END IF;
 h:=repeat('9',64);PERFORM public.vault_command(sid,'access',jsonb_build_object('id',account_doc,'kind','preview','tokenHash',h));
 UPDATE public.customer_vault_unlocks SET expires_at=now()-interval '1 second' WHERE session_id=sid AND scope='vault';
 r:=public.vault_transfer(h,'read');IF r->>'error'<>'LOCKED' THEN RAISE EXCEPTION 'Worker read bypassed automatic lock expiry'; END IF;
 IF (public.vault_session_state(sid)->>'locked')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'Expired unlock state still unlocked'; END IF;
 PERFORM public.vault_command(sid,'unlock',jsonb_build_object('scope','vault','verifier','rollback-pin-verifier'));
 h:=repeat('4',64);PERFORM public.vault_command(sid,'access',jsonb_build_object('id',d,'kind','preview','tokenHash',h));
 UPDATE public.sessions SET revoked_at=now() WHERE id=sid;
 r:=public.vault_transfer(h,'read');IF r->>'error'<>'LOCKED' THEN RAISE EXCEPTION 'Revoked session access'; END IF;
 UPDATE public.sessions SET revoked_at=NULL WHERE id=sid;
 IF vehicle IS NOT NULL THEN
  UPDATE public.vehicles SET deleted_at=now() WHERE id=vehicle;
  r:=public.vault_transfer(h,'read');IF r->>'error'<>'LOCKED' THEN RAISE EXCEPTION 'Deleted vehicle access'; END IF;
  UPDATE public.vehicles SET deleted_at=NULL WHERE id=vehicle;
 END IF;
 -- Replacement preserves the current file and serializes pending versions.
 h:=repeat('5',64);r:=public.vault_command(sid,'upload',jsonb_build_object('documentId',d,'size',20,'mime','image/png','filename','replacement.png','tokenHash',h));recovery_v:=(r->>'versionId')::uuid;
 IF recovery_v IS NULL OR (SELECT current_version FROM public.customer_documents WHERE id=d)<>1 THEN RAISE EXCEPTION 'Replacement changed current file early'; END IF;
 r:=public.vault_command(sid,'upload',jsonb_build_object('documentId',d,'size',20,'mime','image/png','filename','replacement.png','tokenHash',repeat('6',64)));IF r->>'error'<>'UPLOAD_PENDING' THEN RAISE EXCEPTION 'Concurrent replacement accepted'; END IF;
 r:=public.vault_transfer(h,'claim');lease:=(r->>'lease')::uuid;
 PERFORM public.vault_fail_upload(h,gen_random_uuid());IF (SELECT status FROM public.customer_document_versions WHERE id=recovery_v)<>'UPLOADING' THEN RAISE EXCEPTION 'Wrong recovery lease accepted'; END IF;
 PERFORM public.vault_fail_upload(h,lease);IF (SELECT status FROM public.customer_document_versions WHERE id=recovery_v)<>'FAILED' THEN RAISE EXCEPTION 'Recovery lease failed'; END IF;
 PERFORM public.vault_cleanup(recovery_v);
 PERFORM public.vault_command(sid,'delete',jsonb_build_object('id',d));
 IF public.vault_document_allowed(d,sid,true) THEN RAISE EXCEPTION 'Deleted document access'; END IF;
 PERFORM public.vault_cleanup(v);
 IF (SELECT status FROM public.customer_document_versions WHERE id=v)<>'PURGED' THEN RAISE EXCEPTION 'Cleanup not finalized'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname LIKE 'customer_%' AND c.relname IN ('customer_documents','customer_document_versions','customer_document_security','customer_document_shares','customer_document_access','customer_document_events','customer_vault_unlocks','customer_vault_settings','customer_vault_usage','customer_vault_policy') AND (NOT c.relrowsecurity OR has_table_privilege('anon',c.oid,'SELECT') OR has_table_privilege('authenticated',c.oid,'SELECT'))) THEN RAISE EXCEPTION 'Browser table grants'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc WHERE proname LIKE 'vault_%' AND (has_function_privilege('anon',oid,'EXECUTE') OR has_function_privilege('authenticated',oid,'EXECUTE'))) THEN RAISE EXCEPTION 'Browser RPC grants'; END IF;
 END;
`;
const pending = process.argv
  .find((arg) => arg.startsWith("--pending="))
  ?.slice(10);
if (pending && !/^\d{14}_customer_document_vault_[a-z_]+\.sql$/.test(pending))
  throw new Error("Select a vault migration only.");
const pendingSql = pending
  ? readFileSync("supabase/migrations/" + pending, "utf8")
      .replace(/^BEGIN;\s*/, "")
      .replace(/COMMIT;\s*$/, "")
  : "";
const setup = (process.argv.includes("--existing") ? "" : body) + pendingSql;
try {
  await executeAdminSql(
    `DO $verify_document_vault$ BEGIN BEGIN ${setup} ${assertions} RAISE EXCEPTION 'VAULT_VERIFIED_ROLLBACK'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'VAULT_VERIFIED_ROLLBACK' THEN RAISE; END IF; END; END $verify_document_vault$;`,
  );
} catch (error) {
  // Diagnostic contains only schema/function errors and synthetic verification values, no customer rows.
  const { adminService } = await import("./admin-service.mjs");
  const { data, error: err } = await adminService().rpc("exec_sql", {
    p_sql: `DO $verify_document_vault$ BEGIN BEGIN ${setup} ${assertions} RAISE EXCEPTION 'VAULT_VERIFIED_ROLLBACK'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'VAULT_VERIFIED_ROLLBACK' THEN RAISE; END IF; END; END $verify_document_vault$;`,
  });
  console.log({ code: err?.code, message: err?.message || data?.error });
  throw error;
}
console.log(
  "Verified real PostgreSQL rollback-only: upload claim/finalize/replay, replacement recovery, size validation, PIN/password protection, fresh sign-in reset, session/vehicle revocation, locking, share expiry/limits/revocation/download restriction, password rate limits, cleanup accounting and server-only RLS. No customer documents persisted.",
);
