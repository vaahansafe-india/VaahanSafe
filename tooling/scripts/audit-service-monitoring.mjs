import { readFileSync } from "node:fs";
const parse = path => Object.fromEntries(readFileSync(path,"utf8").split(/\r?\n/).filter(line => /^\w+=/.test(line)).map(line => { const index=line.indexOf("="); return [line.slice(0,index),line.slice(index+1).replace(/^["']|["']$/g,"")]; }));
const root=parse(".env"), customer={...root,...parse("apps/customer/.env.production")};
const account=root.CLOUDFLARE_ACCOUNT_ID, token=root.CLOUDFLARE_API_TOKEN;
async function cf(path, body) {
  const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`,{method:body?"POST":"GET",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
  const d=await r.json(); if(!d.success) throw Error(`Cloudflare audit failed (${r.status})`);return d.result;
}
async function sql(query) {
  const r=await fetch(`${customer.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,{method:"POST",headers:{apikey:customer.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${customer.SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({p_sql:query}),signal:AbortSignal.timeout(20000)});
  const d=await r.json(); if(!r.ok||d?.error)throw Error(`Supabase audit failed (${r.status})`);return d;
}
if (process.argv.includes("--notification-readiness")) {
 for (const [label,query] of [
  ["Provider acceptance", "SELECT channel,status,count(*) AS deliveries,count(provider_message_id) AS provider_accepted FROM public.notification_deliveries GROUP BY channel,status ORDER BY channel,status"],
  ["Recent delivery attempts", "SELECT d.channel,a.result,a.normalized_error_code,count(*) AS attempts,count(a.provider_reference) AS accepted,max(a.finished_at) AS latest FROM public.notification_delivery_attempts a JOIN public.notification_deliveries d ON d.id=a.delivery_id GROUP BY d.channel,a.result,a.normalized_error_code ORDER BY d.channel,a.result"],
  ["Outbox states", "SELECT status,count(*) AS intents FROM public.notification_intents GROUP BY status"],
  ["Scheduler", "SELECT j.active,(SELECT max(start_time) FROM cron.job_run_details r WHERE r.jobid=j.jobid AND r.status='succeeded') AS last_success FROM cron.job j WHERE j.jobname='vaahansafe-notification-drain'"],
 ]) console.log(label, await sql(query));
 const {default:nodemailer}=await import("nodemailer");
 if (!customer.SMTP_USER || !customer.SMTP_PASS) throw Error("SMTP configuration missing");
 const port=Number(customer.SMTP_PORT)||587;
 const smtp=nodemailer.createTransport({host:customer.SMTP_HOST||"smtp.gmail.com",port,secure:port===465,
  auth:{user:customer.SMTP_USER,pass:customer.SMTP_PASS},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:10000,logger:false,debug:false});
 try {console.log("SMTP connection and authentication",{ready:await smtp.verify(),messageSent:false});}
 catch {console.log("SMTP connection and authentication",{ready:false,messageSent:false});process.exitCode=1;}
 finally {smtp.close();}
 process.exit(process.exitCode||0);
}
if (process.argv.includes("--pipeline")) {
 for (const [label,query] of [
  ["Webhook states", "SELECT processing_status,count(*),min(received_at) AS oldest,max(received_at) AS latest FROM payment_webhook_events GROUP BY processing_status"],
  ["Pending notification ages", "SELECT channel,status,count(*),min(updated_at) AS oldest,max(updated_at) AS latest FROM notification_deliveries WHERE status<>'DELIVERED' GROUP BY channel,status"],
  ["Delivery failure categories", "SELECT channel,status,last_failure_code,count(*) FROM notification_deliveries WHERE status IN ('FAILED_PERMANENT','DEAD_LETTERED','FAILED_RETRYABLE') GROUP BY channel,status,last_failure_code"],
  ["Scheduler response schema", "SELECT table_schema,table_name,column_name FROM information_schema.columns WHERE table_schema='net' AND table_name IN ('_http_response','http_request_queue') ORDER BY table_name,ordinal_position"],
 ]) console.log(label, await sql(query));
 process.exit(0);
}
console.log("Runtime configuration",{provider:customer.PAYMENT_PROVIDER,mode:customer.RAZORPAY_MODE,dispatchEnabled:customer.NOTIFICATION_DISPATCH_ENABLED,paymentKeyConfigured:!!customer.RAZORPAY_KEY_ID,paymentWebhookConfigured:!!customer.RAZORPAY_WEBHOOK_SECRET,notificationProviderConfigured:!!customer.MSG91_AUTH_KEY,notificationCallbackConfigured:!!customer.MSG91_WEBHOOK_SECRET});
const subdomain=await cf("/workers/subdomain");
console.log("Monitor host",`https://vaahansafe-supabase-keepalive.${subdomain.subdomain}.workers.dev`);
const settings=await cf("/workers/scripts/vaahansafe-supabase-keepalive/settings");
console.log("Monitor bindings",settings.bindings?.map(b=>({name:b.name,type:b.type,...(b.name.startsWith("STATUS_")&&b.type==="plain_text"?{value:b.text}:{})})));
console.log("Monitor schedule",await cf("/workers/scripts/vaahansafe-supabase-keepalive/schedules"));
const statusQueries=[
  "SELECT s.slug,s.current_state,max(p.checked_at) AS last_checked,count(p.checked_at) AS checks FROM status_services s LEFT JOIN status_probe_samples p ON p.service_id=s.id AND p.checked_at>datetime('now','-1 day') GROUP BY s.slug,s.current_state ORDER BY s.slug",
  "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'status_%' ORDER BY name",
];
for(const query of statusQueries)console.log("D1 status",(await cf(`/d1/database/${root.CLOUDFLARE_D1_DATABASE_ID}/query`,{sql:query}))[0].results);
for(const [label,query] of [
  ["Columns","SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('payment_webhook_events','payments','orders','notification_intents','notification_deliveries') ORDER BY table_name,ordinal_position"],
  ["Scheduler","SELECT j.jobname,j.active,j.schedule,(SELECT max(start_time) FROM cron.job_run_details r WHERE r.jobid=j.jobid) AS last_run FROM cron.job j WHERE j.jobname='vaahansafe-notification-drain'"],
  ["Scheduler responses","SELECT status_code,count(*) FROM net._http_response WHERE created>now()-interval '30 minutes' GROUP BY status_code"],
  ["Notification states","SELECT status,count(*) FROM public.notification_intents GROUP BY status"],
  ["Delivery states","SELECT channel,status,count(*) FROM public.notification_deliveries GROUP BY channel,status"],
]) {try{console.log(label,await sql(query));}catch(e){console.log(label,e.message);}}
for(const url of ["https://status.vaahansafe.com/api/status","https://app.vaahansafe.com/api/webhooks/razorpay","https://app.vaahansafe.com/api/webhooks/msg91"]){
  try{const r=await fetch(url,{method:url.includes("webhooks")?"HEAD":"GET",redirect:"manual",signal:AbortSignal.timeout(15000)});const d=url.includes("/api/status")&&r.ok?await r.json():null;console.log("Public endpoint",{url,status:r.status,services:d?.services?.map(s=>({slug:s.slug,state:s.state,probeStatus:s.probeStatus})),heartbeat:d?.databaseHeartbeat?.status});}catch{console.log("Public endpoint",{url,status:"unreachable"});}
}
if(customer.PAYMENT_PROVIDER==='razorpay'){
 const r=await fetch("https://api.razorpay.com/v1/orders?count=1",{headers:{Authorization:`Basic ${btoa(`${customer.RAZORPAY_KEY_ID}:${customer.RAZORPAY_KEY_SECRET}`)}`},signal:AbortSignal.timeout(15000)});
 console.log("Razorpay read-only authentication",{http:r.status,mode:customer.RAZORPAY_MODE});await r.body?.cancel();
}
for(const name of ["vhn_qr_scan_notice_v2","vhn_vehicle_emergency_report_v1"]){
 const r=await fetch(`https://control.msg91.com/api/v5/whatsapp/get-template-client/${customer.MSG91_WHATSAPP_NUMBER}?template_name=${name}&pagination=false`,{headers:{authkey:customer.MSG91_AUTH_KEY},signal:AbortSignal.timeout(15000)});
 const language=name==='vhn_qr_scan_notice_v2'?'en_US':'en';
 const d=await r.json();console.log("MSG91 template read",{name,http:r.status,approved:d.status==='success'&&Array.isArray(d.data)&&d.data.some(t=>t.name===name&&t.namespace===customer.MSG91_WHATSAPP_NAMESPACE&&t.languages?.some(l=>l.language===language&&l.status?.toUpperCase()==='APPROVED'&&!l.is_disabled))});
}
