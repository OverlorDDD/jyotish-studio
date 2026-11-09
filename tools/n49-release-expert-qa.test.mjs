/**
 * N4.9 independent-of-fixture LIVE-SWISS editorial QA.
 * These are 12 invented control birth records, never actual users.
 * Tests use real native Swiss calculations but the SAME in-repo varga engine:
 * do NOT call this an independent astronomical certificate or human expert review.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {runCalculation} from '../apps/api/src/logic.ts';
import {buildDetailedReport} from '../apps/api/src/report.ts';
import {N44_CLASSICAL_SOURCES} from '../apps/api/src/reader-classical-n44.ts';
import {classicalLordshipTable} from '../apps/api/src/reader-classical.ts';
const CASES=[
 {id:'Q01',date:'1978-02-11',time:'08:27',timeZone:'Europe/London',latitude:51.507,longitude:-0.128},
 {id:'Q02',date:'1980-06-29',time:'21:13',timeZone:'Europe/Berlin',latitude:52.520,longitude:13.405},
 {id:'Q03',date:'1983-08-23',time:'05:42',timeZone:'Asia/Kolkata',latitude:19.076,longitude:72.878},
 {id:'Q04',date:'1987-11-06',time:'14:11',timeZone:'America/New_York',latitude:40.713,longitude:-74.006},
 {id:'Q05',date:'1990-03-13',time:'00:47',timeZone:'Asia/Tokyo',latitude:35.676,longitude:139.650},
 {id:'Q06',date:'1993-05-27',time:'23:08',timeZone:'Australia/Sydney',latitude:-33.869,longitude:151.209},
 {id:'Q07',date:'1995-09-04',time:'17:53',timeZone:'Europe/Kyiv',latitude:50.450,longitude:30.523},
 {id:'Q08',date:'1998-12-20',time:'09:35',timeZone:'America/Los_Angeles',latitude:34.052,longitude:-118.244},
 {id:'Q09',date:'2001-01-17',time:'04:14',timeZone:'America/Sao_Paulo',latitude:-23.550,longitude:-46.633},
 {id:'Q10',date:'2003-04-11',time:'11:18',timeZone:'Africa/Johannesburg',latitude:-26.204,longitude:28.047},
 {id:'Q11',date:'2006-10-02',time:'20:07',timeZone:'Pacific/Auckland',latitude:-36.848,longitude:174.764},
 {id:'Q12',date:'2009-07-15',time:'16:22',timeZone:'Europe/Warsaw',latitude:52.230,longitude:21.012}
];
const DIVS=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45];
const SOURCE_IDS=new Set(N44_CLASSICAL_SOURCES.map(s=>s.id));
const hFrom=(a,b)=>((a-b+12)%12)+1;
const normalize=s=>s.replace(/\s+/g,' ').trim();
const forbidden=/\b(?:guaranteed destiny|certainly marry|will definitely|100% accurate|scientifically proven personality)\b|(?:гарантовано станеться|точно одружитесь|стовідсоткова доля|підтверджений діагноз)/iu;
test('12 diverse real Swiss synthetic-birth charts x UK/EN: claim traceability and narrative editorial gate',async()=>{
 process.env.ALLOW_PYTHON_SWISSEPH='0';
 const dir=join(process.cwd(),'.qa-artifacts');
 mkdirSync(dir,{recursive:true});
 const samples=['# N4.9 — 12 real-method invented example readings × 2 languages',
 'Every birth record is an INVENTED QA VECTOR. These are not actual people, not independently verified predictions or a human-astrologer endorsement.',
 'Swiss Ephemeris calculations are real for the specified test inputs; divisional mappings reuse the production Galaxiora engine.',
 'Source IDs denote historical excerpts, with explicitly limited OCR/translation status.'];
 const signatures={uk:new Set(),en:new Set()};
 const profiles=[];
 for(const item of CASES){
  const {id,...input}=item;
  const chart=await runCalculation(input);
  assert.match(chart.ephemeris,/verified-SWIEPH/,'live native Swiss required, never mock or Moshier: '+id);
  assert.equal(chart.verification.version,'jyotish-integrity-v3');
  assert.equal(chart.verification.status,'verified_internal');
  assert.equal(chart.n4.charts.length,15);
  const lords=classicalLordshipTable(chart.ascendant.sign);
  const profile={id,lang:'',lagna:chart.ascendant.sign,moon:chart.d1.find(p=>p.name==='Moon').sign};
  const source=chart.n4.charts;
  for(const lang of ['uk','en']){
   const report=buildDetailedReport(chart,lang,'2026-11-09');
   const reader=report.readerV8;
   assert.equal(reader.status,'available',id+' '+lang);
   const n=reader.integrated;
   assert.equal(n.version,'n49-unified-evidence-v1');
   assert.equal(n.links.length,15);
   assert.equal(reader.insights.length,15);
   assert.deepEqual(n.threads.map(x=>x.id),['foundation','career','partnership','resource','tension']);
   for(const link of n.links){
    assert.ok(DIVS.includes(link.division));
    const original=chart.d1.find(p=>p.name===link.lord);
    const actual=source.find(x=>x.division===link.division);
    const graha=actual.planets.find(x=>x.name===link.lord);
    assert.ok(original&&graha);
    assert.deepEqual([link.d1House,link.d1Sign,link.dnHouse,link.dnSign],
     [original.house,original.sign,graha.house,graha.sign],id+': D'+link.division);
    assert.equal(link.lord,lords[Object.entries({
     1:1,2:2,3:3,4:4,7:5,9:7,10:10,12:4,16:4,20:9,24:5,27:1,30:6,40:4,45:9
    }).find(([d])=>Number(d)===link.division)[1]]);
    for(const sid of [...link.directSourceIds,...link.extensionSourceIds])
     assert.ok(SOURCE_IDS.has(sid),'unknown historical source '+sid);
    assert.ok(['reinforced','contradictory','cautious','unresolved'].includes(link.polarity));
   }
   for(const thread of n.threads){
    assert.ok(thread.evidence.length>=3,id+' '+lang+' '+thread.id+' has missing source facts');
    assert.ok(thread.directSourceIds.every(x=>SOURCE_IDS.has(x)));
    assert.ok(thread.extensionSourceIds.every(x=>SOURCE_IDS.has(x)));
    assert.ok(thread.text.length>=160,'short thematic prose: '+id+'/'+lang+'/'+thread.id);
    assert.match(thread.text.trim(),/[.!?]$/,'unfinished prose: '+id+'/'+lang+'/'+thread.id);
    assert.doesNotMatch(thread.text,forbidden);
    assert.ok(thread.evidence.every(e=>/^D\d+\.|^D1\./.test(e)),'unstructured evidence token');
   }
   const all=normalize([n.opening,...n.threads.map(t=>t.text),n.closing].join(' '));
   assert.ok(all.length>1100,'too little connected interpretation: '+id+'/'+lang);
   assert.match(n.closing,/15/,'must reconcile all 15 source links');
   assert.doesNotMatch(JSON.stringify(n),/Etc\/UTC|Asia\/Kolkata|Europe\/Kyiv|latitude|longitude|["]place["]:|birthTime|birthDate/iu);
   assert.ok(n.threads.find(t=>t.id==='career').evidence.some(x=>x.startsWith('D9.')));
   assert.ok(n.threads.find(t=>t.id==='career').evidence.some(x=>x.startsWith('D10.')));
   assert.ok(n.threads.find(t=>t.id==='partnership').evidence.some(x=>x.startsWith('D9.')));
   const details=n.threads.map(t=>t.id+': '+t.title+'\n'+t.text+
    '\nCalculations: '+t.evidence.join(' ; ')+
    '\nDirect sources: '+(t.directSourceIds.join(',')||'none')+
    '\nModern extensions: '+(t.extensionSourceIds.join(',')||'none')).join('\n\n');
   samples.push('\n## '+id+' / '+lang+' (invented astronomical test vector)\n',
    '**Opening**: '+n.opening+'\n',details+'\n',
    '**Final synthesis:** '+n.closing+'\n',
    '**Method limitations:** '+n.method+'\n',
    '**Fifteen detailed areas:** '+reader.insights.map(x=>'D'+x.division+': '+x.title+' — '+x.headline+' '+x.context).join('\n\n')+'\n');
   signatures[lang].add(n.opening);
   profiles.push({...profile,lang,sourceLinks:n.links.length,threads:n.threads.length,
    reportChars:all.length,conflicts:n.links.filter(x=>x.polarity==='contradictory').length});
   if(['Q01','Q06','Q11'].includes(id))
    console.log('N49_EDITORIAL_REVIEW '+id+' '+lang+': '+n.threads.map(t=>t.id+'='+t.text.slice(0,95)).join(' | '));
  }
 }
 for(const lang of ['uk','en'])assert.ok(signatures[lang].size>=10,'too many generic identical openings');
 assert.equal(profiles.length,24);
 writeFileSync(join(dir,'n49-12-swiss-readings-uk-en.md'),samples.join('\n'),'utf8');
 writeFileSync(join(dir,'n49-fact-review-summary.json'),JSON.stringify({
  classification:'AUTOMATED_CLAIM_QA_NOT_HUMAN_EXPERT_CERTIFICATION',
  cases:profiles,verifiedTextSampleCount:24,privateUserRecordsRead:0,externalJHoraFullBirthComparison:false
 },null,2),'utf8');
 console.log('N49_REAL_SWISS_12_CASE_24_BILINGUAL_REVIEW_PASS');
});
