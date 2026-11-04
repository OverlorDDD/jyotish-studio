/**
 * JQA-3.2 provenance-preserving replay of ORIGINAL JHora 8.0 clipboard exports
 * from the immutable GitHub Actions artifact in run 39962145837.
 *
 * This does NOT run Swiss to produce reference answers, and NEVER marks numeric
 * comparison CERTIFIED. It only ingests original clipboard, INI and JHD bytes.
 *
 * Run: node --experimental-strip-types tools/jqa3-recover-archived.mjs <unzipped-artifact-dir>
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {importCapture,registerCapture,loadCorpus,auditCorpus} from './jqa3-corpus.mjs';
import {parseJHoraRaw} from './jqa3-raw-parser.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ARCHIVE_RUN='39962145837';
const ARTIFACT='12505264277';
const ARCHIVE_SHA256='b937a0d9d7ccffda36cc3079fc608d8471b87855626cc588111e4b50d7924c0f';
const UPSTREAM='f63826b501eabe69c6b08c5365875e1e2f74c24a';
const archiveDir=process.argv[2]&&resolve(process.argv[2]);
assert.ok(archiveDir&&existsSync(join(archiveDir,'captures')),'Unzipped original JHora archive is required');
const matrix=readFileSync(join(ROOT,'tests/fixtures/jhora-corpus/capture-matrix.psv'),'utf8')
 .split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>x.split('|')[0]);
assert.equal(matrix.length,20,'Expected 20 fixed independent capture requests');
assert.equal(new Set(matrix).size,20);
const captureRoot=join(ROOT,'tests/fixtures/jhora-corpus/captures');
const manifestPath=join(ROOT,'tests/fixtures/jhora-corpus/manifest.json');
const manifest=loadCorpus();
assert.deepEqual(manifest.records.map(x=>x.id),['jhora8-gandhi-1869-public'],
 'Corpus already has captures; refuse duplicate or destructive recovery');
assert.ok(!existsSync(captureRoot)||readdirSync(captureRoot).length===0,
 'Preserve existing captured evidence; do not overwrite it');

const checksum=buf=>createHash('sha256').update(buf).digest('hex');
const originalFiles=['chart_data.txt','divisionals.txt','input.jhd','jhora.ini','capture.json'];
const uniqueChartHashes=new Set(),lagnaSigns=new Set(),exeHashes=new Set();
const events=[];
// Validate the entire original archive BEFORE writing a single reference.
for(const id of matrix){
 const dir=join(archiveDir,'captures',id);
 assert.ok(existsSync(dir),'Original capture missing '+id);
 const blobs={};
 for(const file of originalFiles){
  const src=join(dir,file);
  assert.ok(existsSync(src)&&statSync(src).isFile()&&statSync(src).size>50,
   'Original JHora file missing or empty: '+id+'/'+file);
  blobs[file]=readFileSync(src);
 }
 const meta=JSON.parse(blobs['capture.json'].toString('utf8'));
 assert.equal(meta.id,id,'Mismatched original capture ID');
 assert.equal(meta.sourceCommit,UPSTREAM,'Unexpected JHoraKit automation version');
 assert.match(meta.jhoraExeSha256,/^[a-f0-9]{64}$/,'JHora executable SHA required');
 assert.equal(meta.jhoraVersion,'8.0.0.0','Source binary version not attested');
 assert.equal(meta.jhoraConfigurationCapturedBeforeRun,true);
 assert.equal(meta.jhoraConfigurationRestoredAfterRun,true);
 const chart=blobs['chart_data.txt'].toString('utf8'),div=blobs['divisionals.txt'].toString('utf8');
 assert.ok(chart.includes('C:\\windows\\temp\\'+id),'Original clipboard references wrong chart '+id);
 const parsed=parseJHoraRaw(chart,div); // cross-check 10 objects, D1/D9/D10 and 9×9 ORIGINAL dasha
 lagnaSigns.add(parsed.expected.positions.Lagna.d1);
 uniqueChartHashes.add(checksum(blobs['chart_data.txt']));
 exeHashes.add(meta.jhoraExeSha256);
 // Contemporaneous action metadata is original evidence, not a certification of method.
 events.push({id,lagnaSign:parsed.expected.positions.Lagna.d1,
  chartSha256:checksum(blobs['chart_data.txt']),
  iniSha256:checksum(blobs['jhora.ini']),
  divisionalsSha256:checksum(blobs['divisionals.txt']),
  exeSha256:meta.jhoraExeSha256,
  maha:parsed.expected.vimshottari.length,
  antar:parsed.expected.vimshottari.reduce((n,p)=>n+Object.keys(p.antardashas).length,0)});
}
assert.equal(uniqueChartHashes.size,20,'Duplicate JHora clipboard detected');
assert.equal(lagnaSigns.size,12,'12 distinct independently observed lagna signs required');
assert.equal(exeHashes.size,1,'All JHora recordings must use one verified binary');

mkdirSync(captureRoot,{recursive:true});
for(const id of matrix){
 const source=join(archiveDir,'captures',id),destination=join(captureRoot,id);
 assert.ok(!existsSync(destination),'Never overwrite genuine capture '+id);
 cpSync(source,destination,{recursive:true,errorOnExist:true,force:false});
 const fixture='tests/fixtures/jhora-corpus/'+id+'.json';
 const normalized=importCapture(destination,fixture);
 assert.equal(normalized.bodyCount,10);
 assert.equal(normalized.mahaCount,9);
 assert.equal(normalized.antarCount,81);
 const archivedFixture=join(archiveDir,id+'.json');
 if(existsSync(archivedFixture)){
  assert.equal(checksum(readFileSync(join(ROOT,fixture))),checksum(readFileSync(archivedFixture)),
   'Previously accepted independent reference changed while replaying '+id);
 }
 registerCapture(fixture);
 console.log('JQA3 ORIGINAL ACCEPTED '+id+' lagna='+events.find(x=>x.id===id).lagnaSign);
}
const audit=auditCorpus({verifyAstronomy:false});
assert.equal(audit.independentJHoraCharts,21,'Expected 20 recovered originals and one historical public record');
assert.equal(audit.distinctLagnaSigns,12);
assert.equal(audit.status,'NOT_CERTIFIED','Do not silently promote raw corpus to numeric accuracy certificate');
const summary={
 stage:'JQA-3.2',source:'ORIGINAL_JHORA_8_CLIPBOARD_AND_INI',referenceCaptureRun:ARCHIVE_RUN,
 referenceArtifactId:ARTIFACT,referenceArchiveSha256:ARCHIVE_SHA256,
 originalIndependentExports:20,legacyPublicWithoutIni:1,
 uniqueOriginalChartHashes:uniqueChartHashes.size,distinctLagnaSigns:lagnaSigns.size,
 uniqueJHoraExecutableHashes:exeHashes.size,sourceJHoraExeSha256:[...exeHashes][0],
 status:'ORIGINAL_EVIDENCE_PRESERVED_NUMERICAL_PARITY_NOT_CERTIFIED',
 limitation:'YearLength stored in INI but separately attested JHora dasha preference selection is not recorded. Do not certify Vimshottari yet.',
 events
};
const out=join(ROOT,'docs/research/jqa3-2-recovered-evidence.json');
mkdirSync(dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify(summary,null,2)+'\n');
console.log('JQA3.2 COMPLETE: 20 original chart recordings, 12 lagna signs, 9x9 dasha tables each; NOT numeric CERTIFIED.');
