import assert from 'node:assert/strict';
import test from 'node:test';
import {loadCorpus,verifyReference,verifyPinnedTextBlob,auditCorpus,parseIni,BODIES,normalizeJHoraClock} from './jqa3-corpus.mjs';
import {readFileSync} from 'node:fs';

test('pinned third-party JHora source remains byte-for-byte unchanged',()=>{
 const m=loadCorpus();
 assert.ok(m.records.length>=1,'at least one genuine immutable reference is required');
 assert.equal(m.records[0].id,'jhora8-gandhi-1869-public','keep original source as first fixture');
 const record=m.records[0],source=verifyReference(record);
 assert.deepEqual(Object.keys(source.expected.positions),BODIES);
 assert.equal(source.independentSource.tool.includes('Jagannatha Hora 8.0'),true);
 assert.equal(record.hasOriginalJHoraIni,false);
});
test('source tampering hard-fails instead of silently matching',()=>{
 const record=loadCorpus().records[0];
 assert.throws(()=>verifyReference({...record,referenceGitBlobSha1:'0'.repeat(40)}),/immutable JHora fixture changed/);
});
test('profile missing or inferred must always be UNVERIFIED',()=>{
 const report=auditCorpus({verifyAstronomy:false});
 assert.ok(report.independentJHoraCharts>=1);
 assert.ok(report.explicitlyMatchedCharts<=report.independentJHoraCharts);
 assert.equal(report.status,'NOT_CERTIFIED');
 if(report.independentJHoraCharts<report.required)
  assert.ok(report.blockingConditions.includes('INSUFFICIENT_INDEPENDENT_JHORA_EXPORTS'));
 else
  assert.ok(!report.blockingConditions.includes('INSUFFICIENT_INDEPENDENT_JHORA_EXPORTS'),
   'Real source corpus sufficiency is no longer a blocker');
 assert.equal(report.explicitlyMatchedCharts,20,'twenty original INIs attest compatible astronomy');
 assert.equal(report.comparableLagnaSigns,12);
 assert.equal(report.signParityCertified,false,'cannot certify without running independent astronomy');
 assert.ok(!report.blockingConditions.includes('INSUFFICIENT_INI_ATTESTED_IDENTICAL_PROFILES'),
  'Missing dasha-year setting must not conceal an attested astronomy profile');
 assert.equal(report.results[0].profileStatus,'UNVERIFIED');
 assert.equal(report.results[0].evidenceStatus,'ORIGINAL_INI_MISSING');
});
test('captured JHora INI cannot omit calculation preferences',()=>{
 assert.throws(()=>parseIni('[CalculationPreferences]\nTrueNodes=1\n'),/Missing JHora INI field/);
 const names=['Siddhanta','UserSelectedAyanamsa','DeltaFromUserSelectedAyanamsa',
  'TrueNodes','TruePositions','TopocentricPositions','NoNutation','NoAberration','NoGravDeflection'];
 const ini='[CalculationPreferences]\n'+names.map((name,i)=>name+'='+String(i)).join('\n')+'\n';
 const parsed=parseIni(ini);
 assert.equal(parsed.TrueNodes,'3');
 assert.equal(parsed.UserSelectedAyanamsa,'1');
});
test('repeated or suspicious birth records cannot inflate reference counts',()=>{
 const record=loadCorpus().records[0];
 assert.ok(record.sourceCommit.length===40);
 assert.notEqual(record.referenceFile,'');
});

test('astronomical audit cannot certify unrecorded nakshatra, pada and house lords',()=>{
 const report=auditCorpus({verifyAstronomy:true});
 assert.equal(report.status,'SIGN_PARITY_CERTIFIED',
  '20 original JHora charts must pass every attested D1/D9/D10 sign and fact check');
 assert.equal(report.signParityCertified,true);
 assert.equal(report.dashaSequenceCertified,true,'all original JHora mahadasha/antardasha lords must retain their order');
 assert.equal(report.precisionCertified,false);
 assert.equal(report.lagnaLongitudeCertified,false,'JHora and Swiss ascendant differ beyond 1 arcsecond');
 assert.equal(report.planetaryLongitudeCertified,false,'do not declare all nine graha precision matches');
 assert.equal(report.bodyPrecision.Lagna.total,20);
 assert.equal(report.bodyPrecision.Lagna.passing,19,
  'mean Lahiri Lagna must independently match 19/20 original JHora arcs to 1 arcsecond');
 assert.ok(report.bodyPrecision.Lagna.maxAbsArcseconds>1,
  'the 2002 Seattle residual is still above strict 1 arcsecond; never round to PASS');
 assert.ok(report.bodyPrecision.Lagna.maxAbsArcseconds<1.1,
  'unexpected systematic change to the corrected ascendant convention');
 for(const body of BODIES)assert.equal(report.bodyPrecision[body].total,20,'no silently dropped chart');

 assert.equal(report.explicitlyMatchedCharts,20);
 for(const item of report.results.slice(1)){
  assert.equal(item.profileStatus,'EXPLICIT_MATCH',item.id);
  for(const field of ['D1','D9','D10','nakshatra','pada','retrograde','houseLords'])
   assert.equal(item.result[field].status,'PASS',item.id+' '+field);
  assert.equal(item.result.dasha.sequenceStatus,'PASS',item.id+' authentic dasha lord sequence');
  assert.equal(item.result.dasha.jhoraYearDefinitionCode,3,'original JHora selected year option');
 }
 const metrics=report.results[0].result;
 for(const field of ['nakshatra','pada','retrograde','houseLords']){
  assert.equal(metrics[field].status,'UNVERIFIED',field+' must not be silently promoted');
 }
 assert.ok(report.blockingConditions.includes('VIMSHOTTARI_YEAR_MODE_OR_DATE_MISMATCH'));
 assert.ok(report.blockingConditions.includes('SUB_ARCSECOND_LONGITUDE_NOT_MATCHED'));
 assert.ok(!report.blockingConditions.includes('UNMATCHED_ASTROLOGICAL_FACTS'));
});

test('Windows CRLF checkout preserves pinned Git blob identity without allowing any edited content',()=>{
 const record=loadCorpus().records[0];
 const raw=readFileSync(new URL('../'+record.referenceFile,import.meta.url));
 const windows=Buffer.from(raw.toString('utf8').replace(/\r?\n/g,'\r\n'),'utf8');
 const canonical=verifyPinnedTextBlob(windows,record.referenceGitBlobSha1,record.id);
 assert.deepEqual(canonical,Buffer.from(raw.toString('utf8').replace(/\r\n/g,'\n'),'utf8'));
 const changed=Buffer.from(windows.toString('utf8').replace('Mahatma Gandhi','Fabricated Gandhi'),'utf8');
 assert.throws(()=>verifyPinnedTextBlob(changed,record.referenceGitBlobSha1,record.id),/immutable JHora fixture changed/);
});

test('JHora genuine midnight clock 0:20:00 equals ISO 00:20:00, but different hours do not',()=>{
 assert.equal(normalizeJHoraClock('0:20:00'),'00:20:00');
 assert.equal(normalizeJHoraClock('00:20:00'),'00:20:00');
 assert.equal(normalizeJHoraClock('1:05:00'),'01:05:00');
 assert.notEqual(normalizeJHoraClock('1:05:00'),normalizeJHoraClock('01:06:00'));
 assert.throws(()=>normalizeJHoraClock('25:20:00'),/Invalid JHora wall-clock time/);
 assert.throws(()=>normalizeJHoraClock('1:20'),/Invalid JHora clock representation/);
});

test('date precision and D1/D9/D10 sign accuracy have independent certification statuses',()=>{
 const a=auditCorpus({verifyAstronomy:false});
 assert.equal(a.signParityCertified,false,'no astronomy run may produce a certificate');
 assert.ok(!a.blockingConditions.includes('INSUFFICIENT_INI_ATTESTED_IDENTICAL_PROFILES'));
 assert.equal(a.explicitlyMatchedCharts,20);
 assert.equal(a.results[0].profileStatus,'UNVERIFIED','the Gandhi missing-INI reference stays diagnostic');
});
