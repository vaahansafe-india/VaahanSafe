// Versioned administrative reference data, never a business-state database.
import fs from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run = promisify(execFile);
const origin = 'https://igod.gov.in';
const fetchPage = async path => {
  const {stdout} = await run('curl.exe',['--fail','--silent','--show-error','--max-time','30','-H','X-Requested-With: XMLHttpRequest','-e',origin+path.replace(/organizations_more.*/, 'organizations'),origin + path],{maxBuffer:4*1024*1024});
  return stdout;
};
const html = await fetchPage('/sg/district/states');
const text = value => value.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const states = [...html.matchAll(/href="https:\/\/igod.gov.in\/sg\/([A-Z]{2})\/E042\/organizations">([^<]+)<\/a>/g)].map(m=>({code:m[1],name:text(m[2])}));
if(states.length!==36) throw new Error('Incomplete government state directory');
const districts = [];
// Bound downloads; no runtime dependency on the government website.
for(let index=0;index<states.length;index+=4) {
  await Promise.all(states.slice(index,index+4).map(async state=>{
    const first = await fetchPage(`/sg/${state.code}/E042/organizations`);
    const count=Number(first.match(/(\d+) Results/)?.[1]);
    let page=first;
    for(let offset=25;offset<count;offset+=5) page += await fetchPage(`/sg/${state.code}/E042/organizations_more/${offset}/${Math.min(5,count-offset)}`);
    const rows = page.split(/<div class="search-row[^\"]*">/).slice(1);
    const extracted = rows.map(row=>{
      const title=row.match(/class="search-title"[^>]*>([\s\S]*?)<\/(?:a|span|h\d)>/);
      const id=row.match(/\/district\/([A-Za-z0-9_-]+)\/sub_districts/);
      if(!title || !id) throw new Error(`Unrecognized district markup: ${state.code}`);
      return {code:id[1],state_code:state.code,name:text(title[1])};
    });
    if(!count || extracted.length!==count) {await fs.writeFile(`tooling/scripts/.geography-${state.code}.html`,page);throw new Error(`Incomplete district directory: ${state.code} ${extracted.length}/${count}`);}
    districts.push(...extracted);
    console.log(state.code,extracted.length);
  }));
}
districts.sort((a,b)=>a.state_code.localeCompare(b.state_code)||a.name.localeCompare(b.name));
if(new Set(districts.map(d=>d.code)).size!==districts.length) throw new Error('Duplicate official district identifiers');
await fs.mkdir('apps/admin/features/distributors/geography',{recursive:true});
await fs.writeFile('apps/admin/features/geography/india-directory.json',JSON.stringify({source:origin+'/sg/district/states',version:new Date().toISOString().slice(0,10),identifierSystem:'IGOD directory identifiers (not LGD codes)',states,districts},null,2)+'\n');
console.log('Saved canonical directory:',states.length,'states;',districts.length,'districts');
