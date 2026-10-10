import nextEnv from '@next/env';
nextEnv.loadEnvConfig('apps/admin', true);
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sql = `SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('admin_partners','admin_stock_transfers','admin_stock_reconciliations','qr_stickers','admin_export_jobs') ORDER BY table_name,ordinal_position`;
try {
  const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p_sql:sql}),signal:AbortSignal.timeout(12000)});
  const data = await response.json();
  console.log(JSON.stringify({status:response.status,data:response.ok?data:{code:data.code}},null,2));
} catch(error) { console.error('Schema audit unavailable:',error.name,error.cause?.code); process.exitCode=1; }
