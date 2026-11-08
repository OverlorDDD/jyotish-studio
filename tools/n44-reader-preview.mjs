// N4.4 independent, offline demo — NOT a person's real horoscope or live AI output.
// Uses the same Classical Reader 8 API method against three *synthetic* verified-bound charts.
// Never reads .env, identity, birth data or provider credentials.
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const birth={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:40,longitude:30};
const focus=[2,9,10,24,27,30];
for(let seed=0;seed<3;seed++){
 const eph={ayanamsa:23.8,ascendant:17.713+seed*27,julianDay:2451545,
  backend:'N44_SYNTHETIC_PREVIEW_DO_NOT_ASCRIBE_TO_A_REAL_PERSON',
  positions:names.map((name,i)=>({name,longitude:(i*33.17+7+seed*36.71)%360,speed:i%3===0?-.1:.3}))};
 const base=calculateChart(birth,eph);
 const proof={version:'jyotish-integrity-v3',status:'verified_internal',digest:String(seed+1).repeat(64),checks:['SYNTHETIC_PREVIEW_ONLY'],externalReferenceChecked:false};
 const chart={...base,verification:proof,n4:makeN4RcPayload(base,proof)};
 console.log('\n=== SYNTHETIC CASE '+(seed+1)+' — not an actual birth chart ===');
 for(const lang of ['uk','en']){
  const r=buildClassicalReaderV8(chart,lang,'2026-11-07');
  if(r.status!=='available'||r.insights.length!==15)throw new Error('N44_PREVIEW_SOURCE_MISMATCH');
  console.log('\n'+(lang==='uk'?'УКРАЇНСЬКА':'ENGLISH')+' · 15 theme reports + D60 precision boundary');
  for(const n of focus){
   const item=r.insights.find(i=>i.division===n);
   console.log('\nD'+n+' · '+item.title+'\n'+item.headline+
    '\n'+item.strength+'\n'+item.challenge+'\n'+item.context+'\n'+item.step);
  }
 }
}
console.log('\nN44_CLASSICAL_READER_8_UA_EN_3_CASES_PASS');
