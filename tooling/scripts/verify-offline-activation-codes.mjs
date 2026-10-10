// Read-only verification. Never prints private activation codes or database hashes.
import fs from 'node:fs';
import crypto from 'node:crypto';
import ts from 'typescript';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig('apps/admin', true);
const reference=process.argv[2] || 'B001';
if(!/^B\d{3}$/.test(reference)) throw new Error('Invalid batch reference');
async function sourceModule(path) {
  const compiled=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}
const {decryptActivationManifest}=await sourceModule('packages/qr/src/secrets/encrypted-manifest.ts');
const {hashScratchSecret}=await sourceModule('packages/qr/src/secrets/hash-secret.ts');
const base=process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
async function query(sql) {
  const r=await fetch(`${base}/rest/v1/rpc/exec_sql`,{method:'POST',headers:{'Content-Type':'application/json',apikey:serviceKey,Authorization:`Bearer ${serviceKey}`},body:JSON.stringify({p_sql:sql}),signal:AbortSignal.timeout(15000)});
  if(!r.ok) throw new Error(`Database verification unavailable (${r.status})`);
  return r.json();
}
const [metadata]=await query(`SELECT e.*,b.reference_code FROM public.qr_batch_activation_exports e JOIN public.qr_batches b ON b.id=e.batch_id WHERE b.reference_code='${reference}'`);
if(!metadata) throw new Error('Activation packaging archive not yet registered');
const stickers=await query(`SELECT s.id,s.public_id,s.visible_code,s.status,s.lifecycle_state,s.activation_secret_hash,
  s.user_id IS NULL AND s.vehicle_id IS NULL AND s.activated_at IS NULL AS unactivated,
  sec.secret_hash,sec.hash_version,sec.consumed_at FROM public.qr_stickers s JOIN public.qr_activation_secrets sec ON sec.qr_id=s.id
  WHERE s.batch_id='${metadata.batch_id.replaceAll("'","''")}'`);
const r2Base=`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${metadata.bucket_name}`;
async function r2(path) {
  const r=await fetch(`${r2Base}${path}`,{headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`},signal:AbortSignal.timeout(15000)});
  if(!r.ok) throw new Error(`Private archive verification unavailable (${r.status})`);
  return r;
}
const managed=await (await r2('/domains/managed')).json();
const custom=await (await r2('/domains/custom')).json();
const privateBucket=managed.success && managed.result.enabled===false && custom.success && custom.result.domains.length===0;
const encoded=metadata.object_key.split('/').map(encodeURIComponent).join('/');
const encrypted=await (await r2(`/objects/${encoded}`)).text();
const checksumMatches=crypto.createHash('sha256').update(encrypted).digest('hex')===metadata.ciphertext_sha256;
const manifest=JSON.parse(await decryptActivationManifest(encrypted,process.env.ACTIVATION_EXPORT_ENCRYPTION_KEY_V1,metadata.batch_id));
const byId=new Map(stickers.map(s=>[s.id,s]));
const codes=new Set(),serials=new Set();
let verified=0;
for(const entry of manifest.entries) {
  const s=byId.get(entry.qrId);
  if(!s || !s.unactivated || s.status!=='INVENTORY' || s.lifecycle_state!=='INVENTORY' || s.consumed_at ||
    s.hash_version!=='v1' || s.activation_secret_hash!==s.secret_hash || s.public_id!==entry.publicId || s.visible_code!==entry.vaahanSafeId ||
    !/^[A-Z2-9]{16}$/.test(entry.activationCode) || !/^B\d{3}-\d{4}$/.test(entry.serial) || codes.has(entry.activationCode) || serials.has(entry.serial))
    throw new Error('Private code-to-sticker verification failed');
  const expected=await hashScratchSecret(entry.activationCode,s.secret_hash.split(':')[0],s.hash_version);
  const expectedBytes=Buffer.from(expected.secretHash),storedBytes=Buffer.from(s.secret_hash);
  if(expectedBytes.length!==storedBytes.length || !crypto.timingSafeEqual(expectedBytes,storedBytes)) throw new Error('Activation code verification failed');
  codes.add(entry.activationCode);serials.add(entry.serial);verified++;
}
const [permissions]=await query(`SELECT
  has_column_privilege('anon','public.qr_stickers','activation_secret_hash','SELECT') AS anon_hash_access,
  has_column_privilege('authenticated','public.qr_stickers','activation_secret_hash','SELECT') AS customer_hash_access,
  has_table_privilege('anon','public.qr_activation_secrets','SELECT') AS anon_secret_access,
  has_table_privilege('authenticated','public.qr_activation_secrets','SELECT') AS customer_secret_access,
  has_table_privilege('anon','public.qr_batch_activation_exports','SELECT') AS anon_export_access,
  has_table_privilege('authenticated','public.qr_batch_activation_exports','SELECT') AS customer_export_access`);
const [security]=await query(`SELECT c.relrowsecurity AND NOT EXISTS (
  SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename='qr_activation_secrets'
  AND p.cmd IN ('SELECT','ALL') AND p.roles && ARRAY['public','anon','authenticated']::name[]
 ) AS secret_rls_denies_customers FROM pg_class c WHERE c.oid='public.qr_activation_secrets'::regclass`);
const secretReadsDenied=(!permissions.anon_secret_access && !permissions.customer_secret_access) || security.secret_rls_denies_customers;
const publicAccessDenied=secretReadsDenied && !permissions.anon_hash_access && !permissions.customer_hash_access && !permissions.anon_export_access && !permissions.customer_export_access;
const [activity]=await query(`SELECT
 (SELECT count(*) FROM public.qr_assignments a JOIN public.qr_stickers s ON s.id=a.qr_id WHERE s.batch_id='${metadata.batch_id}') AS assignments,
 (SELECT count(*) FROM public.service_entitlements e JOIN public.qr_stickers s ON s.id=e.qr_sticker_id WHERE s.batch_id='${metadata.batch_id}') AS entitlements,
 (SELECT count(*) FROM public.admin_audit_logs WHERE resource_id='${metadata.batch_id}' AND action='PROVISION_OFFLINE_ACTIVATION_CODES') AS provisioning_audits`);
const safe=privateBucket && checksumMatches && verified===metadata.code_count && verified===stickers.length && publicAccessDenied && Number(activity.assignments)===0 && Number(activity.entitlements)===0 && Number(activity.provisioning_audits)===1;
console.log(JSON.stringify({safe,batch:reference,verifiedCodes:verified,uniqueCodes:codes.size,allUnactivated:stickers.every(s=>s.unactivated),privateBucket,encryptedArchiveChecksumMatches:checksumMatches,publicAndCustomerAccessDenied:publicAccessDenied,activity},null,2));
if(!safe) process.exitCode=1;
