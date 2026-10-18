// Requests one real private report for the existing signed-in operator. This
// checks the configured scheduled export pipeline; no stock records are changed.
import fs from "node:fs/promises";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig("apps/admin",true);
const base=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers={apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"};
const response=await fetch(`${base}/rest/v1/rpc/exec_sql`,{method:"POST",headers,body:JSON.stringify({p_sql:`SELECT public.admin_request_reconciliation_export((SELECT s.id FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN') ORDER BY s.created_at DESC LIMIT 1),'{}'::jsonb,NULL,gen_random_uuid()) AS id`})});
const result=await response.json();if(!response.ok||!result[0]?.id)throw Error("A real authenticated admin session is required to verify exports.");
const id=result[0].id;await fs.writeFile("output/reconciliation-export-check.json",JSON.stringify({id,status:"QUEUED"}));console.log(JSON.stringify({id,status:"QUEUED",destination:"existing private R2 exports bucket"}));
for(let attempt=0;attempt<24;attempt++){
 const statusResponse=await fetch(`${base}/rest/v1/admin_export_jobs?id=eq.${id}&select=id,status,row_count,object_key`,{headers});const jobs=await statusResponse.json();const job=jobs[0];
 if(job?.status==='FAILED')throw Error("The configured export worker failed to generate this report.");
 if(job?.status==='READY'){
  const objectResponse=await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${process.env.CLOUDFLARE_R2_EXPORTS_BUCKET}/objects/${job.object_key.split('/').map(encodeURIComponent).join('/')}`,{headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`}});
  if(!objectResponse.ok)throw Error(`Private export retrieval failed: ${objectResponse.status}`);const csv=await objectResponse.text();
  const columns=csv.split('\r\n')[0];if(!columns.includes('custodian_name')||!columns.includes('outcome')||columns.includes('partner_id'))throw Error("Unexpected reconciliation report projection");
  const check={id,status:job.status,rows:job.row_count,namedCustodians:true,separateOutcome:true,privateRetrieval:true};await fs.writeFile("output/reconciliation-export-check.json",JSON.stringify(check,null,2));console.log(JSON.stringify(check));process.exit(0);
 }
 await new Promise(resolve=>setTimeout(resolve,5000));
}
throw Error("The private report is still pending; inspect Reports before requesting another.");
