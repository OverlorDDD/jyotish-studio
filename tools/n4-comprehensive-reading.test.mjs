import test from 'node:test';
import assert from 'node:assert/strict';
import {n4SyntheticAuditChart} from './n4-ai-synthetic-profiles.mjs';
import {buildN4LifeEvidence,buildN4CompletePrompt,N4_LIFE_SECTIONS,N4_LIFE_DOMAINS}
 from '../apps/api/src/n4-comprehensive-reading.ts';
import {n4InternalServerSnapshot} from '../apps/api/src/n4-varga-contract.ts';
import {classicalLordshipTable} from '../apps/api/src/reader-classical.ts';

const dset=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60];
test('N4 full-life dossier covers all 16 D charts with 14 interpretable topical lenses and D60 withheld',()=>{
 assert.deepEqual(N4_LIFE_DOMAINS.map(x=>x.division),dset.slice(1));
 assert.deepEqual([...new Set(N4_LIFE_SECTIONS.flatMap(x=>x.charts))].sort((a,b)=>a-b),dset.slice(0,-1));
 for(let seed=0;seed<12;seed++){
  const chart=n4SyntheticAuditChart(seed),actual=n4InternalServerSnapshot(chart);
  const dossier=buildN4LifeEvidence(chart,'2026-11-05');
  assert.equal(dossier.sourceCount,16);
  assert.deepEqual(dossier.availableDivisions,dset);
  assert.equal(dossier.scopes.length,15);
  assert.equal(dossier.scopes.filter(x=>x.status==='INTERNAL_MATH_ONLY').length,14);
  assert.equal(dossier.scopes.find(x=>x.division===60).status,'WITHHELD_JHORA_AND_BIRTH_TIME_PENDING');
  assert.equal(dossier.certification,'internal_rules_only_external_reference_pending');
  const lords=classicalLordshipTable(chart.ascendant.sign);
  for(const scope of dossier.scopes){
   const dn=actual.charts.find(c=>c.division===scope.division);
   const name=lords[scope.house];
   const expected=dn.planets.find(p=>p.name===name);
   const base=actual.charts.find(c=>c.division===1).planets.find(p=>p.name===name);
   assert.equal(scope.domainLord,name);
   assert.equal(scope.dnLord.house,expected.house);
   assert.equal(scope.dnLord.sign,expected.sign);
   assert.equal(scope.d1Lord.house,base.house);
   assert.equal(scope.dnLagna,dn.lagnaSign);
   assert.equal(scope.authoritativePrediction,false);
  }
 }
});
test('Full-life compact prompt covers 14 topical scopes on all 12 synthetic charts in both languages',()=>{
 for(let seed=0;seed<12;seed++)for(const lang of ['uk','en']){
  const chart=n4SyntheticAuditChart(seed);
  const p=buildN4CompletePrompt(chart,lang,'2026-11-05');
  assert.equal(p.availableCharts,16);
  assert.equal(p.eligibleExtraCharts,14);
  assert.deepEqual(p.withheldDivisions,[60]);
  assert.ok(p.promptChars>2500&&p.promptChars<8500);
  assert.ok(p.system.includes('750-950 words'));
  assert.ok(p.system.includes('Shadbala'));
  assert.ok(p.user.includes('D60=WITHHELD'));
  assert.ok(p.user.includes('D1 Lagna=s'));
  for(const d of dset.filter(x=>x!==1&&x!==60))
   assert.match(p.user,new RegExp('(?:^|\\n)D'+d+'\\s'));
  for(const privateText of ['1994-05-17','08:16','Etc/UTC',
    'SYNTHETIC_TEST_ONLY_NEVER_REAL_BIRTH','latitude','longitude','api_key'])
   assert.ok(!p.user.includes(privateText),'no input leak: '+privateText);
 }
});
test('N4 full dossier will not invent another ayanamsa or accept missing D1 source',()=>{
 const chart=n4SyntheticAuditChart(2);
 assert.throws(()=>buildN4LifeEvidence({...chart,config:{...chart.config,ayanamsa:'Raman'}},'2026-11-05'),/Lahiri/);
 assert.throws(()=>buildN4LifeEvidence({...chart,d1:chart.d1.slice(0,3)},'2026-11-05'),/Incomplete/);
});
