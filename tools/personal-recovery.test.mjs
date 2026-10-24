import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart,graha,vimshottari,divisionalLongitude} from '../packages/jyotish-core/src/index.ts';
import {isCurrentVerifiedChart,originalSignsAgree,sourceFingerprint,personalRecoveryVersion,resolvePersonalChart} from '../apps/api/src/personal-chart-recovery.ts';
const input={date:'1996-03-27',time:'12:58',timeZone:'Europe/Kyiv',latitude:47.9105,longitude:33.3918};
const positions=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>({name,longitude:12+i*35,speed:1}));
const eph={ascendant:97,ayanamsa:23,positions,julianDay:2450170,backend:'synthetic for structural test'};
const original=calculateChart(input,eph);
test('Legacy signs must match across Lagna and all nine positions in D1/D9/D10 before recovery',()=>{
 assert.equal(originalSignsAgree(original,original),true);
 const wrong=structuredClone(original);wrong.d10[2].sign=(wrong.d10[2].sign%12)+1;
 assert.equal(originalSignsAgree(wrong,original),false);
 const invalid=structuredClone(original);delete invalid.d9;
 assert.equal(originalSignsAgree(invalid,original),false);
 const invalidMoon=structuredClone(original);invalidMoon.ascendant.sign=(invalidMoon.ascendant.sign%12)+1;
 assert.equal(originalSignsAgree(invalidMoon,original),false);
});
test('Internal marker is not trusted if method or verification version changed',()=>{
 const good={...original,verification:{status:'verified_internal',version:'jyotish-integrity-v1',digest:'test'}};
 assert.equal(isCurrentVerifiedChart(good),true);
 assert.equal(isCurrentVerifiedChart({...good,config:{...good.config,ascendantConvention:'legacy'}}),false);
 assert.equal(isCurrentVerifiedChart({...good,verification:{...good.verification,version:'old'}}),false);
 assert.equal(isCurrentVerifiedChart(original),false);
 assert.match(personalRecoveryVersion,/personal-chart-recovery-v1/);
});
test('Recovery cache is source-bound, versioned, never silently rewrites snapshots',async()=>{
 const row={id:'legacy-chart',input,result:structuredClone(original)};
 let read=0,updates=0;
 const saved={sourceHash:sourceFingerprint(row),methodVersion:personalRecoveryVersion,verifiedResult:{...original,verification:{status:'verified_internal',version:'jyotish-integrity-v1',digest:'test'}}};
 const prisma={personalChartRecovery:{findUnique:async()=>{read++;return saved;},upsert:async()=>{updates++;throw Error('must not write a cache hit');}}};
 const res=await resolvePersonalChart(prisma,row);
 assert.equal(res.status,'recovered');assert.equal(res.chart?.dasha.length,9);
 assert.equal(read,1);assert.equal(updates,0);
 assert.equal(row.result.verification,undefined);
 const changed={...row,input:{...input,time:'12:59'}};
 assert.notEqual(sourceFingerprint(changed),saved.sourceHash);
});
