import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {calculateAllVargas} from '../packages/jyotish-core/src/vargas.ts';
import {buildDetailedReport} from '../apps/api/src/report.ts';
import {n4OfflineSynthesis} from '../apps/api/src/n4-offline-synthesis.ts';
import {buildN4OfflineReading,n4OfflineEligible,N4_OFFLINE_READING_VERSION}
 from '../apps/api/src/n4-offline-reading.ts';
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const make=(seed=0)=>calculateChart({
 date:'1995-02-03',time:'12:00',timeZone:'Europe/Kyiv',latitude:49.2331,
 longitude:33.4398,place:'PRIVATE_PLACE_NOT_FOR_THE_READER'
},{
 julianDay:2449771,ayanamsa:23.83,backend:'synthetic_offline_test_not_real_sky',
 ascendant:(seed*31.733+17.11)%360,
 positions:names.map((name,i)=>({
  name,longitude:(i*32.431+(seed+1)*(i+1)*7.193+0.17)%360,speed:0
 }))
});
test('offline N4 editorial supplement requires BOTH explicit feature and certification toggles',()=>{
 assert.equal(n4OfflineEligible({}),false);
 assert.equal(n4OfflineEligible({N4_OFFLINE_READER_ENABLED:'1'}),false);
 assert.equal(n4OfflineEligible({N4_VARGA_INDEPENDENT_REFERENCE_APPROVED:'1'}),false);
 assert.equal(n4OfflineEligible({N4_OFFLINE_READER_ENABLED:'1',N4_VARGA_INDEPENDENT_REFERENCE_APPROVED:'1'}),true);
});
test('offline readings are bilingual, complete, owner-private, D1-linked and actually different by chart',()=>{
 const uk=[],en=[],themes=new Set();
 for(let i=0;i<12;i++){
  const chart=make(i),actual=calculateAllVargas(chart.ascendant.longitude,
   chart.d1.map(p=>({name:p.name,longitude:p.longitude})));
  for(const lang of ['uk','en']){
   const a=buildN4OfflineReading(chart,lang),b=buildN4OfflineReading(chart,lang);
   assert.deepEqual(a,b,'same chart and language must be deterministic');
   assert.equal(a.version,N4_OFFLINE_READING_VERSION);
   assert.equal(a.certification,'independent_jhora8_original_reference_pending');
   assert.equal(a.language,lang);
   assert.deepEqual(a.chapters.slice(0,2).map(c=>c.division),[9,10]);
   assert.equal(a.chapters.length,5);
   assert.equal(new Set(a.chapters.map(c=>c.id)).size,5);
   themes.add(a.chapters.map(c=>c.division).join(','));
   for(const c of a.chapters){
    assert.ok(c.lead.length>70&&c.analysis.length>100&&c.example.length>45&&c.action.length>30);
    assert.equal(c.evidence.length,6);
    const d=actual.find(x=>x.division===c.division);
    const named=c.evidence[0].match(/^D1 (\w+) sign=(\d+) house=(\d+)$/);
    assert.ok(named,'prose must have machine-checkable D1 placement evidence');
    const p=chart.d1.find(x=>x.name===named[1]);
    const v=d.planets.find(x=>x.name===named[1]);
    assert.equal(Number(named[2]),p.sign);assert.equal(Number(named[3]),p.house);
    assert.equal(c.evidence[1],'D'+c.division+' '+named[1]+' sign='+v.vargaSign+' house='+v.house);
    assert.equal(c.evidence[2],'D'+c.division+' lagna sign='+d.lagna.vargaSign);
    assert.match(c.evidence[3],/^D1 house\d+ lord=\w+ house=\d+$/);
    assert.ok(c.evidence[4].startsWith('D'+c.division+' '));
    assert.ok(c.evidence[4].includes(' as_d1_house_lord house='));
    assert.ok(c.evidence[5].startsWith('D'+c.division+' asc_lord='));
    assert.ok(c.evidence[5].includes(' house='));
    assert.doesNotMatch(c.heading+' '+c.lead+' '+c.analysis+' '+c.example,/\bD60\b/);
   }
   const serialized=JSON.stringify(a);
   for(const privateText of ['1995-02-03','12:00','Europe/Kyiv','PRIVATE_PLACE_NOT_FOR_THE_READER','49.2331','33.4398'])
    assert.ok(!serialized.includes(privateText),'No original birth inputs can enter offline prose');
   (lang==='uk'?uk:en).push(a.chapters.map(c=>c.lead+' '+c.analysis).join(' '));
  }
 }
 assert.equal(new Set(uk).size,12,'Ukrainian texts must reflect the source chart');
 assert.equal(new Set(en).size,12,'English texts must reflect the source chart');
 assert.ok(themes.size>=3,'selected topic combinations must respond to natal chart context');
 assert.ok(uk[0].includes('домі')&&en[0].includes('house'));
});
test('Reader v6 and fingerprint stay byte-identical when optional N4 offline content is ON or OFF',()=>{
 const origA=process.env.N4_OFFLINE_READER_ENABLED,origB=process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED;
 try{
  delete process.env.N4_OFFLINE_READER_ENABLED;
  delete process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED;
  const chart=make(3);
  const original=buildDetailedReport(chart,'uk','2026-11-04');
  assert.ok(!Object.hasOwn(original,'n4Offline'));
  process.env.N4_OFFLINE_READER_ENABLED='1';
  assert.ok(!Object.hasOwn(buildDetailedReport(chart,'uk','2026-11-04'),'n4Offline'));
  process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED='1';
  const expanded=buildDetailedReport(chart,'uk','2026-11-04');
  assert.equal(expanded.n4Offline.chapters.length,5);
  assert.equal(expanded.rulesDigest,original.rulesDigest);
  assert.deepEqual(expanded.editorial,original.editorial,'unchanged Reader v6 narrative and factual evidence');
  assert.deepEqual(expanded.lifePortrait,original.lifePortrait);
  assert.deepEqual(expanded.sections,original.sections);
  assert.deepEqual(expanded.ruleFacts,original.ruleFacts);
  const {n4Offline:_extra,...rest}=expanded;
  assert.deepEqual(rest,original,'only the optional additive field may be new');
 }finally{
  if(origA===undefined)delete process.env.N4_OFFLINE_READER_ENABLED;else process.env.N4_OFFLINE_READER_ENABLED=origA;
  if(origB===undefined)delete process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED;else process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED=origB;
 }
});

test('N4 no-AI thematic advice reflects the actual D1 and Dn house-lord context in both languages',()=>{
 const themes=new Set();
 for(const lang of ['uk','en']){
  const suggestions=new Set();
  for(let seed=0;seed<12;seed++){
   const reading=buildN4OfflineReading(make(seed),lang);
   for(const chapter of reading.chapters){
    const d1=chapter.evidence[3].match(/house=(\\d+)$/);
    const dn=chapter.evidence[4].match(/house=(\\d+)$/);
    assert.ok(d1&&dn,'proof must expose source house-lord placement');
    const bridge=n4OfflineSynthesis(chapter.division,Number(d1[1]),Number(dn[1]),lang);
    assert.ok(chapter.analysis.includes(bridge.analysis));
    assert.ok(chapter.example.includes(bridge.example));
    assert.ok(chapter.action.includes(bridge.action));
    assert.doesNotMatch(chapter.action,/guarantee|гарантован|завжди станеться/iu);
    if(chapter.division===9) suggestions.add(chapter.action);
    if(lang==='uk')themes.add(bridge.contextKey);
   }
  }
  assert.ok(suggestions.size>=2,'same D9 topic must produce distinct chart-conditioned next steps');
 }
 assert.ok(themes.size>=4,'house contexts must not collapse to one generic template');
 assert.throws(()=>n4OfflineSynthesis(9,0,2,'uk'),/valid 1-based house/);
 assert.throws(()=>n4OfflineSynthesis(9,2,13,'en'),/valid 1-based house/);
});
