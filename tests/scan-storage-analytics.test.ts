import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {geoMercator,geoPath} from 'd3-geo';
import {canonicalSearch,defaultFilters,parseFilters} from '../apps/customer/features/analytics/filters';
import {csvCell,storageCsv} from '../apps/customer/features/analytics/csv';
import {analyticsOptions} from '../apps/customer/features/analytics/queries';
import {INDIA_REGIONS} from '../apps/customer/features/analytics/scan-model';
const now=new Date('2026-10-10T10:00:00Z');
describe('Independent analytics scopes',()=>{
 it('keeps storage filters out of scan keys and scan filters out of storage keys',()=>{const f=defaultFilters(now);expect(canonicalSearch('scan-flow',f)).toBe(canonicalSearch('scan-flow',{...f,file:'image/*',category:'INSURANCE',protection:'VAULT_PIN',documentActivity:'PREVIEW'}));expect(canonicalSearch('storage-history',f)).toBe(canonicalSearch('storage-history',{...f,state:'IN-AP',city:'Hyderabad',weekday:'0',hour:'0',outcome:'NOT_FOUND',qr:'q'}));expect(canonicalSearch('scan-rhythm',f)).not.toBe(canonicalSearch('scan-rhythm',{...f,weekday:'0',hour:'0'}));});
 it.each(['hour=24','weekday=7','state=IN-ZZ','city='+ 'x'.repeat(121),'file=text/html','validity=anything','protection=PUBLIC'])('rejects unsupported filter %s',s=>expect(()=>parseFilters(new URLSearchParams(s),now)).toThrow());
 it('preserves zero hour and Monday in keys',()=>{const f=parseFilters(new URLSearchParams('hour=0&weekday=0&state=IN-TG'),now);expect(canonicalSearch('scan-calendar',f)).toContain('hour=0');expect(f.weekday).toBe('0');});
 it('never keeps previous-account chart data as a placeholder',()=>{const options=analyticsOptions('new:session','scan-summary',defaultFilters(now));const placeholder=options.placeholderData as (data:unknown,query:{queryKey:unknown[]})=>unknown;const old={scope:'old:session',data:{}};expect(placeholder(old,{queryKey:['customer-analytics','old:session']})).toBeUndefined();expect(placeholder(old,{queryKey:['customer-analytics','new:session']})).toBe(old);});
});
describe('CSV export safety',()=>{
 it.each(['=SUM(A1)',' +cmd','\t@evil','-1+evil','\r\n=cmd'])('neutralizes text formula %s',v=>expect(csvCell(v)).toBe('"\''+v+'"'));
 it('preserves numbers, quotes and line breaks without changing values',()=>{expect(csvCell(-3)).toBe('"-3"');expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');expect(storageCsv(['Title'],[['=x']])).toBe('\uFEFF"Title"\r\n"\'=x"\r\n');});
});
describe('Licensed geography asset',()=>{
 const manifest=JSON.parse(readFileSync('apps/customer/public/geo/india/manifest.json','utf8'));const raw=readFileSync('apps/customer/public'+manifest.asset,'utf8').trim();const geo=JSON.parse(raw);
 it('pins and verifies the simplified source asset',()=>{expect(createHash('sha256').update(raw).digest('hex')).toBe(manifest.checksum);expect(Buffer.byteLength(raw)).toBeLessThan(150000);expect(manifest.license).toBe('CC BY 2.5 India');expect(manifest.revision).toMatch(/^[a-f0-9]{40}$/);expect(geo.features).toHaveLength(36);});
 it.each([320,768,1440])('produces finite paths within a %s wide viewport',w=>{const p=geoPath(geoMercator().fitExtent([[8,8],[w-8,302]],geo));for(const f of geo.features){expect(INDIA_REGIONS[f.properties.code]).toBeTruthy();expect(p(f)).not.toMatch(/NaN|Infinity/);const [[x0,y0],[x1,y1]]=p.bounds(f);expect(x0).toBeGreaterThanOrEqual(7.9);expect(x1).toBeLessThanOrEqual(w-7.9);expect(y0).toBeGreaterThanOrEqual(7.9);expect(y1).toBeLessThanOrEqual(302.1);}});
 it('documents missing modern boundaries rather than inventing them',()=>{expect(geo.features.some((f:{properties:{code:string}})=>f.properties.code==='IN-LA')).toBe(false);expect(manifest.limitations.join(' ')).toContain('Ladakh');});
});
