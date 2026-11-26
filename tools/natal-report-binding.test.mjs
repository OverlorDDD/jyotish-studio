import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveVerifiedReportChart} from '../apps/web/lib/natal-report-binding.ts';

const digest=x=>x.repeat(64);
const input={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52,place:'Kyiv, Ukraine'};
const chart=(hash,overrides={})=>({input:{...input,...overrides},
 verification:{version:'jyotish-integrity-v3',status:'verified_internal',digest:hash},
 d1:[{name:'Sun'}],n4:{verified:true}});
const good=x=>x?.verification?.version==='jyotish-integrity-v3'&&
 x.verification.status==='verified_internal'&&/^[a-f0-9]{64}$/.test(x.verification.digest)&&
 Array.isArray(x.d1)&&x.d1.length>0&&x.n4?.verified===true;

test('matching report retains original chart and avoids redundant verified chart transport',()=>{
 const current=chart(digest('a'));
 const bound=resolveVerifiedReportChart(current,{verification:current.verification},good);
 assert.equal(bound.chart,current);assert.equal(bound.rebound,false);
});
test('stale chart from earlier release atomically rebinds to independently verified report chart',()=>{
 const current=chart(digest('a')),recomputed=chart(digest('b'));
 const bound=resolveVerifiedReportChart(current,{verification:recomputed.verification,verifiedChart:recomputed},good);
 assert.equal(bound.chart,recomputed);assert.equal(bound.rebound,true);
});
test('mismatch never succeeds without a server-supplied newly verified chart',()=>{
 const current=chart(digest('a')),recomputed=chart(digest('b'));
 assert.throws(()=>resolveVerifiedReportChart(current,{verification:recomputed.verification},good),/report_chart_mismatch/);
});
test('tampered chart digest, time, timezone, place and coords are all rejected',()=>{
 const current=chart(digest('a')),proof=chart(digest('b'));
 for(const changes of [
  {date:'2000-01-02'},{time:'12:01'},{timeZone:'Europe/Kyiv'},
  {latitude:50.46},{longitude:30.521},{place:'Different city'}
 ]){
  assert.throws(()=>resolveVerifiedReportChart(current,{
   verification:proof.verification,verifiedChart:chart(digest('b'),changes)},good),/report_chart_mismatch/);
 }
 assert.throws(()=>resolveVerifiedReportChart(current,{
  verification:proof.verification,verifiedChart:chart(digest('c'))},good),/report_chart_mismatch/);
});
test('unverified report or invalid canonical N4 chart can never bypass integrity check',()=>{
 const current=chart(digest('a'));
 assert.throws(()=>resolveVerifiedReportChart(current,{
  verification:{version:'jyotish-integrity-v3',status:'unverified',digest:digest('b')},
  verifiedChart:chart(digest('b'))},good),/report_verification_invalid/);
 assert.throws(()=>resolveVerifiedReportChart(current,{
  verification:chart(digest('b')).verification,
  verifiedChart:{...chart(digest('b')),n4:null}},good),/report_chart_mismatch/);
});
