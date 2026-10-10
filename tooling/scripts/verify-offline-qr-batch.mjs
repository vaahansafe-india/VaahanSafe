import fs from 'node:fs';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig('apps/admin', true);
const source = process.argv[2];
if (!source) throw new Error('CSV path is required');
const rows = fs.readFileSync(source, 'utf8').trim().split(/\r?\n/).slice(1).map(line => line.split(','));
const reference = rows[0][0].split('-')[0];
if (!/^B\d{3}$/.test(reference)) throw new Error('Invalid batch reference');
const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function query(sql) {
  const r = await fetch(`${base}/rest/v1/rpc/exec_sql`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({ p_sql: sql }), signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`Verification unavailable (${r.status})`);
  return r.json();
}
const stickers = await query(`SELECT s.public_id,s.visible_code,s.status,s.lifecycle_state,
  s.user_id IS NULL AND s.vehicle_id IS NULL AND s.activated_at IS NULL AND s.activation_secret_hash IS NULL AS unclaimed
  FROM public.qr_stickers s JOIN public.qr_batches b ON b.id=s.batch_id WHERE b.reference_code='${reference}'`);
const summary = await query(`SELECT b.reference_code,b.quantity,b.inventory_channel,
 (SELECT count(*) FROM public.qr_assignments a JOIN public.qr_stickers s ON s.id=a.qr_id WHERE s.batch_id=b.id) AS assignments,
 (SELECT count(*) FROM public.service_entitlements e JOIN public.qr_stickers s ON s.id=e.qr_sticker_id WHERE s.batch_id=b.id) AS entitlements,
 (SELECT count(*) FROM public.qr_activation_secrets e JOIN public.qr_stickers s ON s.id=e.qr_id WHERE s.batch_id=b.id) AS secrets,
 (SELECT count(*) FROM public.qr_status_history h JOIN public.qr_stickers s ON s.id=h.qr_id WHERE s.batch_id=b.id AND h.reason_code='OFFLINE_BATCH_IMPORT') AS history,
 (SELECT count(*) FROM public.admin_audit_logs l WHERE l.resource_id=b.id AND l.action='IMPORT_OFFLINE_QR_BATCH') AS audits
 FROM public.qr_batches b WHERE b.reference_code='${reference}'`);
const found = new Map(stickers.map(s => [s.visible_code,s]));
const exact = found.size === rows.length && rows.every(r => {
  const s=found.get(r[1]);
  return s && s.public_id===r[1].slice(3) && s.status==='INVENTORY' && s.lifecycle_state==='INVENTORY' && s.unclaimed;
});
const s=summary[0];
const safe = exact && s?.inventory_channel==='OFFLINE_RETAIL' && s.quantity===rows.length &&
  Number(s.assignments)===0 && Number(s.entitlements)===0 && Number(s.secrets)===0 &&
  Number(s.history)===rows.length && Number(s.audits)===1;
console.log(JSON.stringify({ safe, exactSourceMatch: exact, rows: stickers.length, summary: s }, null, 2));
if (!safe) process.exitCode=1;
