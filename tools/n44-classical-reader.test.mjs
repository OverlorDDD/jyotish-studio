import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {N44_CLASSICAL_SOURCES,N44_CLASSICAL_RULESET_VERSION,extractN44Evidence} from '../apps/api/src/reader-classical-n44.ts';
import {READER_V8_VERSION,buildClassicalReaderV8,compactClassicalReaderV8ForAi} from '../apps/api/src/reader-v8.ts';
import {buildDetailedReport} from '../apps/api/src/report.ts';
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const birth={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
function fixture(seed=0){
 const mock={ayanamsa:23.8,ascendant:12.713+seed*9,julianDay:2451545,backend:'N44_SYNTHETIC_CASE',
  positions:names.map((name,i)=>({name,longitude:(i*36.17+11+seed*(19.23+i*.41))%360,speed:.1}))};
 const chart=calculateChart(birth,mock);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',digest:seed.toString(16).padStart(64,'a'),
  checks:['SYNTHETIC_ONLY'],externalReferenceChecked:false};
 return {...chart,verification,n4:makeN4RcPayload(chart,verification)};
}
test('Every N44 book rule has a real local, bounded OCR anchor and candid review status',()=>{
 assert.ok(N44_CLASSICAL_SOURCES.length>=7);
 const ids=new Set();
 for(const source of N44_CLASSICAL_SOURCES){
  assert.ok(!ids.has(source.id));ids.add(source.id);
  const raw=readFileSync(join(root,source.path),'utf8');
  const lines=raw.split(/\r?\n/);
  assert.ok(source.startLine>=1&&source.endLine<lines.length);
  const excerpt=lines.slice(source.startLine-1,source.endLine).join(' ');
  const norm=s=>s.replace(/\s+/gu,' ').trim().toLocaleLowerCase();
  assert.ok(norm(excerpt).includes(norm(source.anchor)),
   'OCR source anchor not found: '+source.id+' '+JSON.stringify(source.anchor));
  assert.match(source.review,/ocr_excerpt_checked/);
  assert.ok(source.edition&&source.stanza&&source.chapter);
 }
 assert.ok([...ids].includes('BJ-X-1')&&[...ids].includes('LP-I-SUBPERIOD'));
});
test('Classical Reader 8 combines source-bound, multilingual evidence for 15 divisions and never D60',()=>{
 for(let seed=0;seed<6;seed++){
  const chart=fixture(seed),uk=buildClassicalReaderV8(chart,'uk','2026-11-07');
  const en=buildClassicalReaderV8(chart,'en','2026-11-07');
  assert.equal(uk.version,READER_V8_VERSION);
  assert.equal(uk.editorialVersion,'n48-poetic-evidence-1.0.0');
  assert.equal(uk.ruleSetVersion,N44_CLASSICAL_RULESET_VERSION);
  assert.equal(uk.status,'available');assert.equal(en.status,'available');
  assert.equal(uk.insights.length,15);assert.equal(en.insights.length,15);
  assert.equal(uk.highlights.length,3);
  assert.deepEqual(uk.insights.map(i=>i.division),[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45]);
  for(const i of uk.insights){
   assert.ok(i.headline.length>45&&i.strength.length>75&&i.challenge.length>75);
   assert.ok(i.context.length>95&&i.step.length>38);
   assert.ok(i.proof.some(x=>x.includes('D1.house-lord.')));
   assert.ok(i.proof.some(x=>x.startsWith('D'+i.division+'.')));
   assert.ok(i.sources.every(x=>N44_CLASSICAL_SOURCES.some(src=>src.id===x.id)));
   assert.equal(new Set(i.ruleIds).size,i.ruleIds.length);
   assert.doesNotMatch(i.strength+i.challenge+i.context+i.step,/накшатра|антардаша|йогакарака/iu);
  }
  assert.ok(!uk.insights.some(i=>i.division===60));
  assert.match(uk.d60Notice,/D60/);
  assert.ok(en.insights.every(i=>!(/накшатра|антардаша/iu.test(i.headline))));
  const report=buildDetailedReport(chart,'uk','2026-11-07');
  assert.equal(report.readerV8.version,READER_V8_VERSION);
  assert.equal(report.readerV7.status,'available','older consumer remains compatible');
  assert.equal(report.editorial.chapters.length,8,'preserve Reader v6 long chapters');
 }
});
test('Classical signals use genuine D1 facts and D9 vocation, never invented D60 or current event',()=>{
 const chart=fixture(1);
 const career=extractN44Evidence(chart,10,'2026-11-07');
 const nav=career.find(s=>s.ruleId==='BJ-X-1-NAVAMSA-VOCATION');
 assert.ok(nav,'Brihat Jataka X/1 career rule should activate');
 assert.ok(nav.facts.some(x=>x.startsWith('D9.')));
 assert.equal(nav.application,'direct_natal');
 assert.ok(career.every(s=>N44_CLASSICAL_SOURCES.some(x=>x.id===s.sourceId)));
 assert.deepEqual(extractN44Evidence(chart,60,'2026-11-07'),[]);
 const prompt=compactClassicalReaderV8ForAi(chart,'2026-11-07');
 assert.ok(prompt.includes('D27')&&prompt.includes('D10'));
 assert.ok(prompt.length<=6500);
 assert.doesNotMatch(prompt,/2000-01-01|latitude|longitude|D60\.Mars\.house/);
});
test('Two different horoscopes produce distinct classical synthesis not just a single shared template',()=>{
 const versions=Array.from({length:12},(_,i)=>buildClassicalReaderV8(fixture(i),'en','2026-11-07'));
 const signature=r=>[2,9,10,24,27,30].map(n=>{const x=r.insights.find(y=>y.division===n);return x.headline+'|'+x.context+'|'+x.strength;}).join(';');
 assert.ok(new Set(versions.map(signature)).size>=8,'8/12 different multi-factor signatures');
 const career=new Set(versions.map(r=>r.insights.find(i=>i.division===10).context));
 assert.ok(career.size>=4,'distinct professional context from classical rules');
});
test('Unverified source, fake digest and unsupported D60 all fail closed',()=>{
 const v=fixture();
 const invalids=[
  {...v,n4:undefined},
  {...v,n4:{...v.n4,sourceDigest:'f'.repeat(64)}},
  {...v,n4:{...v.n4,d60Excluded:false}}
 ];
 for(const item of invalids){
  const report=buildClassicalReaderV8(item,'en','2026-11-07');
  assert.equal(report.status,'unavailable');assert.equal(report.insights.length,0);
  assert.equal(extractN44Evidence(item,10,'2026-11-07').length,0);
 }
});
