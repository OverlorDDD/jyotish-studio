import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';
import {N46_EDITORIAL_VERSION,renderN45Narrative} from '../apps/api/src/reader-editorial-n45.ts';

const bodies=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const birth={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
function fixture(seed=0){
 const eph={ayanamsa:23.8,ascendant:12.123+seed*11.07,julianDay:2451545,
  backend:'N46_EDITORIAL_SYNTHETIC_ONLY',
  positions:bodies.map((name,i)=>({name,longitude:(12+i*35.3+seed*(17.41+i*.11))%360,speed:.1}))};
 const base=calculateChart(birth,eph);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',digest:String(seed.toString(16)).padStart(64,'a'),
  checks:['SYNTHETIC_QA_ONLY'],externalReferenceChecked:false};
 return {...base,verification,n4:makeN4RcPayload(base,verification)};
}
test('Reader portraits are visibly balanced, source-bound and have three distinct thematic highlights',()=>{
 for(let seed=0;seed<15;seed++){
  const chart=fixture(seed);
  for(const lang of ['uk','en']){
   const report=buildClassicalReaderV8(chart,lang,'2026-11-08');
   assert.equal(report.editorialVersion,N46_EDITORIAL_VERSION);
   assert.equal(report.status,'available');
   assert.equal(report.insights.length,15);
   assert.equal(new Set(report.highlights.map(h=>h.division)).size,3,'do not duplicate D10 in the top three');
   assert.equal(report.highlights.find(h=>h.id==='career').division,10);
   for(const insight of report.insights){
    const words=[insight.headline,insight.strength,insight.context,insight.challenge,insight.step].join(' ');
    assert.ok(insight.strength.length>125,'a meaningful strong side D'+insight.division);
    assert.ok(insight.challenge.length>115,'a meaningful shadow D'+insight.division);
    assert.ok(insight.context.length>110,'a concrete human situation D'+insight.division);
    assert.ok(insight.step.length>38,'a specific next step D'+insight.division);
    assert.doesNotMatch(words,/Підстава: тематична карта|Based on chart|Класичне правило застосовано|управитель лагни|D60.*карм/iu);
    assert.ok(insight.proof.some(v=>v.startsWith('D1.')));
    assert.ok(insight.proof.some(v=>v.startsWith('D'+insight.division+'.')));
   }
   assert.ok(!report.insights.some(x=>x.division===60));
  }
 }
});
test('Historical support and friction change the actual human narrative, not just hidden metadata',()=>{
 const proof=['D1.house-lord.10=Mars','D1.Mars.house=5','D10.Mars.house=10','D10.Saturn.house=6'];
 const base={division:10,title:'Робота',proof,contrast:false,complement:false,directCareer:true,timeSensitive:false};
 for(const lang of ['uk','en']){
  const positive=renderN45Narrative({...base,support:true,friction:false},lang);
  const challenging=renderN45Narrative({...base,support:false,friction:true},lang);
  const mixed=renderN45Narrative({...base,support:true,friction:true},lang);
  assert.notEqual(positive.strength,challenging.strength);
  assert.notEqual(positive.challenge,challenging.challenge);
  assert.notEqual(mixed.challenge,positive.challenge);
  assert.notEqual(challenging.highlight,mixed.highlight);
  assert.notEqual(positive.step,mixed.step,'a challenging placement should motivate a second specific practice');
  for(const output of [positive,challenging,mixed]){
   assert.ok(output.strength.includes(lang==='uk'?'результат':'results'));
   assert.ok(output.challenge.length>120);
   assert.doesNotMatch(output.headline+output.strength+output.challenge,/всі вас люблять|король гори|гарантоване багатство|guaranteed riches/iu);
  }
 }
});
test('Solar System illustration explicitly keeps Sun central, 8 ordered solar orbits and a Moon bound to Earth',()=>{
 const file=readFileSync(fileURLToPath(new URL('../apps/web/app/components/NatalSkyLayers.tsx',import.meta.url)),'utf8');
 const kinds=[...file.matchAll(/\{kind:'(mercury|venus|earth|mars|jupiter|saturn|uranus|neptune)',eccentricity:(\d+\.\d+),name:'[^']+',radius:(\d+)/g)];
 assert.deepEqual(kinds.map(m=>m[1]),['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']);
 const radii=kinds.map(m=>Number(m[3]));
 const eccentricities=kinds.map(m=>Number(m[2]));
 assert.ok(eccentricities.every(e=>e>0&&e<.3),'Sun lies at the focus of noncircular orbital ellipses');
 assert.ok(radii.every((r,i)=>i===0||r>radii[i-1]),'correct orbital order');
 assert.match(file,/SUN:Body=\{kind:'sun',name:'SUN',x:CX,y:CY/);
 assert.match(file,/const moon:Body=\{kind:'moon'/);
 assert.match(file,/x:earth\.x\+27\*Math\.cos\(phase\)/);
 assert.match(file,/periodSeconds:18/);
 assert.match(file,/m\.elapsed\+=dt\/1000/);
 assert.match(file,/data-orbit-model="heliocentric-schematic"/);
 assert.match(file,/not to scale or date-specific/i);
});
