import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {n4InternalServerSnapshot,n4ApiEligible,N4_SERVER_CONTRACT_VERSION}
 from '../apps/api/src/n4-varga-contract.ts';
import {n4PersonalPlacements} from '../apps/api/src/n4-personal-themes.ts';
import {compactN4VargaFacts} from '../apps/api/src/n4-varga-evidence.ts';

const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function chart(){
 return calculateChart({
  date:'2001-02-03',time:'04:52',timeZone:'Europe/Kyiv',
  latitude:47.1234,longitude:32.8765,place:'SECRET_USER_PLACE'
 },{
  ayanamsa:23.85,ascendant:44.245,julianDay:2450000,backend:'synthetic-contract-test',
  positions:names.map((name,i)=>({name,longitude:(3.172+i*40.171)%360,speed:0}))
 });
}
test('N4 provisional internal contract has 16×10 derived placements without any private birth data',()=>{
 const c=chart(),s=n4InternalServerSnapshot(c);
 assert.equal(s.version,N4_SERVER_CONTRACT_VERSION);
 assert.equal(s.certification,'internal_rules_only_external_reference_pending');
 assert.equal(s.source,'calculated_chart_D1_without_separate_origin_attestation');
 assert.equal(s.charts.length,16);
 assert.equal(new Set(s.charts.map(v=>v.division)).size,16);
 for(const v of s.charts){
  assert.equal(v.planets.length,9);
  assert.ok(Number.isFinite(v.lagnaBoundaryArcseconds)&&v.lagnaBoundaryArcseconds>=0);
  assert.ok(v.lagnaSign>=1&&v.lagnaSign<=12);
  for(const p of v.planets){
   assert.ok(p.sign>=1&&p.sign<=12&&p.house>=1&&p.house<=12);
   assert.ok(Number.isFinite(p.boundaryDistanceArcseconds)&&p.boundaryDistanceArcseconds>=0);
  }
 }
 assert.equal(s.charts.find(v=>v.division===1).lagnaSign,c.ascendant.sign);
 const encoded=JSON.stringify(s);
 for(const key of ['input','utc','birthLongitude','longitude','latitude','timeZone','owner','chartId','digest','dasha','place','nameOfUser'])
  assert.ok(!encoded.includes('"'+key+'":'),key+' must not be in the read model');
 for(const value of ['2001-02-03','04:52','Europe/Kyiv','47.1234','32.8765','SECRET_USER_PLACE'])
  assert.ok(!encoded.includes(value),'birth metadata must never be serialized');
 assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.charts)&&Object.isFrozen(s.charts[0].planets));
});
test('N4 personal themes and AI facts use the SAME shared provisional source',()=>{
 const c=chart(),source=n4InternalServerSnapshot(c),themes=n4PersonalPlacements(c);
 const ai=compactN4VargaFacts(c);
 assert.equal(themes.length,9*9);
 for(const p of themes){
  const entry=source.charts.find(v=>v.division===p.division)?.planets.find(v=>v.name===p.body);
  assert.ok(entry);
  assert.equal(p.sign,entry.sign);
  assert.equal(p.house,entry.house);
 }
 const d24=source.charts.find(v=>v.division===24);
 const sun=d24.planets.find(v=>v.name==='Sun');
 assert.ok(ai.includes('D24 education lagna='+d24.lagnaSign));
 assert.ok(ai.includes('Sun sign='+sun.sign+' house='+sun.house));
 assert.ok(!ai.includes('SECRET_USER_PLACE'));
});
test('No N4 API exposure without TWO explicit owner-approved feature switches',()=>{
 assert.equal(n4ApiEligible({}),false);
 assert.equal(n4ApiEligible({N4_VARGA_API_ENABLED:'1'}),false);
 assert.equal(n4ApiEligible({N4_VARGA_INDEPENDENT_REFERENCE_APPROVED:'1'}),false);
 assert.equal(n4ApiEligible({N4_VARGA_API_ENABLED:'1',N4_VARGA_INDEPENDENT_REFERENCE_APPROVED:'1'}),true);
});
test('Malformed natal chart input is rejected instead of returning fabricated vargas',()=>{
 const c=chart();c.d1=[...c.d1.slice(0,8)];
 assert.throws(()=>n4InternalServerSnapshot(c),/Incomplete/);
});
