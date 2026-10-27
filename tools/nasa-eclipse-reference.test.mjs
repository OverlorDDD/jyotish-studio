import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const original=JSON.parse(readFileSync(new URL('../docs/research/nasa-eclipses-2027-fixture.json',import.meta.url),'utf8'));
const root=resolve(new URL('..',import.meta.url).pathname);
const python=process.env.PYTHON_BIN||(process.platform==='win32'?'py':'python3');
const args=[...(python==='py'?['-3']:[]),resolve(root,'tools/astronomy-eclipses.py')];
function search(payload){
 const r=spawnSync(python,args,{input:JSON.stringify(payload),encoding:'utf8',timeout:55000,maxBuffer:1024*1024});
 assert.equal(r.status,0,'Swiss eclipse reference search: '+(r.stderr||r.error?.message||''));
 return JSON.parse(r.stdout);
}
test('AE-P6 Swiss global solar/lunar eclipse types and UTC maxima independently match all 5 NASA 2027 originals', {timeout:65000},()=>{
 const data=search({startUtc:'2027-01-01T00:00:00.000Z',endUtc:'2028-01-01T00:00:00.000Z',
 latitude:50.4501,longitude:30.5234,altitudeM:0});
 assert.equal(original.referenceTimeScale,'UT (published by NASA to the nearest whole minute)');
 assert.equal(data.independentVisibilityCertified,false);
 assert.equal(data.events.length,original.events.length,'Must match all NASA GSFC catalog eclipses, not just a sample');
 for(const expected of original.events){
  const actual=data.events.find(x=>x.type===expected.type&&
   x.maximumUtc.slice(0,10)===expected.utc.slice(0,10));
  assert.ok(actual,'Swiss omitted NASA global event '+expected.utc);
  assert.equal(actual.eclipseKind,expected.eclipseKind,expected.utc+' type');
  assert.ok(Math.abs(Date.parse(actual.maximumUtc)-Date.parse(expected.utc))<=
   original.validationToleranceMinutes*60000,
   expected.utc+' expected independently catalogued maximum within <=15min: '+actual.maximumUtc);
  assert.equal(typeof actual.visibleHere,'boolean','Local visibility must use Swiss when_loc, not a guessed string');
  assert.equal(actual.localMaximumUtc===null,!actual.visibleHere,'Never fabricate a local maximum if not visible');
 }
});
test('AE-P6 eclipse engine fails closed for invalid coordinates',()=>{
 const r=spawnSync(python,args,{input:JSON.stringify({
  startUtc:'2027-01-01T00:00:00.000Z',endUtc:'2028-01-01T00:00:00.000Z',
  latitude:100,longitude:30.5234}),encoding:'utf8',timeout:10000});
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/Invalid observer coordinates/);
});
