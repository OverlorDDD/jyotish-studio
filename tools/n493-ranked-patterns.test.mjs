import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {dignityFor} from '../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable} from '../apps/api/src/reader-classical.ts';
import {rankN493Patterns} from '../apps/api/src/reader-patterns-n493.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';

const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function fixture(seed,ascendant=null){
 const input={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
 const eph={ayanamsa:23.8,ascendant:ascendant??((10.713+seed*13.37)%360),julianDay:2451545,
  backend:'SYNTHETIC_TEST_ONLY',
  positions:names.map((name,i)=>({name,longitude:(11+i*35.2+seed*(16.41+i*.13))%360,speed:.1}))};
 const base=calculateChart(input,eph);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:seed.toString(16).padStart(64,'a'),checks:['SYNTHETIC_TEST_ONLY'],externalReferenceChecked:false};
 return {...base,verification,n4:makeN4RcPayload(base,verification),
  n4D60:makeN4D60Candidate(base,verification)};
}
test('100 synthetic readings: rank 3–5 distinct, evidenced patterns; never interpret unconfirmed D60 as top finding',()=>{
 const textOut=['# N4.9.3 — full generated Ukrainian and English quality evidence',
  '100 synthetic, invented birth vectors. Not evidence for predictive truth or independently calibrated confidence.'];
 const fingerprints={uk:new Set(),en:new Set()};
 const categorySets={uk:new Set(),en:new Set()};
 for(let seed=1;seed<=50;seed++){
  const chart=fixture(seed);
  for(const lang of ['uk','en']){
   const ranked=rankN493Patterns(chart,lang),report=buildClassicalReaderV8(chart,lang,'2026-11-09');
   assert.equal(report.status,'available');
   assert.equal(report.meaningful.patternVersion,'n493-ranked-multifactor-v1');
   assert.deepEqual(report.meaningful.topInsights,ranked);
   assert.ok(ranked.length>=3&&ranked.length<=5);
   assert.equal(new Set(ranked.map(p=>p.id)).size,ranked.length);
   assert.deepEqual([...ranked].sort((a,b)=>b.score-a.score).map(p=>p.id),ranked.map(p=>p.id));
   categorySets[lang].add(ranked.map(p=>p.id).join(','));
   for(const pattern of ranked){
    assert.ok(pattern.evidence.length>=2,pattern.id+' lacking evidence');
    assert.ok(pattern.reading.length>=65&&pattern.reading.length<1500,pattern.id+' missing or excessively long');
    assert.ok(pattern.implication.length>=45&&pattern.implication.length<320);
    assert.equal(pattern.divisions.includes(60),false);
    assert.ok(pattern.score<=100&&pattern.score>=20);
    assert.ok(['prominent','contextual','requires-review'].includes(pattern.tier));
    assert.doesNotMatch(pattern.reading+' '+pattern.implication,/судилося|гарантовано|100%|statistically proven|you will marry|you are destined/i);
    if(lang==='en')assert.doesNotMatch(pattern.reading,/[А-Яа-яІіЇїЄєҐґ]/u);
    if(lang==='uk')assert.doesNotMatch(pattern.reading+' '+pattern.implication,/управителя Меркурій|управителя Венера|та дому та|  +/u,'no broken Ukrainian cases or double spaces');
    for(const fact of pattern.evidence){
     const m=/^D(1|2|9|10|24)\.([A-Za-z]+)\.(sign|house)=(\d+)$/.exec(fact);
     if(!m||m[2]==='ascendant')continue;
     const d=Number(m[1]),p=m[2],key=m[3],n=Number(m[4]);
     const source=d===1?chart.d1:chart.n4.charts.find(x=>x.division===d).planets;
     assert.equal(source.find(x=>x.name===p)?.[key],n,seed+'/'+lang+'/'+fact);
    }
   }
   assert.equal(report.meaningful.cards.length,16);
   assert.equal(report.meaningful.cards.at(-1).division,60);
   assert.ok(report.meaningful.summary.proof.length>=3);
   const summary=report.meaningful.summary;
   const summarySentences=Object.values(summary).filter(x=>typeof x==='string')
     .join(' ').split(/(?<=[.!?])\s+/u).map(x=>x.trim()).filter(x=>x.length>55);
   assert.equal(summarySentences.length,new Set(summarySentences).size,
     'full synthesis repeats identical sentences instead of combining factors: '+seed+'/'+lang);
   for(const field of ['strength','attention','direction']){
    assert.ok(summary[field].length>=85&&summary[field].length<=1000,field+' '+lang+' '+seed);
    assert.doesNotMatch(summary[field],/між грошей|обидва ракурси повторюють|one planetary concentration/i);
    if(lang==='uk')assert.doesNotMatch(summary[field],/керує \d+-м домами|D10 підкреслює (?:спільних|праці)|та дому та/u,'native speaker case scan');
   }
   const fp=ranked.map(p=>p.reading).join(' ');
   fingerprints[lang].add(fp);
   textOut.push('\n## Synthetic vector '+seed+' · '+lang+' · Lagna '+chart.ascendant.sign,
    ...ranked.map(p=>'### '+p.id+' — '+p.title+'\n'+p.reading+'\n'+p.implication+'\n'+p.evidence.join(' · ')),
    '\n#### Whole-chart synthesis\n'+summary.strength+'\n'+summary.attention+'\n'+summary.direction,
    '\n#### 16 cards\n'+report.meaningful.cards.map(p=>'D'+p.division+' '+p.title+'\n'+p.meaning).join('\n\n'));
  }
 }
 assert.ok(fingerprints.uk.size>=48&&fingerprints.en.size>=48);
 assert.ok(categorySets.uk.size>=3&&categorySets.en.size>=3,'ranked categories must differ between birth charts');
 mkdirSync('qa-artifacts',{recursive:true});
 writeFileSync('qa-artifacts/n493-100-fully-rendered-invented-readings.md',textOut.join('\n'),'utf8');
 console.log('N493_100_SYNTHETIC_READINGS_UK_EN_PASS');
});
test('Cancer rising has Mars as yogakaraka of 5 and 10; use actual sign evidence rather than static personality',()=>{
 const chart=fixture(9,95.5);const lords=classicalLordshipTable(chart.ascendant.sign);
 assert.equal(chart.ascendant.sign,4);
 assert.equal(lords[5],'Mars');assert.equal(lords[10],'Mars');
 for(const lang of ['uk','en']){
  const results=rankN493Patterns(chart,lang);
  const career=results.find(r=>r.id==='vocation');
  assert.ok(career);
  assert.ok(career.evidence.includes('D1.house-lord.5=Mars'));
  assert.ok(career.evidence.includes('D1.house-lord.10=Mars'));
  assert.match(career.reading,lang==='uk'?/йогакаракою/:/yogakaraka/);
  assert.ok(career.reading.includes('D10'));
 }
});
test('missing verified Shodashavarga must not produce invented personal patterns',()=>{
 const c=fixture(2);
 assert.equal(rankN493Patterns({...c,n4:undefined},'uk'),null);
 assert.equal(rankN493Patterns({...c,verification:{...c.verification,digest:'f'.repeat(64)}},'en'),null);
});
