import fs from 'node:fs/promises';
import nextEnv from '@next/env';
import {execFileSync} from 'node:child_process';
nextEnv.loadEnvConfig('apps/admin',true);
const base=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
async function sql(p_sql){const r=await fetch(`${base}/rest/v1/rpc/exec_sql`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p_sql}),signal:AbortSignal.timeout(30000)});const b=await r.json();if(!r.ok||b?.error)throw Error('Replacement query inspection failed');return b;}
const reads=await sql(`SELECT public.admin_replacement_summary((SELECT s.id FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN') ORDER BY s.created_at DESC LIMIT 1)) summary`);
const cli=process.env.SUPABASE_CLI_PATH||'C:/Users/hp/AppData/Local/npm-cache/_npx/0e23c24576954b26/node_modules/@supabase/cli-windows-x64/bin/supabase.exe';
const output=execFileSync(cli,['db','query','--linked','--output-format','json',`EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id,reference_code,status,risk_level,stage FROM public.admin_replacement_projection ORDER BY requested_at DESC,id DESC LIMIT 51`],{encoding:'utf8',timeout:30000,windowsHide:true});
const plan=JSON.parse(output).rows;
const result={summary:reads[0].summary,plan:plan[0]['QUERY PLAN'],scope:'Current real dataset only; no synthetic scale or browser performance claim'};
await fs.writeFile('output/replacement-query-inspection.json',JSON.stringify(result,null,2));console.log(JSON.stringify({summary:result.summary,queryPlanSaved:true,realDataset:true}));
