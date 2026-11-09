import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {CLASSICAL_RULERS} from '../packages/jyotish-core/src/rules.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {extractN44Evidence} from '../apps/api/src/reader-classical-n44.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';
import {buildUnifiedN49,n49Polarity,N49_UNIFIED_VERSION} from '../apps/api/src/reader-unified-n49.ts';

const bodies=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function fixture(seed){
 const input={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
 const eph={ayanamsa:23.8,ascendant:(12.713+seed*11.37)%360,
  julianDay:2451545,backend:'N49_SYNTHETIC_NOT_A_REAL_BIRTH',
  positions:bodies.map((name,i)=>({name,longitude:(11+i*35.2+seed*(16.41+i*.12))%360,speed:.1}))};
 const chart=calculateChart(input,eph);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:seed.toString(16).padStart(64,'a'),checks:['SYNTHETIC_TEST_ONLY'],externalReferenceChecked:false};
 return {...chart,verification,n4:makeN4RcPayload(chart,verification)};
}
const tenthSign=sign=>((sign+8)%12)+1;
const oldGrahas=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
test('N4.9 sign polarity is conservative: unknown is never negative or a made-up percentage',()=>{
 assert.equal(n49Polarity('own','exalted'),'reinforced');
 assert.equal(n49Polarity('own','debilitated'),'contradictory');
 assert.equal(n49Polarity('debilitated','own'),'contradictory');
 assert.equal(n49Polarity('other','other'),'unresolved');
 assert.equal(n49Polarity('debilitated','other'),'cautious');
});
test('All 15 thematic charts link back to their D1 house lord; output includes no birth metadata or D60 claims',()=>{
 const portraits=[];
 for(let seed=1;seed<=18;seed++){
  const chart=fixture(seed);
  for(const lang of ['uk','en']){
   const report=buildClassicalReaderV8(chart,lang,'2026-11-09');
   assert.equal(report.status,'available');
   const n=report.integrated;
   assert.ok(n);assert.equal(n.version,N49_UNIFIED_VERSION);
   assert.equal(n.links.length,15);assert.equal(n.threads.length,5);
   assert.deepEqual(n.threads.map(t=>t.id),['foundation','career','partnership','resource','tension']);
   assert.equal(new Set(n.links.map(l=>l.division)).size,15);
   assert.equal(n.threads[0].scope,'d1_direct');
   for(const link of n.links){
    const d=chart.n4.charts.find(x=>x.division===link.division);
    const d1=chart.d1.find(x=>x.name===link.lord);
    const dn=d?.planets.find(x=>x.name===link.lord);
    assert.ok(dn&&d1);
    assert.equal(link.d1House,d1.house);
    assert.equal(link.d1Sign,d1.sign);
    assert.equal(link.dnHouse,dn.house);
    assert.equal(link.dnSign,dn.sign);
    assert.ok(link.evidence.includes('D'+link.division+'.'+link.lord+'.house='+dn.house));
    assert.ok(link.evidence.includes('D1.'+link.lord+'.sign='+d1.sign));
    assert.ok(['reinforced','contradictory','cautious','unresolved'].includes(link.polarity));
   }
   const c=n.threads.find(t=>t.id==='career');
   const r=n.threads.find(t=>t.id==='partnership');
   assert.ok(c.evidence.some(x=>x.startsWith('D10.')));
   assert.ok(c.evidence.some(x=>x.startsWith('D9.')));
   assert.ok(r.evidence.some(x=>x.startsWith('D9.')));
   const serialized=JSON.stringify(n);
   assert.doesNotMatch(serialized,/2000-01-01|50\.45|30\.52|Etc\/UTC|latitude|longitude|birthDate|birthTime|\\"place\\":/iu);
   assert.doesNotMatch(n.threads.flatMap(t=>t.evidence).join(','),/D60\./);
   assert.ok(n.threads.every(t=>t.evidence.length>=4&&t.text.length>170));
   assert.ok(n.threads.every(t=>!t.sourceIds.includes('FAKE_BOOK_VERSE')));
   portraits.push(n.opening+n.threads.map(t=>t.text).join(''));
  }
 }
 assert.ok(new Set(portraits).size>=25,'distinct charts should yield distinct linked narratives');
});
test('Brihat Jataka X.1 fallback correctly includes Moon AND Sun only when both classical tenth houses are empty',()=>{
 let fallback=0,occupied=0;
 for(let seed=0;seed<60;seed++){
  const c=fixture(seed),moon=c.d1.find(x=>x.name==='Moon'),sun=c.d1.find(x=>x.name==='Sun');
  const tenthFromAsc=tenthSign(c.ascendant.sign),tenthFromMoon=tenthSign(moon.sign);
  const hasOccupation=c.d1.some(p=>oldGrahas.includes(p.name)&&
    (p.sign===tenthFromAsc||p.sign===tenthFromMoon));
  const evidence=extractN44Evidence(c,10,'2026-11-09');
  const nav=evidence.filter(x=>x.ruleId.startsWith('BJ-X-1-NAVAMSA-VOCATION-'));
  if(hasOccupation){occupied++;assert.equal(nav.length,0,'navamsa fallback must not override occupied tenth');}
  else{
   fallback++;
   assert.equal(nav.length,3,'fallback must have Lagna, Moon, Sun alternatives');
   for(const [id,origin] of [['LAGNA',c.ascendant.sign],['MOON',moon.sign],['SUN',sun.sign]]){
    const rule=nav.find(x=>x.ruleId.endsWith('-'+id));
    const tenth=tenthSign(origin),lord=CLASSICAL_RULERS[tenth-1];
    const navSign=c.d9.find(x=>x.name===lord).sign;
    assert.ok(rule.facts.includes('D1.tenth-from-'+id.toLowerCase()+'.sign='+tenth));
    assert.ok(rule.facts.includes('D1.tenth-from-'+id.toLowerCase()+'.lord='+lord));
    assert.ok(rule.facts.includes('D9.'+lord+'.sign='+navSign));
    assert.equal(rule.application,'direct_natal');
    assert.equal(rule.sourceId,'BJ-X-1');
   }
  }
 }
 assert.ok(fallback>0&&occupied>0,'test must exercise both branches');
});
test('Forged/missing D1-to-Dn source blocks N4.9 without any substituted biography',()=>{
 const c=fixture(4);
 for(const bad of [
  {...c,n4:undefined},
  {...c,n4:{...c.n4,sourceDigest:'f'.repeat(64)}},
  {...c,n4:{...c.n4,d60Excluded:false}}
 ]){
  assert.equal(buildUnifiedN49(bad,'en','2026-11-09',27,30),null);
  const report=buildClassicalReaderV8(bad,'uk','2026-11-09');
  assert.equal(report.status,'unavailable');
  assert.equal(report.integrated,null);
 }
});
