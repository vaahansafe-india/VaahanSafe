import {spawn} from 'node:child_process';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig('apps/admin',true);
const values={SUPABASE_URL:process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY};
if(Object.values(values).some(v=>!v))throw new Error('Configured server database environment is missing.');
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','secret','bulk','--config','infrastructure/cloudflare/workers/admin-exports/wrangler.toml'],{env:process.env,stdio:['pipe','pipe','pipe'],windowsHide:true});
let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
child.stdin.end(JSON.stringify(values));
const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
if(code!==0){for(const value of Object.values(values))output=output.replaceAll(value,'[redacted]');throw new Error(`Worker secret configuration failed (${code}): ${output}`);}
console.log('Configured the existing server database URL and service credential on the approved Cloudflare export Worker. Secret values were not written to files or output.');
