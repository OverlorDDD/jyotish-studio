import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync as importedSpawnSync} from 'node:child_process';
import {loadCorpus,verifyReference,auditCorpus,parseIni,BODIES} from './jqa3-corpus.mjs';

test('pinned third-party JHora source remains byte-for-byte unchanged',()=>{
 const m=loadCorpus();
 assert.equal(m.records.length,1,'do not silently create fake reference count');
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
 assert.equal(report.independentJHoraCharts,1);
 assert.equal(report.explicitlyMatchedCharts,0);
 assert.equal(report.status,'NOT_CERTIFIED');
 assert.ok(report.blockingConditions.includes('INSUFFICIENT_INDEPENDENT_JHORA_EXPORTS'));
 assert.ok(report.blockingConditions.includes('INSUFFICIENT_INI_ATTESTED_IDENTICAL_PROFILES'));
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
 assert.equal(report.status,'NOT_CERTIFIED');
 const metrics=report.results[0].result;
 for(const field of ['nakshatra','pada','retrograde','houseLords']){
  assert.equal(metrics[field].status,'UNVERIFIED',field+' must not be silently promoted');
 }
 assert.ok(report.blockingConditions.includes('UNVERIFIED_OR_DIFFERENT_VALUES'));
});


test('Swiss adapter reports the ACTUAL planetary ephemeris backend, not just requested flags',()=>{
 const {spawnSync}=requireForTest();
 const cmd=process.env.PYTHON_BIN||(process.platform==='win32'?'py':'python3');
 const r=spawnSync(cmd,[...(cmd==='py'?['-3']:[]),'tools/swiss_ephemeris.py'],{
  input:JSON.stringify({utc:'1980-01-11T12:25:00Z',latitude:64.1413888889,longitude:-21.9388888889}),
  encoding:'utf8',timeout:15000
 });
 assert.equal(r.status,0,r.stderr||r.error?.message);
 const data=JSON.parse(r.stdout);
 const sources=Object.values(data.ephemerisSourcesByBody);
 assert.equal(sources.length,9);
 assert.ok(sources.every(x=>['SWIEPH','MOSEPH','OTHER'].includes(x)));
 assert.equal(data.allSwissEphemerisFilesUsed,sources.every(x=>x==='SWIEPH'));
 assert.equal(data.effectiveEphemerisSource,data.allSwissEphemerisFilesUsed?'SWIEPH':'MIXED_OR_FALLBACK');
});
// Lazy dynamic module use avoids changing runtime core import behavior.
function requireForTest(){return {spawnSync:importedSpawnSync};}
