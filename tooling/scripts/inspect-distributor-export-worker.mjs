import nextEnv from '@next/env';
nextEnv.loadEnvConfig('apps/admin',true);
const root=`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}`;
async function get(path){const r=await fetch(root+path,{headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`},signal:AbortSignal.timeout(15000)});const j=await r.json();if(!r.ok||!j.success)throw new Error(`Cloudflare inspection failed: ${r.status} ${j.errors?.map(e=>e.code).join(',')}`);return j.result;}
const settings=await get('/workers/scripts/vaahansafe-admin-exports/settings');
console.log('Configured account Worker bindings:',JSON.stringify(settings.bindings.map(b=>({name:b.name,type:b.type,bucket:b.bucket_name}))));
const versions=await get('/workers/scripts/vaahansafe-admin-exports/versions');
console.log('Latest Worker version:',versions.items?.[0]?.id);
const bucket=await get('/r2/buckets/vaahansafe-prod-exports');
console.log('Configured export bucket:',bucket.name,'created:',bucket.creation_date);
