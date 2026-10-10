import { readFileSync } from 'node:fs';
import { executeAdminSql } from './admin-service.mjs';
const root = Object.fromEntries(readFileSync('.env','utf8').split(/\r?\n/).filter(l=>/^\w+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^["']|["']$/g,'')];}));
console.log('schema', JSON.stringify(await executeAdminSql("SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('qr_scan_events','qr_assignments','emergency_contacts','users','service_entitlements') ORDER BY table_name,ordinal_position")));
console.log('functions', JSON.stringify(await executeAdminSql("SELECT proname FROM pg_proc WHERE proname IN ('claim_notification_batch','enqueue_notification_event','exec_sql')")));
for (const [service,url,headers] of [
 ['R2',`https://api.cloudflare.com/client/v4/accounts/${root.CLOUDFLARE_ACCOUNT_ID}/r2/buckets`,{Authorization:`Bearer ${root.CLOUDFLARE_API_TOKEN}`}],
 ['MSG91',`https://control.msg91.com/api/v5/whatsapp/get-template-client/${root.MSG91_WHATSAPP_NUMBER}?template_name=vhn_vehicle_report_v1&pagination=false`,{authkey:root.MSG91_AUTH_KEY}]
]) {try {const r=await fetch(url,{headers,signal:AbortSignal.timeout(15000)});const d=await r.json();console.log(service,r.status,JSON.stringify(service==='R2'?{success:d.success,buckets:d.result?.buckets?.map(b=>b.name)}:d));}catch{console.log(service,'unavailable');}}
try {const r=await fetch('https://supabase.com/changelog.md');const s=await r.text();console.log('changelog relevant lines',s.split('\n').filter(l=>/breaking.change|Postgres|RLS|Storage/i.test(l)).slice(0,12).join('\n'));}catch{console.log('changelog unavailable');}
