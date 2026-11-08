import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';
const text=(p)=>readFileSync(fileURLToPath(new URL('../'+p,import.meta.url)),'utf8');
const bodies=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function chart(seed){
 const input={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
 const eph={ayanamsa:23.8,ascendant:7.1+seed*11.18,julianDay:2451545,
  backend:'N48_SYNTHETIC_ONLY',
  positions:bodies.map((name,i)=>({name,longitude:(11+i*35.2+seed*(16.41+i*.12))%360,speed:.1}))};
 const result=calculateChart(input,eph);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:seed.toString(16).padStart(64,'a'),checks:['SYNTHETIC_QA_ONLY'],externalReferenceChecked:false};
 return {...result,verification,n4:makeN4RcPayload(result,verification),
  n4D60:makeN4D60Candidate(result,verification)};
}
test('N4.8 synthesis is complete, individual and no longer copies or character-clips life story text',()=>{
 const data=[];
 for(let seed=1;seed<=18;seed++){
  for(const lang of ['uk','en']){
   const report=buildClassicalReaderV8(chart(seed),lang,'2026-11-08');
   assert.equal(report.status,'available');
   assert.equal(report.editorialVersion,'n48-poetic-evidence-1.0.0');
   assert.equal(report.synthesis.version,'n48-evidence-poetic-v1');
   for(const paragraph of [report.synthesis.opening,report.synthesis.strength,report.synthesis.challenge,report.synthesis.direction,...report.highlights.map(x=>x.text)]){
    assert.ok(paragraph.length>85);
    assert.match(paragraph.trim(),/[.!?]$/,'paragraph must end on a complete sentence');
    assert.doesNotMatch(paragraph,/Запишіть один вимірюваний результат|Скажіть близькій людині одну важливу потребу|Write down one measurable result|Tell someone one important need/iu);
    assert.doesNotMatch(paragraph,/[;:]\s*$/,'no dangling punctuation');
   }
   assert.equal(new Set(report.highlights.map(h=>h.division)).size,3);
   assert.ok(report.d60Preview.title&&!/перевірити|verify/i.test(report.d60Preview.title));
   data.push(report.synthesis.opening);
  }
 }
 assert.ok(new Set(data).size>=25,'natal configurations must lead to genuinely different portraits');
 assert.doesNotMatch(text('apps/api/src/reader-synthesis-n47.ts'),/const clip\s*=/,'no arbitrary character limit on synthesis prose');
});
test('N4.8 restrained atlas has all major planets, subtle orbit speeds, no bottom caption and preserved reduced-motion UX',()=>{
 const hero=text('apps/web/app/components/NatalSkyLayers.tsx');
 for(const duration of [420,600,840,1140,1880,2800,3500,4600])assert.ok(hero.includes('periodSeconds:'+duration));
 assert.ok(hero.includes('ctx.translate(px*8,py*6)'));
 assert.ok(hero.includes('prefers-reduced-motion: reduce'));
 assert.ok(hero.includes('BODY_NAMES'));
 assert.doesNotMatch(hero,/<figcaption|className=\{styles.caption\}/);
 assert.ok(hero.includes('D60')===false,'Hero is illustration, not a misleading natal calculation');
});
