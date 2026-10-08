import { executeAdminSql } from './admin-service.mjs';
import {readFileSync} from 'node:fs';
const envNames=readFileSync('.env','utf8').split(/\r?\n/).filter(l=>/^\w+=/.test(l)).map(l=>l.slice(0,l.indexOf('=')));
console.log('Deployment credential names',envNames.filter(k=>/SUPABASE.*(TOKEN|PASSWORD)|SSH|HOSTINGER|VERCEL/.test(k)));
for(const sql of [
 "SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('notification_intents','notification_deliveries','notification_delivery_attempts','users','auth_identities','auth_otp_requests','shipments','subscriptions','replacement_requests','admin_support_tickets') ORDER BY table_name,ordinal_position",
 "SELECT status,template_key,count(*) FROM public.notification_intents GROUP BY status,template_key",
 "SELECT channel,status,count(*) FROM public.notification_deliveries GROUP BY channel,status",
 "SELECT extname FROM pg_extension WHERE extname IN ('pg_cron','pg_net','supabase_vault')",
 "SELECT has_function_privilege('anon','public.exec_sql(text)','EXECUTE') AS anon_sql,has_function_privilege('authenticated','public.exec_sql(text)','EXECUTE') AS authenticated_sql",
]) console.log(JSON.stringify(await executeAdminSql(sql)));
for(const sql of [
 "SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('payments','orders','payment_webhook_events','qr_assignments','qr_stickers','vehicles','qr_scan_events','plans','service_entitlements','sticker_replacements') ORDER BY table_name,ordinal_position",
 "SELECT table_name,pg_get_constraintdef(oid) AS definition FROM (SELECT c.oid,r.relname AS table_name FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid WHERE r.relname IN ('notification_intents','notifications','notification_deliveries','orders','payments')) t",
]) console.log(JSON.stringify(await executeAdminSql(sql)));
