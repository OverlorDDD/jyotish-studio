/** Human-readable, safe GitHub Actions summary. Reads only pre-sanitized G3.2 reports. */
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const read=(name)=>{try{return JSON.parse(readFileSync('artifacts/'+name+'.json','utf8'))}
 catch{return null;}};
const finite=n=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('en-US'):'unknown';
const metric=n=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(1)+'%':'unknown';
const safe=s=>String(s||'unknown').replace(/[\r\n|<>]/g,' ').slice(0,150);
export function reportMarkdown(health,search,content){
 const totals=search?.propertyTotals||{},access=search?.access||'unknown';
 const summary=health?.summary||{};
 const rows=[
  '# Galaxiora · Organic Search Intelligence',
  '',
  '> Daily automated evidence · read-only · no private search phrases or natal details',
  '',
  '| Signal | Observed | Meaning |',
  '|:--|--:|:--|',
  '| SEO health | '+finite(summary.errors)+' errors | Canonical, hreflang, robots, safe public pages |',
  '| Search Console access | '+safe(access)+' | Verified means service-account property access confirmed |',
  '| Finalized property impressions | '+finite(totals.impressions)+' | Site-wide, not summed from query rows |',
  '| Finalized property clicks | '+finite(totals.clicks)+' | Clicks from Google Search, not GA4 sessions |',
  '| Search CTR | '+(typeof totals.ctr==='number'?metric(totals.ctr*100):'unknown')+' | Interpret only with enough volume |',
  '| Reporting period | '+safe(search?.period)+' | Google Pacific dates, finalized observations |',
  '',
  '## Three tool entrypoints',
  '',
  '| Tool | Impressions | Clicks | Decision |',
  '|:--|--:|--:|:--|'
 ];
 for(const topic of ['jyotish','panchanga','tarot']){
  const data=search?.opportunities?.find(o=>o.id===topic);
  rows.push('| '+topic+' | '+finite(data?.impressions)+' | '+finite(data?.clicks)+
   ' | '+safe(data?.decision)+' |');
 }
 rows.push('','**Evidence caveats:** Query/page rows are incomplete and may be anonymized. '+
  'Unknown ≠ zero; the daily total is a separate API aggregation. No automatic indexing submission, content publication or spending.');
 if(access!=='verified_read_only')
  rows.push('','**Connection blocker:** '+safe(search?.blocker||'Service account needs read-only permission on sc-domain:galaxiora.com'));
 if(Array.isArray(content?.assets))
  rows.push('','**Original content:** '+content.assets.length+' reviewed tool bridges; no new generated doorway pages.');
 return rows.join('\n')+'\n';
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const summary=reportMarkdown(read('health'),read('search'),read('content'));
 const dest=process.env.GITHUB_STEP_SUMMARY;
 if(dest)writeFileSync(dest,summary,{flag:'a'});
 else process.stdout.write(summary);
}
