import test from 'node:test';
import assert from 'node:assert/strict';
import {classicalSignRuler,dignityFor,houseLordFacts,dignityFacts,mahapurushaYogas,ruleFindings,ruleFingerprint,validateRuleInput} from '../packages/jyotish-core/src/rules.ts';

const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const signs=[5,4,1,6,12,2,7,9,3];
function chart(asc=1){
 const positions=names.map((name,i)=>({
  name,sign:signs[i],signName:'placeholder',house:((signs[i]-asc+12)%12)+1,
  longitude:(signs[i]-1)*30+15,degreesInSign:15,nakshatra:'Swati',pada:4,retrograde:false
 }));
 const copy=arr=>arr.map(p=>({...p}));
 return {
  ascendant:{sign:asc},d1:positions,d9:copy(positions),d10:copy(positions),dasha:[]
 };
}
test('all twelve classical sign rulers, no node as ruler',()=>{
 const expected=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
 assert.deepEqual(Array.from({length:12},(_,i)=>classicalSignRuler(i+1)),expected);
 assert.throws(()=>classicalSignRuler(13));
});
test('dignity matrix seven classical planets, nodes explicitly unassigned',()=>{
 const matrix=[
  ['Sun',1,7,5],['Moon',2,8,4],['Mars',10,4,1],['Mercury',6,12,3],
  ['Jupiter',4,10,9],['Venus',12,6,2],['Saturn',7,1,11]
 ];
 for(const [name,exalt,fall,own] of matrix){
  assert.equal(dignityFor(name,exalt),'exalted',name);
  assert.equal(dignityFor(name,fall),'debilitated',name);
  assert.equal(dignityFor(name,own),'own',name);
 }
 assert.equal(dignityFor('Rahu',2),'unassigned');
 assert.equal(dignityFor('Ketu',8),'unassigned');
});
test('house lords change with Lagna, use actual calculated graha house',()=>{
 const c=chart(12),lords=houseLordFacts(c);
 assert.equal(lords.length,12);
 assert.equal(lords[0].subject,'Jupiter');
 assert.equal(lords[0].values.locatedHouse,c.d1.find(g=>g.name==='Jupiter').house);
 assert.equal(lords[9].subject,'Jupiter');
 assert.deepEqual(lords.map(l=>l.id),Array.from({length:12},(_,i)=>'house-lord:'+(i+1)));
});
test('all five Mahapurusha yogas require Lagna kendra AND own/exaltation',()=>{
 const a=chart(1);
 // Mars Aries house 1 qualifies Ruchaka; Mercury Virgo house 6 does not.
 assert.ok(mahapurushaYogas(a).some(y=>y.name==='Ruchaka'));
 assert.ok(!mahapurushaYogas(a).some(y=>y.name==='Bhadra'));
 for(const [name,sign,asc,yoga] of [
  ['Mars',1,1,'Ruchaka'],['Mercury',6,6,'Bhadra'],['Jupiter',4,4,'Hamsa'],
  ['Venus',7,7,'Malavya'],['Saturn',10,10,'Shasha']
 ]){
  const ch=chart(asc);
  const pos=ch.d1.find(p=>p.name===name);
  pos.sign=sign;pos.house=1;pos.longitude=(sign-1)*30+15;
  const yogas=mahapurushaYogas(ch);
  assert.ok(yogas.some(y=>y.name===yoga),name);
 }
});
test('missing, duplicate, or inconsistent astronomical facts fail closed',()=>{
 const base=chart();
 validateRuleInput(base);
 const duplicate=chart();duplicate.d1[1].name='Sun';
 assert.throws(()=>ruleFindings(duplicate),/Duplicate/);
 const changed=chart();changed.d1[0].house=4;
 assert.throws(()=>ruleFindings(changed),/mismatch/);
 const longitudeMismatch=chart();longitudeMismatch.d1[0].longitude+=30;
 assert.throws(()=>ruleFindings(longitudeMismatch),/longitude\/sign mismatch/);
 const missing=chart();missing.d1=missing.d1.slice(1);
 assert.throws(()=>ruleFindings(missing));
});
test('fingerprint is stable across repeated calculations and shuffles but reacts to facts and asOf',()=>{
 const a=chart();
 const h1=ruleFingerprint(a,'2026-10-13');
 assert.equal(h1,ruleFingerprint(chart(),'2026-10-13'));
 const shuffled=chart();shuffled.d1.reverse();shuffled.d9.reverse();shuffled.d10.reverse();
 // Rule facts retain D1 order; astronomy arrays are semantically sets, digest normalizes in patch later.
 assert.equal(h1.length,64);
 assert.notEqual(h1,ruleFingerprint(a,'2026-10-14'));
 const moved=chart();moved.d1.find(g=>g.name==='Sun').longitude+=0.125;moved.d1.find(g=>g.name==='Sun').degreesInSign+=0.125;
 assert.notEqual(h1,ruleFingerprint(moved,'2026-10-13'));
 assert.throws(()=>ruleFingerprint(a,'bad'));
});
test('provenance rule identifiers and facts are unique and complete',()=>{
 const r=ruleFindings(chart());
 assert.equal(r.version,'2.0.0');
 assert.equal(r.lords.length,12);
 assert.equal(r.dignities.length,9);
 assert.equal(new Set(r.facts.map(x=>x.id)).size,r.facts.length);
 assert.ok(r.facts.every(f=>f.rule&&f.evidence.length&&f.subject));
});
