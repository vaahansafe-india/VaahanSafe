// Explicit owner-authorized provider test only. No QR/report/customer records are created.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
const recipient=process.argv.find(arg=>arg.startsWith('--to='))?.slice(5);
if(!recipient||!/^91[6-9]\d{9}$/.test(recipient))throw new Error('Supply an explicitly authorized Indian WhatsApp recipient using --to=91...');
const env=Object.fromEntries(readFileSync('.env','utf8').split(/\r?\n/).filter(l=>/^\w+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^["']|["']$/g,'')];}));
const built=await build({entryPoints:['packages/notifications/src/whatsapp/index.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {Msg91WhatsAppAdapter}=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const adapter=new Msg91WhatsAppAdapter(env.MSG91_AUTH_KEY,env.MSG91_WHATSAPP_NUMBER,env.MSG91_WHATSAPP_NAMESPACE);
const templateName='vhn_vehicle_emergency_report_v1';
const approval=await adapter.getTemplateApproval(templateName);
if(approval!=='APPROVED')throw new Error(`Demo not sent: template status ${approval}`);
const timestamp=new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date())+' IST';
const correlationId=`demo_${randomUUID()}`;
const options={recipientPhone:recipient,templateName,languageCode:'en',correlationId,templateParams:{
  1:'DEMO ONLY - no real vehicle',
  2:'DEMO TEST ONLY. There is no actual emergency and no action is required.',
  3:timestamp,
  4:'Demo only: GPS location was not shared.',
  5:'Demo preview: https://app.vaahansafe.com/scan-history . No report or photos were created for this test.',
}};
mkdirSync('output/msg91',{recursive:true});
const receiptPath=`output/msg91/${correlationId}.json`;
// Persist the attempt first so an interrupted process cannot tempt a blind resend.
writeFileSync(receiptPath,JSON.stringify({correlationId,templateName,recipient,attemptedAt:new Date().toISOString(),outcome:'ATTEMPTING',demo:true},null,2));
const result=await adapter.sendMessage(options);
writeFileSync(receiptPath,JSON.stringify({correlationId,templateName,recipient,attemptedAt:new Date().toISOString(),demo:true,result},null,2));
console.log(JSON.stringify({recipient,templateName,approval,result,receiptPath}));
if(!result.success)process.exitCode=1;
