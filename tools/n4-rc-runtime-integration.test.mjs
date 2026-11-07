import test from 'node:test';
import assert from 'node:assert/strict';
import {runCalculation} from '../apps/api/src/logic.ts';
import {N4_RC_DIVISIONS} from '../apps/api/src/n4-rc-contract.ts';
import {hasN4RcView} from '../apps/web/lib/n4-rc-view.ts';
/** Full runtime path: real native SWIEPH + true-sidereal Sun -> core D1/D9/D10
 * -> jyotish-integrity-v3 -> N4 15-map contract -> exact browser validator.
 * No private birth data or network/API/DB, synthetic arbitrary dates only.
 */
test('real full production SWIEPH natal path yields source-bound 15-varga without D60',async()=>{
 const previous=process.env.ALLOW_PYTHON_SWISSEPH;
 process.env.ALLOW_PYTHON_SWISSEPH='0';
 try{
  const r=await runCalculation({
   date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',
   latitude:50.45,longitude:30.5234,place:'SYNTHETIC_TEST_ONLY'
  });
  assert.equal(r.verification.version,'jyotish-integrity-v3');
  assert.equal(r.verification.status,'verified_internal');
  assert.equal(r.verification.externalReferenceChecked,false);
  assert.match(r.ephemeris,/verified-SWIEPH/);
  assert.equal(r.n4.sourceDigest,r.verification.digest);
  assert.equal(r.n4.charts.length,15);
  assert.deepEqual(r.n4.charts.map(x=>x.division),[...N4_RC_DIVISIONS]);
  assert.ok(!r.n4.charts.some(x=>x.division===60));
  assert.equal(r.n4.externalJhoraPerBirthCertified,false);
  assert.ok(hasN4RcView(r));
  assert.ok(r.config.dashaYearMode);
  assert.equal(r.dasha.length,9);
 }finally{
  if(previous===undefined)delete process.env.ALLOW_PYTHON_SWISSEPH;
  else process.env.ALLOW_PYTHON_SWISSEPH=previous;
 }
});
test('DST spring gap and autumn fold cannot silently create synthetic natal charts',async()=>{
 for(const input of [
  {date:'2024-03-31',time:'03:30',timeZone:'Europe/Kyiv',latitude:50.45,longitude:30.52},
  {date:'2024-10-27',time:'03:30',timeZone:'Europe/Kyiv',latitude:50.45,longitude:30.52},
 ]){
  await assert.rejects(()=>runCalculation(input),/Nonexistent local time|Ambiguous local time/);
 }
});
