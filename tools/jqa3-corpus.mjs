/**
 * JQA-3: fail-closed, evidence-oriented JHora corpus, NOT a JHora emulator.
 *
 * audit    checks pinned source integrity and emits scoped statuses;
 * certify  rejects incomplete external evidence (never promotes UNVERIFIED).
 * import   converts genuine JHoraKit raw + chart.json + original jhora.ini
 *          into a normalized snapshot; preserves all evidence by SHA-256.
 *
 * Usage:
 * node tools/jqa3-corpus.mjs audit
 * node tools/jqa3-corpus.mjs certify
 * node tools/jqa3-corpus.mjs import <capture-directory> <output-normalized.json>
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {divisionalLongitude,signIndex,nakshatraOf,vimshottari,graha} from '../packages/jyotish-core/src/index.ts';
import {houseLordFacts} from '../packages/jyotish-core/src/rules.ts';
import {d10JHoraFiveEight} from './jhora-independent-parity.mjs';
import {parseJHoraRaw,JQA3_RAW_PARSER} from './jqa3-raw-parser.mjs';


const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const MANIFEST='tests/fixtures/jhora-corpus/manifest.json';
export const BODIES=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const NINE=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
// Independently specified classical sign-lord truth table (not read from production rules).
const REFERENCE_RULERS=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const SHA=/^[a-f0-9]{40}$/;
const SHA256=/^[a-f0-9]{64}$/;

const sign=lon=>signIndex(lon)+1;
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const gitSha=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const deltaArcsec=(a,b)=>((a-b+540)%360-180)*3600;
function withinRoot(path){
 const absolute=resolve(ROOT,path), rel=relative(ROOT,absolute);
 assert.ok(rel!==''&&!rel.startsWith('..')&&!isAbsolute(rel),'JQA3: path must remain inside repository');
 return absolute;
}
export function loadCorpus(path=MANIFEST){
 const m=JSON.parse(readFileSync(withinRoot(path),'utf8'));
 assert.equal(m.schemaVersion,1);
 assert.ok(Number.isInteger(m.minIndependentForCertification)&&m.minIndependentForCertification>=10);
 assert.ok(Array.isArray(m.records)&&m.records.length>0);
 const ids=new Set();
 for(const record of m.records){
  assert.match(record.id,/^[a-z0-9-]{5,100}$/);
  assert.ok(!ids.has(record.id),'duplicate corpus ID: '+record.id);ids.add(record.id);
  assert.equal(record.evidenceKind,'RECORDED_JHORA_EXPORT');
  assert.match(record.sourceCommit,SHA);
  assert.ok(record.sourceRepo.startsWith('https://github.com/'));
  assert.match(record.referenceGitBlobSha1,SHA);
  assert.ok(!record.referenceFile.includes('..'));
 }
 return m;
}
/** Git SHA-1 is computed on repository LF bytes; Windows checkout may be CRLF.
 * A successful check still requires an EXACT pinned Git blob after the only
 * permitted transformation (CRLF→LF), never a regenerated reference value.
 */
export function verifyPinnedTextBlob(bytes,expectedHash,id='source'){
 const actual=gitSha(bytes);
 const canonical=bytes.includes(Buffer.from('\r\n'))
  ?Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n'),'utf8'):bytes;
 assert.ok(actual===expectedHash||gitSha(canonical)===expectedHash,
  'immutable JHora fixture changed: '+id);
 return canonical;
}
export function verifyReference(record){
 const bytes=readFileSync(withinRoot(record.referenceFile));
 const canonical=verifyPinnedTextBlob(bytes,record.referenceGitBlobSha1,record.id);
 const ref=JSON.parse(canonical.toString('utf8'));
 assert.ok(ref.civilTime?.birthUtc?.endsWith('Z'));
 assert.ok(Number.isFinite(ref.civilTime.latitude)&&Number.isFinite(ref.civilTime.longitude));
 assert.deepEqual(Object.keys(ref.expected.positions),BODIES);
 assert.equal(ref.independentSource.captureCommit,record.sourceCommit);
 assert.equal(ref.independentSource.captureRepository,record.sourceRepo);
 for(const name of BODIES){
  const p=ref.expected.positions[name];
  assert.ok(Number.isFinite(p.longitude)&&p.longitude>=0&&p.longitude<360,'invalid longitude '+name);
  assert.ok(p.d1>=1&&p.d1<=12&&p.d9>=1&&p.d9<=12,'invalid signs '+name);
  assert.equal(p.d1,sign(p.longitude),'JHora fixture internal D1 corruption '+name);
  assert.equal(p.d9,sign(divisionalLongitude(p.longitude,9)),'JHora fixture internal D9 corruption '+name);
  if(Number.isInteger(p.d10_5_8))assert.equal(p.d10_5_8,d10JHoraFiveEight(p.longitude),'JHora D10 (5-8) replay mismatch '+name);
  else if(Number.isInteger(p.d10_1_9))assert.equal(p.d10_1_9,sign(divisionalLongitude(p.longitude,10)));
  else throw Error('Missing D10 method for '+name);
 }
 if(record.hasOriginalJHoraIni){
  assert.equal(record.configAssertion,'EXPLICIT_CAPTURED_INI');
  assert.ok(ref.independentSource.capture?.iniSha256?.match(SHA256));
  assert.ok(ref.independentSource.capture?.jhoraExeSha256?.match(SHA256));
  assert.ok(ref.independentSource.capture?.rawChartSha256?.match(SHA256));
  assert.ok(ref.independentSource.capture?.rawDivisionalsSha256?.match(SHA256));
  assert.equal(ref.independentSource.capture?.parser,JQA3_RAW_PARSER);
  assert.ok(record.captureDir,'Original JHora raw data directory required');
  const evidence={
   'jhora.ini':ref.independentSource.capture.iniSha256,
   'chart_data.txt':ref.independentSource.capture.rawChartSha256,
   'divisionals.txt':ref.independentSource.capture.rawDivisionalsSha256,
   ...(ref.independentSource.capture.parsedJsonSha256?{'chart.json':ref.independentSource.capture.parsedJsonSha256}:{}),
   'capture.json':ref.independentSource.capture.captureJsonSha256,
   'input.jhd':ref.independentSource.capture.inputJhdSha256
  };
  for(const [name,hash] of Object.entries(evidence)){
   assert.match(hash??'',SHA256,'Missing original JHora hash '+name);
   assert.equal(sha256(readFileSync(withinRoot(record.captureDir+'/'+name))),hash,'Original JHora raw capture changed: '+name);
  }
 }else assert.equal(record.configAssertion,'INFERRED_NOT_CERTIFIED');
 return ref;
}
function hasComparableProfile(record,ref){
 // A source file with an inferred INI is never evidence for a matched calculation.
 if(!record.hasOriginalJHoraIni||record.configAssertion!=='EXPLICIT_CAPTURED_INI')return false;
 const p=ref.independentSource.capture?.profile;
 return Boolean(p && p.ayanamsa==='SWISS_TRADITIONAL_LAHIRI'
 && p.nodes==='MEAN' && p.positions==='APPARENT' && p.observer==='GEOCENTRIC'
 && p.nutation==='ON' && p.aberration==='ON' && p.deflection==='ON'
 && p.d10==='1-9' && p.ephemeris==='SWISS');
 // Astronomy profile is independent of the separately selected Vimshottari
 // year mode. The old gate demanded dasha-year attestation before it would
 // even *measure* D1/D9/D10, so 20 fully captured JHora charts were all 0/20.

}
function calcCurrent(ref){
 // GitHub Windows installs Python through setup-python while the py.exe launcher
 // may select a different interpreter without pyswisseph. Probe the interpreter
 // actually importing Swiss; do not confuse a missing package with bad JHora data.
 const chosen=process.env.PYTHON_BIN;
 const candidates=chosen?[{bin:chosen,args:chosen==='py'?['-3']:[]}]:
  process.platform==='win32'?[{bin:'python',args:[]},{bin:'py',args:['-3']},{bin:'python3',args:[]}]:
  [{bin:'python3',args:[]},{bin:'python',args:[]}];
 let child;
 for(const candidate of candidates){
  const probe=spawnSync(candidate.bin,[...candidate.args,'-c','import swisseph'],{
   cwd:ROOT,encoding:'utf8',timeout:5000
  });
  if(probe.status!==0)continue;
  child=spawnSync(candidate.bin,[...candidate.args,resolve(ROOT,'tools/swiss_ephemeris.py')],{
   cwd:ROOT,encoding:'utf8',timeout:15000,maxBuffer:300000,
   input:JSON.stringify({utc:ref.civilTime.birthUtc,latitude:ref.civilTime.latitude,longitude:ref.civilTime.longitude})
  });
  break;
 }
 assert.ok(child,'Swiss Ephemeris Python package missing. Install pyswisseph into Python 3 or set PYTHON_BIN.');
 assert.equal(child.status,0,'Swiss ephemeris backend unavailable: '+(child.stderr||child.error?.message||''));
 const eph=JSON.parse(child.stdout);
 const p=new Map(eph.positions.map(x=>[x.name,x.longitude]));p.set('Lagna',eph.ascendant);
 const speeds=new Map(eph.positions.map(x=>[x.name,x.speed]));
 assert.equal(p.size,10);
 return {positions:p,speeds};
}
function compare(ref,observed,comparable,speeds){
 const result={};
 const refPositions=ref.expected.positions,values=BODIES.map(name=>({name,reference:refPositions[name],computed:observed.get(name)}));
 const d10Profile=Number.isInteger(refPositions.Lagna.d10_1_9)?'1-9':'5-8';
 const numerator={
  D1:values.filter(v=>sign(v.computed)===v.reference.d1).length,
  D9:values.filter(v=>sign(divisionalLongitude(v.computed,9))===v.reference.d9).length,
  D10:values.filter(v=>(d10Profile==='1-9'?sign(divisionalLongitude(v.computed,10)):d10JHoraFiveEight(v.computed))===(v.reference.d10_1_9??v.reference.d10_5_8)).length,
  longitude:values.filter(v=>Math.abs(deltaArcsec(v.computed,v.reference.longitude))<=1).length
 };
 const validNak=values.every(v=>Number.isInteger(v.reference.nakshatraIndex)&&Number.isInteger(v.reference.pada));
 const nakMatches=validNak?values.filter(v=>nakshatraOf(v.computed).index===v.reference.nakshatraIndex).length:0;
 const padaMatches=validNak?values.filter(v=>nakshatraOf(v.computed).pada===v.reference.pada).length:0;
 const seven=values.filter(v=>!['Lagna','Rahu','Ketu'].includes(v.name));
 const validRetro=Boolean(speeds)&&seven.every(v=>typeof v.reference.retrograde==='boolean'&&Number.isFinite(speeds.get(v.name)));
 const retroMatches=validRetro?seven.filter(v=>(speeds.get(v.name)<0)===v.reference.retrograde).length:0;
 result.nakshatra={matches:nakMatches,total:10,status:comparable&&validNak?(nakMatches===10?'PASS':'FAIL'):'UNVERIFIED'};
 result.pada={matches:padaMatches,total:10,status:comparable&&validNak?(padaMatches===10?'PASS':'FAIL'):'UNVERIFIED'};
 result.retrograde={matches:retroMatches,total:7,status:comparable&&validRetro?(retroMatches===7?'PASS':'FAIL'):'UNVERIFIED'};
 // House-lord parity must be backed by 12 independently captured house-lord entries.
 // A matching ascendant alone cannot certify an implementation of all lord rules.
 const ascLon=observed.get('Lagna'),lagna=graha('Ascendant',ascLon,ascLon);
 const chartForRules={ascendant:lagna,d1:NINE.map(name=>graha(name,observed.get(name),ascLon,speeds?.get(name)??0))};
 const actualLordFacts=houseLordFacts(chartForRules);
 let lordMatches=0;
 for(let h=1;h<=12;h++){
  const externalHouseSign=((refPositions.Lagna.d1+h-2)%12)+1;
  const expectedRuler=REFERENCE_RULERS[externalHouseSign-1];
  const externalRulerSign=refPositions[expectedRuler].d1;
  const expectedLocatedHouse=((externalRulerSign-refPositions.Lagna.d1+12)%12)+1;
  const actual=actualLordFacts.find(x=>x.values.house===h);
  if(actual?.values.sign===externalHouseSign&&actual?.values.ruler===expectedRuler
   &&actual?.values.locatedSign===externalRulerSign
   &&actual?.values.locatedHouse===expectedLocatedHouse)lordMatches++;
 }
 result.houseLords={matches:lordMatches,total:12,
  evidence:'JHora-recorded D1 signs + separately specified classical Parashari sign-ruler mapping',
  status:comparable?(lordMatches===12?'PASS':'FAIL'):'UNVERIFIED'};
 for(const [name,n] of Object.entries(numerator))result[name]={
  matches:n,total:10,status:comparable?(n===10?'PASS':'FAIL'):(name==='D1'?'CONFIGURATION_DIFFERENCE':'UNVERIFIED')
 };
 const dashaRef=ref.expected.vimshottari||[];
 let dashaMatches=0,subMatches=0,subTotal=0;
 const computed=vimshottari(observed.get('Moon'),ref.civilTime.birthUtc);
 for(const p of dashaRef){
  const c=computed.find(x=>x.lord===p.lord);
  if(c&&c.start.slice(0,10)===p.start)dashaMatches++;
  for(const [lord,date] of Object.entries(p.antardashas||{})){
   subTotal++;
   if(c?.antardashas?.find(x=>x.lord===lord)?.start.slice(0,10)===date)subMatches++;
  }
 }
 result.dasha={
  matches:dashaMatches,total:dashaRef.length,antardashaMatches:subMatches,antardashaTotal:subTotal,
  status:comparable&&ref.independentSource.capture?.profile?.dashaYearVerified===true
   &&ref.independentSource.capture?.profile?.dashaYearDays===365.2425&&dashaRef.length===9&&subTotal===81
    ?(dashaMatches===9&&subMatches===81?'PASS':'FAIL')
    :'YEAR_MODE_UNATTESTED',
  comparisonBasis:'same UTC, Swiss-derived Moon, production 365.2425-day calendar; JHora year setting not independently attested'
 };
 result.profile=comparable?'MATCHED_EXPLICIT_INI':'UNMATCHED_OR_NOT_ATTESTED';
 result.precision='1 arcsec where reference source reports hundredths of arcsecond';
 result.details=values.map(v=>({body:v.name,jhoraLongitude:v.reference.longitude,galaxioraLongitude:v.computed,
  arcseconds:+deltaArcsec(v.computed,v.reference.longitude).toFixed(4)}));
 return result;
}
export function auditCorpus({manifestPath=MANIFEST,minimum=null,verifyAstronomy=true}={}){
 const manifest=loadCorpus(manifestPath),results=[],distinct=new Set(),lagnaSigns=new Set();
 for(const record of manifest.records){
  const ref=verifyReference(record);
  lagnaSigns.add(ref.expected.positions.Lagna.d1);
  const unique=ref.civilTime.birthUtc+'|'+ref.civilTime.latitude+'|'+ref.civilTime.longitude;
  assert.ok(!distinct.has(unique),'Repeated birth event does not count as independent second chart: '+record.id);
  distinct.add(unique);
  const comparable=hasComparableProfile(record,ref);
  const calc=verifyAstronomy?calcCurrent(ref):null;
  const comparison=calc?compare(ref,calc.positions,comparable,calc.speeds):null;
  results.push({id:record.id,provenance:'PINNED_THIRD_PARTY_RECORD',profileStatus:comparable?'EXPLICIT_MATCH':'UNVERIFIED',
    evidenceStatus:record.hasOriginalJHoraIni?'CAPTURE_EVIDENCE_PRESENT':'ORIGINAL_INI_MISSING',
    result:comparison});
 }
 const count=results.length;
 const required=minimum??manifest.minIndependentForCertification;
 // The historical Gandhi record has NO original INI. It is valuable for
 // regression diagnostics but can never sabotage a sufficient attested corpus.
 const comparableResults=results.filter(x=>x.profileStatus==='EXPLICIT_MATCH');
 const matched=comparableResults.length;
 const covered=new Set();
 for(const row of comparableResults){
  const record=manifest.records.find(r=>r.id===row.id);
  covered.add(verifyReference(record).expected.positions.Lagna.d1);
 }
 const signs=['D1','D9','D10','nakshatra','pada','retrograde','houseLords'];
 const signParityCertified=verifyAstronomy&&matched>=required&&covered.size===12
  &&comparableResults.every(x=>signs.every(k=>x.result?.[k]?.status==='PASS'));
 const precise=['longitude','dasha'];
 const precisionCertified=signParityCertified
  &&comparableResults.every(x=>precise.every(k=>x.result?.[k]?.status==='PASS'));
 const status=precisionCertified?'CERTIFIED'
  :signParityCertified?'SIGN_PARITY_CERTIFIED':'NOT_CERTIFIED';
 const blockers=[
  ...(count<required?['INSUFFICIENT_INDEPENDENT_JHORA_EXPORTS']:[]),
  ...(matched<required?['INSUFFICIENT_INI_ATTESTED_IDENTICAL_PROFILES']:[]),
  ...(covered.size<12?['MATCHED_PROFILE_DOES_NOT_COVER_12_LAGNA_SIGNS']:[]),
  ...(matched>0&&verifyAstronomy&&comparableResults.some(x=>signs.some(k=>x.result?.[k]?.status!=='PASS'))?['UNMATCHED_ASTROLOGICAL_FACTS']:[]),
  ...(matched>0&&verifyAstronomy&&comparableResults.some(x=>x.result?.longitude?.status!=='PASS')?['SUB_ARCSECOND_LONGITUDE_NOT_MATCHED']:[]),
  ...(matched>0&&verifyAstronomy&&comparableResults.some(x=>x.result?.dasha?.status!=='PASS')?['VIMSHOTTARI_YEAR_MODE_OR_DATE_MISMATCH']:[])
 ];
 return {stage:'JQA-3',independentJHoraCharts:count,explicitlyMatchedCharts:matched,required,
  distinctLagnaSigns:lagnaSigns.size,requiredLagnaSigns:12,
  comparableLagnaSigns:covered.size,
  signParityCertified,precisionCertified,
  status,results,blockingConditions:blockers};
}
const REQUIRED_INI=['Siddhanta','UserSelectedAyanamsa','DeltaFromUserSelectedAyanamsa','TrueNodes','TruePositions',
 'TopocentricPositions','NoNutation','NoAberration','NoGravDeflection'];
export function parseIni(text){
 const fields={};let section='';
 for(const raw of text.split(/\r?\n/)){
  const line=raw.trim();
  if(line.startsWith('[')&&line.endsWith(']')){section=line.slice(1,-1);continue;}
  const index=line.indexOf('=');
  if(section==='CalculationPreferences'&&index>0)fields[line.slice(0,index).trim()]=line.slice(index+1).trim();
 }
 for(const name of REQUIRED_INI)assert.ok(fields[name]!==undefined,'Missing JHora INI field '+name);
 return fields;
}
function convertJhoraKit(chart,divisionalsRaw){
 assert.equal(chart.meta?.chart_type,'Natal Chart');
 assert.ok(/D-10\s*\((?:1-9|5-8)\)/.test(divisionalsRaw),'D10 calculation mode not explicit in original JHora table');
 const d10Variant=/D-10\s*\(1-9\)/.test(divisionalsRaw)?'1-9':'5-8';
 const d10=chart.divisionals?.['Dasamsa (D10)'],d9=chart.divisionals?.['Navamsa (D9)'];
 assert.ok(d9&&d10&&chart.dashas?.Vimsottari,'missing original varga or Vimshottari JHoraKit data');
 const positions={};
 for(const name of BODIES){
  const p=chart.planets?.[name],nav=d9[name],das=d10[name];
  assert.ok(p&&nav&&das,'JHoraKit missing body '+name);
  assert.ok(Number.isFinite(p.longitude),'invalid original longitude '+name);
  const lon=p.longitude;
  assert.equal(sign(lon),SIGNS.indexOf(p.sign)+1,'JHora body sign inconsistency '+name);
  const navSign=SIGNS.indexOf(nav.sign)+1,dasSign=SIGNS.indexOf(das.sign)+1;
  assert.ok(navSign>=1&&dasSign>=1,'unrecognized divisional sign '+name);
  assert.equal(navSign,sign(divisionalLongitude(lon,9)),'JHora D9 disagrees with original body longitude '+name);
  if(d10Variant==='5-8')assert.equal(dasSign,d10JHoraFiveEight(lon),'JHora 5-8 D10 mismatch '+name);
  else assert.equal(dasSign,sign(divisionalLongitude(lon,10)),'JHora 1-9 D10 mismatch '+name);
  positions[name]={longitude:lon,d1:sign(lon),d9:navSign,
   [d10Variant==='5-8'?'d10_5_8':'d10_1_9']:dasSign,
   nakshatra:p.nakshatra,pada:p.pada,retrograde:p.retrograde};
 }
 const vims=chart.dashas.Vimsottari.periods;
 assert.equal(Object.keys(vims).length,9,'all major Vimshottari periods required');
 const vimshottari=Object.entries(vims).map(([lord,v])=>{
  assert.match(v.start,/^\d{4}-\d{2}-\d{2}$/);
  assert.equal(Object.keys(v.antardashas).length,9,'all nine antardashas must be present '+lord);
  return {lord,start:v.start,antardashas:v.antardashas};
 });
 return {positions,vimshottari,d10Variant};
}
/** JHora omits the zero-padding on midnight hours (0:20:00 instead of 00:20:00).
 * Compare validated wall-clock fields, never date/time strings or raw UTC guesses.
 */
export function normalizeJHoraClock(value){
 assert.match(value??'',/^\d{1,2}:\d{2}:\d{2}$/,'Invalid JHora clock representation');
 const [hour,minute,second]=value.split(':').map(Number);
 assert.ok(hour>=0&&hour<=23&&minute>=0&&minute<=59&&second>=0&&second<=59,'Invalid JHora wall-clock time');
 return [hour,minute,second].map(v=>String(v).padStart(2,'0')).join(':');
}
export function importCapture(captureDir,outputFile){
 const input=resolve(captureDir),out=withinRoot(outputFile),read=name=>readFileSync(resolve(input,name));
 for(const name of ['chart_data.txt','divisionals.txt','input.jhd','jhora.ini','capture.json']){
  assert.ok(existsSync(resolve(input,name)),'Original independent JHora evidence missing: '+name);
 }
 const rawChart=read('chart_data.txt'),rawDiv=read('divisionals.txt'),rawIni=read('jhora.ini');
 const meta=JSON.parse(read('capture.json'));
 const ini=parseIni(rawIni.toString('utf8'));
 assert.match(meta.jhoraExeSha256??'',SHA256);
 assert.match(meta.jhoraVersion??'',/^8\./);
 assert.match(meta.sourceCommit??'',SHA);
 assert.match(meta.utc??'',/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
 assert.match(meta.birthLocal??'',/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
 assert.ok(Number.isFinite(meta.latitude)&&Number.isFinite(meta.longitude));
 assert.ok(Number.isInteger(meta.utcOffsetSeconds)&&Math.abs(meta.utcOffsetSeconds)<=14*3600);
 assert.equal(Date.parse(meta.birthLocal+'Z')-meta.utcOffsetSeconds*1000,Date.parse(meta.utc));
 const parsed=parseJHoraRaw(rawChart.toString('utf8'),rawDiv.toString('utf8'));
 const sourceDate=new Date(parsed.birth.date+' 00:00:00 GMT').toISOString().slice(0,10);
 assert.equal(sourceDate,meta.birthLocal.slice(0,10),'Original JHora date differs from requested input');
 assert.equal(normalizeJHoraClock(parsed.birth.time),normalizeJHoraClock(meta.birthLocal.slice(11)),
  'Original JHora time differs from requested input');
 // JHora spells UTC zero as '0:00:00 (West of GMT)'; -0 and +0 denote the same exact offset.
 assert.equal(parsed.birth.utcOffsetSeconds+0,meta.utcOffsetSeconds+0,'Original JHora offset differs from input');
 assert.ok(Math.abs(parsed.birth.latitude-meta.latitude)<1e-7,'JHora encoded latitude differs from reported capture latitude');
 assert.ok(Math.abs(parsed.birth.longitude-meta.longitude)<1e-7,'JHora encoded longitude differs from reported capture longitude');
 assert.equal(meta.jhoraConfigurationCapturedBeforeRun,true);
 assert.equal(meta.jhoraConfigurationRestoredAfterRun,true);
 const variant=parsed.d10Variant;
 const explicitMatching=ini.Siddhanta==='0'&&ini.UserSelectedAyanamsa==='0'&&
   Number(ini.DeltaFromUserSelectedAyanamsa)===0&&ini.TrueNodes==='0'&&
   ini.TruePositions==='0'&&ini.TopocentricPositions==='0'&&
   ini.NoNutation==='0'&&ini.NoAberration==='0'&&ini.NoGravDeflection==='0'&&
   variant==='1-9';
 const yearMatch=rawIni.toString('utf8').match(/^YearLength=0\s+([0-9.]+)$/m);
 const rawDays=yearMatch?Number(yearMatch[1]):null;
 const yearAttested=meta.dashaYearEvidence==='JHORA_PREFERENCES_RECORDER' &&
  Number.isFinite(rawDays)&&rawDays===meta.dashaYearDays;
 const p={
  ayanamsa:explicitMatching?'SWISS_TRADITIONAL_LAHIRI':'OTHER_JHORA_CONFIG',
  nodes:ini.TrueNodes==='0'?'MEAN':'TRUE',positions:ini.TruePositions==='0'?'APPARENT':'TRUE',
  observer:ini.TopocentricPositions==='0'?'GEOCENTRIC':'TOPOCENTRIC',
  nutation:ini.NoNutation==='0'?'ON':'OFF',aberration:ini.NoAberration==='0'?'ON':'OFF',
  deflection:ini.NoGravDeflection==='0'?'ON':'OFF',ephemeris:ini.Siddhanta==='0'?'SWISS':'OTHER',
  d10:variant,dashaYearDays:rawDays,dashaYearVerified:yearAttested
 };
 assert.ok(relative(ROOT,out).startsWith('tests/fixtures/jhora-corpus/'),'Unsafe imported fixture path');
 const chartJson=existsSync(resolve(input,'chart.json'))?read('chart.json'):null;
 const fixture={
  title:meta.id,
  independentSource:{
   tool:'Jagannatha Hora 8.0: direct raw original JHora clipboard export via JHoraKit/AHK driver',
   captureRepository:meta.sourceRepo??'https://github.com/normalmystic/JHoraKit',
   captureCommit:meta.sourceCommit,
   capture:{
    parser:JQA3_RAW_PARSER,iniSha256:sha256(rawIni),rawChartSha256:sha256(rawChart),
    rawDivisionalsSha256:sha256(rawDiv),inputJhdSha256:sha256(read('input.jhd')),
    parsedJsonSha256:chartJson?sha256(chartJson):null,
    captureJsonSha256:sha256(read('capture.json')),
    jhoraExeSha256:meta.jhoraExeSha256,jhoraVersion:meta.jhoraVersion,
    profile:p,iniSettings:ini,
    originalAyanamsaDegrees:parsed.birth.ayanamsaDegrees
   }
  },
  civilTime:{birthUtc:meta.utc,latitude:meta.latitude,longitude:meta.longitude},
  expected:parsed.expected
 };
 mkdirSync(dirname(out),{recursive:true});
 writeFileSync(out,JSON.stringify(fixture,null,2)+'\n');
 return {file:relative(ROOT,out),sha256:sha256(readFileSync(out)),
  gitBlobSha1:gitSha(readFileSync(out)),
  bodyCount:Object.keys(parsed.expected.positions).length,
  mahaCount:parsed.expected.vimshottari.length,
  antarCount:parsed.expected.vimshottari.reduce((n,p)=>n+Object.keys(p.antardashas).length,0),
  sourceMode:variant,profileMatches:explicitMatching,yearAttested};
}

/** Register a complete original raw capture in the pinned corpus without hand-editing expected values. */
export function registerCapture(normalizedFile){
 const file=withinRoot(normalizedFile);
 assert.ok(relative(ROOT,file).startsWith('tests/fixtures/jhora-corpus/'));
 const reference=JSON.parse(readFileSync(file,'utf8'));
 const id=reference.title;
 assert.match(id,/^[a-z0-9-]{5,100}$/);
 const manifest=loadCorpus();
 assert.ok(!manifest.records.some(r=>r.id===id),'Do not overwrite an existing independent capture');
 const record={
  id,evidenceKind:'RECORDED_JHORA_EXPORT',captureType:'JHORAKIT_DIRECT_CAPTURE',
  sourceRepo:reference.independentSource.captureRepository,
  sourceCommit:reference.independentSource.captureCommit,
  originalRawPaths:['chart_data.txt','divisionals.txt','input.jhd','jhora.ini',
   ...(existsSync(withinRoot('tests/fixtures/jhora-corpus/captures/'+id+'/chart.json'))?['chart.json']:[])],
  captureDir:'tests/fixtures/jhora-corpus/captures/'+id,
  referenceFile:relative(ROOT,file),referenceGitBlobSha1:gitSha(readFileSync(file)),
  hasOriginalJHoraIni:true,configAssertion:'EXPLICIT_CAPTURED_INI',
  notes:'Raw clipboard dumps, original JHora INI and reproducible file hashes preserved.'
 };
 verifyReference(record);
 manifest.records.push(record);
 writeFileSync(withinRoot(MANIFEST),JSON.stringify(manifest,null,2)+'\n');
 return record;
}

const isEntry=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isEntry){
 try{
  const command=process.argv[2]??'audit';
  if(command==='import'){
   assert.equal(process.argv.length,5,'usage: import <capture-directory> <repo-relative-fixture-output>');
   console.log(JSON.stringify(importCapture(process.argv[3],process.argv[4]),null,2));
  }else if(command==='register'){
   assert.equal(process.argv.length,4,'usage: register <repo-relative-normalized-fixture>');
   console.log(JSON.stringify(registerCapture(process.argv[3]),null,2));
  }else if(command==='audit'||command==='certify'||command==='certify-signs'){
   const audit=auditCorpus();
   if(command==='certify-signs'){
    console.log(JSON.stringify({stage:audit.stage,sourceCharts:audit.independentJHoraCharts,
     matchedProfileCharts:audit.explicitlyMatchedCharts,
     matchedLagnaSigns:audit.comparableLagnaSigns,
     status:audit.status,signParityCertified:audit.signParityCertified,
     precisionCertified:audit.precisionCertified,
     failures:audit.blockingConditions},null,2));
    if(!audit.signParityCertified)process.exitCode=2;
   }else{
    console.log(JSON.stringify(audit,null,2));
    if(command==='certify'&&audit.status!=='CERTIFIED')process.exitCode=2;
   }
  }else throw Error('Unknown JQA-3 command: '+command);
 }catch(error){console.error('JQA-3 evidence gate failed: '+String(error));process.exitCode=1;}
}
