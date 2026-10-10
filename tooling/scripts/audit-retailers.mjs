import nextEnv from '@next/env';
nextEnv.loadEnvConfig('apps/admin',true);
const query=`SELECT jsonb_build_object(
'counts',(SELECT jsonb_object_agg(kind,n) FROM(SELECT kind,count(*) AS n FROM public.admin_partners GROUP BY kind)x),
'indexes',(SELECT jsonb_agg(jsonb_build_object('table',tablename,'definition',indexdef)) FROM pg_indexes WHERE schemaname='public' AND tablename IN ('admin_partners','qr_stickers','admin_stock_transfer_items','admin_stock_transfers','admin_stock_reconciliations')),
'enums',(SELECT jsonb_agg(jsonb_build_object('type',t.typname,'value',e.enumlabel)) FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname IN ('qr_lifecycle_state','qr_status')),
'activation_functions',(SELECT jsonb_agg(jsonb_build_object('name',proname,'definition',pg_get_functiondef(p.oid))) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname IN ('claim_retail_qr','activate_retail_qr','inventory_admin_actor')),
'stock',(SELECT jsonb_agg(jsonb_build_object('status',status,'channel',inventory_channel,'count',n)) FROM(SELECT q.status,b.inventory_channel,count(*) AS n FROM public.qr_stickers q LEFT JOIN public.qr_batches b ON b.id=q.batch_id GROUP BY q.status,b.inventory_channel)x)) AS audit`;
const r=await fetch(`${process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,{method:'POST',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({p_sql:query}),signal:AbortSignal.timeout(15000)});
const data=await r.json();if(!r.ok)throw new Error(`Schema audit failed: ${data.code}`);console.log(JSON.stringify(data,null,2));
