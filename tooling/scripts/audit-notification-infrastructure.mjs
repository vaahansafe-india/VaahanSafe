import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).filter(l => /^[A-Z0-9_]+=/.test(l)).map(l => {
  const index = l.indexOf('='); return [l.slice(0,index), l.slice(index+1).replace(/^["']|["']$/g,'')];
}));
const base = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}`;
const headers = {Authorization:`Bearer ${env.CLOUDFLARE_API_TOKEN}`, 'Content-Type':'application/json'};
console.log('Configuration', Object.fromEntries(['MSG91_AUTH_KEY','MSG91_OTP_TEMPLATE_ID','MSG91_WHATSAPP_NUMBER','MSG91_WHATSAPP_NAMESPACE','SMTP_USER','SMTP_PASS','CLOUDFLARE_API_TOKEN'].map(k=>[k,!!env[k]])));
for (const path of ['/workers/subdomain','/workers/scripts','/queues']) {
 const response = await fetch(base+path,{headers}); const data=await response.json();
 console.log(path, JSON.stringify({httpStatus:response.status,success:data.success,result:data.success ? (Array.isArray(data.result) ? data.result.map(r=>({id:r.id,queue_name:r.queue_name,consumers:r.consumers})) : data.result):undefined,errorCodes:data.errors?.map(e=>e.code)}));
}
const queries=[
 'SELECT name FROM sqlite_master WHERE type = \'table\' ORDER BY name',
 'SELECT COUNT(*) AS count FROM users',
 'SELECT status,template_key,COUNT(*) AS count FROM notification_intents GROUP BY status,template_key',
 'SELECT channel,status,COUNT(*) AS count FROM notification_deliveries GROUP BY channel,status',
];
for(const sql of queries){const response=await fetch(`${base}/d1/database/${env.CLOUDFLARE_D1_DATABASE_ID}/query`,{method:'POST',headers,body:JSON.stringify({sql})});const data=await response.json();console.log('D1',JSON.stringify({sql,success:data.success,results:data.success?data.result?.[0]?.results:undefined,errorCodes:data.errors?.map(e=>e.code)}));}
